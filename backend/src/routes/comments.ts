import { 
    createComment, 
    getPostComments,
    createCommentValidation,
    getPostCommentsValidation
} from "../controllers/comments";
import { authMiddleware } from "../middleware/authMiddleware";
import express from "express";

const router = express.Router();
router.get("/post/:id", authMiddleware, getPostCommentsValidation, getPostComments);
router.post("/", authMiddleware, createCommentValidation, createComment);

export default router;
