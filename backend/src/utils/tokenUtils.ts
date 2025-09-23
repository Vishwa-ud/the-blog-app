import jwt from "jsonwebtoken";

// Generate Access Token (short-lived, 15 minutes)
export const generateAccessToken = (userId: string) => {
    return jwt.sign(
        { id: userId, type: 'access' }, 
        process.env.TOKEN_SECRET || "", 
        { expiresIn: "15m" }
    );
};

// Generate Refresh Token (long-lived, 7 days)
export const generateRefreshToken = (userId: string) => {
    return jwt.sign(
        { id: userId, type: 'refresh' }, 
        process.env.TOKEN_SECRET || "", 
        { expiresIn: "7d" }
    );
};

// Generate token pair
export const generateTokenPair = (userId: string) => {
    const accessToken = generateAccessToken(userId);
    const refreshToken = generateRefreshToken(userId);
    
    return {
        accessToken,
        refreshToken
    };
};
