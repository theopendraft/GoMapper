// src/App.tsx
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/dashboardPage";
import MapPage from "./pages/mapPage";
import ContactsPage from "./pages/contactsPage";
import LoginPage from "./pages/loginPage";
import SignupPage from "./pages/signupPage";
import LandingPage from "./pages/LandingPage";
import ProtectedRoute from "./components/ProtectedRoute";
import AuthActionPage from "./pages/AuthActionPage"; // NEW: Import AuthActionPage
import { AuthProvider } from "./context/AuthContext";

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <Layout>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/auth-action" element={<AuthActionPage />} /> {/* NEW: Add the auth action route */}

            <Route element={<ProtectedRoute />}>
              <Route path="/map" element={<MapPage />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/contacts" element={<ContactsPage />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      </AuthProvider>
    </Router>
  );
}