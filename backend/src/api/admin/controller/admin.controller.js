import {
  getAdminQueueService,
  approvePostService,
  removePostService,
  escalatePostService,
} from "../service/admin.service.js";

export const getAdminQueueController = async (req, res, next) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));

    const result = await getAdminQueueService({ page, limit });
    return res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

export const approvePostController = async (req, res, next) => {
  try {
    const result = await approvePostService({
      flagId:  Number(req.params.flagId),
      adminId: req.user.id,
    });
    return res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

export const removePostController = async (req, res, next) => {
  try {
    const result = await removePostService({
      flagId:  Number(req.params.flagId),
      adminId: req.user.id,
    });
    return res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

export const escalatePostController = async (req, res, next) => {
  try {
    const result = await escalatePostService({
      flagId:  Number(req.params.flagId),
      adminId: req.user.id,
    });
    return res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};
