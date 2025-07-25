// src/context/MapSearchContext.tsx

import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode, Dispatch, SetStateAction } from 'react';
import { onSnapshot, doc, setDoc, addDoc, deleteDoc } from 'firebase/firestore'; // Import deleteDoc
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
  openSearchModal: () => void;

  currentUser: User | null;
  currentProjectId: string | null;
  setCurrentProjectId: Dispatch<SetStateAction<string | null>>;
  userProjects: Project[];
  loadingProjects: boolean;
  createProject: (projectName: string) => Promise<string>;
  // NEW: Update and Delete Project functions
  updateProject: (projectId: string, newName: string) => Promise<void>;
  deleteProject: (projectId: string) => Promise<void>;
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

  // Memoized callback for openSearchModal
  const openSearchModal = useCallback(() => {
    setIsSearchModalOpen(true);
    setLocationFoundForModalDisplay(null);
  }, [setIsSearchModalOpen, setLocationFoundForModalDisplay]);

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

        // Auto-select the first project if the user has projects and no project is currently selected,
        // OR if the currently selected project was deleted/no longer exists in the list.
        if (projects.length > 0) {
          const isCurrentProjectStillValid = currentProjectId && projects.some(p => p.id === currentProjectId);
          if (!isCurrentProjectStillValid) {
            setCurrentProjectId(projects[0].id);
          }
        } else {
          // If no projects, ensure currentProjectId is null
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
  }, [currentUser, currentProjectId]); // currentProjectId is a dependency because its value affects auto-selection logic within this effect

  const handleClearLocationFound = useCallback(() => {
    setLocationFoundForModalDisplay(null);
  }, []);

  const triggerMapSearchControlVisibility = useCallback((isVisible: boolean) => {
    setIsMapSearchControlVisible(isVisible);
  }, []);

  const requestSearchModalClose = useCallback(() => {
      setIsSearchModalOpen(false);
      setLocationFoundForModalDisplay(null);
  }, [setIsSearchModalOpen, setLocationFoundForModalDisplay]);

  const handleLocationSelectedFromMapSearchAndCloseModal = useCallback((location: { lat: number; lng: number; address: string }) => {
    setIsSearchModalOpen(false);
    setLocationFoundForModalDisplay(null);
  }, [setIsSearchModalOpen, setLocationFoundForModalDisplay]);

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

  // NEW: Update Project function
  const updateProject = useCallback(async (projectId: string, newName: string): Promise<void> => {
    if (!currentUser || !currentUser.uid) {
      throw new Error("User not authenticated to update a project.");
    }
    if (!projectId || !newName.trim()) {
      throw new Error("Project ID and new name are required.");
    }
    const projectDocRef = doc(getUserProjectsCollection(currentUser.uid), projectId);
    await setDoc(projectDocRef, { name: newName.trim() }, { merge: true }); // Only update name
  }, [currentUser]);

  // NEW: Delete Project function
  const deleteProject = useCallback(async (projectId: string): Promise<void> => {
    if (!currentUser || !currentUser.uid) {
      throw new Error("User not authenticated to delete a project.");
    }
    if (!projectId) {
      throw new Error("Project ID is required for deletion.");
    }
    const projectDocRef = doc(getUserProjectsCollection(currentUser.uid), projectId);
    await deleteDoc(projectDocRef); // Delete the project document

    // After deleting a project, you might also want to delete its subcollection (pins)
    // Firestore does not automatically delete subcollections. This requires a Cloud Function.
    // For now, clients will just not see the pins if the parent project is gone.
    // console.warn("Note: Deleting a project client-side does not automatically delete its subcollections (pins). Consider a Firebase Cloud Function for full cleanup.");
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
    openSearchModal,
    currentUser,
    currentProjectId,
    setCurrentProjectId,
    userProjects,
    loadingProjects,
    createProject,
    updateProject, // Expose new function
    deleteProject, // Expose new function
    handleLocationSelectedFromMapSearchAndCloseModal,
  };

  if (authLoading || loadingProjects) {
    return (
      <div className="flex flex-col items-center justify-center h-screen w-screen bg-gradient-to-br from-blue-600 to-indigo-800 text-white p-4">
        <div className="relative flex items-center justify-center mb-6">
          <div className="absolute animate-spin rounded-full h-24 w-24 border-t-4 border-b-4 border-blue-200 opacity-75"></div>
          <div className="absolute animate-spin-slow rounded-full h-20 w-20 border-t-4 border-b-4 border-indigo-200 opacity-75 [animation-delay:-0.5s]"></div>
          <svg className="h-16 w-16 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5A4.5 4.5 0 003 9.5a4.5 4.5 0 004.5 4.5c1.746 0 3.332-.477 4.5-1.247m0 0V14.25m0-6.253c1.168-.773 2.754-1.247 4.5-1.247A4.5 4.5 0 0121 9.5a4.5 4.5 0 01-4.5 4.5c-1.746 0-3.332-.477-4.5-1.247m0 0V14.25m0 0v1.5c0 .874-.396 1.705-1.036 2.272l-2.07 1.849c-.832.74-2.031.74-2.863 0l-2.07-1.849A3.75 3.75 0 017.5 14.25m4.5 4.5v-1.5m0-6.253a4.524 4.524 0 01-.166-.089m0 0L12 14.25" />
          </svg>
        </div>
        <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-4 tracking-wide">
          GoMapper
        </h2>
        <p className="text-xl md:text-2xl text-blue-100 text-center">
          Loading your personalized map experience...
        </p>
      </div>
    );
  }

  return (
    <MapSearchContext.Provider value={value}>
      {children}
    </MapSearchContext.Provider>
  );
};