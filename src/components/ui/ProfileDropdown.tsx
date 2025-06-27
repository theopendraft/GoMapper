import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "../../components/context/AuthContext";
import {
  FiUser,
  FiLogOut,
  FiSettings,
  FiHelpCircle,
  FiMoreVertical,
} from "react-icons/fi";
import { RiMagicLine } from "react-icons/ri";
import { HiOutlineArrowUpRight } from "react-icons/hi2";
import { Link } from "react-router-dom";

export default function ProfileDropdown() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const toggleDropdown = () => setOpen(!open);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  if (!user) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={toggleDropdown}
        className="w-9 h-9 rounded-full border bg-gray-200 hover:ring-2 ring-blue-400 overflow-hidden"
      >
        <img
          src={`https://ui-avatars.com/api/?name=${user.displayName || "U"}&background=0D8ABC&color=fff`}
          alt="avatar"
          className="w-full h-full object-cover"
        />
      </button>

      {open && (
        
        <div className="absolute right-0 mt-2 w-60 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 text-sm z-[1001] animate-fadeIn">
          <div className="px-4 py-2 font-semibold text-gray-800 flex items-center gap-2 border-b z-[1001]">
            <FiUser />
            {user.email}
          </div>
          <ul className="py-1">
            <li>
              <button className="flex items-center w-full px-4 py-2 hover:bg-gray-100 text-gray-700">
                <HiOutlineArrowUpRight className="mr-2" />
                Upgrade Plan
              </button>
            </li>
            <li>
              <button className="flex items-center w-full px-4 py-2 hover:bg-gray-100 text-gray-700">
                <RiMagicLine className="mr-2" />
                Personalize
              </button>
            </li>
            <li>
              <Link
                to="/settings"
                className="flex items-center px-4 py-2 hover:bg-gray-100 text-gray-700"
              >
                <FiSettings className="mr-2" />
                Settings
              </Link>
            </li>
            <li>
              <button className="flex items-center w-full px-4 py-2 hover:bg-gray-100 text-gray-700">
                <FiHelpCircle className="mr-2" />
                Help
              </button>
            </li>
            <li>
              <button
                onClick={logout}
                className="flex items-center w-full px-4 py-2 hover:bg-red-50 text-red-600"
              >
                <FiLogOut className="mr-2" />
                Log out
              </button>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}
