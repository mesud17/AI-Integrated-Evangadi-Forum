import express from 'express';
import { authenticateUser } from '../../../middleware/authentication.js';
import { listDocumentsController } from '../controller/rag.controller.js';

const router = express.Router();

router.get('/documents', authenticateUser, listDocumentsController);

export default router;
