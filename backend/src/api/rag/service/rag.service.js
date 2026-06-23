import fs from "fs/promises";
import { extractTextFromPDF } from "../../../utils/pdfParser.js";
import { chunkText } from "../../../utils/chunk.js";
import { safeExecute } from "../../../../db/config.js";
import { getDocumentEmbedding } from "../../../utils/ragGemini.js"; 


export const createDocumentFromUploadService= async (file, userId)=>{

    let documentId;
    

    try 
    {
        if (userId== null){
            throw new Error ("Authenticated user ID is missing.");
        }

        const storagePath = file.path ?? null;
        const title= file.originalname ?? null;
        const mimeType= file.mimetype ?? null;
        const byteSize= file.size ?? null;

        // 1 Initial DB Record: Insert document as 'processing'

        const insertResult= await safeExecute(
            ` INSERT INTO documents 
            (user_id, title, mime_type, byte_size, storage_path, status)
            VALUES (?, ?, ?, ?, ?, 'processing')`,

            [userId, title, mimeType, byteSize, storagePath]);

             documentId =  insertResult.insertId;

        
        //  2 Parse PDF: Extract text from PDF buffer
        const fileBuffer = await fs.readFile(file.path);

        // Quick signature check to avoid relying only on mimetype/extension.
        const magic = fileBuffer.subarray(0, 5).toString("utf8");
        if (magic !== "%PDF-") {
            const err = new Error("Uploaded file is not a valid PDF.");
            err.statusCode = 400;
            throw err;
        }

        const text = await extractTextFromPDF(fileBuffer);
        if (!text || text.trim().length === 0) {
            const err = new Error("No readable text found in PDF document.");
            err.statusCode = 400;
            throw err;
        }


        // 3 Chunking: Split text into overlapping segments 
        const chunks = chunkText(text);
        if (chunks.length === 0) {
            const err = new Error("No text found in PDF");
            err.statusCode = 400;
            throw err;
        }

        // 4. Embedding: Loop through chunks properly
        for (let i=0; i<chunks.length; i++){
            const chunk= chunks[i];

            // Call Gemini API to get vector embedding for the chunk
            const embedding = await getDocumentEmbedding (chunk);
            if (embedding === undefined || embedding=== null){
                throw new Error ("Failed to generate embedding for PDF chunk.");
            }

            const embeddingJson= JSON.stringify(embedding);
            if (embeddingJson===undefined ){
                throw new Error ("Embedding could not be serialized for storage.");        
            }
            // Store Vector : save chunk to database
            const chunkResult= await safeExecute(
                `INSERT INTO document_chunks
                (document_id, chunk_index, content)
                VALUES(?,?,?)`,
                [documentId, i, chunk], );

            const chunkId = chunkResult.insertId;
            
            // Store Vector : save vector embeddings to database
            await safeExecute(
                `INSERT INTO document_chunk_vectors (chunk_id, source_text, embedding) VALUES (?, ?, ?)`,
                [chunkId, chunk, embeddingJson]
            );
        }

        // 5. Finalize: Update document status to ready
        await safeExecute(`UPDATE documents SET status='ready' WHERE document_id=?`, [documentId]);
        
        return {
            document_id: documentId,
            title: file.originalname,
            mime_type: file.mimetype,   
            byte_size: file.size,      
            storage_path: file.path,    
            status: "ready",
            error_message: null,        
            user_id: userId,
        };


    } catch (error) {
    // Finalize (Error Case): Update status to 'failed' and save error
    if (documentId) {
      // Clean up partial chunk/vector writes; vectors cascade on chunk delete.
      await safeExecute(`DELETE FROM document_chunks WHERE document_id=?`, [
        documentId,
      ]);
      await safeExecute(
        `UPDATE documents SET status='failed', error_message=? WHERE document_id=?`,
        [error.message, documentId],
      );
    }
    throw error;
  }

}