// src/components/Layout.tsx
import React, { useState, useCallback } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
// import SearchModal from "./modals/SearchModal";
import ProjectSidebar from "./ProjectSidebar";
import { FiSearch, FiMenu } from "react-icons/fi";
import { AiOutlineDashboard } from "react-icons/ai";
import { RiMapPin5Line } from "react-icons/ri";
import { LuContactRound } from "react-icons/lu";
import { cn } from "../utils/utils";
import { AuthContextProps, useAuth } from "../context/AuthContext";
import { MapSearchProvider, useMapSearch } from "../context/MapSearchContext";
import ProfileDropdown from "./ui/ProfileDropdown";
import GlobalSearch from "./ui/GlobalSearch";
import MobileSearchModal from "./modals/MobileSearchModal";

// Define navigation links for authenticated users
const navLinks = [
  { name: "Map View", path: "/map", Icon: RiMapPin5Line },
  { name: "Dashboard", path: "/dashboard", Icon: AiOutlineDashboard },
  { name: "Contacts", path: "/contacts", Icon: LuContactRound },
];

interface LayoutProps {
  children: React.ReactNode;
}

const LayoutContent: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user: currentUser, logout } = useAuth() as AuthContextProps;
  const navigate = useNavigate();
  const {
    isSearchModalOpen,
    setIsSearchModalOpen,
    // isMapSearchControlVisible, // Not used directly in Layout, managed by MapPage
    locationFoundForModalDisplay,
    setLocationFoundForModalDisplay,
    // handleLocationSelectedFromMapSearchAndCloseModal, // Not used directly in Layout
    handleClearLocationFound,
    triggerMapSearchControlVisibility,
    currentProjectId,
    // userProjects, // Not used directly in Layout
  } = useMapSearch();

  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);

  const handleOpenSearchModal = useCallback(() => {
    setIsSearchModalOpen(true);
    setLocationFoundForModalDisplay(null);
  }, [setIsSearchModalOpen, setLocationFoundForModalDisplay]);

  const handleLogout = useCallback(async () => {
    await logout();
    navigate("/", { replace: true });
  }, [logout, navigate]);

  return (
    // Main container: full height, hidden overflow to manage fixed elements
    <div className="flex h-screen overflow-hidden bg-gray-100 scrollbar-hide">
      {/* Project Sidebar - Rendered always, its visibility is controlled internally by its own `isOpen` prop
          and the CSS classes it applies (translate-x-full vs translate-x-0).
          On medium screens and up, it becomes static and takes up 64px,
          so we adjust the main content's left margin. */}
      {currentUser && (
        <ProjectSidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      )}
      {/* Main Content Wrapper (Navbar + Main Content Area + Mobile Nav) */}
      <div
        className={`
          flex flex-col flex-1 min-h-full overflow-y-auto scrollbar-hide // Allows content to scroll
          transition-all duration-300 ease-in-out
          ${
            isSidebarOpen ? "md:ml-64" : "md:ml-0"
          } // Adjust main content margin based on sidebar's static state
          `}
      >
        {/* Top Navigation Bar */}
        <nav className="fixed top-0 left-0 right-0 bg-white/20 backdrop-blur-md h-16 md:h-16 flex justify-between items-center px-4 md:px-8 z-[1030] shadow-sm">
          <div className="flex items-center">
            {/* Sidebar Toggle Button - visible only on smaller screens */}
            {currentUser &&
              (location.pathname === "/map" ||
                location.pathname === "/dashboard" ||
                location.pathname === "/contacts") && (
                <button
                  onClick={() => setIsSidebarOpen(true)}
                  className="md:hidden mr-3 text-gray-600 hover:text-gray-800 transition-colors p-2 md:p-1 rounded-full hover:bg-gray-100 active:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  aria-label="Open project sidebar"
                >
                  <FiMenu size={24} />
                </button>
              )}
            <div className="flex items-center gap-1">
              <img
                src="/GoMapper.svg"
                alt="GoMapper Logo"
                className="w-6 h-6 md:w-7 md:h-7"
              />
              <Link
                to="/"
                className="text-xl md:text-2xl font-extrabold text-blue-700 "
              >
                GoMapper
              </Link>
            </div>
          </div>

          {/* Right Section: Search, Nav Links, Auth Buttons */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* Global Search - Conditionally rendered for desktop or mobile */}
            {currentUser &&
              currentProjectId &&
              location.pathname === "/map" && (
                <>
                  {/* Desktop Search Bar */}
                  <div className="hidden sm:flex w-40 md:w-64">
                    <GlobalSearch />
                  </div>
                  {/* Mobile Search Icon */}
                  <button
                    onClick={() => setIsMobileSearchOpen(true)}
                    className="sm:hidden flex items-center justify-center h-10 w-10 rounded-full text-gray-600 hover:bg-gray-100 hover:text-gray-900 active:bg-gray-200 transition-colors"
                    aria-label="Open search"
                  >
                    <FiSearch size={22} />
                  </button>
                </>
              )}

            <div className="flex items-center gap-3">
              {" "}
              {/* Increased gap for better spacing */}
              {/* Desktop Navigation Links - only visible if logged in and on larger screens */}
              {currentUser && (
                <div className="hidden sm:flex gap-3">
                  {" "}
                  {/* Adjusted gap */}
                  {navLinks.map(({ name, path, Icon }) => (
                    <Link
                      key={name}
                      to={path}
                      className={cn(
                        "flex items-center gap-1 px-2 py-1 rounded-lg transition-all duration-200",
                        location.pathname === path
                          ? "bg-blue-600 text-white font-semibold shadow-sm" // Stronger active state
                          : "text-gray-700 hover:bg-gray-100 hover:text-blue-700" // Enhanced hover for inactive
                      )}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{name}</span>
                    </Link>
                  ))}
                </div>
              )}
              {/* Profile Dropdown or Login/Signup Buttons */}
              {currentUser ? (
                <ProfileDropdown onLogout={handleLogout} />
              ) : (
                // You can add Login/Signup buttons here if needed for unauthenticated users on desktop
                <></>
              )}
            </div>
          </div>
        </nav>

        {/* Main Content Area - pushed down by fixed navbar */}
        <main className="flex-grow pt-16 md:pt-20">
          {" "}
          {/* Match pt to navbar height */}
          {children}{" "}
          {/* This is where your Routes and pages (like MapPage) are rendered */}
        </main>

        {/* Bottom Mobile Navigation Bar - only visible if user is logged in */}
        {currentUser && (
          <nav className="fixed bottom-3 left-2 right-2 rounded-2xl sm:hidden z-[1035] bg-white/60 backdrop-blur-sm border border-gray-200 shadow-xl flex justify-around py-2 px-3">
            {navLinks.map(({ name, path, Icon }) => (
              <Link
                key={name}
                to={path}
                className={cn(
                  "flex flex-col items-center gap-1 text-xs px-2 py-2 rounded-lg transition-all duration-200 flex-1 mx-1", // Added flex-1 mx-1 for even distribution
                  location.pathname === path
                    ? "bg-blue-100 text-blue-700 font-semibold" // Active state for mobile nav
                    : "text-gray-600 hover:bg-gray-50 hover:text-blue-600" // Hover for mobile nav
                )}
              >
                <Icon className="w-5 h-5 mb-1" />{" "}
                {/* Slightly larger icons, added mb-1 for spacing */}
                {name}
              </Link>
            ))}
          </nav>
        )}
      </div>{" "}
      {/* End of Main Content Wrapper */}
      <MobileSearchModal
        isOpen={isMobileSearchOpen}
        onClose={() => setIsMobileSearchOpen(false)}
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


