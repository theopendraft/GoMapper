// src/components/ProtectedRoute.tsx
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AuthContextProps } from '../context/AuthContext';

interface ProtectedRouteProps {
  children?: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth() as AuthContextProps;

  if (loading) {
    // You can replace this with a better loading spinner/component if desired
    return (
      <div className="flex justify-center items-center h-screen w-screen bg-gray-100 text-lg text-gray-700">
        Loading user session...
      </div>
    );
  }

  // If not loading and no user, redirect to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If user is authenticated, render the children (the protected route content)
  return children ? <>{children}</> : <Outlet />;
}