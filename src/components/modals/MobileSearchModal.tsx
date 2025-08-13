// src/components/modals/MobileSearchModal.tsx
import React, { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import GlobalSearch from "../ui/GlobalSearch";

interface MobileSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const MobileSearchModal: React.FC<MobileSearchModalProps> = ({
  isOpen,
  onClose,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  // Close modal on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Close modal on 'Escape' key press
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => {
      window.removeEventListener("keydown", handleEsc);
    };
  }, [onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[1050] flex items-start justify-center bg-black/50 p-4 pt-20"
        >
          <motion.div
            ref={modalRef}
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -50, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="relative w-full max-w-md"
          >
            <GlobalSearch onResultSelect={onClose} />
            <button
              onClick={onClose}
              className="absolute -top-10 -right-2 flex h-6 w-6 mt-2 mr-2 items-center justify-center rounded-full bg-white text-gray-600 shadow-lg transition-colors hover:bg-gray-100 hover:text-gray-900"
              aria-label="Close search"
            >
              <X size={20} />
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default MobileSearchModal;
