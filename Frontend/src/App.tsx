import { useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "./store/hooks";
import { checkAuth } from "./store/authSlice";
import { Loader2 } from "lucide-react";
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
import SettingsPage from "./pages/dashboard/settings";

function App() {
    const dispatch = useAppDispatch();
    const authLoading = useAppSelector((s) => s.auth.authLoading);

    useEffect(() => {
        dispatch(checkAuth());
    }, [dispatch]);

    if (authLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-background">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <Routes>
            {/* Public routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/update-password" element={<UpdatePasswordPage />} />
            <Route path="/verify-email" element={<VerifyEmailPage />} />

            {/* Dashboard routes */}
            <Route path="/dashboard" element={<DashboardLayout />}>
                <Route index element={<DashboardPage />} />
                <Route path="history" element={<HistoryPage />} />
                <Route path="profile" element={<ProfilePage />} />
                <Route path="settings" element={<SettingsPage />} />
            </Route>

            <Route path="*" element={<NotFoundPage />} />
        </Routes>
    )
}

export default App;
