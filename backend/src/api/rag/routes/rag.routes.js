
import { Router } from "express";
import express from 'express';
import { listDocumentsController } from '../controller/rag.controller.js';
import { authenticateUser } from "../../../middleware/authentication.js";
import { documentIdParamValidation } from "../validations/rag.validation.js";
import { getDocumentMetaController } from "../controller/rag.controller.js";
import { searchInDocumentValidation } from "../validations/rag.validation.js";
import { searchInDocumentController } from "../controller/rag.controller.js";

const ragRoutes = Router();
// Define RAG routes here
ragRoutes.get("/documents/:documentId",
   authenticateUser,
    documentIdParamValidation,
    getDocumentMetaController);

export default ragRoutes;


const router = express.Router();

router.get('/documents', authenticateUser, listDocumentsController);

export default router;


const ragRoute = express.Router();

ragRoute.get(
  "/documents/:documentId/search",
  authenticateUser,
  searchInDocumentValidation,
  searchInDocumentController,
);

export default ragRoute;
