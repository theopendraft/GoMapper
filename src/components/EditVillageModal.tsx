import React, { useState, useEffect, useRef } from "react";
import ReactDOM from "react-dom";
import { Village, Parent } from "./Map";
import { doc, setDoc } from "firebase/firestore";
import { db } from "../lib/firebase"; // adjust path if needed

function isValidPhoneNumber(phone: string) {
  const phoneDigits = phone.replace(/\D/g, "");
  return phoneDigits.length >= 7 && phoneDigits.length <= 15;
}

export function EditVillageModal({
  village,
  onClose,
  onSave,
}: {
  village: Village;
  onClose: () => void;
  onSave: (updatedVillage: Village) => void;
}) {
  const [villageName, setVillageName] = useState(village.name);
  const [status, setStatus] = useState(village.status);
  const [notes, setNotes] = useState(village.notes || "");
  const [lastInteraction, setLastInteraction] = useState(village.lastInteraction || "");
  const [nextVisitTarget, setNextVisitTarget] = useState(village.nextVisitTarget || "");
  const [parents, setParents] = useState<Parent[]>(village.parents || []);
  const [touched, setTouched] = useState<{ [key: string]: boolean }>({});

  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.body.classList.add("modal-open");
    return () => document.body.classList.remove("modal-open");
  }, []);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  const onOverlayClick = (e: React.MouseEvent) => {
    if (e.target === modalRef.current) onClose();
  };

  // Validation checks
  const validateVillageName = () => villageName.trim().length > 0;
  const validateStatus = () => status.trim().length > 0;

  const validateParentName = (name: string) => name.trim().length > 0;
  const validateParentContact = (contact: string) => {
    if (contact.trim().length === 0) return true; // allow empty contact
    return isValidPhoneNumber(contact);
  };

  const phoneRegex = /^[0-9]{10}$/;

  const isValidVillageName = villageName.trim().length > 0;
  const isValidStatus = !!status;
  const areParentsValid = parents.every(
    (p) =>
      (!p.name && !p.contact) || // both empty is fine
      (p.name.trim().length > 0 && (!p.contact || phoneRegex.test(p.contact)))
  );

  const parentErrors = parents.map((p) => {
    if (p.contact && !phoneRegex.test(p.contact)) {
      return "Invalid phone number";
    }
    if (p.contact && !p.name.trim()) {
      return "Name required if contact is filled";
    }
    return "";
  });

  // Overall form validity
  const canSave =
    isValidVillageName &&
    isValidStatus &&
    areParentsValid;

  const markTouched = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const handleParentChange = (index: number, field: keyof Parent, value: string) => {
    const updatedParents = [...parents];
    updatedParents[index] = { ...updatedParents[index], [field]: value };
    setParents(updatedParents);
  };

  const handleAddParent = () => {
    setParents([...parents, { name: "", contact: "" }]);
  };

  const handleRemoveParent = (index: number) => {
    setParents(parents.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ villageName: true, status: true });

    if (!canSave) return;

    const filteredParents = parents.filter(
      (p) => p.name.trim() !== "" || p.contact.trim() !== ""
    );

    await setDoc(doc(db, "villages", village.id.toString()), {
      ...village,
      name: villageName.trim(),
      status,
      notes,
      lastInteraction,
      nextVisitTarget,
      parents: filteredParents,
    });
    onClose();
  };

  return ReactDOM.createPortal(
    <div
      ref={modalRef}
      onClick={onOverlayClick}
      className="fixed inset-0 bg-black bg-opacity-50 z-[99999] flex items-center justify-center"
      aria-modal="true"
      role="dialog"
      aria-labelledby="modal-title"
    >
      <div
        className="bg-white rounded-lg shadow-lg w-full max-w-md sm:max-w-lg md:max-w-xl lg:max-w-2xl xl:max-w-3xl p-4 sm:p-6 mx-2 max-h-[90vh] overflow-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="modal-title" className="text-xl font-semibold mb-4">
          Edit Village
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Village Name */}
          <div>
            <label htmlFor="village-name" className="block font-medium mb-1">
              Village Name<span className="text-red-600">*</span>
            </label>
            <input
              id="village-name"
              type="text"
              value={villageName}
              onChange={(e) => setVillageName(e.target.value)}
              onBlur={() => markTouched("villageName")}
              className={`border rounded w-full p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                touched.villageName && !validateVillageName() ? "border-red-600" : "border-gray-300"
              }`}
              autoComplete="address-level2"
              required
            />
            {touched.villageName && !validateVillageName() && (
              <p className="text-red-600 text-sm mt-1">Village name is required.</p>
            )}
          </div>

          {/* Status */}
          <div>
            <label htmlFor="status" className="block font-medium mb-1">
              Status<span className="text-red-600">*</span>
            </label>
            <select
              id="status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              onBlur={() => markTouched("status")}
              className={`border rounded w-full p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                touched.status && !validateStatus() ? "border-red-600" : "border-gray-300"
              }`}
              required
            >
              <option value="">Select status</option>
              <option value="visited">Visited</option>
              <option value="planned">Planned</option>
              <option value="not-visited">Not Visited</option>
            </select>
            {touched.status && !validateStatus() && (
              <p className="text-red-600 text-sm mt-1">Status is required.</p>
            )}
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="notes" className="block font-medium mb-1">
              Notes
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="border rounded w-full p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 border-gray-300"
              rows={3}
            />
          </div>

          {/* Last Interaction */}
          <div>
            <label htmlFor="lastInteraction" className="block font-medium mb-1">
              Last Interaction
            </label>
            <input
              type="date"
              id="lastInteraction"
              value={lastInteraction}
              onChange={(e) => setLastInteraction(e.target.value)}
              className="border rounded w-full p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 border-gray-300"
            />
          </div>

          {/* Next Visit Target */}
          <div>
            <label htmlFor="nextVisitTarget" className="block font-medium mb-1">
              Next Visit Target
            </label>
            <input
              type="date"
              id="nextVisitTarget"
              value={nextVisitTarget}
              onChange={(e) => setNextVisitTarget(e.target.value)}
              className="border rounded w-full p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 border-gray-300"
            />
          </div>

          {/* Parents Section */}
          <div>
            <h3 className="text-lg font-semibold mb-2">Parent Contacts</h3>
            {parents.map((parent, index) => (
              <div
                key={index}
                className="flex flex-col md:flex-row gap-2 md:gap-4 items-stretch mb-3"
              >
                <div className="flex-1">
                  <label
                    htmlFor={`parent-name-${index}`}
                    className="block text-sm font-medium mb-1"
                  >
                    Name
                  </label>
                  <input
                    id={`parent-name-${index}`}
                    type="text"
                    value={parent.name}
                    onChange={(e) => handleParentChange(index, "name", e.target.value)}
                    onBlur={() => markTouched(`parentName${index}`)}
                    className={`border rounded w-full p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 border-gray-300 ${
                      touched[`parentName${index}`] && !validateParentName(parent.name)
                        ? "border-red-600"
                        : ""
                    }`}
                    placeholder="Enter parent name"
                  />
                  {touched[`parentName${index}`] && !validateParentName(parent.name) && (
                    <p className="text-red-600 text-sm mt-1">Parent name is required.</p>
                  )}
                </div>
                <div className="flex-1">
                  <label
                    htmlFor={`parent-contact-${index}`}
                    className="block text-sm font-medium mb-1"
                  >
                    Contact
                  </label>
                  <input
                    id={`parent-contact-${index}`}
                    type="text"
                    value={parent.contact}
                    onChange={(e) => handleParentChange(index, "contact", e.target.value)}
                    onBlur={() => markTouched(`parentContact${index}`)}
                    className={`border rounded w-full p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 border-gray-300 ${
                      touched[`parentContact${index}`] &&
                      !validateParentContact(parent.contact)
                        ? "border-red-600"
                        : ""
                    }`}
                    placeholder="Enter valid contact number"
                  />
                  {touched[`parentContact${index}`] && !validateParentContact(parent.contact) && (
                    <p className="text-red-600 text-sm mt-1">
                      Invalid phone number format.
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveParent(index)}
                  className="self-end px-3 py-1 text-red-600 hover:text-red-800"
                  aria-label={`Remove parent ${index + 1}`}
                >
                  &times;
                </button>
                {parentErrors[index] && (
                  <span className="text-xs text-red-600">{parentErrors[index]}</span>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={handleAddParent}
              className="px-4 py-2 mt-2 text-sm bg-green-600 text-white rounded hover:bg-green-700"
            >
              + Add Parent
            </button>
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-2 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!canSave}
              className={`px-4 py-2 rounded text-white ${
                canSave ? "bg-blue-600 hover:bg-blue-700" : "bg-blue-300 cursor-not-allowed"
              }`}
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
