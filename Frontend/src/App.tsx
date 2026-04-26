import { useEffect, useState } from "react";
import { Routes, Route } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "./store/hooks";
import { checkAuth } from "./store/authSlice";
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
    const { isAuthenticated, authLoading } = useAppSelector((s) => s.auth);
    const [authBootstrapped, setAuthBootstrapped] = useState(false);

    useEffect(() => {
        dispatch(checkAuth()).finally(() => {
            setAuthBootstrapped(true);
        });
    }, [dispatch]);

    if (!authBootstrapped || authLoading) {
        return (
            <main
                style={{
                    minHeight: "100vh",
                    display: "grid",
                    placeItems: "center",
                    fontFamily: "system-ui, -apple-system, sans-serif",
                }}
            >
                <p>Loading your session...</p>
            </main>
        );
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
