import bcrypt from "bcryptjs";
import { NextFunction, Request, Response } from "express";
import { generateJwtToken } from "../utils/generateJwtToken";
import { generateTokenPair } from "../utils/tokenUtils";
import prisma from "../config/prisma";
import { OAuth2Client } from "google-auth-library";
import jwt, { JwtPayload } from "jsonwebtoken";

const client = new OAuth2Client(process.env.AUTH_GOOGLE_ID);

export const register = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    const registeringUser = req.body;
    if (
        !registeringUser.username ||
        !registeringUser.password ||
        !registeringUser.fullName
    ) {
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
        res.status(201).json({ user: newUser });
    } catch (error) {
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
    try {
        const { username, password: userPassword } = req.body;
        if (!username || !userPassword) {
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
            return res.status(404).json({ message: "Invalid username." });
        }

        // Check if this is a Google user trying to log in with password
        if (user.isGoogleUser && !user.password) {
            return res.status(400).json({ 
                message: "This account is linked to Google. Please use Google Sign-In." 
            });
        }

        if (!user.password) {
            return res.status(400).json({ message: "Invalid password." });
        }

        const isPasswordCorrect = await bcrypt.compare(
            userPassword,
            user.password,
        );
        if (!isPasswordCorrect) {
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
        res.status(200).json({ user: userWithoutPassword });
    } catch (error) {
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
    try {
        const cookies = req.cookies;
        if (!cookies?.jwt) {
            return res.sendStatus(204);
        }

        res.clearCookie("jwt", {
            httpOnly: true,
            sameSite: "none",
            secure: true,
        });
        res.sendStatus(204);
    } catch (error) {
        next({ error, message: "Unable to logout" });
    }
};

export const googleLogin = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    try {
        const { credential } = req.body;

        if (!credential) {
            return res
                .status(400)
                .json({ message: "Google credential is required." });
        }

        // Verify the Google token
        const ticket = await client.verifyIdToken({
            idToken: credential,
            audience: process.env.AUTH_GOOGLE_ID,
        });

        const payload = ticket.getPayload();
        if (!payload) {
            return res.status(400).json({ message: "Invalid Google token." });
        }

        const { sub: googleId, email, name, picture } = payload;

        if (!googleId || !email || !name) {
            return res
                .status(400)
                .json({ message: "Invalid Google user data." });
        }

        // Check if user already exists
        let user = await prisma.user.findFirst({
            where: {
                OR: [{ googleId }, { email }],
            },
        });

        if (user) {
            // Update existing user with Google info if needed
            if (!user.googleId) {
                user = await prisma.user.update({
                    where: { id: user.id },
                    data: {
                        googleId,
                        isGoogleUser: true,
                        avatar: picture || user.avatar,
                    },
                });
            }
        } else {
            // Create new user
            user = await prisma.user.create({
                data: {
                    googleId,
                    email,
                    fullName: name,
                    username: email, // Use email as username for Google users
                    avatar: picture,
                    isGoogleUser: true,
                    bio: "",
                },
            });
        }

        // Generate JWT token
        const token = generateJwtToken(
            user.id,
            process.env.TOKEN_SECRET || "",
            "1d",
        );

        // Set cookie and return user data
        res.cookie("jwt", token, {
            httpOnly: true,
            secure: true,
            sameSite: "none",
            maxAge: 24 * 60 * 60 * 1000,
        });

        const { password, ...userWithoutPassword } = user;
        res.status(200).json({ user: userWithoutPassword });
    } catch (error) {
        console.error("Google login error:", error);
        next({
            error,
            message: "Unable to authenticate with Google.",
        });
    }
};

export const refreshToken = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    try {
        const token = req.cookies.jwt;
        if (!token) {
            return res.status(401).json({ message: "Refresh token is required." });
        }

        // Verify the refresh token
        const decoded = jwt.verify(token, process.env.TOKEN_SECRET || "") as JwtPayload;
        
        if (decoded.type !== 'refresh') {
            return res.status(401).json({ message: "Invalid token type." });
        }

        // Find the user
        const user = await prisma.user.findUnique({
            where: { id: decoded.id },
        });

        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }

        // Generate new token pair
        const { accessToken, refreshToken: newRefreshToken } = generateTokenPair(user.id);
        
        // Set new refresh token in cookie
        res.cookie("jwt", newRefreshToken, {
            httpOnly: true,
            secure: true,
            sameSite: "none",
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });

        // Return access token and user data
        const { password, ...userWithoutPassword } = user;
        res.status(200).json({ 
            accessToken,
            user: userWithoutPassword 
        });
    } catch (error) {
        console.error("Refresh token error:", error);
        next({
            error,
            message: "Unable to refresh token.",
        });
    }
};
