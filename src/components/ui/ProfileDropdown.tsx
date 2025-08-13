// src/components/ui/ProfileDropdown.tsx
import React, { useState, useEffect, useRef } from 'react';
import { FiLogOut, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { AuthContextProps } from '../../context/AuthContext';
import { motion, AnimatePresence } from "framer-motion"; // Import AnimatePresence

interface ProfileDropdownProps {
  onLogout: () => Promise<void>;
}

export default function ProfileDropdown({ onLogout }: ProfileDropdownProps) {
  const { user } = useAuth() as AuthContextProps;
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null); // Ref for the toggle button

  const toggleDropdown = () => setIsOpen(prev => !prev);

  // Close dropdown when clicking outside or pressing Escape
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current && // Ensure click isn't on the button itself
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
        buttonRef.current?.focus(); // Return focus to the toggle button
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  // Effect to manage focus when dropdown opens/closes
  useEffect(() => {
    if (isOpen) {
      // Focus the first actionable item when dropdown opens
      const firstMenuItem = dropdownRef.current?.querySelector('[role="menuitem"]') as HTMLElement;
      firstMenuItem?.focus();
    }
  }, [isOpen]);

  if (!user) {
    return null; // Render nothing if no user is logged in
  }

  const userInitial = user.displayName ? user.displayName.charAt(0).toUpperCase() : (user.email ? user.email.charAt(0).toUpperCase() : 'U');
  const userDisplay = user.displayName || user.email;

  return (
    <div className="relative profile-dropdown" ref={dropdownRef}>
      <button
        ref={buttonRef} // Assign ref to the button
        onClick={toggleDropdown}
        className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-100 text-blue-700 font-semibold hover:bg-blue-200 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
        aria-label="User profile menu"
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <span className="w-6 h-6 flex items-center justify-center rounded-full bg-blue-600 text-white text-sm flex-shrink-0">
          {userInitial}
        </span>
        <span className="hidden md:inline-block truncate max-w-[120px] lg:max-w-[150px] text-sm text-gray-800">
          {userDisplay}
        </span>
        {isOpen ? <FiChevronUp size={16} className="text-gray-600" /> : <FiChevronDown size={16} className="text-gray-600" />}
      </button>

      <AnimatePresence> {/* Use AnimatePresence for exit animations */}
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -5 }} // Slight lift-up effect
            animate={{ opacity: 1, scale: 1, y: 0 }}   // Animate to actual position
            exit={{ opacity: 0, scale: 0.95, y: -5 }}  // Animate out
            transition={{ duration: 0.15, ease: "easeInOut" }}
            className="absolute right-0 mt-3 w-48 bg-white rounded-md shadow-lg py-1 z-50 origin-top-right ring-1 ring-black ring-opacity-5" // Added ring, origin-top-right
            role="menu"
            aria-orientation="vertical" // Indicate vertical orientation
          >
            <div className="px-4 py-2 text-sm text-gray-600 border-b border-gray-200">
              Signed in as <br /> <span className="font-semibold truncate text-gray-800">{user.email}</span>
            </div>
            <button
              onClick={onLogout}
              className="w-full text-left px-4 py-2 text-sm text-red-600 flex items-center gap-2 hover:bg-gray-100 focus:outline-none focus-visible:bg-gray-100 focus-visible:text-red-700 transition-colors duration-150"
              role="menuitem"
              tabIndex={0} // Ensure it's tabbable when opened
            >
              <FiLogOut size={16} /> Logout
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}