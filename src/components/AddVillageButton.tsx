// src/components/AddVillageButton.tsx
import React from 'react';
import { FiPlus } from "react-icons/fi";

interface Props {
  onClick: () => void;
}

const AddVillageButton: React.FC<Props> = ({ onClick }) => {
  return (
    <button
      className="fixed bottom-6 right-6 z-[1000] flex items-center bg-green-600 text-white rounded-full shadow-lg px-4 py-4 transition-all duration-300 group hover:pr-8 hover:rounded-2"
      onClick={onClick}
      style={{ minWidth: 56, minHeight: 56 }}
      aria-label="Add New Village"
    >
      <span className="flex items-center justify-center w-6 h-6 text-2xl transition-all duration-300">
        <FiPlus />
      </span>
      <span className="overflow-hidden max-w-0 group-hover:max-w-xs group-hover:ml-3 transition-all duration-300 whitespace-nowrap">
        Add New Village
      </span>
    </button>
  );
};

export default AddVillageButton;
