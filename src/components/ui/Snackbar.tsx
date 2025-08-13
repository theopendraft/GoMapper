// src/components/ui/Snackbar.tsx
import React, { useEffect } from "react";
import {
  FiX,
  FiCheckCircle,
  FiAlertCircle,
  FiInfo,
  FiAlertTriangle,
} from "react-icons/fi";

export type SnackbarSeverity = "success" | "error" | "info" | "warning";

export interface SnackbarProps {
  message: string;
  open: boolean;
  onClose: () => void;
  autoHideDuration?: number;
  severity?: SnackbarSeverity;
}

const icons: Record<SnackbarSeverity, React.ReactNode> = {
  success: <FiCheckCircle size={20} />,
  error: <FiAlertCircle size={20} />,
  info: <FiInfo size={20} />,
  warning: <FiAlertTriangle size={20} />,
};

const Snackbar: React.FC<SnackbarProps> = ({
  message,
  open,
  onClose,
  autoHideDuration = 5000,
  severity = "info",
}) => {
  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => {
        onClose();
      }, autoHideDuration);
      return () => clearTimeout(timer);
    }
  }, [open, autoHideDuration, onClose]);

  const baseClasses =
    "fixed bottom-5 left-1/2 -translate-x-1/2 flex items-center justify-between py-3 px-4 rounded-md shadow-lg text-white transition-all duration-300 ease-in-out z-[99999] min-w-[300px] max-w-[90vw]";

  const severityClasses: Record<SnackbarSeverity, string> = {
    success: "bg-green-600",
    error: "bg-red-600",
    info: "bg-gray-800",
    warning: "bg-yellow-500",
  };

  const transformClasses = open
    ? "translate-y-0 opacity-100"
    : "translate-y-full opacity-0";

  if (!message) return null;

  return (
    <div
      className={`${baseClasses} ${severityClasses[severity]} ${transformClasses}`}
      role="alert"
    >
      <div className="flex items-center gap-3">
        {icons[severity]}
        <span>{message}</span>
      </div>
      <button
        onClick={onClose}
        className="ml-4 p-1 rounded-full hover:bg-black/20"
        aria-label="Close"
      >
        <FiX size={18} />
      </button>
    </div>
  );
};

export default Snackbar;
