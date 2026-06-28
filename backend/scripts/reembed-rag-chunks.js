/**
 * One-time script: re-embeds all existing RAG document chunks at the current
 * RAG_EMBEDDING_DIM (see backend/src/utils/ragGemini.js). Run this after changing
 * the RAG embedding dimensionality so the stored chunk vectors match newly-embedded
 * queries — otherwise cosine similarity returns 0 for the old (different-size) vectors.
 *
 * Run from the backend/ directory:  node scripts/reembed-rag-chunks.js
 * Safe to run multiple times.
 */
import { safeExecute } from "../db/config.js";
import { getDocumentEmbedding } from "../src/utils/ragGemini.js";

async function main() {
  const rows = await safeExecute(
    `SELECT dcv.chunk_id AS chunkId,
            COALESCE(dcv.source_text, dc.content) AS text
     FROM document_chunk_vectors dcv
     JOIN document_chunks dc ON dc.chunk_id = dcv.chunk_id
     ORDER BY dcv.chunk_id`
  );

  console.log(`Re-embedding ${rows.length} chunk(s)...`);
  let ok = 0;
  let failed = 0;

  for (const row of rows) {
    if (!row.text || !row.text.trim()) {
      failed++;
      continue;
    }
    try {
      const embedding = await getDocumentEmbedding(row.text);
      await safeExecute(
        `UPDATE document_chunk_vectors SET embedding = ?, status = 'ready' WHERE chunk_id = ?`,
        [JSON.stringify(embedding), row.chunkId]
      );
      ok++;
      if (ok % 25 === 0) console.log(`  ...${ok} done`);
    } catch (err) {
      failed++;
      console.error(`  chunk ${row.chunkId} failed: ${err.message}`);
    }
  }

  console.log(
    `Done. Re-embedded ${ok} chunk(s)${failed ? `, ${failed} skipped/failed.` : "."}`
  );
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
