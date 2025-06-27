import React from "react";
import { Link, useLocation } from "react-router-dom";
import { AiOutlineDashboard } from "react-icons/ai";
import { RiMapPin5Line } from "react-icons/ri";
import { LuContactRound } from "react-icons/lu";
import { useAuth } from "../components/context/AuthContext";
import { cn } from './../lib/utils';
import ProfileDropdown from "./ui/ProfileDropdown";


const navLinks = [
  { name: "Map View", path: "/map", Icon: RiMapPin5Line },
  { name: "Dashboard", path: "/dashboard", Icon: AiOutlineDashboard },
  { name: "Parents", path: "/parents", Icon: LuContactRound },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { user } = useAuth();

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Top Navbar */}
      <nav className="w-full bg-white shadow-sm fixed top-0 z-50 h-14 flex items-center justify-between px-4">
        <Link to="/" className="text-xl font-bold text-blue-700">MAPPER</Link>

        <div className="flex items-center gap-4">
          {/* Desktop Navigation */}
          <div className="hidden sm:flex gap-2">
            {navLinks.map(({ name, path, Icon }) => (
              <Link
                key={name}
                to={path}
                className={cn(
                  "flex items-center gap-1 px-3 py-1 rounded hover:bg-blue-50 transition",
                  location.pathname === path
                    ? "bg-blue-100 text-blue-700 font-semibold"
                    : "text-gray-700"
                )}
              >
                <Icon className="w-5 h-5" />
                <span>{name}</span>
              </Link>
            ))}
          </div>

          {/* User Info */}
          {user ? (
            <ProfileDropdown />
          ) : (
            <div className="flex gap-2 z-[999999]">
              <Link
                to="/login"
                className="text-sm px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Login
              </Link>
              <Link
                to="/signup"
                className="text-sm px-3 py-1 border text-blue-700 rounded hover:bg-gray-100"
              >
                Signup
              </Link>
            </div>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 ">{children}</main>

      {/* Bottom Mobile Navigation */}
      <nav className="fixed bottom-3 left-2 right-2  rounded-full sm:hidden z-50 bg-white border shadow-md flex justify-around py-2 px-3">
        {navLinks.map(({ name, path, Icon }) => (
          <Link
            key={name}
            to={path}
            className={cn(
              "flex flex-col items-center gap-1 text-xs px-2 py-1",
              location.pathname === path
                ? "text-blue-600 font-semibold"
                : "text-gray-600"
            )}
          >
            <Icon className="w-6 h-6" />
            {name}
          </Link>
        ))}
      </nav>
    </div>
  );
}
