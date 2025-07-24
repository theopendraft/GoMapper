// src/pages/AuthActionPage.tsx
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getAuth, confirmPasswordReset, applyActionCode } from 'firebase/auth'; // Import necessary Firebase auth functions
import { toast } from 'react-toastify';
import { app } from '../services/firebase'; // Your Firebase app instance

export default function AuthActionPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const auth = getAuth(app); // Get auth instance

  const [mode, setMode] = useState<string | null>(null);
  const [oobCode, setOobCode] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState<string>('');
  const [passwordConfirm, setPasswordConfirm] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionHandled, setActionHandled] = useState(false); // To prevent multiple attempts

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const receivedMode = params.get('mode');
    const receivedOobCode = params.get('oobCode'); // Out-of-band code
    const receivedContinueUrl = params.get('continueUrl'); // URL to redirect after action

    setMode(receivedMode);
    setOobCode(receivedOobCode);

    if (!receivedMode || !receivedOobCode) {
      setError('Invalid or missing action parameters.');
      return;
    }

    // Optional: Verify the action code immediately for some modes (like email verification)
    // For password reset, it's usually confirmed with the new password.
    if (receivedMode === 'verifyEmail' || receivedMode === 'recoverEmail') {
      handleVerifyAction(receivedMode, receivedOobCode);
    }
  }, [location.search]); // Depend on location.search to re-run if URL changes

  // Handles actions like email verification
  const handleVerifyAction = async (actionMode: string, code: string) => {
    setLoading(true);
    setError(null);
    setSuccessMessage(null);
    try {
      await applyActionCode(auth, code);
      setSuccessMessage(`${actionMode === 'verifyEmail' ? 'Email successfully verified!' : 'Email recovery successful!'}`);
      toast.success(successMessage);
      setTimeout(() => navigate('/login'), 3000); // Redirect after success
    } catch (err: any) {
      console.error('Action verification error:', err);
      let errMsg = 'Failed to process action.';
      if (err.code === 'auth/invalid-action-code') errMsg = 'The action code is invalid or has expired.';
      else if (err.code === 'auth/user-disabled') errMsg = 'This user account has been disabled.';
      setError(errMsg);
      toast.error(errMsg);
    } finally {
      setLoading(false);
      setActionHandled(true); // Mark as handled
    }
  };


  const handlePasswordResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oobCode) {
      setError('Missing action code.');
      return;
    }
    if (newPassword !== passwordConfirm) {
      setError('Passwords do not match.');
      return;
    }
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      await confirmPasswordReset(auth, oobCode, newPassword);
      setSuccessMessage('Your password has been successfully reset! You can now log in with your new password.');
      toast.success('Password reset successful!');
      setTimeout(() => navigate('/login'), 3000); // Redirect to login
    } catch (err: any) {
      console.error('Password reset error:', err);
      let errMsg = 'Failed to reset password.';
      if (err.code === 'auth/invalid-action-code') errMsg = 'The reset link is invalid or has expired.';
      else if (err.code === 'auth/user-disabled') errMsg = 'This user account has been disabled.';
      else if (err.code === 'auth/user-not-found') errMsg = 'User not found.';
      else if (err.code === 'auth/weak-password') errMsg = 'Password is too weak. Please choose a stronger password.';
      setError(errMsg);
      toast.error(errMsg);
    } finally {
      setLoading(false);
      setActionHandled(true); // Mark as handled
    }
  };

  // Render UI based on mode
  const renderActionForm = () => {
    if (loading) {
      return <p className="text-center text-blue-600">Processing request...</p>;
    }
    if (error) {
      return <p className="text-center text-red-600 font-medium">{error}</p>;
    }
    if (successMessage) {
      return <p className="text-center text-green-600 font-medium">{successMessage}</p>;
    }
    if (actionHandled) {
        return <p className="text-center text-gray-600">Action already processed or redirecting...</p>
    }

    switch (mode) {
      case 'resetPassword':
        return (
          <form onSubmit={handlePasswordResetSubmit} className="space-y-4">
            <h3 className="text-xl font-bold text-gray-800 text-center">Set New Password</h3>
            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
              <input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="input-field" // Reuse input-field class
                placeholder="Enter new password"
                required
              />
            </div>
            <div>
              <label htmlFor="passwordConfirm" className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
              <input
                id="passwordConfirm"
                type="password"
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                className="input-field" // Reuse input-field class
                placeholder="Confirm new password"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full py-2 px-4 rounded-md bg-blue-600 text-white font-semibold hover:bg-blue-700 transition"
              disabled={loading}
            >
              Reset Password
            </button>
          </form>
        );
      case 'verifyEmail':
        return <p className="text-center text-gray-700">Verifying your email address...</p>;
      case 'recoverEmail':
        return <p className="text-center text-gray-700">Recovering your email address...</p>;
      // Add other modes as needed (e.g., 'signInWithEmailLink')
      default:
        return <p className="text-center text-gray-700">Unknown action or invalid link.</p>;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md text-gray-800">
        <h2 className="text-2xl font-bold mb-6 text-center">Firebase Action</h2>
        {renderActionForm()}
      </div>
    </div>
  );
}