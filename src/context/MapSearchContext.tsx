// src/context/MapSearchContext.tsx
import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface MapSearchContextType {
  isSearchModalOpen: boolean;
  setIsSearchModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isMapSearchControlVisible: boolean;
  setIsMapSearchControlVisible: React.Dispatch<React.SetStateAction<boolean>>;
  locationFoundForModalDisplay: { lat: number; lng: number; address: string } | null;
  setLocationFoundForModalDisplay: React.Dispatch<React.SetStateAction<{ lat: number; lng: number; address: string } | null>>;
  // Callbacks passed down to Map.tsx
  handleLocationSelectedFromMapSearchAndCloseModal: (location: { lat: number; lng: number; address: string }) => void;
  // Callbacks passed down to SearchModal.tsx
  handleClearLocationFound: () => void;
  // Callback to signal Map.tsx to show search control (used by SearchModal's "Start Search" button)
  triggerMapSearchControlVisibility: (isVisible: boolean) => void;
  requestSearchModalClose: () => void; // New method for Map to call
}

const MapSearchContext = createContext<MapSearchContextType | undefined>(undefined);

export const MapSearchProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [isMapSearchControlVisible, setIsMapSearchControlVisible] = useState(false);
  const [locationFoundForModalDisplay, setLocationFoundForModalDisplay] = useState<{ lat: number; lng: number; address: string } | null>(null);

  // This will be passed to MapPage to ensure location selection closes the modal
  const handleLocationSelectedFromMapSearchAndCloseModal = useCallback((location: { lat: number; lng: number; address: string }) => {
    // This location is now ready to be added as a new village in Map.tsx
    console.log("Location selected from map search (in MapSearchProvider):", location);
    setIsSearchModalOpen(false); // Close the search modal
    setLocationFoundForModalDisplay(null); // Clear any found location message
  }, []);

  // Callback to signal Map.tsx to show search control (used by SearchModal's "Start Search" button)
  const triggerMapSearchControlVisibility = useCallback((isVisible: boolean) => {
    setIsMapSearchControlVisible(isVisible);
  }, []);

  // Callback to clear the found location message in the modal directly
  const handleClearLocationFound = useCallback(() => {
    setLocationFoundForModalDisplay(null);
  }, []);

    // NEW: Function for Map to call to close the search modal
  const requestSearchModalClose = useCallback(() => {
      setIsSearchModalOpen(false);
      setLocationFoundForModalDisplay(null); // Clear message in modal
  }, []);


  const value = {
    isSearchModalOpen,
    setIsSearchModalOpen,
    isMapSearchControlVisible,
    setIsMapSearchControlVisible,
    locationFoundForModalDisplay,
    setLocationFoundForModalDisplay,
    handleLocationSelectedFromMapSearchAndCloseModal,
    handleClearLocationFound,
    triggerMapSearchControlVisibility,
    requestSearchModalClose,
  };

  return <MapSearchContext.Provider value={value}>{children}</MapSearchContext.Provider>;
};

export const useMapSearch = () => {
  const context = useContext(MapSearchContext);
  if (context === undefined) {
    throw new Error('useMapSearch must be used within a MapSearchProvider');
  }
  return context;
};