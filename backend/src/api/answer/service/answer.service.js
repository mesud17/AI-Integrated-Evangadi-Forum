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
    `,
    [questionId],
  );

  if (!questions || questions.length === 0) {
    throw new NotFoundError("Question not found");
  }

  const question = questions[0];

  // Prevent self-answering

  if (Number(question.user_id) === Number(userId)) {
    throw new BadRequestError("You cannot answer your own question");
  }
  // if (question.user_id === userId) {
  //   throw new BadRequestError("You cannot answer your own question");
  // }

  // Check duplicate answer
  const existingAnswers = await safeExecute(
    `
      SELECT answer_id
      FROM answers
      WHERE question_id = ?
      AND user_id = ?
      LIMIT 1
    `,
    [questionId, userId],
  );

  if (existingAnswers.length > 0) {
    throw new ConflictError("You have already answered this question");
  }

  // Insert answer
  const result = await safeExecute(
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
    `,
    [answerId],
  );

  const row = rows[0];

  return {
    id: row.id,
    questionId: row.questionId,
    content: row.content,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    author: {
      id: row.authorId,
      firstName: row.authorFirstName,
      lastName: row.authorLastName,
    },
  };
};
