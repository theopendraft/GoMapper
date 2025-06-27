import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/dashboard";
import MapPage from "./pages/map";
import ParentsPage from "./pages/parents";
import LoginPage from "./pages/login";
import SignupPage from "./pages/signup";
import { AuthProvider } from "./components/context/AuthContext";

export default function App() {
  return (
    <AuthProvider>
      <Layout>
        <Routes>
          <Route path="/" element={<Navigate to="/map" replace />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/parents" element={<ParentsPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
        </Routes>
      </Layout>
    </AuthProvider>
  );
}
