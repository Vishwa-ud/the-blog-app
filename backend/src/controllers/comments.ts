import { NextFunction, Request, Response } from "express";
import { body, param, validationResult } from "express-validator";
import prisma from "../config/prisma";

// Validation rules for creating a comment
export const createCommentValidation = [
    body("content")
        .trim()
        .isLength({ min: 1, max: 1000 })
        .withMessage("Comment content must be between 1 and 1000 characters")
        .escape(), // Escapes HTML characters to prevent XSS
    body("postId")
        .trim()
        .isLength({ min: 1 })
        .withMessage("Post ID is required")
        .matches(/^[a-zA-Z0-9_-]+$/)
        .withMessage("Invalid post ID format"),
    body("authorId")
        .trim()
        .isLength({ min: 1 })
        .withMessage("Author ID is required")
        .matches(/^[a-zA-Z0-9_-]+$/)
        .withMessage("Invalid author ID format"),
];

// Validation rules for getting post comments
export const getPostCommentsValidation = [
    param("id")
        .trim()
        .isLength({ min: 1 })
        .withMessage("Post ID is required")
        .matches(/^[a-zA-Z0-9_-]+$/)
        .withMessage("Invalid post ID format"),
];

export const createComment = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    try {
        // Check validation results
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                message: "Validation failed",
                errors: errors.array(),
            });
        }

        const { content, postId, authorId } = req.body;

        // Verify that the post exists before creating comment
        const postExists = await prisma.post.findUnique({
            where: { id: postId },
            select: { id: true },
        });

        if (!postExists) {
            return res.status(404).json({ message: "Post not found" });
        }

        // Verify that the author exists
        const authorExists = await prisma.user.findUnique({
            where: { id: authorId },
            select: { id: true },
        });

        if (!authorExists) {
            return res.status(404).json({ message: "Author not found" });
        }

        // Create comment with validated and sanitized data
        const newComment = await prisma.comment.create({
            data: {
                content,
                postId,
                authorId,
            },
            include: {
                author: {
                    select: {
                        id: true,
                        username: true,
                        fullName: true,
                        avatar: true,
                    },
                },
            },
        });

        res.status(201).json(newComment);
    } catch (error) {
        next({ error, message: "Unable to create new comment" });
    }
};

export const getPostComments = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    try {
        // Check validation results
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                message: "Validation failed",
                errors: errors.array(),
            });
        }

        const postId = req.params.id;

        // Verify that the post exists before fetching comments
        const postExists = await prisma.post.findUnique({
            where: { id: postId },
            select: { id: true },
        });

        if (!postExists) {
            return res.status(404).json({ message: "Post not found" });
        }

        const postComments = await prisma.comment.findMany({
            where: {
                postId: postId,
            },
            include: {
                author: {
                    select: {
                        id: true,
                        username: true,
                        fullName: true,
                        avatar: true,
                    },
                },
            },
            orderBy: {
                updatedAt: "desc",
            },
        });

        res.status(200).json(postComments);
    } catch (error) {
        next({
            error,
            message: "Unable to retrieve the comments for the given post",
        });
    }
};
