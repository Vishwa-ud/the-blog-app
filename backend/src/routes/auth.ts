import { login, register, logout } from "../controllers/auth";
import { upload } from "../middleware/multerMiddleware";
import express from "express";
import { fileUploadMiddleware } from "../middleware/fileUploadMiddleware";
import { morganMiddleware } from "../middleware/loggerMiddleware";

const router = express.Router();

// Apply morgan middleware for logging
router.use(morganMiddleware);

router.post(
    "/register",
    upload.single("avatar"),
    fileUploadMiddleware,
    register,
);
router.post("/login", login);
router.get("/logout", logout);

export default router;
