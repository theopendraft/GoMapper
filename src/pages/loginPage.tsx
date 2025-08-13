// src/pages/loginPage.tsx
import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import { AuthContextProps } from "../context/AuthContext";
import { FirebaseError } from "firebase/app";
import { FiEye, FiEyeOff, FiMail, FiLock, FiLogIn } from "react-icons/fi";
import { FcGoogle } from "react-icons/fc";
import { GrMapLocation } from "react-icons/gr"; // Import an icon for the left graphic side

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
    <div className="min-h-full bg-gradient-to-br from-blue-600 to-indigo-950 flex items-center justify-center p-6 relative">
      {/* Background Overlay with Blur */}
      <div className="absolute inset-0 bg-gray-700/50 backdrop-filter backdrop-blur-sm"></div>

      {/* Main Container for Desktop Dual-Pane Layout */}
      <div className="relative z-10 hidden md:flex w-full max-w-6xl h-[80vh] rounded-2xl shadow-2xl overflow-hidden">
        {/* Left Side: SVG Graphics */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="w-1/2 bg-gradient-to-br from-blue-700 to-indigo-900 flex flex-col items-center justify-center p-8 text-white text-center"
        >
          <Lottie animationData={Login} className="w-64 h-64 drop-shadow-lg " />
          <h2 className="text-4xl font-extrabold mb-2">GoMapper</h2>
          <p className="text-lg font-light opacity-90">
            Your world, organized and secured.
          </p>
        </motion.div>

        {/* Right Side: Login Form */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="w-1/2 bg-white flex flex-col justify-center p-12 rounded-r-2xl" // Increased padding for form
        >
          <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">
            Welcome Back!
          </h2>

          <AnimatePresence>
            {errorMessage && (
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="text-red-600 text-sm mb-6 text-center"
              >
                {errorMessage}
              </motion.p>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="space-y-6">
            {" "}
            {/* Increased vertical spacing */}
            {/* Email Input */}
            <div className="relative">
              <FiMail
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" // Adjusted left padding for icon
                size={20}
              />
              <input
                type="email"
                placeholder="Email Address" // More descriptive placeholder
                className="w-full px-4 py-3.5 rounded-lg border border-gray-300 shadow-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out text-gray-800 pl-12" // Applied consistent input styling
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            {/* Password Input */}
            <div className="relative">
              <FiLock
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" // Adjusted left padding for icon
                size={20}
              />
              <input
                type={passwordVisible ? "text" : "password"}
                placeholder="Password"
                className="w-full px-4 py-3.5 rounded-lg border border-gray-300 shadow-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out text-gray-800 pl-12 pr-12" // Applied consistent input styling, added right padding for eye icon
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setPasswordVisible(!passwordVisible)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500" // Added focus styles
                aria-label={passwordVisible ? "Hide password" : "Show password"}
              >
                {passwordVisible ? <FiEyeOff size={20} /> : <FiEye size={20} />}
              </button>
            </div>
            {/* Forgot Password Link */}
            <div className="text-right">
              <button
                type="button"
                onClick={() => setIsForgotPasswordModalOpen(true)}
                className="text-sm text-blue-600 hover:underline font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 rounded" // Added focus styles
                disabled={loading}
              >
                Forgot Password?
              </button>
            </div>
            {/* Login Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              className={`w-full py-3.5 px-4 rounded-lg bg-blue-600 text-white font-semibold text-lg flex items-center justify-center gap-2 shadow-md hover:bg-blue-700 transition duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500
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
            {" "}
            {/* Increased vertical margin */}
            <span className="absolute bg-white px-4 text-sm text-gray-500 font-medium">
              OR
            </span>{" "}
            {/* Increased horizontal padding */}
            <div className="w-full border-t border-gray-300"></div>
          </div>

          {/* Social Login Buttons */}
          <div className="space-y-4">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleGoogleSignIn}
              className="w-full py-3.5 px-4 rounded-lg border border-gray-300 bg-white text-gray-700 font-semibold text-lg flex items-center justify-center gap-2 shadow-sm hover:bg-gray-50 transition duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500" // Applied consistent button styling
              disabled={loading}
            >
              <FcGoogle size={24} /> Login with Google
            </motion.button>
          </div>

          {/* Link to Signup */}
          <p className="text-center text-gray-600 mt-8">
            {" "}
            {/* Increased margin top */}
            Don't have an account?{" "}
            <Link
              to="/signup"
              className="text-blue-600 hover:underline font-medium"
            >
              Sign Up
            </Link>
          </p>
        </motion.div>
      </div>

      {/* Mobile View: Small Card Login Form (conditionally shown) */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="relative z-10 md:hidden bg-white bg-opacity-95 p-8 rounded-xl shadow-2xl w-full max-w-md mx-auto transform transition-all duration-300 ease-out"
      >
        <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">
          Welcome Back!
        </h2>

        <AnimatePresence>
          {errorMessage && (
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="text-red-600 text-sm mb-4 text-center"
            >
              {errorMessage}
            </motion.p>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email Input */}
          <div className="relative">
            <FiMail
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={20}
            />
            <input
              type="email"
              placeholder="Email"
              className="w-full px-4 py-3.5 rounded-lg border border-gray-300 shadow-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out text-gray-800 pl-10"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          {/* Password Input */}
          <div className="relative">
            <FiLock
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={20}
            />
            <input
              type={passwordVisible ? "text" : "password"}
              placeholder="Password"
              className="w-full px-4 py-3.5 rounded-lg border border-gray-300 shadow-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out text-gray-800 pl-10 pr-10"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
            />
            <button
              type="button"
              onClick={() => setPasswordVisible(!passwordVisible)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 rounded-full"
              aria-label={passwordVisible ? "Hide password" : "Show password"}
            >
              {passwordVisible ? <FiEyeOff size={20} /> : <FiEye size={20} />}
            </button>
          </div>

          {/* Forgot Password Link */}
          <div className="text-right">
            <button
              type="button"
              onClick={() => setIsForgotPasswordModalOpen(true)}
              className="text-sm text-blue-600 hover:underline"
              disabled={loading}
            >
              Forgot Password?
            </button>
          </div>

          {/* Login Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            className={`w-full py-3 px-4 rounded-md bg-blue-600 text-white font-semibold text-lg flex items-center justify-center gap-2 hover:bg-blue-700 transition duration-300
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
          <span className="absolute bg-white bg-opacity-95 px-3 text-sm text-gray-500">
            OR
          </span>
          <div className="w-full border-t border-gray-300"></div>
        </div>

        {/* Social Login Buttons */}
        <div className="space-y-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleGoogleSignIn}
            className="w-full py-3 px-4 rounded-md border border-gray-300 bg-white text-gray-700 font-semibold text-lg flex items-center justify-center gap-2 hover:bg-gray-50 transition duration-300"
            disabled={loading}
          >
            <FcGoogle size={24} /> Login with Google
          </motion.button>
        </div>

        {/* Link to Signup */}
        <p className="text-center text-gray-600 mt-6">
          Don't have an account?{" "}
          <Link
            to="/signup"
            className="text-blue-600 hover:underline font-medium"
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
