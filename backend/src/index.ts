import express from "express";
import https from "https";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
dotenv.config({ path: "../.env" });
import cors from "cors";
import cookieParser from "cookie-parser";
import usersRoutes from "./routes/users";
import postsRoutes from "./routes/posts";
import authRoutes from "./routes/auth";
import likesRoutes from "./routes/likes";
import commentsRoutes from "./routes/comments";
import { errorMiddleware } from "./middleware/errorMiddleware";
import { v2 as cloudinary } from "cloudinary";

const app = express();
const PORT = parseInt(process.env.PORT || "5000");
const HTTPS_PORT = parseInt(process.env.HTTPS_PORT || "5443");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

const corsOptions = {
    origin: [
        "http://localhost:5173",  // Frontend direct access
        "http://localhost:4173",  // Frontend preview
        "https://localhost",      // Nginx HTTPS proxy
        "https://localhost:443",  // Explicit HTTPS port
        process.env.FRONTEND_SERVER_PROD || "",
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
};
app.use(cors(corsOptions));

// If running behind a reverse proxy (Nginx) and you plan to use secure cookies,
// trust the proxy so Express can correctly detect HTTPS
app.set("trust proxy", 1);

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

app.use("/uploads/", express.static(path.join(process.cwd(), "/uploads/")));

// Health check endpoint
app.get("/health", (req, res) => {
    res.status(200).json({ 
        status: "healthy backend ekak bn", 
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || "development"
    });
});

app.use("/posts", postsRoutes);
app.use("/posts", likesRoutes);
app.use("/users", usersRoutes);
app.use("/auth", authRoutes);
app.use("/comments", commentsRoutes);
app.use(errorMiddleware);

// HTTPS Configuration with error handling
const sslKeyPath = path.join(__dirname, '../ssl/backend.key');
const sslCertPath = path.join(__dirname, '../ssl/backend.crt');

// Check if SSL certificates exist
if (fs.existsSync(sslKeyPath) && fs.existsSync(sslCertPath)) {
    const httpsOptions = {
        key: fs.readFileSync(sslKeyPath),
        cert: fs.readFileSync(sslCertPath)
    };

    // Start HTTPS server
    const httpsServer = https.createServer(httpsOptions, app);
    
    httpsServer.listen(HTTPS_PORT, '0.0.0.0', () => {
        console.log(`🔒 Backend HTTPS server running on port ${HTTPS_PORT}`);
    });
} else {
    console.log(`⚠️  SSL certificates not found. HTTPS server not started.`);
    console.log(`   Expected: ${sslKeyPath} and ${sslCertPath}`);
}

// Start HTTP server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🌐 Backend HTTP server running on port ${PORT}`);
});
