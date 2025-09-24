import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";
import { v2 as cloudinary } from "cloudinary";
import usersRoutes from "./routes/users";
import postsRoutes from "./routes/posts";
import authRoutes from "./routes/auth";
import likesRoutes from "./routes/likes";
import commentsRoutes from "./routes/comments";
import { errorMiddleware } from "./middleware/errorMiddleware";
import {
    logger,
    morganMiddleware,
    securityMorganMiddleware,
    logSecurityEvent
} from "./middleware/loggerMiddleware";

dotenv.config({ path: "../.env" });

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

logger.info("Application starting up", {
    nodeEnv: process.env.NODE_ENV,
    port: PORT,
    timestamp: new Date().toISOString()
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morganMiddleware);
app.use(securityMorganMiddleware);

const corsOptions = {
    origin: [
        "http://localhost:5173",
        "http://localhost:4173",
        process.env.FRONTEND_SERVER_PROD || "",
    ],
    credentials: true,
};
app.use(cors(corsOptions));

logger.info("CORS configured", {
    allowedOrigins: corsOptions.origin.filter(origin => origin !== ""),
    credentialsEnabled: corsOptions.credentials
});

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

logger.info("Cloudinary configured", {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME ? '[SET]' : '[NOT SET]',
    apiKey: process.env.CLOUDINARY_API_KEY ? '[SET]' : '[NOT SET]',
    apiSecret: process.env.CLOUDINARY_API_SECRET ? '[SET]' : '[NOT SET]'
});

app.use((req, res, next) => {
    const suspiciousPatterns = [
        /\.\./,
        /<script/i,
        /union.*select/i,
        /javascript:/i,
        /eval\(/i,
    ];
    const fullUrl = req.url;
    const userAgent = req.headers['user-agent'] || 'unknown';
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.ip;
    const isSuspicious = suspiciousPatterns.some(pattern =>
        pattern.test(fullUrl) || pattern.test(userAgent)
    );
    if (isSuspicious) {
        logSecurityEvent('Suspicious request detected', {
            url: fullUrl,
            method: req.method,
            ip: ip,
            userAgent: userAgent,
            headers: sanitizeHeaders(req.headers)
        });
    }
    if (req.url.includes('/auth/')) {
        logger.audit('Authentication endpoint accessed', req.body?.email || 'unknown', {
            endpoint: req.url,
            method: req.method,
            ip: ip,
            userAgent: userAgent
        });
    }
    next();
});

function sanitizeHeaders(headers: any) {
    const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key'];
    const sanitized = { ...headers };
    sensitiveHeaders.forEach(header => {
        if (sanitized[header]) {
            sanitized[header] = '[REDACTED]';
        }
    });
    return sanitized;
}

app.get('/health', (req, res) => {
    const healthStatus = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development'
    };
    logger.info('Health check requested', {
        ip: req.ip,
        userAgent: req.headers['user-agent']
    });
    res.json(healthStatus);
});

app.use("/uploads/", express.static(path.join(process.cwd(), "/uploads/")));

app.use("/posts", (req, res, next) => {
    if (req.method !== 'GET') {
        logger.audit('Posts route accessed', req.body?.userId || 'anonymous', {
            method: req.method,
            endpoint: req.url,
            ip: req.ip
        });
    }
    next();
}, postsRoutes);

app.use("/posts", (req, res, next) => {
    if (req.url.includes('like')) {
        logger.audit('Like action', req.body?.userId || 'anonymous', {
            method: req.method,
            endpoint: req.url,
            ip: req.ip
        });
    }
    next();
}, likesRoutes);

app.use("/users", (req, res, next) => {
    if (req.method !== 'GET') {
        logger.audit('User management action', req.body?.userId || req.params?.id || 'unknown', {
            method: req.method,
            endpoint: req.url,
            ip: req.ip
        });
    }
    next();
}, usersRoutes);

app.use("/auth", (req, res, next) => {
    const action = req.url.includes('login') ? 'Login attempt' :
        req.url.includes('register') ? 'Registration attempt' :
            req.url.includes('logout') ? 'Logout attempt' : 'Auth action';
    logger.audit(action, req.body?.email || 'unknown', {
        method: req.method,
        endpoint: req.url,
        ip: req.ip,
        userAgent: req.headers['user-agent']
    });
    next();
}, authRoutes);

app.use("/comments", (req, res, next) => {
    if (req.method !== 'GET') {
        logger.audit('Comment action', req.body?.userId || 'anonymous', {
            method: req.method,
            endpoint: req.url,
            postId: req.body?.postId || req.params?.postId,
            ip: req.ip
        });
    }
    next();
}, commentsRoutes);

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    logSecurityEvent('Application error occurred', {
        error: err.message,
        stack: err.stack ? err.stack.split('\n').slice(0, 3) : 'No stack trace',
        url: req.url,
        method: req.method,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        timestamp: new Date().toISOString()
    });
    errorMiddleware(err, req, res, next);
});

app.use('*', (req, res) => {
    logSecurityEvent('404 Not Found', {
        url: req.url,
        method: req.method,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        referer: req.headers.referer || 'none'
    });
    res.status(404).json({
        error: 'Route not found',
        message: 'The requested resource was not found on this server'
    });
});

process.on('SIGTERM', () => {
    logger.info('SIGTERM received, shutting down gracefully');
    process.exit(0);
});

process.on('SIGINT', () => {
    logger.info('SIGINT received, shutting down gracefully');
    process.exit(0);
});

process.on('uncaughtException', (error) => {
    logSecurityEvent('Uncaught Exception', {
        error: error.message,
        stack: error.stack
    });
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    logSecurityEvent('Unhandled Rejection', {
        reason: reason,
        promise: promise
    });
});

const server = app.listen(PORT, () => {
    const startupMessage = `Server successfully started on port: ${PORT}`;
    console.log(startupMessage);
    logger.info('Server startup completed', {
        port: PORT,
        environment: process.env.NODE_ENV || 'development',
        nodeVersion: process.version,
        timestamp: new Date().toISOString(),
        processId: process.pid
    });
    logger.security('Security logging system activated', {
        features: [
            'HTTP request logging',
            'Security event monitoring',
            'Audit trail logging',
            '90-day log retention',
            'Data sanitization',
            'Error tracking'
        ],
        compliance: 'PCI-DSS v4.0 / OWASP A09-2021'
    });
});

server.on('error', (error) => {
    logSecurityEvent('Server error', {
        error: error.message,
        code: (error as any).code,
        timestamp: new Date().toISOString()
    });
});

export default app;
