// src/App.tsx
import {
  BrowserRouter as Router, // Ensure you are using BrowserRouter
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/dashboardPage";
import MapPage from "./pages/mapPage";
import ContactsPage from "./pages/contactsPage"; // Assuming ParentsPage is now ContactsPage
import LoginPage from "./pages/loginPage";
import SignupPage from "./pages/signupPage";
import LandingPage from "./pages/LandingPage"; // Import LandingPage
import ProtectedRoute from "./components/ProtectedRoute"; // Import ProtectedRoute
import { AuthProvider } from "./context/AuthContext";
import { SnackbarProvider } from "./context/SnackbarContext";

export default function App() {
  return (
    <Router>
      {" "}
      {/* Use BrowserRouter here if not already wrapping in main.tsx */}
      <AuthProvider>
        <SnackbarProvider>
          {/* Layout wraps all content, including public and protected routes */}
          <Layout>
            <Routes>
              {/* Public Routes - Accessible to everyone */}
              <Route path="/" element={<LandingPage />} />{" "}
              {/* This is the new actual landing page */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
              {/* Protected Routes - only accessible after successful login */}
              {/* All routes inside this <Route> element will use the ProtectedRoute logic */}
              <Route element={<ProtectedRoute />}>
                <Route path="/map" element={<MapPage />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/contacts" element={<ContactsPage />} />{" "}
                {/* Changed from /parents to /contacts if that's the new name */}
              </Route>
              {/* Fallback for any unmatched routes - redirects to landing page */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Layout>
        </SnackbarProvider>
      </AuthProvider>
    </Router>
  );
}
