// // src/components/Layout.tsx
// import React, { useState, useCallback } from "react";
// import { Link, useLocation, useNavigate } from "react-router-dom";
// import SearchModal from "./modals/SearchModal";
// import ProjectSidebar from './ProjectSidebar';
// import { FiSearch, FiMenu } from "react-icons/fi";
// import { AiOutlineDashboard } from "react-icons/ai";
// import { RiMapPin5Line } from "react-icons/ri";
// import { LuContactRound } from "react-icons/lu";
// import { cn } from "../utils/utils";
// import { AuthContextProps, useAuth } from "../context/AuthContext";
// import { MapSearchProvider, useMapSearch } from "../context/MapSearchContext";
// import ProfileDropdown from "./ui/ProfileDropdown";

// // Define navigation links for authenticated users
// const navLinks = [
//   { name: "Map View", path: "/map", Icon: RiMapPin5Line },
//   { name: "Dashboard", path: "/dashboard", Icon: AiOutlineDashboard },
//   { name: "Contacts", path: "/contacts", Icon: LuContactRound },
// ];

// interface LayoutProps {
//   children: React.ReactNode;
// }

// const LayoutContent: React.FC<{ children: React.ReactNode }> = ({
//   children,
// }) => {
//   const { user: currentUser, logout } = useAuth() as AuthContextProps;
//   const navigate = useNavigate();
//   const {
//     isSearchModalOpen,
//     setIsSearchModalOpen,
//     isMapSearchControlVisible,
//     locationFoundForModalDisplay,
//     setLocationFoundForModalDisplay,
//     handleLocationSelectedFromMapSearchAndCloseModal,
//     handleClearLocationFound,
//     triggerMapSearchControlVisibility,
//     currentProjectId,
//     userProjects,
//   } = useMapSearch();

//   const location = useLocation();
//   const [isSidebarOpen, setIsSidebarOpen] = useState(false);

//   const handleOpenSearchModal = useCallback(() => {
//     setIsSearchModalOpen(true);
//     setLocationFoundForModalDisplay(null);
//   }, [setIsSearchModalOpen, setLocationFoundForModalDisplay]);

//   const handleLogout = useCallback(async () => {
//     await logout();
//     navigate('/', { replace: true });
//   }, [logout, navigate]);

//   return (
//     <div className="flex min-h-screen bg-gray-50"> {/* Changed to flex for sidebar layout */}
//       {/* Project Sidebar - Rendered always, but its visibility is controlled internally */}
//       {currentUser && (
//         <ProjectSidebar
//           isOpen={isSidebarOpen}
//           setIsOpen={setIsSidebarOpen}
//         />
//       )}

//       {/* Main Content Wrapper (Navbar + Main Content Area + Mobile Nav) */}
//       <div className={`flex flex-col flex-1 min-h-screen transition-all duration-300 ease-in-out
//           ${isSidebarOpen ? 'md:ml-0' : 'md:ml-0'} /* Sidebar is fixed/absolute on mobile, static on desktop */
//           `}>
//         {/* Top Navigation Bar */}
//         <nav className="bg-white md:p-4 pb-2 pt-3 flex justify-between items-center z-[1030] shadow-sm fixed top-0 left-0 right-0 border-b border-gray-200">
//           <div className="flex items-center">
//             {/* Sidebar Toggle Button - visible on mobile, hidden on larger screens */}
//             {currentUser && (location.pathname === "/map" || location.pathname === "/dashboard" || location.pathname === "/contacts") && (
//               <button
//                 onClick={() => setIsSidebarOpen(true)}
//                 className="mr-4 text-gray-600 hover:text-gray-800 transition-colors p-2 rounded-md hover:bg-blue-100 " // Hide on md and up
//                 aria-label="Open project sidebar"
//               >
//                 <FiMenu size={24} />
//               </button>
//             )}
//             <div className="flex items-center gap-1 ml-2">
//             <svg className="h-8 w-8 text-blue-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
//             <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5A4.5 4.5 0 003 9.5a4.5 4.5 0 004.5 4.5c1.746 0 3.332-.477 4.5-1.247m0 0V14.25m0-6.253c1.168-.773 2.754-1.247 4.5-1.247A4.5 4.5 0 0121 9.5a4.5 4.5 0 01-4.5 4.5c-1.746 0-3.332-.477-4.5-1.247m0 0V14.25m0 0v1.5c0 .874-.396 1.705-1.036 2.272l-2.07 1.849c-.832.74-2.031.74-2.863 0l-2.07-1.849A3.75 3.75 0 017.5 14.25m4.5 4.5v-1.5m0-6.253a4.524 4.524 0 01-.166-.089m0 0L12 14.25" />
//           </svg>
//             <Link to="/" className="text-xl font-bold text-blue-700">
//               GoMapper
//             </Link>
//             </div>
//           </div>

