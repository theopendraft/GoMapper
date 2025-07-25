// src/pages/LandingPage.tsx
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // Assuming useAuth is here
import { AuthContextProps } from '../context/AuthContext'; // Import AuthContextProps

export default function LandingPage() {
  const { user, loading } = useAuth() as AuthContextProps; // Get user and loading state
  const navigate = useNavigate();

  useEffect(() => {
    // If not loading and user is logged in, redirect to the map/projects page
    if (!loading && user) {
      navigate('/map', { replace: true });
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen w-screen bg-gray-100 text-lg text-gray-700">
        Checking authentication status...
      </div>
    );
  }

  // If not logged in, show the landing page content
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-indigo-900 text-white flex flex-col items-center justify-center p-6">
      <h1 className="text-5xl md:text-6xl font-extrabold mb-4 text-center">
        Welcome to GoMapper
      </h1>
      <p className="text-xl md:text-2xl mb-8 text-center max-w-2xl">
        Organize your locations, accessible only by you.
      </p>
      <div className="space-x-4">
        <button
          onClick={() => navigate('/login')}
          className="bg-white text-blue-700 hover:bg-gray-100 px-8 py-3 rounded-full font-semibold text-lg shadow-lg transform hover:scale-105 transition duration-300"
        >
          Login
        </button>
        <button
          onClick={() => navigate('/signup')}
          className="border border-white text-white hover:bg-white hover:text-blue-700 px-8 py-3 rounded-full font-semibold text-lg shadow-lg transform hover:scale-105 transition duration-300"
        >
          Sign Up
        </button>
      </div>
      <footer className="absolute bottom-4 text-sm text-gray-200">
        &copy; {new Date().getFullYear()} GoMapper. All rights reserved.
      </footer>
    </div>
  );
}