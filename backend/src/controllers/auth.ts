import bcrypt from "bcryptjs";
import { NextFunction, Request, Response } from "express";
import { generateJwtToken } from "../utils/generateJwtToken";
import prisma from "../config/prisma";
import { logger } from "../middleware/loggerMiddleware";

export const register = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    logger.info("Register endpoint hit", { endpoint: "/register", method: "POST" });
    const registeringUser = req.body;
    if (
        !registeringUser.username ||
        !registeringUser.password ||
        !registeringUser.fullName
    ) {
        logger.warn("Validation failed: Missing required fields", {
            endpoint: "/register",
            method: "POST",
            body: registeringUser,
        });
        return res
            .status(400)
            .json({
                message: "Username, password, and full name are required.",
            });
    }

    const existingUser = await prisma.user.findUnique({
        where: {
            username: registeringUser.username,
        },
    });
    if (existingUser) {
        logger.warn("Registration failed: Username already exists", {
            endpoint: "/register",
            method: "POST",
            username: registeringUser.username,
        });
        return res
            .status(409)
            .json({ message: "User with the given username already exists." });
    }

    try {
        const hashedPassword = await bcrypt.hash(registeringUser.password, 10);
        const newUser = await prisma.user.create({
            data: {
                ...registeringUser,
                avatar: req.image,
                password: hashedPassword,
            },
        });
        const token = generateJwtToken(
            newUser.id,
            process.env.TOKEN_SECRET || "",
            "1d",
        );

        res.cookie("jwt", token, {
            httpOnly: true,
            secure: true,
            sameSite: "none",
            maxAge: 24 * 60 * 60 * 1000,
        });
        logger.info("User registered successfully", {
            endpoint: "/register",
            method: "POST",
            userId: newUser.id,
        });
        res.status(201).json({ user: newUser });
    } catch (error) {
        logger.error("Error during user registration", {
            endpoint: "/register",
            method: "POST",
            error,
        });
        next({
            error,
            message: "Unable to sign up the user with given credentials.",
        });
    }
};

export const login = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    logger.info("Login endpoint hit", { endpoint: "/login", method: "POST" });
    try {
        const { username, password: userPassword } = req.body;
        if (!username || !userPassword) {
            logger.warn("Validation failed: Missing username or password", {
                endpoint: "/login",
                method: "POST",
                body: req.body,
            });
            return res
                .status(400)
                .json({ message: "Username and password are required." });
        }

        const user = await prisma.user.findUnique({
            where: {
                username,
            },
        });
        if (!user) {
            logger.warn("Login failed: Invalid username", {
                endpoint: "/login",
                method: "POST",
                username,
            });
            return res.status(404).json({ message: "Invalid username." });
        }

        const isPasswordCorrect = await bcrypt.compare(
            userPassword,
            user.password,
        );
        if (!isPasswordCorrect) {
            logger.warn("Login failed: Invalid password", {
                endpoint: "/login",
                method: "POST",
                username,
            });
            return res.status(400).json({ message: "Invalid password." });
        }

        const token = generateJwtToken(
            user.id,
            process.env.TOKEN_SECRET || "",
            "1d",
        );
        const { password, ...userWithoutPassword } = user;
        res.cookie("jwt", token, {
            httpOnly: true,
            secure: true,
            sameSite: "none",
            maxAge: 24 * 60 * 60 * 1000,
        });
        logger.info("User logged in successfully", {
            endpoint: "/login",
            method: "POST",
            userId: user.id,
        });
        res.status(200).json({ user: userWithoutPassword });
    } catch (error) {
        logger.error("Error during user login", {
            endpoint: "/login",
            method: "POST",
            error,
        });
        next({
            error,
            message: "Unable to authenticate the user with given credentials.",
        });
    }
};

export const logout = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    logger.info("Logout endpoint hit", { endpoint: "/logout", method: "GET" });
    try {
        const cookies = req.cookies;
        if (!cookies?.jwt) {
            logger.info("No JWT token found during logout", {
                endpoint: "/logout",
                method: "GET",
            });
            return res.sendStatus(204);
        }

        res.clearCookie("jwt", {
            httpOnly: true,
            sameSite: "none",
            secure: true,
        });
        logger.info("User logged out successfully", {
            endpoint: "/logout",
            method: "GET",
        });
        res.sendStatus(204);
    } catch (error) {
        logger.error("Error during user logout", {
            endpoint: "/logout",
            method: "GET",
            error,
        });
        next({ error, message: "Unable to logout" });
    }
};
