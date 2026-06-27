import { safeExecute } from "../../../../db/config.js";
import { NotFoundError, ConflictError } from "../../../utils/errors/index.js";

// Maps incident count → consequence applied to user_moderation_status.
const getEscalationForCount = (count) => {
  if (count <= 1) return { status: 'active',   blockedUntil: null, label: 'No restriction — admin review only.' };
  if (count === 2) return { status: 'limited',  blockedUntil: null, label: 'Posting limited until reviewed.' };

  // Block durations in hours, keyed by incident count (all are whole days).
  const hours = { 3: 24, 4: 168, 5: 336, 6: 720 };

  if (count <= 6) {
    const h = hours[count];
    const blockedUntil = new Date(Date.now() + h * 60 * 60 * 1000);
    const label = `${h / 24}-day block applied.`;
    return { status: 'blocked', blockedUntil, label };
  }

  return { status: 'removed', blockedUntil: null, label: 'Account removed.' };
};

const requirePendingFlag = async (flagId) => {
  const flags = await safeExecute(
    `SELECT flag_id, author_id, queue_status FROM moderation_flags WHERE flag_id = ? LIMIT 1`,
    [flagId]
  );

  if (!flags.length) throw new NotFoundError("This post is not in the moderation queue.", "POST_NOT_IN_QUEUE");
  if (flags[0].queue_status !== 'pending') throw new ConflictError("This post has already been actioned.", "POST_ALREADY_ACTIONED");

  return flags[0];
};

const resolveFlag = (flagId, status, adminId) =>
  safeExecute(
    `UPDATE moderation_flags
     SET queue_status = ?, reviewed_at = NOW(), reviewed_by = ?
     WHERE flag_id = ?`,
    [status, adminId, flagId]
  );

const applyEscalation = async (authorId, escalation) => {
  await safeExecute(
    `INSERT INTO user_moderation_status
       (user_id, incident_count, status, blocked_until, last_incident_at)
     VALUES (?, 1, ?, ?, NOW())
     ON DUPLICATE KEY UPDATE
       incident_count   = incident_count + 1,
       status           = VALUES(status),
       blocked_until    = VALUES(blocked_until),
       last_incident_at = NOW(),
       updated_at       = NOW()`,
    [authorId, escalation.status, escalation.blockedUntil]
  );
};

// ── GET /api/admin/queue ─────────────────────────────────────────────────────
export const getAdminQueueService = async ({ page, limit }) => {
  const offset = (page - 1) * limit;

  const [rows, total] = await Promise.all([
    safeExecute(
      `SELECT
         mf.flag_id          AS flagId,
         mf.post_type        AS postType,
         mf.category         AS moderationCategory,
         mf.moderation_score AS moderationScore,
         mf.ai_reason        AS aiReason,
         mf.has_revision     AS hasRevision,
         mf.flagged_at       AS flaggedAt,
         u.user_id           AS authorId,
         u.first_name        AS authorFirstName,
         u.last_name         AS authorLastName,
         COALESCE(ums.incident_count, 0) AS incidentCount,
         COALESCE(q.content, a.content)  AS content
       FROM moderation_flags mf
       INNER JOIN users u ON u.user_id = mf.author_id
       LEFT JOIN user_moderation_status ums ON ums.user_id = mf.author_id
       LEFT JOIN questions q ON mf.post_type = 'question' AND q.question_id = mf.post_id
       LEFT JOIN answers   a ON mf.post_type = 'answer'   AND a.answer_id   = mf.post_id
       WHERE mf.queue_status = 'pending'
       ORDER BY mf.flagged_at ASC
       LIMIT ? OFFSET ?`,
      [limit, offset]
    ),
    safeExecute(
      `SELECT COUNT(*) AS total FROM moderation_flags WHERE queue_status = 'pending'`,
      []
    ),
  ]);

  return {
    data: rows.map(r => ({
      flagId:             r.flagId,
      postType:           r.postType,
      content:            r.content,
      moderationCategory: r.moderationCategory,
      moderationScore:    Number(r.moderationScore),
      aiReason:           r.aiReason,
      hasRevision:        Boolean(r.hasRevision),
      flaggedAt:          r.flaggedAt,
      author: {
        userId:        r.authorId,
        firstName:     r.authorFirstName,
        lastName:      r.authorLastName,
        incidentCount: r.incidentCount,
      },
    })),
    meta: {
      total: Number(total[0].total),
      page,
      limit,
    },
  };
};

