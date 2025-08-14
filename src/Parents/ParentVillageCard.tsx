import React, { useState } from "react";
import { Village } from "../types/village";
import ContactsListModal from "../components/modals/ContactsListModal";
import { FiUsers } from "react-icons/fi";

type Props = {
  village: Village;
  onUpdate: (v: Village) => void;
};

export default function ParentVillageCard({ village, onUpdate }: Props) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const parentCount = village.parents?.length || 0;

  return (
    <>
      <div
        className="bg-white border border-gray-200 shadow-sm rounded-xl p-5 space-y-4 cursor-pointer hover:shadow-lg hover:border-blue-500 transition-all duration-300"
        onClick={() => setIsModalOpen(true)}
      >
        <div className="flex justify-between items-start">
          <h2 className="text-lg font-bold text-gray-800">{village.name}</h2>
          <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
            <FiUsers />
            <span>
              {parentCount} {parentCount === 1 ? "Contact" : "Contacts"}
            </span>
          </div>
        </div>
        <div className="text-sm text-gray-600">
          <p>
            Tehsil:{" "}
            <span className="font-medium">{village.tehsil || "N/A"}</span>
          </p>
          <p>
            Population:{" "}
            <span className="font-medium">{village.population || "N/A"}</span>
          </p>
        </div>
        <div className="mt-4 pt-4 border-t border-gray-200 text-right">
          <button
            onClick={(e) => {
              e.stopPropagation(); // Prevent card click from triggering
              setIsModalOpen(true);
            }}
            className="text-blue-600 hover:underline text-sm font-semibold"
          >
            View Contacts
          </button>
        </div>
      </div>

      {isModalOpen && (
        <ContactsListModal
          village={village}
          onUpdate={onUpdate}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </>
  );
}
