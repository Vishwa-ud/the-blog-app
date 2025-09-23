import { GoogleLogin, CredentialResponse } from '@react-oauth/google';
import { useGoogleLoginMutation } from '../api/googleLogin';
import { Box, Typography } from '@mui/material';

export const GoogleLoginButton = () => {
    const { mutate: googleLogin } = useGoogleLoginMutation();

    const handleGoogleSuccess = (credentialResponse: CredentialResponse) => {
        if (credentialResponse.credential) {
            console.log("Google login credential received:", credentialResponse.credential);
            googleLogin(credentialResponse.credential);
        } else {
            console.error("No credential received from Google");
        }
    };

    const handleGoogleError = () => {
        console.error("Google login failed");
    };

    return (
        <Box sx={{ width: '100%', my: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Box sx={{ flex: 1, height: '1px', bgcolor: 'divider' }} />
                <Typography sx={{ px: 2, color: 'text.secondary', fontSize: '0.875rem' }}>
                    OR
                </Typography>
                <Box sx={{ flex: 1, height: '1px', bgcolor: 'divider' }} />
            </Box>
            
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={handleGoogleError}
                    useOneTap={false}
                    theme="outline"
                    size="large"
                    width="100%"
                    text="signin_with"
                    shape="rectangular"
                    locale="en"
                />
            </Box>
        </Box>
    );
};
