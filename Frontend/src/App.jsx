import { Button } from "@/components/ui/button"
import { LoginForm } from "./components/login-form";
import LoginPage from "./pages/login";
import SignupPage from "./pages/singup";
import { Routes, Route } from "react-router-dom";
import NotFoundPage from "./pages/not-found";
import LandingPage from "./pages/landing";
import ForgotPasswordPage from "./pages/forgot-password";
import VerifyEmailPage from "./pages/verify-email";
import UpdatePasswordPage from "./pages/update-password";

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/update-password" element={<UpdatePasswordPage />} />
      <Route path="/verify-email" element={<VerifyEmailPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>

  )
}

export default App;

