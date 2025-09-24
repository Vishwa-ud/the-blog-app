import jwt, { Secret, SignOptions } from "jsonwebtoken";

export const generateJwtToken = (
    userId: string,
    TOKEN_SECRET: Secret,
    expiryTime: SignOptions["expiresIn"],
) => {
    return jwt.sign({ id: userId }, TOKEN_SECRET, { expiresIn: expiryTime as any });
};
