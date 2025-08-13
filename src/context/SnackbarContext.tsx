// src/context/SnackbarContext.tsx
import React, {
  createContext,
  useState,
  useContext,
  useCallback,
  ReactNode,
} from "react";
import Snackbar, { SnackbarProps } from "../components/ui/Snackbar";

// The props that can be passed to the showSnackbar function
type SnackbarOptions = Omit<SnackbarProps, "onClose" | "open">;

// The props that are stored in the context's state
type SnackbarState = Omit<SnackbarProps, "open">;

interface SnackbarContextType {
  showSnackbar: (options: SnackbarOptions) => void;
}

const SnackbarContext = createContext<SnackbarContextType | undefined>(
  undefined
);

export const SnackbarProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [snackbar, setSnackbar] = useState<SnackbarState | null>(null);

  const showSnackbar = useCallback((options: SnackbarOptions) => {
    // When a new snackbar is shown, we create its full state including the onClose handler
    setSnackbar({ ...options, onClose: () => setSnackbar(null) });
  }, []);

  const handleClose = () => {
    setSnackbar(null);
  };

  return (
    <SnackbarContext.Provider value={{ showSnackbar }}>
      {children}
      {snackbar && (
        <Snackbar
          open={true} // When snackbar state is not null, it should be open
          message={snackbar.message}
          severity={snackbar.severity}
          onClose={handleClose}
          autoHideDuration={snackbar.autoHideDuration}
        />
      )}
    </SnackbarContext.Provider>
  );
};

export const useSnackbar = () => {
  const context = useContext(SnackbarContext);
  if (context === undefined) {
    throw new Error("useSnackbar must be used within a SnackbarProvider");
  }
  return context;
};
