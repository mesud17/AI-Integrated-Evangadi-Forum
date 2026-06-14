import express from "express";
import authRoutes from "./auth/routes/auth.routes.js";
import answerRoutes from "./answer/routes/answer.routes.js";
import questionRoutes from "./question/routes/question.routes.js";
import answerFitRoutes from "./questions/routes/answer-fit.routes.js";

export const mainRouter = express.Router();

// Authentication routes
mainRouter.use("/auth", authRoutes);
// Answer routes
mainRouter.use("/answers", answerRoutes);
//  /api/questions
mainRouter.use("/questions", questionRoutes);
mainRouter.use("/questions", answerFitRoutes);
