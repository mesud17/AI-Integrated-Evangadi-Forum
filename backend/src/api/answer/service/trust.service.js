import { safeExecute } from "../../../../db/config.js";

const POINTS = {
  WELCOME_BONUS: 5,
  QUICK_RESPONDER: 3,
  WEEKLY_CONSISTENCY: 10,
};

const QUICK_RESPONDER_THRESHOLD = 5;

const addTrustScore = (userId, points) =>
  safeExecute(
    `UPDATE users SET trust_score = trust_score + ? WHERE user_id = ?`,
    [points, userId]
  );

// INSERT IGNORE is idempotent — the UNIQUE KEY on (user_id, badge_name, period)
// silently skips duplicates so calling this twice has no effect.
const awardBadge = (userId, badgeName, period = '') =>
  safeExecute(
    `INSERT IGNORE INTO user_badges (user_id, badge_name, period) VALUES (?, ?, ?)`,
    [userId, badgeName, period]
  );

export const applyAnswerCreationTrust = async ({
  userId,
  answerId,
  questionId,
  questionCreatedAt,
}) => {
  // ── 1. Welcome bonus (+5) ─────────────────────────────────────────────────
  // Awarded once: on the user's very first answer ever.
  const prevAnswers = await safeExecute(
    `SELECT COUNT(*) AS total FROM answers WHERE user_id = ? AND answer_id != ?`,
    [userId, answerId]
  );

  if (Number(prevAnswers[0].total) === 0) {
    await addTrustScore(userId, POINTS.WELCOME_BONUS);
    await awardBadge(userId, 'First Answer');
  }

  // ── 2. Quick responder (+3) ───────────────────────────────────────────────
  // Awarded when: this is the first answer on the question AND the question
  // was posted within the last 24 hours.
  const ageMs = Date.now() - new Date(questionCreatedAt).getTime();
  const within24h = ageMs < 24 * 60 * 60 * 1000;

  if (within24h) {
    const otherAnswers = await safeExecute(
      `SELECT COUNT(*) AS total FROM answers WHERE question_id = ? AND answer_id != ?`,
      [questionId, answerId]
    );

    if (Number(otherAnswers[0].total) === 0) {
      await addTrustScore(userId, POINTS.QUICK_RESPONDER);

      // Track this credit using a badge row (period = answerId keeps it unique per answer).
      // Count existing credits to decide whether the badge threshold is reached.
      const credits = await safeExecute(
        `SELECT COUNT(*) AS total FROM user_badges
         WHERE user_id = ? AND badge_name = 'Quick Responder Credit'`,
        [userId]
      );

      await awardBadge(userId, 'Quick Responder Credit', String(answerId));

      if (Number(credits[0].total) + 1 >= QUICK_RESPONDER_THRESHOLD) {
        await awardBadge(userId, 'Quick Responder');
      }
    }
  }

  // ── 3. Weekly consistency (+10) ───────────────────────────────────────────
  // Awarded when the user's answer count for the current ISO calendar week
  // reaches exactly 3. Checking for exactly 3 (not >=3) means the bonus
  // fires once per week naturally — no separate tracking table needed.
  const weekAnswers = await safeExecute(
    `SELECT COUNT(*) AS total FROM answers
     WHERE user_id = ? AND YEARWEEK(created_at, 1) = YEARWEEK(NOW(), 1)`,
    [userId]
  );

  if (Number(weekAnswers[0].total) === 3) {
    await addTrustScore(userId, POINTS.WEEKLY_CONSISTENCY);
  }
};
