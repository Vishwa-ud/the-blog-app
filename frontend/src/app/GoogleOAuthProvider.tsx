import { GoogleOAuthProvider } from '@react-oauth/google';
import { ReactNode } from 'react';

interface GoogleOAuthWrapperProps {
    children: ReactNode;
}

const GOOGLE_CLIENT_ID = "123401464362-mf4tfcigg6q8varvlmvqaop5l0dr3e86.apps.googleusercontent.com";

export const GoogleOAuthWrapper = ({ children }: GoogleOAuthWrapperProps) => {
    return (
        <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
            {children}
        </GoogleOAuthProvider>
    );
};
