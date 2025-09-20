import winston from "winston";
import morgan from "morgan";
import path from "path";

// Configure winston logger
const logger = winston.createLogger({
    level: "info",
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.printf(({ timestamp, level, message }) => {
            return `${timestamp} [${level.toUpperCase()}]: ${message}`;
        })
    ),
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: path.join(__dirname, "../../logs/app.log") })
    ]
});

// Stream for morgan to use winston
const stream = {
    write: (message: string) => logger.info(message.trim())
};

// Morgan middleware for HTTP request logging
const morganMiddleware = morgan("combined", { stream });

export { logger, morganMiddleware };