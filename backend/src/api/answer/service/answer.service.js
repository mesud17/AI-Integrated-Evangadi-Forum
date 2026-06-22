import { safeExecute } from "../../../../db/config.js";
import {
  BadRequestError,
  NotFoundError,
  ConflictError,
} from "../../../utils/errors/index.js";

export const createAnswerService = async ({ questionId, content, userId }) => {
  // Verify question exists
  const questions = await safeExecute(
    `
      SELECT question_id, user_id
      FROM questions
      WHERE question_id = ?
      LIMIT 1
    `,
    [questionId],
  );

  if (!questions || questions.length === 0) {
    throw new NotFoundError("Question not found", "QUESTION_NOT_FOUND");
  }

  const question = questions[0];

  if (Number(question.user_id) === Number(userId)) {
    throw new BadRequestError("You cannot answer your own question", "SELF_ANSWER_NOT_ALLOWED");
  }

  // Insert answer — the UNIQUE KEY on (question_id, user_id) enforces
  // the one-answer-per-user constraint atomically at the DB level,
  // avoiding the SELECT→INSERT race condition.
  let result;
  try {
    result = await safeExecute(
      `
        INSERT INTO answers
        (
          question_id,
          user_id,
          content,
          created_at,
          updated_at
        )
        VALUES
        (
          ?,
          ?,
          ?,
          NOW(),
          NOW()
        )
      `,
      [questionId, userId, content],
    );
  } catch (err) {
    // MySQL duplicate-entry error: unique constraint on (question_id, user_id)
    if (err.code === "ER_DUP_ENTRY") {
      throw new ConflictError("You have already answered this question", "ANSWER_ALREADY_EXISTS");
    }
    throw err;
  }

  const answerId = result.insertId;

  // Fetch created answer
  const rows = await safeExecute(
    `
      SELECT
        a.answer_id AS id,
        a.question_id AS questionId,
        a.content,
        a.created_at AS createdAt,
        a.updated_at AS updatedAt,
        u.user_id AS authorId,
        u.first_name AS authorFirstName,
        u.last_name AS authorLastName
      FROM answers a
      INNER JOIN users u
        ON a.user_id = u.user_id
      WHERE a.answer_id = ?
      LIMIT 1
    `,
    [answerId],
  );

  if (!rows || rows.length === 0) {
    throw new NotFoundError("Created answer not found");
  }

  const row = rows[0];
  return {
    id: row.id,
    questionId: row.questionId,
    content: row.content,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    user: {
      id: row.authorId,
      firstName: row.authorFirstName,
      lastName: row.authorLastName,
    },
  };
};
