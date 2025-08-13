// src/components/modals/NewProjectModal.tsx
import React, { useState } from "react";
import ReactDOM from "react-dom"; // For React Portals
import { useSnackbar } from "../../context/SnackbarContext"; // For notifications
import { FiPlus, FiX, FiChevronDown } from "react-icons/fi"; // Icons
import { useMapSearch } from "../../context/MapSearchContext"; // Import useMapSearch

// Define props interface for this modal
interface NewProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NewProjectModal({
  isOpen,
  onClose,
}: NewProjectModalProps) {
  const { createProject, loadingProjects } = useMapSearch(); // Get createProject and loadingProjects from useMapSearch
  const { showSnackbar } = useSnackbar();

  const [projectName, setProjectName] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<string>("village"); // Default to "village"
  const [isCreating, setIsCreating] = useState(false); // Local loading state for create action
  const [error, setError] = useState<string | null>(null); // Local error state for create action

  // Handle form submission to create a new project
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null); // Clear previous errors

    if (!projectName.trim()) {
      setError("Project name cannot be empty.");
      return;
    }

    setIsCreating(true); // Start local loading for this action
    try {
      // Use createProject function from MapSearchContext
      // This handles the Firestore call (addDoc), user ID, and auto-selecting the new project
      await createProject(projectName.trim()); // Only passing projectName as per current context function signature

      // If you want to save description and type, createProject in MapSearchContext needs to be updated:
      // await createProject(projectName.trim(), description.trim(), type);

      showSnackbar({
        message: `Project "${projectName.trim()}" created successfully!`,
        severity: "success",
      });
      // Clear form fields
      setProjectName("");
      setDescription("");
      setType("village");
      onClose(); // Close the modal
    } catch (err: any) {
      console.error("Error creating project:", err);
      const errorMessage = "Failed to create project.";
      setError(errorMessage);
      showSnackbar({ message: errorMessage, severity: "error" });
    } finally {
      setIsCreating(false); // End local loading
    }
  };

  // If modal is not open, render null
  if (!isOpen) return null;

  // Render modal using React Portal
  return ReactDOM.createPortal(
    <div className="fixed inset-0 bg-gray-700 bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-[1050] p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-8 mx-auto my-8 max-h-[95vh] overflow-y-auto">
        {" "}
        {/* Increased padding */}
        <div className="flex justify-between items-center pb-4 mb-6 border-b border-gray-200">
          {" "}
          {/* Increased bottom margin, padding */}
          <h2 className="text-2xl md:text-3xl font-extrabold text-gray-700">
            Create New Project
          </h2>{" "}
          {/* Bolder, larger title */}
          <button
            type="button"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-full p-3 transition-colors" // Larger touch area, more subtle hover
            aria-label="Close"
          >
            <FiX size={24} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          {" "}
          {/* Increased vertical spacing */}
          {error && <p className="text-red-600 text-sm my-3">{error}</p>}{" "}
          {/* Adjusted margin */}
          {/* Project Name */}
          <div>
            <label
              htmlFor="projectName"
              className="block text-sm font-semibold text-gray-700 mb-2"
            >
              Project Name<span className="text-red-600">*</span>
            </label>
            <input
              id="projectName"
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="block w-full px-4 py-2.5 border rounded-lg shadow-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out text-gray-800 sm:text-base" // Applied consistent input styling
              required
              disabled={isCreating}
              placeholder="e.g., My New Mapping Project"
            />
          </div>
          {/* Description (Optional) - Uncomment and ensure createProject accepts it */}
          {/*
          <div>
            <label htmlFor="description" className="block text-sm font-semibold text-gray-700 mb-2">Description (Optional)</label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="block w-full px-4 py-2.5 border rounded-lg shadow-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out text-gray-800 sm:text-base min-h-[80px]" // Applied consistent input styling
              disabled={isCreating}
              placeholder="A brief description of this project"
            />
          </div>
          */}
          {/* Type - Uncomment and ensure createProject accepts it */}
          {/*
          <div className="relative">
            <label htmlFor="type" className="block text-sm font-semibold text-gray-700 mb-2">Type</label>
            <select
              id="type"
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="block w-full px-4 py-2.5 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out text-gray-800 sm:text-base appearance-none pr-10 bg-white" // Applied consistent select styling with custom arrow space
              disabled={isCreating}
            >
              <option value="village">Village Mapping</option>
              <option value="trekking">Trekking Routes</option>
              <option value="other">Other</option>
            </select>
            <FiChevronDown size={20} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" aria-hidden="true"/>
          </div>
          */}
          <div className="flex justify-end gap-4 mt-8 pt-5 border-t border-gray-200">
            {" "}
            {/* Increased gap, padding, margin top */}
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-semibold shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-400 md:text-base text-sm" // Adjusted padding, font-weight, shadow
              disabled={isCreating}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`px-6 py-2.5 rounded-lg text-white font-semibold flex items-center gap-2 transition-colors shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 md:text-base text-sm ${
                // Adjusted padding, font-weight, shadow, focus styles
                isCreating
                  ? "bg-blue-300 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
              disabled={isCreating || !projectName.trim()} // Disable if project name is empty or already creating
            >
              {isCreating ? (
                <svg
                  className="animate-spin h-5 w-5 text-white"
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
              ) : (
                <>
                  <FiPlus size={16} /> Create Project
                </> // Changed text for clarity
              )}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
