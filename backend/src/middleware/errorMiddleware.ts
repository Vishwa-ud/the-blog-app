import { NextFunction, Request, Response } from "express";

interface CustomError extends Error {
  statusCode?: number;
}

export const errorMiddleware = (
  error: CustomError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Always log full error server-side
  console.error(error);

  const status = error.statusCode || 500;

  // In production: generic message
  const message =
    process.env.NODE_ENV === "production"
      ? "Internal server error"
      : error.message;

  res.status(status).json({
    success: false,
    message,
  });
};
//Don’t leak sensitive stack traces/messages in production.(A05)