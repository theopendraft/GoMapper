// src/components/Layout.tsx
import React, { useState, useCallback } from "react";
import { Link, useLocation } from "react-router-dom"; // Import useLocation
import SearchModal from "./modals/SearchModal";
import ProjectSidebar from './ProjectSidebar'; // Import ProjectSidebar
import { FiSearch, FiMenu } from "react-icons/fi"; // FiMenu for sidebar toggle
import { AiOutlineDashboard } from "react-icons/ai";
import { RiMapPin5Line } from "react-icons/ri";
import { LuContactRound } from "react-icons/lu";
import { cn } from "../utils/utils"; // Assuming cn utility is correctly imported
import { AuthContextProps, useAuth } from "../context/AuthContext";
import { MapSearchProvider, useMapSearch } from "../context/MapSearchContext";
import ProfileDropdown from "./ui/ProfileDropdown"; // Assuming ProfileDropdown exists

// Define navigation links for authenticated users
const navLinks = [
  { name: "Map View", path: "/map", Icon: RiMapPin5Line },
  { name: "Dashboard", path: "/dashboard", Icon: AiOutlineDashboard },
  { name: "Contacts", path: "/contacts", Icon: LuContactRound }, // Changed path from /parents to /contacts
];

interface LayoutProps {
  children: React.ReactNode;
}

// LayoutContent uses the context
const LayoutContent: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user: currentUser, logout } = useAuth() as AuthContextProps;
  const {
    isSearchModalOpen,
    setIsSearchModalOpen,
    isMapSearchControlVisible, // Still used internally by Map for GeoSearchControlManager
    locationFoundForModalDisplay,
    setLocationFoundForModalDisplay,
    handleLocationSelectedFromMapSearchAndCloseModal,
    handleClearLocationFound,
    triggerMapSearchControlVisibility,
    // NEW: currentProjectId, userProjects from context for conditional rendering
    currentProjectId,
    userProjects,
  } = useMapSearch();

  const location = useLocation(); // To get current path for active link styling
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // State for sidebar open/close

  // Callback to open the search modal
  const handleOpenSearchModal = useCallback(() => {
    setIsSearchModalOpen(true);
    setLocationFoundForModalDisplay(null); // Clear previous messages
  }, [setIsSearchModalOpen, setLocationFoundForModalDisplay]);

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Top Navigation Bar */}
      <nav className="bg-white p-4 flex justify-between items-center z-[1030] shadow-sm">
        <div className="flex items-center">
          {/* Sidebar Toggle Button - only visible if user is logged in */}
          {currentUser && (
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="mr-4 text-gray-600 hover:text-gray-800 transition-colors p-2 rounded-md hover:bg-gray-100"
              aria-label="Open project sidebar"
            >
              <FiMenu size={24} />
            </button>
          )}
          <Link to="/" className="text-xl font-bold text-blue-700">
            MAPPER
          </Link>
        </div>

        {/* Right Section: Search Button, Nav Links, Auth Buttons */}
        <div className="flex items-center space-x-4">
          {/* Search Location Button - only visible if logged in AND a project is selected */}
          {currentUser && currentProjectId && (
            <button
              onClick={handleOpenSearchModal}
              className="hidden md:flex items-center justify-start ml-28 py-2 px-4 pr-[300px] rounded-full border border-blue-300 text-gray-600 bg-blue-50 hover:bg-blue-100 hover:border-blue-500 transition-colors gap-2"
              // Adjust styling for mobile vs desktop if needed, currently hidden on small screens
            >
              <FiSearch className="w-5 h-5" /> Search
            </button>
          )}

          <div className="flex items-center gap-2">
            {/* Desktop Navigation Links - only visible if logged in */}
            {currentUser && (
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
            )}

            {/* Profile Dropdown or Login/Signup Buttons */}
            {currentUser ? (
              <ProfileDropdown /> // Your existing ProfileDropdown component
            ) : (
              <div className="flex gap-2 z-[999999]">
                <Link
                  to="/login"
                  className="text-sm py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  className="text-sm py-2 px-4 border border-blue-600 text-blue-700 rounded-md hover:bg-blue-50 transition-colors"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-grow">
        {children} {/* This is where your Routes and pages (like MapPage) are rendered */}
      </main>

      {/* Bottom Mobile Navigation Bar - only visible if user is logged in */}
      {currentUser && (
        <nav className="fixed bottom-3 left-2 right-2 rounded-full sm:hidden z-[1035] bg-white border border-gray-200 shadow-md flex justify-around py-2 px-3">
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
      )}

      {/* Render the Project Sidebar - only if user is logged in */}
      {currentUser && (
        <ProjectSidebar
          isOpen={isSidebarOpen}
          setIsOpen={setIsSidebarOpen}
        />
      )}

      {/* Render the SearchModal */}
      <SearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        onStartSearch={triggerMapSearchControlVisibility.bind(null, true)}
        locationFoundForSelection={locationFoundForModalDisplay}
        onClearLocationFound={handleClearLocationFound}
      />
    </div>
  );
};

export default function Layout({ children }: LayoutProps) {
  return (
    <MapSearchProvider>
      <LayoutContent>{children}</LayoutContent>
    </MapSearchProvider>
  );
}