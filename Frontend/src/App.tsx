import { useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "./store/hooks";
import { checkAuth } from "./store/authSlice";
import { AppShellSkeleton } from "./components/loading-skeletons";
import LandingPage from "./pages/landing";
import LoginPage from "./pages/login";
import SignupPage from "./pages/signup";
import ForgotPasswordPage from "./pages/forgot-password";
import UpdatePasswordPage from "./pages/update-password";
import VerifyEmailPage from "./pages/verify-email";
import NotFoundPage from "./pages/not-found";
import DashboardLayout from "./components/dashboard-layout";
import DashboardPage from "./pages/dashboard/dashboard";
import HistoryPage from "./pages/dashboard/history";
import ProfilePage from "./pages/dashboard/profile";
import ApiKeysPage from "./pages/dashboard/api-keys";

function App() {
    const dispatch = useAppDispatch();
    const authLoading = useAppSelector((s) => s.auth.authLoading);
    const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated);

    useEffect(() => {
        dispatch(checkAuth());
    }, [dispatch]);

    if (authLoading) {
        return <AppShellSkeleton />;
    }

    return (
        <Routes>
            {/* Public routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/update-password" element={<UpdatePasswordPage />} />
            <Route path="/verify-email" element={<VerifyEmailPage />} />

            {/* Root: Landing page if not authenticated, Dashboard if authenticated */}
            {isAuthenticated ? (
                <Route path="/" element={<DashboardLayout />}>
                    <Route index element={<DashboardPage />} />
                    <Route path="history" element={<HistoryPage />} />
                    <Route path="profile" element={<ProfilePage />} />
                    <Route path="api-keys" element={<ApiKeysPage />} />
                </Route>
            ) : (
                <Route path="/" element={<LandingPage />} />
            )}

            <Route path="*" element={<NotFoundPage />} />
        </Routes>
    )
}

export default App;
