import express from "express";
import { authenticateUser } from "../../../middleware/authentication.js";
import { getDocumentFileController } from "../controller/rag-file.controller.js";

const router = express.Router();

router.get("/:documentId/file", authenticateUser, getDocumentFileController);

export default router;