import winston from "winston";
import morgan from "morgan";
import path from "path";
import fs from "fs";
import DailyRotateFile from "winston-daily-rotate-file";

// Environment-based configuration
const isProduction = process.env.NODE_ENV === "production";
const logLevel = process.env.LOG_LEVEL || (isProduction ? "warn" : "debug");

// Create logs directory
const logDir = path.join(process.cwd(), "logs");
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
}

// Extend Winston Logger interface
interface SecurityLogger extends winston.Logger {
    security: (message: string, metadata?: any) => void;
    audit: (action: string, user: string, metadata?: any) => void;
}

// Security-focused log format with sanitization
const secureLogFormat = winston.format.combine(
    winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss.SSS" }),
    winston.format.errors({ stack: true }),
    winston.format.printf(({ timestamp, level, message, stack, ...metadata }) => {
        // Type-safe message handling
        const logMessage = typeof message === 'string' ? message : String(message);
        const sanitizedMetadata = sanitizeLogData(metadata);
        
        const logEntry: any = {
            timestamp,
            level: level.toUpperCase(),
            message: sanitizeLogMessage(logMessage)
        };
        
        // Add stack if it exists and is a string
        if (stack && typeof stack === 'string') {
            logEntry.stack = stack;
        }
        
        // Add metadata if it has properties
        if (Object.keys(sanitizedMetadata).length > 0) {
            logEntry.metadata = sanitizedMetadata;
        }
        
        return JSON.stringify(logEntry);
    })
);

// Sanitization functions for A09 compliance
function sanitizeLogData(data: any): any {
    const sensitiveFields = ['password', 'token', 'apikey', 'secret', 'authorization', 'cookie'];
    if (typeof data !== 'object' || data === null) return data;
    
    const sanitized = { ...data };
    for (const field of sensitiveFields) {
        if (sanitized[field]) {
            sanitized[field] = '[REDACTED]';
        }
    }
    return sanitized;
}

function sanitizeLogMessage(message: string): string {
    // Remove potential sensitive data patterns
    return message
        .replace(/password=[\w\d]+/gi, 'password=[REDACTED]')
        .replace(/token=[\w\d]+/gi, 'token=[REDACTED]')
        .replace(/authorization:\s*[\w\d]+/gi, 'authorization: [REDACTED]');
}

// Configure winston logger with daily rotation for PCI-DSS compliance
const baseLogger = winston.createLogger({
    level: logLevel,
    format: secureLogFormat,
    transports: [
        // Console transport for development
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.simple()
            ),
            silent: isProduction
        }),
        
        // Daily rotating file for general logs (90 days retention)
        new DailyRotateFile({
            filename: path.join(logDir, 'app-%DATE%.log'),
            datePattern: 'YYYY-MM-DD',
            maxSize: '20m',
            maxFiles: '90d', // 90 days for PCI-DSS compliance
            auditFile: path.join(logDir, 'app-audit.json'),
            handleExceptions: true,
            handleRejections: true
        }),
        
        // Separate security log file
        new DailyRotateFile({
            filename: path.join(logDir, 'security-%DATE%.log'),
            datePattern: 'YYYY-MM-DD',
            maxSize: '20m',
            maxFiles: '90d',
            level: 'warn', // Only security-relevant events
            auditFile: path.join(logDir, 'security-audit.json')
        }),
        
        // Error log file
        new DailyRotateFile({
            filename: path.join(logDir, 'error-%DATE%.log'),
            datePattern: 'YYYY-MM-DD',
            maxSize: '20m',
            maxFiles: '90d',
            level: 'error',
            auditFile: path.join(logDir, 'error-audit.json')
        })
    ],
    exitOnError: false
});

// Extend logger with security methods
const logger = baseLogger as SecurityLogger;

// Enhanced security logging methods
logger.security = (message: string, metadata: any = {}) => {
    logger.warn(`[SECURITY] ${message}`, { 
        category: 'security', 
        timestamp: new Date().toISOString(),
        ...metadata 
    });
};

logger.audit = (action: string, user: string, metadata: any = {}) => {
    logger.info(`[AUDIT] ${action}`, {
        category: 'audit',
        user: sanitizeLogData({ user }).user,
        timestamp: new Date().toISOString(),
        ...sanitizeLogData(metadata)
    });
};

// Custom Morgan tokens for security context
morgan.token('user-id', (req: any) => {
    return req.user?.id || 'anonymous';
});

morgan.token('session-id', (req: any) => {
    return req.sessionID || 'no-session';
});

morgan.token('real-ip', (req: any) => {
    return req.headers['x-forwarded-for'] || 
           req.headers['x-real-ip'] || 
           req.connection.remoteAddress || 
           req.ip;
});

// Security-focused Morgan format
const securityMorganFormat = ':real-ip - :user-id [:date[iso]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" :response-time ms :session-id';

// Stream for morgan to use winston
const stream = {
    write: (message: string) => {
        logger.info(message.trim(), { category: 'http-request' });
    }
};

// Morgan middleware configurations
const morganMiddleware = morgan(securityMorganFormat, { 
    stream,
    skip: (req, res) => {
        // Skip logging of health checks and static assets in production
        if (isProduction) {
            const url = req.url || '';
            return url === '/health' || url.startsWith('/static');
        }
        return false;
    }
});

// Security event middleware for failed requests
const securityMorganMiddleware = morgan(securityMorganFormat, {
    stream: {
        write: (message: string) => {
            logger.security(`HTTP Request: ${message.trim()}`);
        }
    },
    skip: (req, res) => {
        // Only log security-relevant events (4xx, 5xx)
        return res.statusCode < 400;
    }
});

// Export enhanced logger and middleware
export { 
    logger, 
    morganMiddleware, 
    securityMorganMiddleware 
};

// Utility functions for security logging
export const logSecurityEvent = (event: string, details: any = {}) => {
    logger.security(event, details);
};

export const logUserAction = (action: string, userId: string, details: any = {}) => {
    logger.audit(action, userId, details);
};

// Basic logger without daily rotation (if you prefer the simpler version)
export const basicLogger = winston.createLogger({
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

// Helper function to generate daily log file name (for basic logger)
function getDailyLogFile() {
    const date = new Date().toISOString().split("T")[0];
    const logDir = path.join(process.cwd(), "logs");
    if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
    }
    return path.join(logDir, `app-${date}.log`);
}
