// src/pages/signupPage.tsx
import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import { AuthContextProps } from "../context/AuthContext";
import { updateProfile } from "firebase/auth"; // Explicitly imported updateProfile
import {
  FiEye,
  FiEyeOff,
  FiUser,
  FiMail,
  FiLock,
  FiUserPlus,
} from "react-icons/fi";
import { useSnackbar } from "../context/SnackbarContext";
import { FcGoogle } from "react-icons/fc";
import { GrMapLocation } from "react-icons/gr"; // Icon for the left graphic side
import { AnimatePresence, motion } from "framer-motion";
import { FirebaseError } from "firebase/app"; // Import FirebaseError for type checking

export default function SignupPage() {
  const { signup, signInWithGoogle } = useAuth() as AuthContextProps;
  const navigate = useNavigate();
  const { showSnackbar } = useSnackbar();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(""); // Renamed 'error' to 'errorMessage' for consistency

  const getAuthErrorMessage = (error: any): string => {
    if (error instanceof FirebaseError) {
      switch (error.code) {
        case "auth/email-already-in-use":
          return "This email address is already in use. Please log in or use a different email.";
        case "auth/invalid-email":
          return "The email address is not valid.";
        case "auth/operation-not-allowed":
          return "Email/password accounts are not enabled. Please contact support.";
        case "auth/weak-password":
          return "Password is too weak. Please choose a stronger password.";
        case "auth/popup-closed-by-user":
          return "Authentication cancelled by user.";
        case "auth/cancelled-popup-request":
          return "Only one authentication popup allowed at a time. Please try again.";
        case "auth/network-request-failed":
          return "Network error. Please check your internet connection.";
        default:
          return `Registration failed: ${error.message || "Unknown error."}`;
      }
    }
    return "An unexpected error occurred. Please try again.";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(""); // Clear previous errors
    setLoading(true);

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      setLoading(false);
      return;
    }
    if (password.length < 6) {
      setErrorMessage("Password should be at least 6 characters.");
      setLoading(false);
      return;
    }
    if (!username.trim()) {
      setErrorMessage("Username is required.");
      setLoading(false);
      return;
    }

    try {
      const userCredential = await signup(email, password); // This now correctly resolves to UserCredential

      // Update user profile with username (display name)
      if (userCredential.user) {
        await updateProfile(userCredential.user, {
          displayName: username.trim(),
        });
      }

      showSnackbar({
        message: "Account created successfully!",
        severity: "success",
      });
      navigate("/map"); // Redirect to map after successful signup
    } catch (error: any) {
      console.error("Signup error:", error);
      const msg = getAuthErrorMessage(error);
      setErrorMessage(msg);
      showSnackbar({ message: msg, severity: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setErrorMessage(""); // Clear previous errors
    try {
      await signInWithGoogle();
      showSnackbar({
        message: "Login successful with Google!",
        severity: "success",
      });
      navigate("/map"); // Redirect to map after successful signup
    } catch (error: any) {
      console.error("Google sign-in error:", error);
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
      <div className="relative z-10 hidden md:flex w-3/4 h-[80vh]  max-w-6xl rounded-2xl shadow-2xl overflow-hidden">
        {/* Left Side: SVG Graphics */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="w-1/2 bg-gradient-to-br from-blue-700 to-indigo-900 flex flex-col items-center justify-center p-8 text-white text-center"
        >
          <GrMapLocation className="w-48 h-48 text-blue-200 mb-6 drop-shadow-lg" />
          <h2 className="text-4xl font-extrabold mb-2">Join GoMapper!</h2>
          <p className="text-lg font-light opacity-90">
            Start organizing your world, pin by pin.
          </p>
        </motion.div>

        {/* Right Side: Signup Form */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="w-1/2 bg-white flex flex-col justify-center p-12 rounded-r-2xl"
        >
          <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">
            Create Your Account
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
            {/* Username Input */}
            <div className="relative">
              <FiUser
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                size={20}
              />
              <input
                type="text"
                placeholder="Username"
                className="w-full px-4 py-3.5 rounded-lg border border-gray-300 shadow-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out text-gray-800 pl-12"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            {/* Email Input */}
            <div className="relative">
              <FiMail
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                size={20}
              />
              <input
                type="email"
                placeholder="Email Address"
                className="w-full px-4 py-3.5 rounded-lg border border-gray-300 shadow-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out text-gray-800 pl-12"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            {/* Password Input */}
            <div className="relative">
              <FiLock
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                size={20}
              />
              <input
                type={passwordVisible ? "text" : "password"}
                placeholder="Password"
                className="w-full px-4 py-3.5 rounded-lg border border-gray-300 shadow-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out text-gray-800 pl-12 pr-12"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setPasswordVisible(!passwordVisible)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label={passwordVisible ? "Hide password" : "Show password"}
              >
                {passwordVisible ? <FiEyeOff size={20} /> : <FiEye size={20} />}
              </button>
            </div>

            {/* Confirm Password Input */}
            <div className="relative">
              <FiLock
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                size={20}
              />
              <input
                type={confirmPasswordVisible ? "text" : "password"}
                placeholder="Confirm Password"
                className="w-full px-4 py-3.5 rounded-lg border border-gray-300 shadow-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out text-gray-800 pl-12 pr-12"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={loading}
              />
              <button
                type="button"
                onClick={() =>
                  setConfirmPasswordVisible(!confirmPasswordVisible)
                }
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label={
                  confirmPasswordVisible
                    ? "Hide confirm password"
                    : "Show confirm password"
                }
              >
                {confirmPasswordVisible ? (
                  <FiEyeOff size={20} />
                ) : (
                  <FiEye size={20} />
                )}
              </button>
            </div>

            {/* Sign Up Button */}
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
                  <FiUserPlus size={20} /> Sign Up
                </>
              )}
            </motion.button>
          </form>

          <div className="relative flex items-center justify-center my-8">
            <span className="absolute bg-white px-4 text-sm text-gray-500 font-medium">
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
              className="w-full py-3.5 px-4 rounded-lg border border-gray-300 bg-white text-gray-700 font-semibold text-lg flex items-center justify-center gap-2 shadow-sm hover:bg-gray-50 transition duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            >
              <FcGoogle size={24} /> Sign Up with Google
            </motion.button>
          </div>

          {/* Link to Login */}
          <p className="text-center text-gray-600 mt-8">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-blue-600 hover:underline font-medium"
            >
              Login
            </Link>
          </p>
        </motion.div>
      </div>

      {/* Mobile View: Small Card Signup Form (conditionally shown) */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="relative z-10 md:hidden bg-white bg-opacity-95 p-8 rounded-xl shadow-2xl w-full max-w-md mx-auto transform transition-all duration-300 ease-out"
      >
        <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">
          Create Your Account
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
          {/* Username Input */}
          <div className="relative">
            <FiUser
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={20}
            />
            <input
              type="text"
              placeholder="Username"
              className="w-full px-4 py-3.5 rounded-lg border border-gray-300 shadow-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out text-gray-800 pl-10"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              disabled={loading}
            />
          </div>

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

          {/* Confirm Password Input */}
          <div className="relative">
            <FiLock
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={20}
            />
            <input
              type={confirmPasswordVisible ? "text" : "password"}
              placeholder="Confirm Password"
              className="w-full px-4 py-3.5 rounded-lg border border-gray-300 shadow-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out text-gray-800 pl-10 pr-10"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={loading}
            />
            <button
              type="button"
              onClick={() => setConfirmPasswordVisible(!confirmPasswordVisible)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 rounded-full"
              aria-label={
                confirmPasswordVisible
                  ? "Hide confirm password"
                  : "Show confirm password"
              }
            >
              {confirmPasswordVisible ? (
                <FiEyeOff size={20} />
              ) : (
                <FiEye size={20} />
              )}
            </button>
          </div>

          {/* Sign Up Button */}
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
                <FiUserPlus size={20} /> Sign Up
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
            <FcGoogle size={24} /> Sign Up with Google
          </motion.button>
        </div>

        {/* Link to Login */}
        <p className="text-center text-gray-600 mt-6">
          Already have an account?{" "}
          <Link
            to="/login"
            className="text-blue-600 hover:underline font-medium"
          >
            Login
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
