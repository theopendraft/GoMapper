// src/pages/LandingPage.tsx
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { AuthContextProps } from "../context/AuthContext";
import {
  FiMapPin,
  FiTrendingUp,
  FiUsers,
  FiShield,
  FiGitMerge,
  FiBriefcase,
} from "react-icons/fi";

export default function LandingPage() {
  const { user, loading } = useAuth() as AuthContextProps;
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      navigate("/map", { replace: true });
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen w-screen bg-gray-900 text-lg text-white">
        Checking authentication status...
      </div>
    );
  }

  const FeatureCard = ({
    icon,
    title,
    children,
  }: {
    icon: React.ReactNode;
    title: string;
    children: React.ReactNode;
  }) => (
    <div className="bg-gray-800/50 p-6 rounded-xl shadow-lg hover:bg-gray-700/70 transition-all duration-300 transform hover:-translate-y-1 animate-fade-in-up">
      <div className="flex items-center justify-center h-12 w-12 rounded-full bg-indigo-500 text-white mb-4">
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-2">{title}</h3>
      <p className="text-gray-400">{children}</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-[#1a2035] to-gray-900 text-white scrollbar-hide">
      {/* Hero Section */}
      <section
        className="relative flex flex-col items-center justify-center min-h-screen text-center p-6 overflow-hidden"
        style={
          {
            "--grid-color": "rgba(203, 213, 225, 0.1)",
            "--grid-size": "40px",
            backgroundImage: `
            linear-gradient(to bottom, transparent, #111827),
            linear-gradient(to right, var(--grid-color) 1px, transparent 1px),
            linear-gradient(to bottom, var(--grid-color) 1px, transparent 1px)
          `,
            backgroundSize: `100% 100%, var(--grid-size) var(--grid-size), var(--grid-size) var(--grid-size)`,
          } as React.CSSProperties
        }
      >
        <div className="absolute inset-0 bg-gradient-to-b from-gray-900/50 via-[#1a2035]/80 to-gray-900 z-0"></div>
        <div className="max-w-4xl mx-auto relative z-10">
          <img
            src="/GoMapperW.svg"
            alt="GoMapper Logo"
            className="w-24 h-24 mx-auto mb-4 animate-fade-in-down"
          />
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-4 animate-fade-in-up animation-delay-200">
            GoMapper
          </h1>
          <p className="text-lg md:text-xl text-gray-300 mb-8 max-w-2xl mx-auto animate-fade-in-up animation-delay-400">
            Visualize your data, optimize your routes, and manage your field
            operations with unparalleled efficiency. Your entire world, mapped
            and managed.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up animation-delay-600">
            <button
              onClick={() => navigate("/signup")}
              className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-500 px-8 py-3 rounded-full font-semibold text-lg shadow-lg transform hover:scale-105 transition duration-300"
            >
              Get Started for Free
            </button>
            <button
              onClick={() => navigate("/login")}
              className="w-full sm:w-auto border-2 border-gray-500 text-gray-300 hover:bg-gray-700 hover:border-gray-700 px-8 py-3 rounded-full font-semibold text-lg shadow-lg transform hover:scale-105 transition duration-300"
            >
              Login
            </button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6 bg-transparent">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-extrabold tracking-tight">
              Why GoMapper?
            </h2>
            <p className="text-lg text-gray-400 mt-2">
              Everything you need for intelligent field operations.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard
              icon={<FiMapPin size={24} />}
              title="Visual Pin Management"
            >
              Add, edit, and manage unlimited locations with custom details and
              statuses on an interactive map.
            </FeatureCard>
            <FeatureCard
              icon={<FiGitMerge size={24} />}
              title="Intelligent Routing"
            >
              Plan multi-stop routes with turn-by-turn directions and use our
              one-click optimization to find the shortest path.
            </FeatureCard>
            <FeatureCard
              icon={<FiBriefcase size={24} />}
              title="Project-Based Workflow"
            >
              Organize your work into separate projects, each with its own set
              of pins and saved routes for clean data management.
            </FeatureCard>
            <FeatureCard
              icon={<FiUsers size={24} />}
              title="Contact Management"
            >
              Attach contact information directly to your map pins, keeping
              crucial data exactly where you need it.
            </FeatureCard>
            <FeatureCard
              icon={<FiTrendingUp size={24} />}
              title="Dashboard Analytics"
            >
              Get a high-level overview of your operations with a dashboard
              featuring charts, stats, and an activity calendar.
            </FeatureCard>
            <FeatureCard icon={<FiShield size={24} />} title="Secure & Private">
              Your data is your own. All your projects and locations are
              securely stored and only accessible by you.
            </FeatureCard>
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="py-20 px-6 bg-gray-900/60">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-extrabold tracking-tight mb-4 animate-fade-in">
            Ready to take control of your map?
          </h2>
          <p className="text-lg text-gray-400 mb-8 animate-fade-in animation-delay-200">
            Start mapping your world today. It's free to get started.
          </p>
          <button
            onClick={() => navigate("/signup")}
            className="bg-indigo-600 hover:bg-indigo-500 px-10 py-4 rounded-full font-semibold text-xl shadow-lg transform hover:scale-105 transition duration-300 animate-fade-in animation-delay-400"
          >
            Sign Up Now
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-6 bg-transparent text-center text-sm text-gray-500">
        &copy; {new Date().getFullYear()} GoMapper. All rights reserved | The
        Open Draft.
      </footer>
    </div>
  );
}
