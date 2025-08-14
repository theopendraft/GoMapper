// src/pages/loginPage.tsx
import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import { AuthContextProps } from "../context/AuthContext";
import { FirebaseError } from "firebase/app";
import { FiEye, FiEyeOff, FiMail, FiLock, FiLogIn } from "react-icons/fi";
import { FcGoogle } from "react-icons/fc";
import { useSnackbar } from "../context/SnackbarContext";
import ForgotPasswordModal from "../components/modals/ForgotPasswordModal";
import { AnimatePresence, motion } from "framer-motion";
import Login from "../../public/Login.json"; // Adjust path if necessary
import Lottie from "lottie-react";

export default function LoginPage() {
  const { login, signInWithGoogle } = useAuth() as AuthContextProps;
  const navigate = useNavigate();
  const { showSnackbar } = useSnackbar();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isForgotPasswordModalOpen, setIsForgotPasswordModalOpen] =
    useState(false);

  const getAuthErrorMessage = (error: any): string => {
    if (error instanceof FirebaseError) {
      switch (error.code) {
        case "auth/user-not-found":
          return "No account found with this email. Please sign up or check your email address.";
        case "auth/wrong-password":
          return "Invalid password. Please try again.";
        case "auth/invalid-email":
          return "The email address is not valid.";
        case "auth/user-disabled":
          return "This account has been disabled.";
        case "auth/popup-closed-by-user":
          return "Authentication cancelled by user.";
        case "auth/cancelled-popup-request":
          return "Only one authentication popup allowed at a time. Please try again.";
        case "auth/network-request-failed":
          return "Network error. Please check your internet connection.";
        case "auth/too-many-requests":
          return "Too many login attempts. Please try again later.";
        default:
          return `Authentication failed: ${error.message || "Unknown error."}`;
      }
    }
    return "An unexpected error occurred. Please try again.";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setErrorMessage("");

    try {
      await login(email, password);
      showSnackbar({ message: "Login successful!", severity: "success" });
      navigate("/map");
    } catch (error: any) {
      console.error("Login (Email/Password) error:", error);
      const msg = getAuthErrorMessage(error);
      setErrorMessage(msg);
      showSnackbar({ message: msg, severity: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (loading) return;
    setLoading(true);
    setErrorMessage("");
    try {
      await signInWithGoogle();
      showSnackbar({
        message: "Login successful with Google!",
        severity: "success",
      });
      navigate("/map");
    } catch (error: any) {
      console.error("Login (Google) error:", error);
      const msg = getAuthErrorMessage(error);
      setErrorMessage(msg);
      showSnackbar({ message: msg, severity: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen w-full bg-gray-900 flex items-center justify-center p-4 sm:p-6 lg:p-8 relative overflow-hidden"
      style={
        {
          "--grid-color": "rgba(203, 213, 225, 0.1)",
          "--grid-size": "40px",
          backgroundImage: `
          linear-gradient(to bottom, transparent, #111827),
          linear-gradient(to right, var(--grid-color) 1px, transparent 1px),
          linear-gradient(to bottom, var(--grid-color) 1px, transparent 1px)
        `,
          backgroundSize: `100% 100%, var(--grid-size) var(--grid-size), var(--grid-size) var(--grid-size)`,
        } as React.CSSProperties
      }
    >
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/30 via-indigo-900/30 to-gray-900/40 backdrop-blur-sm"></div>

      {/* Main Container for Desktop Dual-Pane Layout */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative z-10 hidden md:flex w-full max-w-6xl rounded-2xl shadow-2xl overflow-hidden bg-white/5 backdrop-blur-lg border border-white/10"
      >
        {/* Left Side: SVG Graphics */}
        <div className="w-1/2 bg-gradient-to-br from-blue-700/20 to-indigo-900/30 flex flex-col items-center justify-center p-8 text-white text-center">
          <Lottie animationData={Login} className="w-64 h-64 drop-shadow-lg " />
          <h2 className="text-4xl font-extrabold mb-2">GoMapper</h2>
          <p className="text-lg font-light opacity-90">
            Your world, organized and secured.
          </p>
        </div>

        {/* Right Side: Login Form */}
        <div className="w-1/2 bg-gray-900/30 flex flex-col justify-center p-12">
          <h2 className="text-3xl font-bold text-white mb-8 text-center">
            Welcome Back!
          </h2>

          <AnimatePresence>
            {errorMessage && (
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="text-red-400 text-sm mb-6 text-center bg-red-900/30 p-3 rounded-lg"
              >
                {errorMessage}
              </motion.p>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="relative">
              <FiMail
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                size={20}
              />
              <input
                type="email"
                placeholder="Email Address"
                className="w-full px-4 py-3.5 rounded-lg border border-gray-600 bg-gray-800/50 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out pl-12"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div className="relative">
              <FiLock
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                size={20}
              />
              <input
                type={passwordVisible ? "text" : "password"}
                placeholder="Password"
                className="w-full px-4 py-3.5 rounded-lg border border-gray-600 bg-gray-800/50 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out pl-12 pr-12"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setPasswordVisible(!passwordVisible)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200 p-1 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label={passwordVisible ? "Hide password" : "Show password"}
              >
                {passwordVisible ? <FiEyeOff size={20} /> : <FiEye size={20} />}
              </button>
            </div>
            <div className="text-right">
              <button
                type="button"
                onClick={() => setIsForgotPasswordModalOpen(true)}
                className="text-sm text-blue-400 hover:underline font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                disabled={loading}
              >
                Forgot Password?
              </button>
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              className={`w-full py-3.5 px-4 rounded-lg bg-blue-600 text-white font-semibold text-lg flex items-center justify-center gap-2 shadow-md hover:bg-blue-700 transition duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-blue-500
                ${loading ? "opacity-70 cursor-not-allowed" : ""}
              `}
              disabled={loading}
            >
              {loading ? (
                <svg
                  className="animate-spin h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
              ) : (
                <>
                  <FiLogIn size={20} /> Login
                </>
              )}
            </motion.button>
          </form>

          <div className="relative flex items-center justify-center my-8">
            <span className="absolute bg-gray-900/80 px-4 text-sm text-gray-400 font-medium">
              OR
            </span>
            <div className="w-full border-t border-gray-600"></div>
          </div>

          <div className="space-y-4">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleGoogleSignIn}
              className="w-full py-3.5 px-4 rounded-lg border border-gray-600 bg-gray-800/50 text-white font-semibold text-lg flex items-center justify-center gap-3 shadow-sm hover:bg-gray-700/70 transition duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-blue-500"
              disabled={loading}
            >
              <FcGoogle size={24} /> Login with Google
            </motion.button>
          </div>

          <p className="text-center text-gray-400 mt-8">
            Don't have an account?{" "}
            <Link
              to="/signup"
              className="text-blue-400 hover:underline font-medium"
            >
              Sign Up
            </Link>
          </p>
        </div>
      </motion.div>

      {/* Mobile View: Small Card Login Form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative z-10 md:hidden bg-gray-900/50 backdrop-blur-lg border border-white/10 p-8 rounded-2xl shadow-2xl w-full max-w-md mx-auto"
      >
        <h2 className="text-3xl font-bold text-white mb-6 text-center">
          Welcome Back!
        </h2>

        <AnimatePresence>
          {errorMessage && (
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="text-red-400 text-sm mb-4 text-center bg-red-900/30 p-3 rounded-lg"
            >
              {errorMessage}
            </motion.p>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="relative">
            <FiMail
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={20}
            />
            <input
              type="email"
              placeholder="Email"
              className="w-full px-4 py-3.5 rounded-lg border border-gray-600 bg-gray-800/50 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out pl-10"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className="relative">
            <FiLock
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={20}
            />
            <input
              type={passwordVisible ? "text" : "password"}
              placeholder="Password"
              className="w-full px-4 py-3.5 rounded-lg border border-gray-600 bg-gray-800/50 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out pl-10 pr-10"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
            />
            <button
              type="button"
              onClick={() => setPasswordVisible(!passwordVisible)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200 p-1 rounded-full"
              aria-label={passwordVisible ? "Hide password" : "Show password"}
            >
              {passwordVisible ? <FiEyeOff size={20} /> : <FiEye size={20} />}
            </button>
          </div>

          <div className="text-right">
            <button
              type="button"
              onClick={() => setIsForgotPasswordModalOpen(true)}
              className="text-sm text-blue-400 hover:underline"
              disabled={loading}
            >
              Forgot Password?
            </button>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            className={`w-full py-3 px-4 rounded-lg bg-blue-600 text-white font-semibold text-lg flex items-center justify-center gap-2 hover:bg-blue-700 transition duration-300
              ${loading ? "opacity-70 cursor-not-allowed" : ""}
            `}
            disabled={loading}
          >
            {loading ? (
              <svg
                className="animate-spin h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            ) : (
              <>
                <FiLogIn size={20} /> Login
              </>
            )}
          </motion.button>
        </form>

        <div className="relative flex items-center justify-center my-6">
          <span className="absolute bg-gray-900/50 px-3 text-sm text-gray-400">
            OR
          </span>
          <div className="w-full border-t border-gray-600"></div>
        </div>

        <div className="space-y-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleGoogleSignIn}
            className="w-full py-3 px-4 rounded-lg border border-gray-600 bg-gray-800/50 text-white font-semibold text-lg flex items-center justify-center gap-3 hover:bg-gray-700/70 transition duration-300"
            disabled={loading}
          >
            <FcGoogle size={24} /> Login with Google
          </motion.button>
        </div>

        <p className="text-center text-gray-400 mt-6">
          Don't have an account?{" "}
          <Link
            to="/signup"
            className="text-blue-400 hover:underline font-medium"
          >
            Sign Up
          </Link>
        </p>
      </motion.div>

      {/* Forgot Password Modal */}
      <ForgotPasswordModal
        isOpen={isForgotPasswordModalOpen}
        onClose={() => setIsForgotPasswordModalOpen(false)}
      />
    </div>
  );
}
