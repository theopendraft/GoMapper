import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { db, doc,setDoc, collection } from "../../services/firebase"; // Added collection import
import { useProject } from "../Layout";


export default function NewProjectModal({ isOpen, onClose }) {
  const [projectName, setProjectName] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("village");
  const { user } = useAuth();
  const { setCurrentProject } = useProject();


const handleSubmit = async (e) => {
  e.preventDefault();
  if (!user || !projectName) return;

  const projectId = doc(collection(db, "projects")).id;
  const projectData = {
    id: projectId,
    name: projectName,
    createdBy: user.uid,
    createdAt: new Date().toISOString(),
    description: description || "",
    type: type || "village",
  };

  try {
    await setDoc(doc(db, "projects", projectId), projectData); // ✅ create the document
    setCurrentProject(projectData);
    setProjectName("");
    setDescription("");
    setType("village");
    onClose();
  } catch (error) {
    console.error("Error creating project:", error);
  }
  };
console.log("User:", user); // should not be null

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1050]">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Create New Project</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Project Name</label>
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Description (Optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="village">Village</option>
              <option value="trekking">Trekking</option>
            </select>
          </div>
          <div className="flex gap-3">
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200"
            >
              Create
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-100"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}