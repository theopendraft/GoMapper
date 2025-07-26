// src/components/modals/ForgotPasswordModal.tsx
import React, { useState, useRef, useEffect } from "react";
import ReactDOM from "react-dom";
import { FiX, FiMail, FiSend } from "react-icons/fi"; // Added FiMail and FiSend icons
import { toast } from "react-toastify";
import { useAuth } from "../../context/AuthContext";
import { AuthContextProps } from "../../context/AuthContext";

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ForgotPasswordModal({
  isOpen,
  onClose,
}: ForgotPasswordModalProps) {
  const { resetPassword } = useAuth() as AuthContextProps; // Renamed to avoid confusion with internal resetPassword
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(""); // For success/error messages displayed in the modal
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.classList.add("overflow-hidden");
    } else {
      document.body.classList.remove("overflow-hidden");
      setEmail(""); // Clear form on close
      setMessage(""); // Clear message on close
      setLoading(false);
    }
    return () => {
      document.body.classList.remove("overflow-hidden");
    };
  }, [isOpen]);

  const onOverlayClick = (e: React.MouseEvent) => {
    if (e.target === modalRef.current) onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) { // Use .trim() for validation
      toast.error("Please enter your email address.");
      setMessage("Please enter your email address."); // Also set modal message
      return;
    }
    setMessage("");
    setLoading(true);
    try {
      await resetPassword(email);
      setMessage("A password reset link has been sent to your email. Please check your inbox (and spam folder).");
      toast.success("Password reset email sent!");
      // Optionally, close modal after a short delay for user to read message
      // setTimeout(() => onClose(), 3000); 
    } catch (error: any) {
      console.error("Password reset error:", error);
      let errorMessage = "Failed to send password reset email.";
      if (error.code === "auth/user-not-found") {
        errorMessage = "No user found with that email address.";
      } else if (error.code === "auth/invalid-email") {
        errorMessage = "Please enter a valid email address.";
      }
      setMessage(errorMessage); // Set modal message for error
      toast.error(errorMessage); // Show toast for error
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div
      ref={modalRef}
      onClick={onOverlayClick}
      className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-[1060] flex items-center justify-center p-4" // Modern overlay
      aria-modal="true"
      role="dialog"
      aria-labelledby="forgot-password-title"
    >
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-8 mx-auto my-8 max-h-[95vh] overflow-auto border border-gray-200" // Increased padding, added border
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center pb-4 mb-6 border-b border-gray-200"> {/* Increased padding and margin */}
          <h2
            id="forgot-password-title"
            className="text-2xl md:text-3xl font-bold text-gray-900" // Bolder, larger title
          >
            Forgot Password
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-full p-3 transition-colors" // Larger touch area, consistent styling
            aria-label="Close"
          >
            <FiX size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6"> {/* Increased spacing */}
          <p className="text-gray-700 text-sm mb-6"> {/* Adjusted text color and margin */}
            Enter your email address and we'll send you a link to reset your
            password.
          </p>
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-semibold text-gray-700 mb-2" // Increased margin
            >
              Email Address
            </label>
            <div className="relative"> {/* Wrapper for icon inside input */}
                <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full px-4 py-2.5 border rounded-lg shadow-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out text-gray-800 pl-10" // Applied consistent input styling, added pl-10 for icon
                    placeholder="your.email@example.com"
                    required
                    disabled={loading || !!message}
                />
            </div>
          </div>

          {message && (
            <p
              className={`text-sm ${
                message.includes("sent") ? "text-green-600" : "text-red-600"
              } my-4`} // Added my-4 for spacing
            >
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3.5 px-4 rounded-lg text-white font-semibold text-lg shadow-md transition-colors flex items-center justify-center gap-2 ${ // Increased padding, font size, shadow
              loading
                ? "bg-blue-300 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500" // Added focus styles
            }`}
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
                <FiSend size={20} /> Send Reset Email
              </> // Added icon
            )}
          </button>
        </form>
      </div>
    </div>,
    document.body
  );
}