//           {/* Right Section: Search Button, Nav Links, Auth Buttons */}
//           <div className="flex items-center space-x-4">
//             {/* Search Location Button - only visible if logged in AND on map page AND a project is selected */}
//             {currentUser && currentProjectId && location.pathname === "/map" && (
//               <button
//                 onClick={handleOpenSearchModal}
//                 className="hidden md:flex items-center justify-start py-2 px-4  rounded-full border border-blue-300 text-gray-600 bg-blue-50 hover:bg-blue-100 hover:border-blue-500 transition-colors gap-2"
//               >
//                 <FiSearch className="w-5 h-5" /> Search
//               </button>
//             )}

//             <div className="flex items-center gap-2">
//               {/* Desktop Navigation Links - only visible if logged in and on larger screens */}
//               {currentUser && (
//                 <div className="hidden sm:flex gap-2">
//                   {navLinks.map(({ name, path, Icon }) => (
//                     <Link
//                       key={name}
//                       to={path}
//                       className={cn(
//                         "flex items-center gap-1 px-3 py-3 rounded hover:bg-blue-50 transition",
//                         location.pathname === path
//                           ? "bg-blue-100 text-blue-700 font-semibold"
//                           : "text-gray-700"
//                       )}
//                     >
//                       <Icon className="w-5 h-5" />
//                       <span>{name}</span>
//                     </Link>
//                   ))}
//                 </div>
//               )}

//               {/* Profile Dropdown or Login/Signup Buttons */}
//               {currentUser ? (
//                 <ProfileDropdown
//                   onLogout={handleLogout}
//                 />
//               ) : (
//                 <></>
//               )}
//             </div>
//           </div>
//         </nav>

//         {/* Main Content Area */}
//         <main className="flex-grow">
//           {children} {/* This is where your Routes and pages (like MapPage) are rendered */}
//         </main>

//         {/* Bottom Mobile Navigation Bar - only visible if user is logged in */}
//         {currentUser && (
//           <nav className="fixed bottom-3 left-2 right-2 rounded-full sm:hidden z-[1035] bg-white border border-gray-200 shadow-md flex justify-around py-2 px-3">
//             {navLinks.map(({ name, path, Icon }) => (
//               <Link
//                 key={name}
//                 to={path}
//                 className={cn(
//                   "flex flex-col items-center gap-1 text-xs px-2 py-1",
//                   location.pathname === path
//                     ? "text-blue-600 font-semibold"
//                     : "text-gray-600"
//                 )}
//               >
//                 <Icon className="w-4 h-4" />
//                 {name}
//               </Link>
//             ))}
//           </nav>
//         )}
//       </div> {/* End of Main Content Wrapper */}

//       {/* Render the SearchModal */}
//       <SearchModal
//         isOpen={isSearchModalOpen}
//         onClose={() => setIsSearchModalOpen(false)}
//         onStartSearch={triggerMapSearchControlVisibility.bind(null, true)}
//         locationFoundForSelection={locationFoundForModalDisplay}
//         onClearLocationFound={handleClearLocationFound}
//       />
//     </div>
//   );
// };

// export default function Layout({ children }: LayoutProps) {
//   return (
//     <MapSearchProvider>
//       <LayoutContent>{children}</LayoutContent>
//     </MapSearchProvider>
//   );
// }

