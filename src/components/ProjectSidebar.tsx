// src/components/ProjectSidebar.tsx
import React, { useState, useEffect } from 'react';
import { FiPlus, FiFolder, FiChevronLeft, FiChevronRight, FiLogOut } from 'react-icons/fi';
import { useMapSearch } from '../context/MapSearchContext';
import { useAuth } from '../context/AuthContext';
import { AuthContextProps } from '../context/AuthContext';
import { Project } from '../types/project'; // Import Project type
import { Input } from './ui/input'; // Assuming you have a reusable Input component
import { Button } from './ui/button'; // Assuming you have a reusable Button component


interface ProjectSidebarProps {
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function ProjectSidebar({ isOpen, setIsOpen }: ProjectSidebarProps) {
  const {
    currentUser,
    currentProjectId,
    setCurrentProjectId,
    userProjects,
    loadingProjects,
    createProject,
  } = useMapSearch();
  const { logout } = useAuth() as AuthContextProps; // For the logout button

  const [newProjectName, setNewProjectName] = useState('');
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [createProjectError, setCreateProjectError] = useState<string | null>(null);

  // Auto-close sidebar if no user or no projects and not creating
  useEffect(() => {
    if (!currentUser || (userProjects.length === 0 && !isCreatingProject && !loadingProjects)) {
      setIsOpen(false);
    }
  }, [currentUser, userProjects, isCreatingProject, loadingProjects, setIsOpen]);


  const handleCreateProject = async () => {
    if (!newProjectName.trim()) {
      setCreateProjectError('Project name cannot be empty.');
      return;
    }
    setCreateProjectError(null);
    setIsCreatingProject(true);
    try {
      const newId = await createProject(newProjectName);
      console.log('Project created with ID:', newId);
      setNewProjectName('');
      setIsOpen(true); // Keep sidebar open after creating
    } catch (error) {
      console.error('Error creating project:', error);
      setCreateProjectError('Failed to create project.');
    } finally {
      setIsCreatingProject(false);
    }
  };

  const handleSelectProject = (projectId: string) => {
    setCurrentProjectId(projectId);
    setIsOpen(false); // Optionally close sidebar after selection
  };

  if (!currentUser) {
    // Should be handled by ProtectedRoute, but a fallback is fine
    return null;
  }

  return (
    <aside
      className={`
        fixed inset-y-0 left-0 bg-gray-900 text-white
        w-64 transform transition-transform duration-300 ease-in-out
        p-4 flex flex-col z-[1050] shadow-xl
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}
    >
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Your Projects</h2>
        <button
          onClick={() => setIsOpen(false)}
          className="text-gray-400 hover:text-white transition-colors"
          aria-label="Close project sidebar"
        >
          <FiChevronLeft size={24} />
        </button>
      </div>

      {loadingProjects ? (
        <div className="flex flex-col items-center justify-center flex-grow text-gray-400">
          <svg className="animate-spin h-8 w-8 text-white mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Loading projects...
        </div>
      ) : userProjects.length === 0 ? (
        <div className="flex flex-col items-center justify-center flex-grow text-gray-400 text-center">
          <FiFolder size={40} className="mb-4" />
          <p className="mb-4">No projects yet.</p>
          <p>Create your first one!</p>
        </div>
      ) : (
        <ul className="flex-grow overflow-y-auto space-y-2 mb-6 pr-2">
          {userProjects.map((project: Project) => (
            <li key={project.id}>
              <button
                onClick={() => handleSelectProject(project.id)}
                className={`
                  w-full text-left p-3 rounded-md flex items-center justify-between
                  hover:bg-gray-700 transition-colors
                  ${project.id === currentProjectId ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-800'}
                `}
              >
                <span className="truncate">{project.name}</span>
                {project.id === currentProjectId && (
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-auto pt-4 border-t border-gray-700">
        <h3 className="text-lg font-semibold mb-2">Create New Project</h3>
        {createProjectError && (
          <p className="text-red-400 text-sm mb-2">{createProjectError}</p>
        )}
        <Input
          type="text"
          placeholder="Project Name"
          value={newProjectName}
          onChange={(e) => setNewProjectName(e.target.value)}
          className="w-full p-2 rounded bg-gray-700 border border-gray-600 text-white placeholder-gray-400 mb-2 focus:border-blue-500"
          disabled={isCreatingProject}
        />
        <Button
          onClick={handleCreateProject}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-md flex items-center justify-center"
          disabled={isCreatingProject}
        >
          {isCreatingProject ? (
            <svg className="animate-spin h-5 w-5 text-white mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            <FiPlus className="mr-2" />
          )}
          Create Project
        </Button>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-700">
        <Button
          onClick={logout}
          className="w-full bg-red-600 hover:bg-red-700 text-white py-2 rounded-md flex items-center justify-center"
        >
          <FiLogOut className="mr-2" /> Logout
        </Button>
      </div>
    </aside>
  );
}