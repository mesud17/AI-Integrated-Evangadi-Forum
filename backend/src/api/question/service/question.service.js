import { GoogleGenAI } from "@google/genai";
import { safeExecute } from "../../../../db/config.js";
import { BadRequestError } from "../../../utils/errors/index.js";

// Initialize Gemini SDK with apiKey
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

/**
 * Calculates the dot product of two vectors.
 *
 * @param {number[]} a
 * @param {number[]} b
 * @returns {number}
 */
const dotProduct = (a, b) => a.reduce((sum, val, i) => sum + val * b[i], 0);

/**
 * Calculates the magnitude of a vector.
 *
 * @param {number[]} arr
 * @returns {number}
 */
const magnitude = (arr) =>
  Math.sqrt(arr.reduce((sum, val) => sum + val * val, 0));

/**
 * Computes cosine similarity between two vectors.
 *
 * @param {number[]} a
 * @param {number[]} b
 * @returns {number}
 */
const cosineSimilarity = (a, b) => {
  const dp = dotProduct(a, b);
  const magA = magnitude(a);
  const magB = magnitude(b);
  if (magA === 0 || magB === 0) return 0;
  return dp / (magA * magB);
};

/**
 * Performs semantic search over community questions using Gemini embeddings and cosine similarity.
 *
 * @param {Object} params
 * @param {string} params.query - The search query string.
 * @param {number} [params.k] - Maximum number of results to return.
 * @param {number} [params.threshold] - Minimum similarity score.
 * @returns {Promise<Object>} The results and metadata.
 */
export const searchQuestionsSemanticService = async ({
  query,
  k,
  threshold,
}) => {
  const limit = k !== undefined ? k : parseInt(process.env.RECOMM_K || "5", 10);
  const searchThreshold =
    threshold !== undefined
      ? threshold
      : parseFloat(process.env.RECOMM_THRESHOLD || "0.75");

  // 1. Generate query embedding via Gemini
  const model = process.env.GEMINI_EMBEDDING_MODEL || "gemini-embedding-001";
  let queryVector;
  try {
    const response = await ai.models.embedContent({
      model,
      contents: query,
      config: {
        taskType: "RETRIEVAL_QUERY",
      },
    });

    // 🌟 OFFICIAL @GOOGLE/GENAI SDK SPECIFIC EXTRACTION 🌟
    if (response?.embedding?.values) {
      queryVector = response.embedding.values;
    } else if (response?.values) {
      queryVector = response.values;
    } else if (Array.isArray(response)) {
      queryVector = response;
    } else if (response?.embeddings?.[0]?.values) {
      queryVector = response.embeddings[0].values;
    }

    // Comprehensive validation check on final numerical array conversion
    if (
      !queryVector ||
      !Array.isArray(queryVector) ||
      queryVector.length === 0
    ) {
      console.error(
        "Gemini Response Unwrapping Failed. Raw output was:",
        response,
      );
      throw new Error("Invalid embedding response structure from Gemini API");
    }
  } catch (error) {
    console.error("Gemini Embedding Error:", error.message);
    throw new BadRequestError(
      `Failed to generate embedding for query: ${error.message}`,
    );
  }

  // 2. Fetch all ready vectors from the database
  const vectors = await safeExecute(
    "SELECT question_id, embedding FROM question_vectors WHERE status = 'ready'",
    [],
  );

  // 3. Compute cosine similarity for each vector
  const scoredIds = [];
  for (const row of vectors) {
    let embeddingVal = row.embedding;
    if (typeof embeddingVal === "string") {
      embeddingVal = JSON.parse(embeddingVal);
    } else if (Buffer.isBuffer(embeddingVal)) {
      embeddingVal = JSON.parse(embeddingVal.toString("utf-8"));
    }

    if (!Array.isArray(embeddingVal)) {
      continue;
    }

    const score = cosineSimilarity(queryVector, embeddingVal);
    if (score >= searchThreshold) {
      scoredIds.push({ id: row.question_id, score });
    }
  }

  // 4. Sort descending by score and take top K
  scoredIds.sort((a, b) => b.score - a.score);
  const topK = scoredIds.slice(0, limit);

  if (topK.length === 0) {
    return {
      data: [],
      meta: {
        total: 0,
        k: limit,
        threshold: searchThreshold,
      },
    };
  }

  // 5. Fetch detailed question and author details for top K IDs
  const ids = topK.map((item) => item.id);
  const placeholders = ids.map(() => "?").join(", ");
  const sql = `
    SELECT 
      q.question_id AS id,
      q.question_hash AS questionHash,
      q.title,
      q.content,
      q.created_at AS createdAt,
      q.updated_at AS updatedAt,
      u.user_id AS authorId,
      u.first_name AS authorFirstName,
      u.last_name AS authorLastName,
      (SELECT COUNT(*) FROM answers a WHERE a.question_id = q.question_id) AS answerCount
    FROM questions q
    JOIN users u ON q.user_id = u.user_id
    WHERE q.question_id IN (${placeholders})
  `;

  const questionRows = await safeExecute(sql, ids);

  // Map database rows to structured object
  const questionMap = {};
  for (const row of questionRows) {
    questionMap[row.id] = {
      id: row.id,
      questionHash: row.questionHash,
      title: row.title,
      content: row.content,
      answerCount: row.answerCount,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      author: {
        id: row.authorId,
        firstName: row.authorFirstName,
        lastName: row.authorLastName,
      },
    };
  }

  // Format final response keeping the sorted score order
  const data = topK
    .map((item) => {
      const q = questionMap[item.id];
      if (!q) return null;
      return {
        ...q,
        score: item.score,
      };
    })
    .filter(Boolean);

  return {
    data,
    meta: {
      total: data.length,
      k: limit,
      threshold: searchThreshold,
    },
  };
};
