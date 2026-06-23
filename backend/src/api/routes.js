import express from "express";
import authRoutes from "./auth/routes/auth.routes.js";
import answerRoutes from "./answer/routes/answer.routes.js";
import questionRoutes from "./question/routes/question.routes.js";
import answerFitRoutes from "./questions/routes/answer-fit.routes.js";
import ragFileRoutes from "./rag/routes/rag-file.routes.js";
import ragRoutes from "./rag/routes/rag.routes.js";
import ragRoute from "./rag/routes/rag.routes.js";

export const mainRouter = express.Router();

// Authentication routes
mainRouter.use("/auth", authRoutes);

// Answer routes
mainRouter.use("/answers", answerRoutes);

//  /api/questions
mainRouter.use("/questions", questionRoutes);

mainRouter.use("/questions", answerFitRoutes);

// rag routes
mainRouter.use("/rag", ragRoutes);
// /api/rag/documents
mainRouter.use("/rag/documents", ragFileRoutes);

mainRouter.use("/rag", ragRoute);
