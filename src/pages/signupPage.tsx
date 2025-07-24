// src/pages/signupPage.tsx
import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import { AuthContextProps } from "../context/AuthContext";
import { getAuth, updateProfile } from "firebase/auth"; // auth is imported, but not used directly. useAuth gives you the auth instance implicitly
import { FiEye, FiEyeOff, FiUser, FiMail, FiLock, FiUserPlus } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { FcGoogle } from 'react-icons/fc';

export default function SignupPage() {
  const { signup, signInWithGoogle } = useAuth() as AuthContextProps;
  // const auth = getAuth(); // No longer needed if updateProfile uses the user from userCredential.user
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }
    if (password.length < 6) {
        setError("Password should be at least 6 characters.");
        setLoading(false);
        return;
    }

    try {
      const userCredential = await signup(email, password); // This now correctly resolves to UserCredential
      
      // Update user profile with username (display name)
      if (userCredential.user) { // `userCredential.user` is now correctly typed
        await updateProfile(userCredential.user, { // Pass userCredential.user directly
          displayName: username,
        });
      }
      
      toast.success("Account created successfully!");
      navigate("/map");
    } catch (error: any) {
      console.error("Signup error:", error);
      let errorMessage = "Signup failed. Please try again.";
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = "Email already in use. Try logging in or use a different email.";
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = "Invalid email format.";
      } else if (error.code === 'auth/weak-password') {
        errorMessage = "Password is too weak. Please choose a stronger password.";
      }
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

    const handleGoogleSignIn = async () => {
      setLoading(true);
      try {
        await signInWithGoogle();
        toast.success("Login successful with Google!");
        navigate("/map");
      } catch (error: any) {
        console.error("Google sign-in error:", error);
        let errorMessage = "Google sign-in failed.";
        if (error.code === 'auth/popup-closed-by-user') {
          errorMessage = 'Sign-in cancelled by user.';
        } else if (error.code === 'auth/cancelled-popup-request') {
          errorMessage = 'Only one popup request allowed at a time.';
        }
        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    };
  

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-gray-900 bg-cover bg-center"
         style={{ backgroundImage: "url('https://source.unsplash.com/random/1920x1080?map,nature')" }}
    >
      {/* Background Overlay with Blur */}
      <div className="absolute inset-0 bg-black bg-opacity-50 backdrop-filter backdrop-blur-sm"></div>

      <div className="relative bg-white bg-opacity-90 p-8 rounded-xl shadow-2xl w-full max-w-md mx-auto my-8 transform transition-all duration-300 ease-out scale-100 opacity-100 z-10">
        <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">Create Your Account</h2>
        
        {error && <p className="text-red-600 text-sm mb-4 text-center">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Username Input */}
          <div className="relative">
            <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Username"
              className="input-field pl-10"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          {/* Email Input */}
          <div className="relative">
            <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
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
            <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
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

          {/* Confirm Password Input */}
          <div className="relative">
            <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type={confirmPasswordVisible ? "text" : "password"}
              placeholder="Confirm Password"
              className="input-field pl-10 pr-10"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={loading}
            />
            <button
              type="button"
              onClick={() => setConfirmPasswordVisible(!confirmPasswordVisible)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 rounded-full"
              aria-label={confirmPasswordVisible ? "Hide confirm password" : "Show confirm password"}
            >
              {confirmPasswordVisible ? <FiEyeOff size={20} /> : <FiEye size={20} />}
            </button>
          </div>

          {/* Sign Up Button */}
          <button
            type="submit"
            className="w-full py-3 px-4 rounded-md bg-green-600 text-white font-semibold text-lg flex items-center justify-center gap-2 hover:bg-green-700 transition duration-300"
            disabled={loading}
          >
            {loading ? (
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <><FiUserPlus size={20} /> Sign Up</>
            )}
          </button>
        </form>

                <div className="relative flex items-center justify-center my-6">
                  <span className="absolute bg-white bg-opacity-90 px-3 text-sm text-gray-500">OR</span>
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
                  {/* Add more social login buttons here (e.g., Facebook, GitHub) */}
                </div>
        

        {/* Link to Login */}
        <p className="text-center text-gray-600 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-blue-600 hover:underline">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}