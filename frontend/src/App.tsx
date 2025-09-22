import { MainLayout } from "./components/Layout/MainLayout";
import { AppRoutes } from "./routes";
import { GoogleOAuthWrapper } from "./app/GoogleOAuthProvider";
import { useTokenRefresh } from "./features/auth/hooks/useTokenRefresh";

const App = () => {
    // Set up automatic token refresh
    useTokenRefresh();

    return (
        <GoogleOAuthWrapper>
            <MainLayout>
                <AppRoutes />
            </MainLayout>
        </GoogleOAuthWrapper>
    );
};

export default App;
