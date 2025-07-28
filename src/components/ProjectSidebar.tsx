
// src/components/ProjectSidebar.tsx
import React, { useState, useEffect, useRef } from "react";
// Import all necessary icons
import {
  FiPlus,
  FiFolder,
  FiChevronLeft,
  FiLogOut,
  FiEdit2,
  FiTrash2,
  FiCheck,
  FiX,
} from "react-icons/fi";
import { useMapSearch } from "../context/MapSearchContext";
import { useAuth } from "../context/AuthContext";
import { AuthContextProps } from "../context/AuthContext";
import { Project } from "../types/project";
import NewProjectModal from "./modals/NewProjectModal";
import { Input } from "./ui/input"; // Assuming you have a reusable Input component
import { Button } from "./ui/button"; // Assuming you have a reusable Button component
import { toast } from "react-toastify"; // For notifications

interface ProjectSidebarProps {
  isOpen: boolean; // Controls sidebar's open/close state (from Layout)
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>; // Callback to update parent
}

export default function ProjectSidebar({
  isOpen,
  setIsOpen,
}: ProjectSidebarProps) {
  const {
    currentUser,
    currentProjectId,
    setCurrentProjectId,
    userProjects,
    loadingProjects,
    createProject, // Still needed for the modal
    updateProject, // NEW: Get updateProject from context
    deleteProject, // NEW: Get deleteProject from context
  } = useMapSearch();
  const { logout } = useAuth() as AuthContextProps;

  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null); // State for which project is being edited
  const [newProjectName, setNewProjectName] = useState(""); // State for new project name in inline edit
  const sidebarRef = useRef<HTMLDivElement>(null); // Ref for outside click

  // Effect to close sidebar on outside click
  useEffect(() => {
    if (!isOpen) return; // Only attach listener if sidebar is open

    function handleClickOutside(event: MouseEvent) {
      // Check if click is outside the sidebar AND not on the toggle button itself (in Navbar)
      const isClickOutsideSidebar =
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target as Node);
      // You'll need to pass the navbar toggle button's ref or ID to exclude it
      // For simplicity, we'll just check if it's outside the sidebar for now.
      if (isClickOutsideSidebar) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, setIsOpen]); // Re-run when isOpen changes

  // Auto-select first project if available and no project selected initially
  useEffect(() => {
    if (!loadingProjects && userProjects.length > 0 && !currentProjectId) {
      setCurrentProjectId(userProjects[0].id);
    }
  }, [loadingProjects, userProjects, currentProjectId, setCurrentProjectId]);

  // Handle project selection
  const handleSelectProject = (projectId: string) => {
    setCurrentProjectId(projectId);
    setIsOpen(false); // Close sidebar after selection
  };

  // Handle project rename save
  const handleRenameProject = async (projectId: string) => {
    if (!newProjectName.trim()) {
      toast.error("Project name cannot be empty.");
      return;
    }
    try {
      await updateProject(projectId, newProjectName.trim());
      toast.success("Project renamed successfully!");
      setEditingProjectId(null); // Exit editing mode
      setNewProjectName(""); // Clear temp name
    } catch (error: any) {
      console.error("Error renaming project:", error);
      toast.error("Failed to rename project");
    }
  };

  // Handle project deletion
  const handleDeleteProject = async (
    projectId: string,
    projectName: string
  ) => {
    if (
      !window.confirm(
        `Are you sure you want to delete project "${projectName}" and all its pins? This action cannot be undone.`
      )
    ) {
      return;
    }
    try {
      await deleteProject(projectId);
      toast.success("Project deleted successfully!");
      // currentProjectId will be auto-updated by MapSearchContext's useEffect
    } catch (error: any) {
      console.error("Error deleting project:", error);
      toast.error("Failed to delete project");
    }
  };

  if (!currentUser) {
    return null; // Should be handled by ProtectedRoute
  }

  return (
    <>
      <aside
        ref={sidebarRef} // Attach ref for outside click
        className={`
          fixed inset-y-0 left-0 bg-white text-gray-800
          w-64 transform transition-all duration-300 ease-in-out
          p-4 pb-24 md:pb-2 // Padding, adjusted for mobile footer and desktop
          flex flex-col z-[1020] shadow-2xl rounded-r-lg 
          ${isOpen ? "translate-x-0" : "-translate-x-full"}

          md:translate-x-0 md:static md:w-64 md:flex // On medium screens and up, be static and always visible
          overflow-y-auto
          scrollbar-thin scrollbar-thumb-blue-400 scrollbar-track-gray-200 // Custom scrollbar (requires tailwind-scrollbar plugin)
        `}
      >
        {/* Sidebar Header (for mobile toggle) */}
        <div className="flex justify-between items-center mb-6 mt-14 md:hidden ">
          <h2 className="text-2xl font-bold">Your Projects</h2>
          <button
            onClick={() => setIsOpen(false)}
            className="text-gray-500 hover:text-gray-800 transition-colors p-2 rounded-full hover:bg-gray-200"
            aria-label="Close project sidebar"
          >
            <FiChevronLeft size={24} />
          </button>
        </div>

        {/* Desktop Header (always visible) */}
        <div className="hidden md:flex justify-between items-center mb-8 mt-20">
          <h2 className="text-2xl font-bold text-gray-500">
            Your Projects
          </h2>
        </div>

        {/* Project List / Loading / No Projects */}
        {loadingProjects ? (
          <div className="flex flex-col items-center justify-center flex-grow text-gray-600">
            <svg
              className="animate-spin h-10 w-10 text-blue-500 mb-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            <p>Loading projects...</p>
          </div>
        ) : userProjects.length === 0 ? (
          <div className="flex flex-col items-center justify-center flex-grow text-gray-500 text-center p-4">
            <FiFolder size={56} className="mb-6 text-gray-400" />
            <p className="mb-4 text-xl font-medium">No projects yet.</p>
            <Button
              onClick={() => setIsNewProjectModalOpen(true)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg flex items-center justify-center mb-2 shadow-md transition-all duration-200"
            >
              <FiPlus className="mr-2" size={20} /> Create Your First Project
            </Button>
          </div>
        ) : (
          <ul className="flex-grow overflow-y-auto space-y-3 mb-6 pr-2">
            {" "}
            {/* Increased space-y */}
            {userProjects.map((project: Project) => (
              <li key={project.id}>
                {editingProjectId === project.id ? (
                  // Inline Edit Mode
                  <div className="flex items-center space-x-2 bg-gray-100 p-2 rounded-md shadow-sm">
                    <Input
                      type="text"
                      value={newProjectName}
                      onChange={(e) => setNewProjectName(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === "Enter") handleRenameProject(project.id);
                      }}
                      className="flex-grow p-2 rounded-md bg-gray-50 border border-gray-300 text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      autoFocus
                    />
                    <button
                      onClick={() => handleRenameProject(project.id)}
                      className="p-2 rounded-full text-green-500 hover:bg-green-100 hover:text-green-600 transition-colors duration-200"
                      aria-label="Save rename"
                      title="Save Rename"
                    >
                      <FiCheck size={20} />
                    </button>
                    <button
                      onClick={() => setEditingProjectId(null)}
                      className="p-2 rounded-full text-red-500 hover:bg-red-100 hover:text-red-600 transition-colors duration-200"
                      aria-label="Cancel rename"
                      title="Cancel Rename"
                    >
                      <FiX size={20} />
                    </button>
                  </div>
                ) : (
                  // Display Mode
                  <div
                    className={`
                        group relative flex items-center justify-between p-3 rounded-md cursor-pointer
                        transition-all duration-200 ease-in-out
                        ${
                          project.id === currentProjectId
                            ? "bg-blue-600 text-white shadow-lg border-l-4 border-blue-800" // Selected state: strong blue background, white text, shadow, left border
                            : "bg-gray-50 text-gray-800 hover:bg-gray-100 hover:shadow-sm" // Rest state: light gray, dark text, subtle hover shadow
                        }
                      `}
                  >
                    <button
                      onClick={() => handleSelectProject(project.id)}
                      className="flex-grow text-left focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-md"
                      aria-pressed={project.id === currentProjectId}
                    >
                      <span className="truncate block font-medium">
                        {project.name}
                      </span>
                    </button>

                    {/* Action buttons (Rename/Delete) - visible on hover or when active */}
                    <div
                      className={`
                        flex ml-2 space-x-1 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 // Fade in on hover/focus-within
                        transition-opacity duration-200
                        ${
                          project.id === currentProjectId ? "opacity-100" : ""
                        } // Always visible if selected
                      `}
                    >
                      <button
                        onClick={() => {
                          setEditingProjectId(project.id);
                          setNewProjectName(project.name);
                        }}
                        className={`
                          p-2 rounded-full transition-colors duration-200
                          ${
                            project.id === currentProjectId
                              ? "text-blue-200 hover:bg-blue-500"
                              : "text-gray-500 hover:bg-gray-200 hover:text-gray-800"
                          }
                        `}
                        aria-label="Rename project"
                        title="Rename Project"
                      >
                        <FiEdit2 size={16} />
                      </button>
                      <button
                        onClick={() =>
                          handleDeleteProject(project.id, project.name)
                        }
                        className={`
                          p-2 rounded-full transition-colors duration-200
                          ${
                            project.id === currentProjectId
                              ? "text-red-200 hover:bg-red-500"
                              : "text-gray-500 hover:bg-gray-200 hover:text-red-600"
                          }
                        `}
                        aria-label="Delete project"
                        title="Delete Project"
                      >
                        <FiTrash2 size={16} />
                      </button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}

        {/* Footer actions */}
        <div className="mt-auto pt-4 border-t border-gray-200 bg-white sticky bottom-0 z-10">
          {" "}
          {/* Sticky footer */}
          {/* Create New Project Button (always present if projects exist, or can be uncommented to always show) */}
          {/* {userProjects.length > 0 && ( */}
          <Button
            onClick={() => setIsNewProjectModalOpen(true)}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg flex items-center justify-center mb-2 shadow-md transition-all duration-200"
          >
            <FiPlus className="mr-2" size={20} /> New Project
          </Button>
          {/* )} */}
          <Button
            onClick={logout}
            className="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg flex items-center justify-center shadow-md transition-all duration-200"
          >
            <FiLogOut className="mr-2" size={20} /> Logout
          </Button>
        </div>
      </aside>

      {/* Render the NewProjectModal */}
      <NewProjectModal
        isOpen={isNewProjectModalOpen}
        onClose={() => setIsNewProjectModalOpen(false)}
      />
    </>
  );
}
