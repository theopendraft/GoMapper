// src/pages/loginPage.tsx
import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import { AuthContextProps } from "../context/AuthContext";
// Import FirebaseError specifically for better type checking on error objects
import { FirebaseError } from "firebase/app";
import { FiEye, FiEyeOff, FiMail, FiLock, FiLogIn } from "react-icons/fi";
import { FcGoogle } from "react-icons/fc";
import { toast } from "react-toastify";
import ForgotPasswordModal from "../components/modals/ForgotPasswordModal";
import { motion } from "framer-motion"; // Assuming framer-motion is installed

export default function LoginPage() {
  const { login, signInWithGoogle } = useAuth() as AuthContextProps;
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [loading, setLoading] = useState(false); // Global loading for any login attempt
  const [errorMessage, setErrorMessage] = useState(""); // NEW: State to display error message
  const [isForgotPasswordModalOpen, setIsForgotPasswordModalOpen] = useState(false);

  // Helper to get user-friendly Firebase Auth error messages
  const getAuthErrorMessage = (error: any): string => {
    if (error instanceof FirebaseError) {
      switch (error.code) {
        case 'auth/user-not-found':
          // Specific message for user not found, suggesting signup
          return 'No account found with this email. Please sign up or check your email address.';
        case 'auth/wrong-password':
          return 'Invalid password. Please try again.';
        case 'auth/invalid-email':
          return 'The email address is not valid.';
        case 'auth/user-disabled':
          return 'This account has been disabled.';
        case 'auth/popup-closed-by-user':
          return 'Authentication cancelled by user.';
        case 'auth/cancelled-popup-request':
          return 'Only one authentication popup allowed at a time. Please try again.';
        case 'auth/network-request-failed':
          return 'Network error. Please check your internet connection.';
        case 'auth/too-many-requests':
          return 'Too many login attempts. Please try again later.';
        default:
          return `Authentication failed: ${error.message || 'Unknown error.'}`;
      }
    }
    return 'An unexpected error occurred. Please try again.';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return; // Prevent double submission
    setLoading(true);
    setErrorMessage(""); // Clear previous error message

    try {
      await login(email, password);
      toast.success("Login successful!");
      navigate("/map"); // Redirect to map after login
    } catch (error: any) {
      console.error("Login (Email/Password) error:", error);
      const msg = getAuthErrorMessage(error);
      setErrorMessage(msg); // Set error message for display below form
      toast.error(msg); // Show toast notification
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (loading) return; // Prevent double submission
    setLoading(true);
    setErrorMessage(""); // Clear previous error message
    try {
      await signInWithGoogle();
      toast.success("Login successful with Google!");
      navigate("/map");
    } catch (error: any) {
      console.error("Login (Google) error:", error);
      const msg = getAuthErrorMessage(error);
      setErrorMessage(msg); // Set error message for display below form
      toast.error(msg); // Show toast notification
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-blue-500 to-indigo-900 text-white flex flex-col items-center justify-center p-6"
       //style={{ backgroundImage: "url('https://source.unsplash.com/random/1920x1080?map,landscape')" }} // Dynamic background, added 'dark' for better contrast with light form
    >
      {/* Background Overlay with Blur */}
      <div className="absolute inset-0 bg-opacity-50 backdrop-filter backdrop-blur-sm"></div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }} // Removed y:10, let it center naturally
        transition={{ duration: 0.2 }}
        className="relative bg-white bg-opacity-95 p-8 rounded-xl shadow-2xl w-full max-w-md mx-auto transform transition-all duration-300 ease-out z-10" // Increased opacity slightly for better readability
      >
        <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">
          Welcome Back!
        </h2>
        
        {/* Display error message */}
        {errorMessage && (
          <p className="text-red-600 text-sm mb-4 text-center">{errorMessage}</p>
        )}

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
              className="input-field pl-10"
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
              className="input-field pl-10 pr-10"
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
          <button
            type="submit"
            className={`w-full py-3 px-4 rounded-md bg-blue-600 text-white font-semibold text-lg flex items-center justify-center gap-2 hover:bg-blue-700 transition duration-300
              ${loading ? 'opacity-70 cursor-not-allowed' : ''}
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
          </button>
        </form>

        <div className="relative flex items-center justify-center my-6">
          <span className="absolute bg-white bg-opacity-95 px-3 text-sm text-gray-500">OR</span>
          <div className="w-full border-t border-gray-300"></div>
        </div>

        {/* Social Login Buttons */}
        <div className="space-y-4">
          <button
            onClick={handleGoogleSignIn}
            className="w-full py-3 px-4 rounded-md border border-gray-300 bg-white text-gray-700 font-semibold text-lg flex items-center justify-center gap-2 hover:bg-gray-50 transition duration-300"
            disabled={loading}
          >
            <FcGoogle size={24} /> Login with Google
          </button>
        </div>

        {/* Link to Signup */}
        <p className="text-center text-gray-600 mt-6">
          Don't have an account?{' '}
          <Link to="/signup" className="text-blue-600 hover:underline font-medium">
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