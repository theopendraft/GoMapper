// src/components/ui/ProfileDropdown.tsx
import React, { useState, useEffect, useRef } from 'react'; // FIX: Add useRef here
import { FiLogOut, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext'; // Adjust path if needed
import { AuthContextProps } from '../../context/AuthContext'; // Adjust path if needed
import { motion } from "framer-motion";

// Define the props interface for ProfileDropdown
interface ProfileDropdownProps {
  onLogout: () => Promise<void>; // This prop must be declared
}

export default function ProfileDropdown({ onLogout }: ProfileDropdownProps) {
  const { user } = useAuth() as AuthContextProps;
  const [isOpen, setIsOpen] = useState(false); // State to control dropdown visibility
  const dropdownRef = useRef<HTMLDivElement>(null); // Ref for click outside

  const toggleDropdown = () => setIsOpen(!isOpen);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);


  if (!user) {
    return null; // Or render a placeholder if ProfileDropdown should always be visible
  }

  return (
    <div className="relative profile-dropdown" ref={dropdownRef}>
      <button
        onClick={toggleDropdown}
        className="flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-700 font-semibold hover:bg-blue-200 transition"
        aria-label="User profile menu"
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <span className="w-8 h-8 flex items-center justify-center rounded-full bg-blue-600 text-white text-sm">
          {user.displayName ? user.displayName.charAt(0).toUpperCase() : (user.email ? user.email.charAt(0).toUpperCase() : 'U')}
        </span>
        <span className="hidden md:inline-block truncate max-w-[100px]">{user.displayName || user.email}</span>
        {isOpen ? <FiChevronUp size={16} /> : <FiChevronDown size={16} />}
      </button>

      {isOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 0 }}
                animate={{ opacity: 1, scale: 1, y: 10 }}
                transition={{ duration: 0.15, ease: "easeInOut" }}
                className="absolute right-0  mt-6 w-48 bg-white rounded-md shadow-lg py-1 z-50"
                role="menu"
              >
          <div className="px-4 py-2 text-sm text-gray-700 border-b border-gray-200">
            Signed in as <br /> <span className="font-semibold truncate">{user.email}</span>
          </div>
          <button
            onClick={onLogout}
            className="w-full text-left px-4 py-2 text-sm text-red-600 flex items-center gap-2 hover:bg-gray-100"
            role="menuitem"
          >
            <FiLogOut size={16} /> Logout
          </button>
          {/* Add more profile options here if needed */}
      </motion.div>
      )

      }
    </div>
  );
}