import winston from "winston";
import morgan from "morgan";
import path from "path";
import fs from "fs";

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
        new winston.transports.File({
            filename: getDailyLogFile(),
        }),
    ],
});

// Helper function to generate daily log file name
function getDailyLogFile() {
    const date = new Date().toISOString().split("T")[0]; // Get current date in YYYY-MM-DD format
    const logDir = path.join(__dirname, "../../logs");
    if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
    }
    return path.join(logDir, `app-${date}.log`);
}

// Stream for morgan to use winston
const stream = {
    write: (message: string) => logger.info(message.trim())
};

// Morgan middleware for HTTP request logging
const morganMiddleware = morgan("combined", { stream });

export { logger, morganMiddleware };