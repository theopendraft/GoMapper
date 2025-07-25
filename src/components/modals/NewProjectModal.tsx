// src/components/modals/NewProjectModal.tsx
import React, { useState } from "react";
import ReactDOM from "react-dom"; // For React Portals
import { toast } from "react-toastify"; // For notifications
import { FiPlus, FiX } from "react-icons/fi"; // Icons
import { useMapSearch } from "../../context/MapSearchContext"; // FIX: Import useMapSearch

// Define props interface for this modal
interface NewProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NewProjectModal({ isOpen, onClose }: NewProjectModalProps) {
  // FIX: Get createProject and loadingProjects from useMapSearch
  const { createProject, loadingProjects } = useMapSearch();

  const [projectName, setProjectName] = useState("");
  const [description, setDescription] = useState("");
  // FIX: Use specific types for type (if you have them, e.g. "village" | "trekking")
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
      // FIX: Use createProject function from MapSearchContext
      // This handles the Firestore call (addDoc), user ID, and auto-selecting the new project
      const newProjectId = await createProject(projectName.trim());
      
      // Optionally, if you want to also save description and type:
      // Note: your createProject function in MapSearchContext currently only takes projectName.
      // If you want to save description/type, you'd need to expand createProject in MapSearchContext.
      // For now, let's stick to projectName for simplicity as per createProject's current signature.
      
      toast.success(`Project "${projectName.trim()}" created!`);
      // Clear form fields
      setProjectName("");
      setDescription("");
      setType("village");
      onClose(); // Close the modal
    } catch (err: any) {
      console.error("Error creating project:", err);
      setError(err.message || "Failed to create project.");
      toast.error(err.message || "Failed to create project.");
    } finally {
      setIsCreating(false); // End local loading
    }
  };

  // If modal is not open, render null
  if (!isOpen) return null;

  // Render modal using React Portal
  return ReactDOM.createPortal(
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1050] p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 mx-auto my-8 max-h-[95vh] overflow-auto">
        <div className="flex justify-between items-center pb-3 mb-4 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800">Create New Project</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-full p-1 transition-colors"
            aria-label="Close"
          >
            <FiX size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <p className="text-red-600 text-sm mb-2">{error}</p>}

          {/* Project Name */}
          <div>
            <label htmlFor="projectName" className="block text-sm font-medium text-gray-700 mb-1">Project Name</label>
            <input
              id="projectName"
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="input-field" // Reusing input-field class
              required
              disabled={isCreating}
              placeholder="e.g., My New Project"
            />
          </div>
          
          {/* Description (Optional) - If you update createProject function to accept it */}
          {/*
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input-field min-h-[80px]"
              disabled={isCreating}
              placeholder="A brief description of this project"
            />
          </div>
          */}

          {/* Type - If you update createProject function to accept it */}
          {/*
          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select
              id="type"
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="input-field appearance-none bg-white pr-10" // Reusing select styling
              disabled={isCreating}
            >
              <option value="village">Village</option>
              <option value="trekking">Trekking</option>
              <option value="other">Other</option>
            </select>
             <FiChevronDown size={20} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" aria-hidden="true"/>
          </div>
          */}

          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
              disabled={isCreating}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`px-5 py-2 rounded-md text-white font-semibold flex items-center gap-1 transition-colors ${
                isCreating ? 'bg-blue-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
              }`}
              disabled={isCreating}
            >
              {isCreating ? (
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <><FiPlus size={16} /> Create</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}