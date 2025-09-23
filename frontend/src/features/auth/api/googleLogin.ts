import { useMutation } from "@tanstack/react-query";
import { api } from "../../../app/api";
import { useDispatch } from "react-redux";
import { AppDispatch } from "../../../app/store";
import { setCredentials } from "../slices/authSlice";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

interface GoogleLoginCredentials {
    credential: string;
}

interface GoogleJWTPayload {
    sub: string;
    email: string;
    name: string;
    picture?: string;
    given_name?: string;
    family_name?: string;
}

const googleLogin = async (
    credentials: GoogleLoginCredentials,
): Promise<{ user: IUser }> => {
    const response = await api.post("/auth/google-login", credentials);
    return response.data;
};

export const useGoogleLoginMutation = () => {
    const dispatch = useDispatch<AppDispatch>();
    const navigate = useNavigate();

    return useMutation({
        mutationFn: (credential: string) => {
            // Decode the JWT to log user info
            try {
                const decoded = jwtDecode<GoogleJWTPayload>(credential);
                console.log("Decoded Google JWT:", {
                    userId: decoded.sub,
                    email: decoded.email,
                    name: decoded.name,
                    picture: decoded.picture,
                    givenName: decoded.given_name,
                    familyName: decoded.family_name,
                });
            } catch (error) {
                console.error("Error decoding Google JWT:", error);
            }

            return googleLogin({ credential });
        },
        onSuccess: (data) => {
            console.log("Google login successful:", data.user);
            dispatch(setCredentials({ user: data.user }));
            navigate("/");
        },
        onError: (error) => {
            console.error("Google login error:", error);
        },
    });
};
