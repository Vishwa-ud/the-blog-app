import { login, register, logout, googleLogin, refreshToken } from "../controllers/auth";
import { upload } from "../middleware/multerMiddleware";
import express from "express";
import { fileUploadMiddleware } from "../middleware/fileUploadMiddleware";

const router = express.Router();
router.post(
    "/register",
    upload.single("avatar"),
    fileUploadMiddleware,
    register,
);
router.post("/login", login);
router.post("/google-login", googleLogin);
router.post("/refresh-token", refreshToken);
router.get("/logout", logout);

export default router;
