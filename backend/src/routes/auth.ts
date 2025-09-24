import { login, register, logout } from "../controllers/auth";
import { upload } from "../middleware/multerMiddleware";
import express from "express";
import { fileUploadMiddleware } from "../middleware/fileUploadMiddleware";
import { morganMiddleware, logger } from "../middleware/loggerMiddleware";

const router = express.Router();

// Apply morgan middleware for logging
router.use(morganMiddleware);

router.post(
    "/register",
    upload.single("avatar"),
    fileUploadMiddleware,
    (req, res, next) => {
        logger.audit("Registration attempt", req.body?.email || "unknown", {
            method: req.method,
            endpoint: req.url,
            ip: req.ip,
            userAgent: req.headers["user-agent"]
        });
        next();
    },
    register,
);

router.post("/login", (req, res, next) => {
    logger.audit("Login attempt", req.body?.email || "unknown", {
        method: req.method,
        endpoint: req.url,
        ip: req.ip,
        userAgent: req.headers["user-agent"]
    });
    next();
}, login);

router.get("/logout", (req, res, next) => {
    logger.audit("Logout attempt", req.body?.email || "unknown", {
        method: req.method,
        endpoint: req.url,
        ip: req.ip,
        userAgent: req.headers["user-agent"]
    });
    next();
}, logout);

export default router;
