import express from "express";
import dotenv from "dotenv";
dotenv.config({ path: "../.env" });
import cors, {CorsOptions} from "cors";
import cookieParser from "cookie-parser";
import usersRoutes from "./routes/users";
import postsRoutes from "./routes/posts";
import authRoutes from "./routes/auth";
import likesRoutes from "./routes/likes";
import commentsRoutes from "./routes/comments";
import path from "path";
import { errorMiddleware } from "./middleware/errorMiddleware";
import { v2 as cloudinary } from "cloudinary";
import helmet from "helmet";
import { sanitizeMiddleware } from "./middleware/sanitizeMiddleware";
import rateLimit from "express-rate-limit";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

//Use helmet for make Security Policies(A05)
app.use(
    helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                scriptSrc: ["'self'"], 
                styleSrc: ["'self'", "https://fonts.googleapis.com"],
                imgSrc: ["'self'", "data:"],
                fontSrc: ["'self'", "https://fonts.gstatic.com"],
            }
        },
        referrerPolicy: { policy: "no-referrer-when-downgrade" },
        frameguard: { action: "deny" },
        hsts: { maxAge: 60 * 60 * 24 * 30, includeSubDomains: true },
    })
)

//Disable X-Powered-By headers(A05)
app.disable("x-powered-by");

//Use sanitize frontend inputs to prevent XSS
app.use(sanitizeMiddleware);

//CORS - Stricter AllowList(A05)
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:4173",
  process.env.FRONTEND_SERVER_PROD || "",
];
const corsOptions: CorsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("CORS not allowed"));
    }
  },
  credentials: true,
};
app.use(cors(corsOptions));


//Use rate limiter for brute-force protection(A05)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: "Too many attempts, try again later.",
});

app.use("/auth", authLimiter);

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

app.use("/uploads/", express.static(path.join(process.cwd(), "/uploads/")));
app.use("/posts", postsRoutes);
app.use("/posts", likesRoutes);
app.use("/users", usersRoutes);
app.use("/auth", authRoutes);
app.use("/comments", commentsRoutes);
app.use(errorMiddleware);

app.listen({ address: "0.0.0.0", port: PORT }, () => {
    console.log(`Server running on port: ${PORT}`);
});
