// src/components/Layout.tsx
import React, { useState, useCallback } from "react";
import { Link } from "react-router-dom";
import SearchModal from "./modals/SearchModal";
import { FiSearch } from "react-icons/fi";
import { AiOutlineDashboard } from "react-icons/ai";
import { RiMapPin5Line } from "react-icons/ri";
import { LuContactRound } from "react-icons/lu";
import { cn } from "../utils/utils";
// FIX: Change AuthContextType to AuthContextProps
import { AuthContextProps, useAuth } from "../context/AuthContext"; // Corrected import
import { MapSearchProvider, useMapSearch } from "../context/MapSearchContext";
import ProfileDropdown from "./ui/ProfileDropdown";

const navLinks = [
  { name: "Map View", path: "/map", Icon: RiMapPin5Line },
  { name: "Dashboard", path: "/dashboard", Icon: AiOutlineDashboard },
  { name: "Contacts", path: "/parents", Icon: LuContactRound },
];

interface LayoutProps {
  children: React.ReactNode;
}

// LayoutContent uses the context
const LayoutContent: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  // FIX: Use AuthContextProps for the type assertion
  const { user: currentUser, logout } = useAuth() as AuthContextProps; // Use 'user' from context, alias to 'currentUser'

  const {
    isSearchModalOpen,
    setIsSearchModalOpen,
    isMapSearchControlVisible,
    locationFoundForModalDisplay,
    setLocationFoundForModalDisplay,
    handleLocationSelectedFromMapSearchAndCloseModal, // Will be passed to MapPage
    handleClearLocationFound,
    triggerMapSearchControlVisibility, // Will be passed to SearchModal
  } = useMapSearch();

  // Callback to open the search modal
  const handleOpenSearchModal = useCallback(() => {
    setIsSearchModalOpen(true);
    setLocationFoundForModalDisplay(null); // Clear previous messages
  }, [setIsSearchModalOpen, setLocationFoundForModalDisplay]); // Add dependencies

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <nav className="bg-white p-4 flex justify-between top-0 items-center z-20 shadow-sm ">
        <Link to="/" className="text-xl font-bold text-blue-700">
          MAPPER
        </Link>
        <div className="flex items-center space-x-4">
          <button
            onClick={handleOpenSearchModal}
            className=" bg-blue-600 text-white hover:bg-blue-700 font-bold py-2 px-2 rounded-full flex items-center transition-colors"
          >
            <FiSearch/>
          </button>

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
          {currentUser ? (
            <ProfileDropdown />
          ) : (
            <div className="flex gap-2 z-[999999]">
              <Link
                to="/login"
                className="text-sm py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Login
              </Link>
              <Link
                to="/signup"
                className="text-sm py-2 px-4 border text-blue-700 rounded hover:bg-gray-100"
              >
                Signup
              </Link>
            </div>
          )}
        </div>
      </nav>

      <main className="flex-grow">
        {children} {/* Children (Routes) will consume context */}
      </main>

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

      {/* Render the SearchModal here, controlled by Layout's state from context */}
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

// Layout component wraps content with MapSearchProvider
export default function Layout({ children }: LayoutProps) {
  return (
    <MapSearchProvider>
      <LayoutContent>{children}</LayoutContent>
    </MapSearchProvider>
  );
}
