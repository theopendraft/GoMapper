// src/components/modals/EditVillageModal.tsx
import React, { useState, useEffect, useRef } from "react";
import ReactDOM from "react-dom";
import { Parent, ExtendedParent } from "../../types/parent";
import { Village, VillageStatus } from "../../types/village";
import { doc, setDoc } from "firebase/firestore";
import { db, getProjectPinsCollection } from "../../services/firebase";
import { toast } from 'react-toastify';
import { FiPlus, FiMinus, FiSave, FiX, FiChevronDown, FiChevronUp } from 'react-icons/fi'; // Import new icons

interface EditVillageModalProps {
  village: Village;
  onClose: () => void;
  onSave: (updatedVillage: Village) => void;
  currentUserUid: string | null;
  currentProjectId: string | null;
}

// Helper function for phone number validation
function isValidPhoneNumber(phone: string): boolean {
  const phoneDigits = phone.replace(/\D/g, "");
  // Allow empty string or numbers between 7 and 15 digits
  return phoneDigits.length === 0 || (phoneDigits.length >= 7 && phoneDigits.length <= 15);
}

export function EditVillageModal({
  village,
  onClose,
  onSave,
  currentUserUid,
  currentProjectId,
}: EditVillageModalProps) {
  // State variables for form fields
  const [villageName, setVillageName] = useState(village.name);
  const [status, setStatus] = useState<VillageStatus>(village.status);
  const [notes, setNotes] = useState(village.notes || "");
  const [lastVisit, setLastVisit] = useState(village.lastVisit || "");
  const [nextVisitTarget, setNextVisitTarget] = useState(village.nextVisitTarget || "");
  const [parents, setParents] = useState<ExtendedParent[]>(village.parents || []);
  const [tehsil, setTehsil] = useState(village.tehsil || "");
  const [population, setPopulation] = useState<number | ''>(village.population ?? '');

  // State to manage the visibility of additional details
  const [showAdditionalDetails, setShowAdditionalDetails] = useState(false);

  // State to track which fields have been blurred (for validation feedback)
  const [touched, setTouched] = useState<{ [key: string]: boolean }>({});

  const modalRef = useRef<HTMLDivElement>(null);

  // Effect to manage body overflow when modal is open
  useEffect(() => {
    document.body.classList.add("overflow-hidden");
    return () => document.body.classList.remove("overflow-hidden");
  }, []);

  // Effect to handle Escape key press for closing modal
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  // Handle clicks outside the modal content to close it
  const onOverlayClick = (e: React.MouseEvent) => {
    if (e.target === modalRef.current) onClose();
  };

  // Validation functions
  const validateVillageName = () => villageName.trim().length > 0;
  const validateStatus = () => status.trim().length > 0;

  const phoneRegex = /^[0-9]{7,15}$/; // Regex for 7 to 15 digits

  // Overall form validity checks
  const isValidVillageName = validateVillageName();
  const isValidStatus = validateStatus();
  const areParentsValid = parents.every((p) => {
    // Parent is valid if:
    // 1. Both name and contact are empty (representing an optional, empty parent entry)
    // 2. OR Name is not empty AND contact is either empty OR a valid phone number format.
    return (
      (!p.name.trim() && !p.contact.trim()) ||
      (p.name.trim().length > 0 && (!p.contact.trim() || phoneRegex.test(p.contact.trim())))
    );
  });

  // Determine if the "Save" button should be enabled
  const canSave = isValidVillageName && isValidStatus && areParentsValid;

  // Mark a field as touched for validation feedback
  const markTouched = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  // Handle changes to parent contact input fields
  const handleParentChange = (
    index: number,
    field: keyof Parent,
    value: string
  ) => {
    const updatedParents = [...parents];
    updatedParents[index] = { ...updatedParents[index], [field]: value };
    setParents(updatedParents);
  };

  // Add a new empty parent contact row
  const handleAddParent = () => {
    setParents([...parents, { name: "", contact: "" }]);
  };

  // Remove a parent contact row
  const handleRemoveParent = (index: number) => {
    setParents(parents.filter((_, i) => i !== index));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Mark all required fields as touched on submit
    setTouched({ villageName: true, status: true });

    if (!canSave) {
      toast.error("Please fill in all required fields and correct any errors.");
      return;
    }

    // Filter out completely empty parent entries before saving to Firestore
    const filteredParents = parents.filter(
      (p) => p.name.trim() !== "" || p.contact.trim() !== ""
    );

    // Construct the updated Village object
    const updatedVillage: Village = {
      ...village, // Spread existing village properties (id, projectId, coords etc.)
      name: villageName.trim(),
      status: status,
      notes: notes || undefined, // Use `undefined` for Firestore to omit field if empty
      lastVisit: lastVisit || undefined,
      nextVisitTarget: nextVisitTarget || undefined,
      tehsil: tehsil || undefined,
      population: population === '' ? undefined : population,
      parents: filteredParents,
    };

    // Prepare data for Firestore: remove any properties that are explicitly `undefined`
    // Firestore does not allow `undefined` values.
    const finalVillageData: { [key: string]: any } = {};
    for (const key in updatedVillage) {
        if (Object.prototype.hasOwnProperty.call(updatedVillage, key)) {
            const value = updatedVillage[key as keyof Village];
            if (value !== undefined) {
                finalVillageData[key] = value;
            }
        }
    }

    // Check for user authentication and project selection before saving
    if (!currentUserUid || !currentProjectId) {
        toast.error("User not authenticated or project not selected. Cannot save pin.");
        return;
    }

    try {
        const pinDocRef = doc(getProjectPinsCollection(currentUserUid, currentProjectId), village.id.toString());
        await setDoc(pinDocRef, finalVillageData);
        onSave(updatedVillage);
        onClose();
        toast.success("Pin details updated successfully!");
    } catch (err: any) {
        console.error("Failed to save pin details:",);
   
    }
  };

  // Render the modal using a React Portal
  return ReactDOM.createPortal(
    <div
      ref={modalRef}
      onClick={onOverlayClick}
      className="fixed inset-0 bg-black bg-opacity-50  backdrop-blur-sm z-[99999] flex items-center justify-center p-4 overflow-y-auto"
      aria-modal="true"
      role="dialog"
      aria-labelledby="modal-title"
    >
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-md sm:max-w-lg md:max-w-xl lg:max-w-2xl p-6 mx-auto my-8 max-h-[95vh] overflow-y-auto transform transition-all duration-300 ease-out sm:scale-100 opacity-100 border border-gray-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center pb-4 mb-4 border-b border-gray-200">
          <h2
            id="modal-title"
            className="text-2xl font-extrabold text-gray-800"
          >
            Edit Pin Details
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-full p-2 transition-colors duration-200"
            aria-label="Close"
          >
            <FiX size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Pin Name */}
          <div>
            <label
              htmlFor="village-name"
              className="block text-sm font-semibold text-gray-700 mb-1"
            >
              Pin Name<span className="text-red-600">*</span>
            </label>
            <input
              id="village-name"
              type="text"
              value={villageName}
              onChange={(e) => setVillageName(e.target.value)}
              onBlur={() => markTouched("villageName")}
              className={`block w-full px-3 py-2 border rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out sm:text-sm ${
                touched.villageName && !isValidVillageName
                  ? "border-red-500"
                  : "border-gray-300"
              }`}
              autoComplete="off"
              required
            />
            {touched.villageName && !isValidVillageName && (
              <p className="text-red-500 text-xs mt-1">Pin name is required.</p>
            )}
          </div>

          {/* Status Dropdown */}
          <div>
            <label
              htmlFor="status"
              className="block text-sm font-semibold text-gray-700 mb-1"
            >
              Status<span className="text-red-600">*</span>
            </label>
            <select
              id="status"
              value={status}
              onChange={(e) => setStatus(e.target.value as VillageStatus)}
              onBlur={() => markTouched("status")}
              className={`block w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out sm:text-sm ${
                touched.status && !isValidStatus
                  ? "border-red-500"
                  : "border-gray-300"
              }`}
              required
            >
              <option value="">Select status</option>
              <option value="visited">Visited</option>
              <option value="planned">Planned</option>
              <option value="not-visited">Not Visited</option>
            </select>
            {touched.status && !isValidStatus && (
              <p className="text-red-500 text-xs mt-1">Status is required.</p>
            )}
          </div>

          {/* Additional Details Toggle */}
          <div className="border-t border-gray-200 pt-4 mt-4">
            <button
              type="button"
              onClick={() => setShowAdditionalDetails(!showAdditionalDetails)}
              className="flex items-center justify-between w-full text-left py-2 px-3 bg-gray-50 rounded-lg text-blue-700 hover:bg-gray-100 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <span className="text-base font-semibold">
                Additional Details
              </span>
              {showAdditionalDetails ? (
                <FiChevronUp size={20} />
              ) : (
                <FiChevronDown size={20} />
              )}
            </button>

            {showAdditionalDetails && (
              <div className="mt-4 space-y-4 transition-all duration-300 ease-in-out">
                {/* Tehsil */}
                <div>
                  <label
                    htmlFor="tehsil"
                    className="block text-sm font-semibold text-gray-700 mb-1"
                  >
                    Tehsil
                  </label>
                  <input
                    id="tehsil"
                    type="text"
                    value={tehsil}
                    onChange={(e) => setTehsil(e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="e.g., Your Tehsil"
                  />
                </div>

                {/* Population */}
                <div>
                  <label
                    htmlFor="population"
                    className="block text-sm font-semibold text-gray-700 mb-1"
                  >
                    Population
                  </label>
                  <input
                    id="population"
                    type="number"
                    value={population}
                    onChange={(e) =>
                      setPopulation(Number(e.target.value) || "")
                    }
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="e.g., 5000"
                    min="0"
                  />
                </div>

                {/* Last Visit Date */}
                <div>
                  <label
                    htmlFor="lastVisit"
                    className="block text-sm font-semibold text-gray-700 mb-1"
                  >
                    Last Visit Date
                  </label>
                  <input
                    type="date"
                    id="lastVisit"
                    value={lastVisit}
                    onChange={(e) => setLastVisit(e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>

                {/* Next Visit Target Date */}
                <div>
                  <label
                    htmlFor="nextVisitTarget"
                    className="block text-sm font-semibold text-gray-700 mb-1"
                  >
                    Next Visit Target Date
                  </label>
                  <input
                    type="date"
                    id="nextVisitTarget"
                    value={nextVisitTarget}
                    onChange={(e) => setNextVisitTarget(e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>

                {/* Notes */}
                <div>
                  <label
                    htmlFor="notes"
                    className="block text-sm font-semibold text-gray-700 mb-1"
                  >
                    Notes
                  </label>
                  <textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    rows={3}
                    placeholder="Any additional notes about this pin..."
                  />
                </div>

                {/* Contacts Section */}
                <div>
                  <h3 className="text-base font-bold text-gray-800 mb-3">
                    Contacts
                  </h3>
                  {parents.map((parent, index) => (
                    <div
                      key={index}
                      className="flex flex-col md:flex-row gap-3 md:gap-5 items-end mb-4 p-4 border border-gray-200 rounded-lg bg-gray-50 shadow-sm"
                    >
                      <div className="flex-1 w-full">
                        <label
                          htmlFor={`parent-name-${index}`}
                          className="block text-xs font-medium text-gray-600 mb-1"
                        >
                          Name
                        </label>
                        <input
                          id={`parent-name-${index}`}
                          type="text"
                          value={parent.name}
                          onChange={(e) =>
                            handleParentChange(index, "name", e.target.value)
                          }
                          onBlur={() => markTouched(`parentName${index}`)}
                          className={`block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400 text-sm ${
                            touched[`parentName${index}`] &&
                            parent.name.trim().length === 0 &&
                            parent.contact.trim().length > 0
                              ? "border-red-500"
                              : "border-gray-300"
                          }`}
                          placeholder="Enter parent name"
                        />
                        {touched[`parentName${index}`] &&
                          parent.name.trim().length === 0 &&
                          parent.contact.trim().length > 0 && (
                            <p className="text-red-500 text-xs mt-1">
                              Name is required if contact is filled.
                            </p>
                          )}
                      </div>
                      <div className="flex-1 w-full">
                        <label
                          htmlFor={`parent-contact-${index}`}
                          className="block text-xs font-medium text-gray-600 mb-1"
                        >
                          Contact
                        </label>
                        <input
                          id={`parent-contact-${index}`}
                          type="text"
                          value={parent.contact}
                          onChange={(e) =>
                            handleParentChange(index, "contact", e.target.value)
                          }
                          onBlur={() => markTouched(`parentContact${index}`)}
                          className={`block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400 text-sm ${
                            touched[`parentContact${index}`] &&
                            !isValidPhoneNumber(parent.contact)
                              ? "border-red-500"
                              : "border-gray-300"
                          }`}
                          placeholder="Enter valid contact number"
                        />
                        {touched[`parentContact${index}`] &&
                          !isValidPhoneNumber(parent.contact) && (
                            <p className="text-red-500 text-xs mt-1">
                              Invalid phone number format (7-15 digits).
                            </p>
                          )}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveParent(index)}
                        className="p-2 text-red-600 hover:text-red-800 transition-colors self-center flex-shrink-0"
                        aria-label={`Remove parent ${index + 1}`}
                      >
                        <FiMinus size={20} />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={handleAddParent}
                    className="px-4 py-2 mt-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-2 transition-colors duration-200 shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <FiPlus size={16} /> Add Contact
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors duration-200 font-medium focus:outline-none focus:ring-2 focus:ring-gray-400 shadow-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!canSave}
              className={`px-6 py-2 rounded-lg text-white flex items-center gap-2 transition-colors duration-200 font-medium shadow-md ${
                canSave
                  ? "bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  : "bg-blue-300 cursor-not-allowed"
              }`}
            >
              <FiSave size={18} /> Save
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}