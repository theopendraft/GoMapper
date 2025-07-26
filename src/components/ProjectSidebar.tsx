// src/components/ProjectSidebar.tsx
import React, { useState, useEffect, useRef } from 'react';
// Import all necessary icons
import { FiPlus, FiFolder, FiChevronLeft, FiLogOut, FiEdit2, FiTrash2, FiCheck, FiX } from 'react-icons/fi';
import { useMapSearch } from '../context/MapSearchContext';
import { useAuth } from '../context/AuthContext';
import { AuthContextProps } from '../context/AuthContext';
import { Project } from '../types/project';
import NewProjectModal from './modals/NewProjectModal';
import { Input } from './ui/input'; // Assuming you have a reusable Input component
import { Button } from './ui/button'; // Assuming you have a reusable Button component
import { toast } from 'react-toastify'; // For notifications

interface ProjectSidebarProps {
  isOpen: boolean; // Controls sidebar's open/close state (from Layout)
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>; // Callback to update parent
}

export default function ProjectSidebar({ isOpen, setIsOpen }: ProjectSidebarProps) {
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
  const [newProjectName, setNewProjectName] = useState(''); // State for new project name in inline edit
  const sidebarRef = useRef<HTMLDivElement>(null); // Ref for outside click

  // Effect to close sidebar on outside click
  useEffect(() => {
    if (!isOpen) return; // Only attach listener if sidebar is open

    function handleClickOutside(event: MouseEvent) {
      // Check if click is outside the sidebar AND not on the toggle button itself (in Navbar)
      const isClickOutsideSidebar = sidebarRef.current && !sidebarRef.current.contains(event.target as Node);
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
      toast.error('Project name cannot be empty.');
      return;
    }
    try {
      await updateProject(projectId, newProjectName.trim());
      toast.success('Project renamed successfully!');
      setEditingProjectId(null); // Exit editing mode
      setNewProjectName(''); // Clear temp name
    } catch (error: any) {
      console.error('Error renaming project:', error);
      toast.error('Failed to rename project');
    }
  };

  // Handle project deletion
  const handleDeleteProject = async (projectId: string, projectName: string) => {
    if (!window.confirm(`Are you sure you want to delete project "${projectName}" and all its pins? This action cannot be undone.`)) {
      return;
    }
    try {
      await deleteProject(projectId);
      toast.success('Project deleted successfully!');
      // currentProjectId will be auto-updated by MapSearchContext's useEffect
    } catch (error: any) {
      console.error('Error deleting project:', error);
      toast.error('Failed to delete project');
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
          fixed inset-y-0 left-0 bg-white text-blue-700 // Base background for the sidebar
          w-56 transform transition-transform duration-300 ease-in-out
          p-4 pb-24 md:pb-2 flex flex-col z-[1020] shadow-xl
          ${isOpen ? "translate-x-0" : "-translate-x-full"}

          md:translate-x-0 md:static md:w-64 md:flex // On medium screens and up, be static
          overflow-y-auto
        `}
      >
        {/* Sidebar Header (for mobile toggle) */}
        <div className="flex justify-between items-center mb-6 mt-14 md:hidden">
          {" "}
          {/* Hide close button on larger screens */}
          <h2 className="text-xl font-bold">Your Projects</h2>
          <button
            onClick={() => setIsOpen(false)}
            className="text-gray-400 hover:text-white transition-colors p-1 rounded-full hover:bg-blue-300"
            aria-label="Close project sidebar"
          >
            <FiChevronLeft size={24} />
          </button>
        </div>

        {/* Desktop Header (always visible) */}
        <div className="justify-between items-center mb-6 mt-24 hidden md:flex">
          <h2 className="text-2xl font-bold mb-2 hidden md:block">
            Your Projects
          </h2>{" "}
          {/* Show on larger screens */}
          <button
            onClick={() => setIsOpen(false)}
            className="text-gray-400 hover:text-white transition-colors p-1 rounded-full hover:bg-blue-300  md:hidden "
            aria-label="Close project sidebar"
          >
            <FiChevronLeft size={24} />
          </button>
        </div>

        {/* Project List / Loading / No Projects */}
        {loadingProjects ? (
          <div className="flex flex-col items-center justify-center flex-grow text-gray-400">
            <svg
              className="animate-spin h-8 w-8 text-white mb-2"
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
            Loading projects...
          </div>
        ) : userProjects.length === 0 ? (
          <div className="flex flex-col items-center justify-center flex-grow text-gray-400 text-center">
            <FiFolder size={40} className="mb-4" />
            <p className="mb-4">No projects yet.</p>
            <Button
              onClick={() => setIsNewProjectModalOpen(true)}
              className="mt-4 bg-blue-600 hover:bg-blue-700 text-white md:py-2 md;px-4 px-2 py-1 rounded-md flex items-center justify-center"
            >
              <FiPlus className="mr-2" /> Create First Project
            </Button>
          </div>
        ) : (
          <ul className="flex-grow overflow-y-auto space-y-2 mb-6 pr-2 scrollbar-hide">
            {userProjects.map((project: Project) => (
              <li key={project.id}>
                {editingProjectId === project.id ? (
                  // Inline Edit Mode (stays the same)
                  <div className="group relative flex items-center justify-between hover:bg-gray-100 rounded-md transition-colors duration-200">
                  <div className="flex-row items-center">
                    <Input
                      type="text"
                      value={newProjectName}
                      onChange={(e) => setNewProjectName(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === "Enter") handleRenameProject(project.id);
                      }}
                      className="flex-grow md:p-2 p-1 rounded-md bg-gray-700 border border-gray-600 text-white placeholder-gray-400 focus:border-blue-500"
                      autoFocus
                    />
                    <button
                      onClick={() => handleRenameProject(project.id)}
                      className="md:p-2 p-1 rounded-md text-green-400 hover:bg-blue-300"
                      aria-label="Save rename"
                    >
                      <FiCheck size={20} />
                    </button>
                    <button
                      onClick={() => setEditingProjectId(null)}
                      className="md:p-2 p-1 rounded-md text-red-400 hover:bg-blue-300"
                      aria-label="Cancel rename"
                    >
                      <FiX size={20} />
                    </button>
                  </div>
                  </div>
                ) : (
                  // Display Mode
                  <div className="group relative flex items-center justify-between hover:bg-gray-100 rounded-md transition-colors duration-200">
                  <div className={`
                        flex-grow text-left md:p-3 p-2 rounded-md flex items-center
                        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                        transition-colors duration-200 justify-between 
                        ${
                          project.id === currentProjectId // If this project is currently selected
                            ? "bg-blue-600 text-white shadow-md " // Selected state: solid blue background, white text, shadow
                            : "bg-gray-100 text-gray-800 hover:bg-gray-200" // Rest state: light gray background, dark text, hover effect
                        }
                      `}>
                    <button
                      onClick={() => handleSelectProject(project.id)}
                      aria-pressed={project.id === currentProjectId}
                    >
                      <span className=" truncate "> {/* Adjusted width for name */}
                        {project.name}
                      </span>

                    </button>
                    {/* Action buttons (Rename/Delete) - visible on hover or when active */}
                    <div className={`
                        flex ml-2 space-x-1 transition-opacity duration-200 float-right
                        ${project.id === currentProjectId ? 'opacity-100' : 'group-hover:opacity-100'}
                    `}>
                      <button
                        onClick={() => { setEditingProjectId(project.id); setNewProjectName(project.name); }}
                        className="pl-2 rounded-md text-green-400 hover:bg-blue-300 hover:text-white" // Adjust text color for contrast
                        aria-label="Rename project"
                        title="Rename Project"
                      >
                        <FiEdit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteProject(project.id, project.name)}
                        className="pl-2 rounded-md text-red-400 hover:bg-blue-300 hover:text-red-300"
                        aria-label="Delete project"
                        title="Delete Project"
                      >
                        <FiTrash2 size={16} />
                      </button>
                    </div>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}

        {/* Footer actions */}
        <div className="mt-auto pt-4 border-t border-gray-700">
          {/* Create New Project Button (always present if projects exist) */}
          {userProjects.length > 0 && ( // Or always show, even if no projects
            <Button
              onClick={() => setIsNewProjectModalOpen(true)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-md flex items-center justify-center mb-2"
            >
              <FiPlus className="mr-2" /> New Project
            </Button>
          )}

          <Button
            onClick={logout}
            className="w-full bg-red-600 hover:bg-red-700 text-white py-2 rounded-md flex items-center justify-center"
          >
            <FiLogOut className="mr-2" /> Logout
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