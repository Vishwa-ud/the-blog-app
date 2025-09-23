import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../../../app/store';
import { setCredentials, logout } from '../slices/authSlice';
import { api } from '../../../app/api';

interface RefreshTokenResponse {
    accessToken: string;
    user: IUser;
}

export const useTokenRefresh = () => {
    const dispatch = useDispatch<AppDispatch>();

    const refreshToken = async (): Promise<RefreshTokenResponse | null> => {
        try {
            const response = await api.post('/auth/refresh-token');
            return response.data;
        } catch (error) {
            console.error('Token refresh failed:', error);
            return null;
        }
    };

    const setupTokenRefresh = () => {
        // Set up token refresh every 14 minutes (access token expires in 15 minutes)
        const interval = setInterval(async () => {
            console.log('Attempting to refresh token...');
            const refreshData = await refreshToken();
            
            if (refreshData) {
                console.log('Token refreshed successfully');
                dispatch(setCredentials({ user: refreshData.user }));
            } else {
                console.log('Token refresh failed, logging out user');
                dispatch(logout());
            }
        }, 14 * 60 * 1000); // 14 minutes

        return () => clearInterval(interval);
    };

    useEffect(() => {
        const cleanup = setupTokenRefresh();
        return cleanup;
    }, [dispatch]);

    return { refreshToken };
};