// ── POST /api/admin/queue/:postId/approve ────────────────────────────────────
// Post was incorrectly flagged — restore it and clear this incident.
export const approvePostService = async ({ flagId, adminId }) => {
  const flag = await requirePendingFlag(flagId);
  await resolveFlag(flagId, 'approved', adminId);

  // This flag was a false positive — roll the user's incident count back by one
  // and RECOMPUTE their standing (status / blocked_until) from the new count, so
  // clearing the incident can actually lift a block instead of leaving it stale.
  const rows = await safeExecute(
    `SELECT incident_count FROM user_moderation_status WHERE user_id = ? LIMIT 1`,
    [flag.author_id]
  );

  if (rows.length) {
    const newCount = Math.max(Number(rows[0].incident_count) - 1, 0);
    const escalation = getEscalationForCount(newCount);

    if (newCount === 0) {
      // No incidents remain — clear standing and the last-incident timestamp.
      await safeExecute(
        `UPDATE user_moderation_status
         SET incident_count = 0, status = ?, blocked_until = ?, last_incident_at = NULL, updated_at = NOW()
         WHERE user_id = ?`,
        [escalation.status, escalation.blockedUntil, flag.author_id]
      );
    } else {
      // Other incidents still stand — keep last_incident_at, just recompute the
      // consequence for the reduced count.
      await safeExecute(
        `UPDATE user_moderation_status
         SET incident_count = ?, status = ?, blocked_until = ?, updated_at = NOW()
         WHERE user_id = ?`,
        [newCount, escalation.status, escalation.blockedUntil, flag.author_id]
      );
    }
  }

  return { message: "Post approved and restored. Incident cleared." };
};

// ── POST /api/admin/queue/:postId/remove ─────────────────────────────────────
// Confirm removal — incident stands, escalation applied based on count.
export const removePostService = async ({ flagId, adminId }) => {
  const flag = await requirePendingFlag(flagId);
  await resolveFlag(flagId, 'removed', adminId);

  // Get current count before incrementing to derive new consequence
  const status = await safeExecute(
    `SELECT incident_count FROM user_moderation_status WHERE user_id = ? LIMIT 1`,
    [flag.author_id]
  );
  const newCount = (status.length ? Number(status[0].incident_count) : 0) + 1;
  const escalation = getEscalationForCount(newCount);

  await applyEscalation(flag.author_id, escalation);

  return { message: `Post removed. ${escalation.label}` };
};

// ── POST /api/admin/queue/:postId/escalate ───────────────────────────────────
// Manually push user one step beyond their current consequence.
export const escalatePostService = async ({ flagId, adminId }) => {
  const flag = await requirePendingFlag(flagId);

  const status = await safeExecute(
    `SELECT incident_count, status FROM user_moderation_status WHERE user_id = ? LIMIT 1`,
    [flag.author_id]
  );

  const currentCount = status.length ? Number(status[0].incident_count) : 0;

  if (status.length && status[0].status === 'removed') {
    throw new ConflictError(
      "This user is already at the maximum escalation level.",
      "USER_AT_MAX_ESCALATION"
    );
  }

  const newCount = currentCount + 1;
  const escalation = getEscalationForCount(newCount);

  await resolveFlag(flagId, 'removed', adminId);
  await applyEscalation(flag.author_id, escalation);

  return {
    message:          `User escalated. ${escalation.label}`,
    newConsequence:   escalation.status,
    authorIncidentCount: newCount,
  };
};
