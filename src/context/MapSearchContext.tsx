// src/context/MapSearchContext.tsx

import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode, Dispatch, SetStateAction } from 'react';
import { onSnapshot, doc, setDoc, addDoc } from 'firebase/firestore'; // Removed query, where as they're not directly used here
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

  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [isMapSearchControlVisible, setIsMapSearchControlVisible] = useState(false);
  const [locationFoundForModalDisplay, setLocationFoundForModalDisplay] = useState<{ lat: number; lng: number; address: string } | null>(null);

  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [userProjects, setUserProjects] = useState<Project[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);

  // FIX: Removed currentProjectId from dependency array
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

        // Auto-select the first project if the user has projects and NO project is currently selected,
        // OR if the currently selected project is no longer in the list (e.g., deleted).
        // This logic needs to be careful not to re-trigger the effect unnecessarily.
        if (projects.length > 0) {
          // Check if currentProjectId is valid within the new list of projects
          const isCurrentProjectStillValid = currentProjectId && projects.some(p => p.id === currentProjectId);
          if (!isCurrentProjectStillValid) {
            // If current project ID is not valid or not set, select the first one
            setCurrentProjectId(projects[0].id);
          }
        } else {
          // If no projects, ensure currentProjectId is null
          if (currentProjectId !== null) { // Prevent unnecessary state update
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
      if (currentProjectId !== null) { // Prevent unnecessary state update
        setCurrentProjectId(null);
      }
      setLoadingProjects(false);
    }
  }, [currentUser]); // <-- FIX: Only depend on currentUser

  const handleClearLocationFound = useCallback(() => {
    setLocationFoundForModalDisplay(null);
  }, []);

  const triggerMapSearchControlVisibility = useCallback((isVisible: boolean) => {
    setIsMapSearchControlVisible(isVisible);
  }, []);

  const requestSearchModalClose = useCallback(() => {
      setIsSearchModalOpen(false);
      setLocationFoundForModalDisplay(null);
  }, []);

  const handleLocationSelectedFromMapSearchAndCloseModal = useCallback((location: { lat: number; lng: number; address: string }) => {
    setIsSearchModalOpen(false);
    setLocationFoundForModalDisplay(null);
  }, []);

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
    // setCurrentProjectId(newProjectRef.id); // The onSnapshot listener will handle auto-selection
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