// src/components/Layout.tsx
import React, { useState, useCallback } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import SearchModal from "./modals/SearchModal";
import ProjectSidebar from './ProjectSidebar';
import { FiSearch, FiMenu } from "react-icons/fi";
import { AiOutlineDashboard } from "react-icons/ai";
import { RiMapPin5Line } from "react-icons/ri";
import { LuContactRound } from "react-icons/lu";
import { cn } from "../utils/utils";
import { AuthContextProps, useAuth } from "../context/AuthContext";
import { MapSearchProvider, useMapSearch } from "../context/MapSearchContext";
import ProfileDropdown from "./ui/ProfileDropdown";

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

  const handleOpenSearchModal = useCallback(() => {
    setIsSearchModalOpen(true);
    setLocationFoundForModalDisplay(null);
  }, [setIsSearchModalOpen, setLocationFoundForModalDisplay]);

  const handleLogout = useCallback(async () => {
    await logout();
    navigate('/', { replace: true });
  }, [logout, navigate]);

  return (
    // Main container: full height, hidden overflow to manage fixed elements
    <div className="flex h-screen overflow-hidden bg-gray-100 scrollbar-hide">
      {/* Project Sidebar - Rendered always, its visibility is controlled internally by its own `isOpen` prop
          and the CSS classes it applies (translate-x-full vs translate-x-0).
          On medium screens and up, it becomes static and takes up 64px,
          so we adjust the main content's left margin. */}
      {currentUser && (
        <ProjectSidebar
          isOpen={isSidebarOpen}
          setIsOpen={setIsSidebarOpen}
        />
      )}

      {/* Main Content Wrapper (Navbar + Main Content Area + Mobile Nav) */}
      <div className={`
          flex flex-col flex-1 min-h-screen overflow-y-auto // Allows content to scroll
          transition-all duration-300 ease-in-out
          ${isSidebarOpen ? 'md:ml-64' : 'md:ml-0'} // Adjust main content margin based on sidebar's static state
          `}>
        {/* Top Navigation Bar */}
        <nav className="fixed top-0 left-0 right-0 bg-white h-16 md:h-20 flex justify-between items-center px-4 md:px-8 z-[1030] shadow-lg border-b border-gray-200">
          <div className="flex items-center">
            {/* Sidebar Toggle Button - visible only on smaller screens */}
            {currentUser && (location.pathname === "/map" || location.pathname === "/dashboard" || location.pathname === "/contacts") && (
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="md:hidden mr-4 text-gray-600 hover:text-gray-800 transition-colors p-2 rounded-full hover:bg-gray-100 active:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Open project sidebar"
              >
                <FiMenu size={24} />
              </button>
            )}
            <div className="flex items-center gap-2">
              <svg className="h-8 w-8 text-blue-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5A4.5 4.5 0 003 9.5a4.5 4.5 0 004.5 4.5c1.746 0 3.332-.477 4.5-1.247m0 0V14.25m0-6.253c1.168-.773 2.754-1.247 4.5-1.247A4.5 4.5 0 0121 9.5a4.5 4.5 0 01-4.5 4.5c-1.746 0-3.332-.477-4.5-1.247m0 0V14.25m0 0v1.5c0 .874-.396 1.705-1.036 2.272l-2.07 1.849c-.832.74-2.031.74-2.863 0l-2.07-1.849A3.75 3.75 0 017.5 14.25m4.5 4.5v-1.5m0-6.253a4.524 4.524 0 01-.166-.089m0 0L12 14.25" />
              </svg>
              <Link to="/" className="text-2xl md:text-3xl font-extrabold text-blue-700">
                GoMapper
              </Link>
            </div>
          </div>

          {/* Right Section: Search Button, Nav Links, Auth Buttons */}
          <div className="flex items-center space-x-4">
            {/* Search Location Button - only visible if logged in AND on map page AND a project is selected */}
            {currentUser && currentProjectId && location.pathname === "/map" && (
              <button
                onClick={handleOpenSearchModal}
                className="hidden md:flex items-center justify-start py-2 px-4 rounded-lg border border-blue-300 text-gray-700 bg-blue-50 hover:bg-blue-100 hover:border-blue-500 transition-all duration-200 gap-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <FiSearch className="w-5 h-5" /> Search
              </button>
            )}

            <div className="flex items-center gap-3"> {/* Increased gap for better spacing */}
              {/* Desktop Navigation Links - only visible if logged in and on larger screens */}
              {currentUser && (
                <div className="hidden sm:flex gap-3"> {/* Adjusted gap */}
                  {navLinks.map(({ name, path, Icon }) => (
                    <Link
                      key={name}
                      to={path}
                      className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200", // Added gap-2 and rounded-lg
                        location.pathname === path
                          ? "bg-blue-600 text-white font-semibold shadow-sm" // Stronger active state
                          : "text-gray-700 hover:bg-gray-100 hover:text-blue-700" // Enhanced hover for inactive
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
                <ProfileDropdown
                  onLogout={handleLogout}
                />
              ) : (
                // You can add Login/Signup buttons here if needed for unauthenticated users on desktop
                <></>
              )}
            </div>
          </div>
        </nav>

        {/* Main Content Area - pushed down by fixed navbar */}
        <main className="flex-grow pt-16 md:pt-20"> {/* Match pt to navbar height */}
          {children} {/* This is where your Routes and pages (like MapPage) are rendered */}
        </main>

        {/* Bottom Mobile Navigation Bar - only visible if user is logged in */}
        {currentUser && (
          <nav className="fixed bottom-3 left-2 right-2 rounded-2xl sm:hidden z-[1035] bg-white border border-gray-200 shadow-xl flex justify-around py-2 px-3">
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
                <Icon className="w-5 h-5 mb-1" /> {/* Slightly larger icons, added mb-1 for spacing */}
                {name}
              </Link>
            ))}
          </nav>
        )}
      </div> {/* End of Main Content Wrapper */}

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