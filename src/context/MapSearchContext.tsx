// src/context/MapSearchContext.tsx

import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode, Dispatch, SetStateAction } from 'react';
import { onSnapshot, doc, setDoc, addDoc } from 'firebase/firestore';
import { getUserProjectsCollection } from '../services/firebase';
import { AuthContextProps, useAuth } from './AuthContext';
import { Project } from '../types/project';
import { User } from 'firebase/auth';

interface MapSearchContextType {
  isSearchModalOpen: boolean;
  setIsSearchModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isMapSearchControlVisible: boolean;
  setIsMapSearchControlVisible: React.Dispatch<React.SetStateAction<boolean>>;
  locationFoundForModalDisplay: { lat: number; lng: number; address: string } | null;
  setLocationFoundForModalDisplay: React.Dispatch<React.SetStateAction<{ lat: number; lng: number; address: string } | null>>;
  handleClearLocationFound: () => void;
  triggerMapSearchControlVisibility: (isVisible: boolean) => void;
  requestSearchModalClose: () => void;
  openSearchModal: () => void; // Added to interface for type safety

  currentUser: User | null;
  currentProjectId: string | null;
  setCurrentProjectId: Dispatch<SetStateAction<string | null>>;
  userProjects: Project[];
  loadingProjects: boolean;
  createProject: (projectName: string) => Promise<string>;
  handleLocationSelectedFromMapSearchAndCloseModal: (location: { lat: number; lng: number; address: string }) => void;
}

const MapSearchContext = createContext<MapSearchContextType | undefined>(undefined);

export const useMapSearch = () => {
  const context = useContext(MapSearchContext);
  if (context === undefined) {
    throw new Error('useMapSearch must be used within a MapSearchProvider');
  }
  return context;
};

export const MapSearchProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user: currentUser, loading: authLoading } = useAuth() as AuthContextProps;

  // State declarations for the context provider
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [isMapSearchControlVisible, setIsMapSearchControlVisible] = useState(false);
  const [locationFoundForModalDisplay, setLocationFoundForModalDisplay] = useState<{ lat: number; lng: number; address: string } | null>(null);

  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [userProjects, setUserProjects] = useState<Project[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);

  // FIX: Move openSearchModal inside the component, after state declarations
  const openSearchModal = useCallback(() => {
    setIsSearchModalOpen(true);
    setLocationFoundForModalDisplay(null); // Clear previous messages
  }, [setIsSearchModalOpen, setLocationFoundForModalDisplay]); // Dependencies are now in scope

  // Effect to fetch user's projects when currentUser changes
  useEffect(() => {
    if (currentUser && currentUser.uid) {
      setLoadingProjects(true);
      const unsubscribe = onSnapshot(getUserProjectsCollection(currentUser.uid), (snapshot) => {
        const projects = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Project[];
        setUserProjects(projects);
        setLoadingProjects(false);

        if (projects.length > 0) {
          const isCurrentProjectStillValid = currentProjectId && projects.some(p => p.id === currentProjectId);
          if (!isCurrentProjectStillValid) {
            setCurrentProjectId(projects[0].id);
          }
        } else {
          if (currentProjectId !== null) {
             setCurrentProjectId(null);
          }
        }
      }, (error) => {
        console.error("Error fetching user projects:", error);
        setLoadingProjects(false);
      });
      return () => unsubscribe();
    } else {
      setUserProjects([]);
      if (currentProjectId !== null) {
        setCurrentProjectId(null);
      }
      setLoadingProjects(false);
    }
  }, [currentUser, currentProjectId]); // currentProjectId is still a dependency because its value affects auto-selection logic within this effect

  const handleClearLocationFound = useCallback(() => {
    setLocationFoundForModalDisplay(null);
  }, []);

  const triggerMapSearchControlVisibility = useCallback((isVisible: boolean) => {
    setIsMapSearchControlVisible(isVisible);
  }, []);

  const requestSearchModalClose = useCallback(() => {
      setIsSearchModalOpen(false);
      setLocationFoundForModalDisplay(null);
  }, [setIsSearchModalOpen, setLocationFoundForModalDisplay]); // Add dependencies

  const handleLocationSelectedFromMapSearchAndCloseModal = useCallback((location: { lat: number; lng: number; address: string }) => {
    setIsSearchModalOpen(false);
    setLocationFoundForModalDisplay(null);
  }, [setIsSearchModalOpen, setLocationFoundForModalDisplay]); // Add dependencies

  const createProject = useCallback(async (projectName: string): Promise<string> => {
    if (!currentUser || !currentUser.uid) {
      throw new Error("User not authenticated to create a project.");
    }
    const projectsCollection = getUserProjectsCollection(currentUser.uid);
    const newProjectRef = await addDoc(projectsCollection, {
      name: projectName,
      ownerId: currentUser.uid,
      createdAt: Date.now(),
    });
    return newProjectRef.id;
  }, [currentUser]);

  const value: MapSearchContextType = {
    isSearchModalOpen,
    setIsSearchModalOpen,
    isMapSearchControlVisible,
    setIsMapSearchControlVisible,
    locationFoundForModalDisplay,
    setLocationFoundForModalDisplay,
    handleClearLocationFound,
    triggerMapSearchControlVisibility,
    requestSearchModalClose,
    openSearchModal, // Now correctly in scope
    currentUser,
    currentProjectId,
    setCurrentProjectId,
    userProjects,
    loadingProjects,
    createProject,
    handleLocationSelectedFromMapSearchAndCloseModal,
  };

  if (authLoading || loadingProjects) {
    return (
      <div className="flex justify-center items-center h-screen w-screen text-lg text-gray-700">
        Loading application data...
      </div>
    );
  }

  return (
    <MapSearchContext.Provider value={value}>
      {children}
    </MapSearchContext.Provider>
  );
};