// src/context/MapSearchContext.tsx

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
  Dispatch,
  SetStateAction,
} from "react";
import { onSnapshot, doc, setDoc, addDoc, deleteDoc } from "firebase/firestore";
import {
  getUserProjectsCollection,
  getProjectRoutesCollection,
} from "../services/firebase"; // Import routes collection helper
import { AuthContextProps, useAuth } from "./AuthContext";
import { Project } from "../types/project";
import { User } from "firebase/auth";
import { SavedRoute } from "../types/savedRoute"; // Import SavedRoute type

interface MapSearchContextType {
  isSearchModalOpen: boolean;
  setIsSearchModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isMapSearchControlVisible: boolean;
  setIsMapSearchControlVisible: React.Dispatch<React.SetStateAction<boolean>>;
  locationFoundForModalDisplay: {
    lat: number;
    lng: number;
    address: string;
  } | null;
  setLocationFoundForModalDisplay: React.Dispatch<
    React.SetStateAction<{ lat: number; lng: number; address: string } | null>
  >;
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
  handleLocationSelectedFromMapSearchAndCloseModal: (location: {
    lat: number;
    lng: number;
    address: string;
  }) => void;

  // Route Management
  savedRoutes: SavedRoute[];
  loadingRoutes: boolean;
  loadedRoute: SavedRoute | null;
  loadRoute: (route: SavedRoute) => void;
  deleteRoute: (routeId: string) => Promise<void>;

  // Global Search Location
  searchedLocation: { lat: number; lng: number; address: string } | null;
  setSearchedLocation: React.Dispatch<
    React.SetStateAction<{ lat: number; lng: number; address: string } | null>
  >;
}

const MapSearchContext = createContext<MapSearchContextType | undefined>(
  undefined
);

export const useMapSearch = () => {
  const context = useContext(MapSearchContext);
  if (context === undefined) {
    throw new Error("useMapSearch must be used within a MapSearchProvider");
  }
  return context;
};

export const MapSearchProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const { user: currentUser, loading: authLoading } =
    useAuth() as AuthContextProps;

  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [isMapSearchControlVisible, setIsMapSearchControlVisible] =
    useState(false);
  const [locationFoundForModalDisplay, setLocationFoundForModalDisplay] =
    useState<{ lat: number; lng: number; address: string } | null>(null);

  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [userProjects, setUserProjects] = useState<Project[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);

  // State for saved routes
  const [savedRoutes, setSavedRoutes] = useState<SavedRoute[]>([]);
  const [loadingRoutes, setLoadingRoutes] = useState(false);
  const [loadedRoute, setLoadedRoute] = useState<SavedRoute | null>(null);

  // State for global search location
  const [searchedLocation, setSearchedLocation] = useState<{
    lat: number;
    lng: number;
    address: string;
  } | null>(null);

  // Memoized callback for openSearchModal
  const openSearchModal = useCallback(() => {
    setIsSearchModalOpen(true);
    setLocationFoundForModalDisplay(null);
  }, [setIsSearchModalOpen, setLocationFoundForModalDisplay]);

  // Effect to fetch user's projects when currentUser changes
  useEffect(() => {
    if (currentUser && currentUser.uid) {
      setLoadingProjects(true);
      const unsubscribe = onSnapshot(
        getUserProjectsCollection(currentUser.uid),
        (snapshot) => {
          const projects = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as Project[];
          setUserProjects(projects);
          setLoadingProjects(false);

          // Auto-select the first project if the user has projects and no project is currently selected,
          // OR if the currently selected project was deleted/no longer exists in the list.
          if (projects.length > 0) {
            const isCurrentProjectStillValid =
              currentProjectId &&
              projects.some((p) => p.id === currentProjectId);
            if (!isCurrentProjectStillValid) {
              setCurrentProjectId(projects[0].id);
            }
          } else {
            // If no projects, ensure currentProjectId is null
            if (currentProjectId !== null) {
              setCurrentProjectId(null);
            }
          }
        },
        (error) => {
          console.error("Error fetching user projects:", error);
          setLoadingProjects(false);
        }
      );
      return () => unsubscribe();
    } else {
      setUserProjects([]);
      if (currentProjectId !== null) {
        setCurrentProjectId(null);
      }
      setLoadingProjects(false);
    }
  }, [currentUser, currentProjectId]); // currentProjectId is a dependency because its value affects auto-selection logic within this effect

  // Effect to fetch saved routes when project changes
  useEffect(() => {
    if (currentUser && currentProjectId) {
      setLoadingRoutes(true);
      const routesCollection = getProjectRoutesCollection(
        currentUser.uid,
        currentProjectId
      );
      const unsubscribe = onSnapshot(
        routesCollection,
        (snapshot) => {
          const routes = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as SavedRoute[];
          setSavedRoutes(routes);
          setLoadingRoutes(false);
        },
        (error) => {
          console.error("Error fetching saved routes:", error);
          setLoadingRoutes(false);
        }
      );
      return () => unsubscribe();
    } else {
      setSavedRoutes([]);
      setLoadedRoute(null); // Clear loaded route if no project is selected
    }
  }, [currentUser, currentProjectId]);

  const handleClearLocationFound = useCallback(() => {
    setLocationFoundForModalDisplay(null);
  }, []);

  const triggerMapSearchControlVisibility = useCallback(
    (isVisible: boolean) => {
      setIsMapSearchControlVisible(isVisible);
    },
    []
  );

  const requestSearchModalClose = useCallback(() => {
    setIsSearchModalOpen(false);
    setLocationFoundForModalDisplay(null);
  }, [setIsSearchModalOpen, setLocationFoundForModalDisplay]);

  const handleLocationSelectedFromMapSearchAndCloseModal = useCallback(
    (location: { lat: number; lng: number; address: string }) => {
      setIsSearchModalOpen(false);
      setLocationFoundForModalDisplay(null);
    },
    [setIsSearchModalOpen, setLocationFoundForModalDisplay]
  );

  const createProject = useCallback(
    async (projectName: string): Promise<string> => {
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
    },
    [currentUser]
  );

  // NEW: Update Project function
  const updateProject = useCallback(
    async (projectId: string, newName: string): Promise<void> => {
      if (!currentUser || !currentUser.uid) {
        throw new Error("User not authenticated to update a project.");
      }
      if (!projectId || !newName.trim()) {
        throw new Error("Project ID and new name are required.");
      }
      const projectDocRef = doc(
        getUserProjectsCollection(currentUser.uid),
        projectId
      );
      await setDoc(projectDocRef, { name: newName.trim() }, { merge: true }); // Only update name
    },
    [currentUser]
  );

  // NEW: Delete Project function
  const deleteProject = useCallback(
    async (projectId: string): Promise<void> => {
      if (!currentUser || !currentUser.uid) {
        throw new Error("User not authenticated to delete a project.");
      }
      if (!projectId) {
        throw new Error("Project ID is required for deletion.");
      }
      const projectDocRef = doc(
        getUserProjectsCollection(currentUser.uid),
        projectId
      );
      await deleteDoc(projectDocRef); // Delete the project document

      // After deleting a project, you might also want to delete its subcollection (pins)
      // Firestore does not automatically delete subcollections. This requires a Cloud Function.
      // For now, clients will just not see the pins if the parent project is gone.
      // console.warn("Note: Deleting a project client-side does not automatically delete its subcollections (pins). Consider a Firebase Cloud Function for full cleanup.");
    },
    [currentUser]
  );

  // Load a saved route
  const loadRoute = useCallback((route: SavedRoute) => {
    setLoadedRoute(route);
  }, []);

  // Delete a saved route
  const deleteRoute = useCallback(
    async (routeId: string): Promise<void> => {
      if (!currentUser || !currentProjectId) {
        throw new Error("User or project not available to delete a route.");
      }
      const routeDocRef = doc(
        getProjectRoutesCollection(currentUser.uid, currentProjectId),
        routeId
      );
      await deleteDoc(routeDocRef);
      // If the deleted route was the currently loaded one, clear it
      if (loadedRoute?.id === routeId) {
        setLoadedRoute(null);
      }
    },
    [currentUser, currentProjectId, loadedRoute]
  );

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
    // Route management values
    savedRoutes,
    loadingRoutes,
    loadedRoute,
    loadRoute,
    deleteRoute,
    // Global search location
    searchedLocation,
    setSearchedLocation,
  };

  if (authLoading || loadingProjects) {
    return (
      <div className="flex flex-col items-center justify-center h-screen w-screen bg-gradient-to-br from-blue-600 to-indigo-800 text-white p-4">
        <div className="relative flex items-center justify-center mb-6">
          <div className="absolute animate-spin rounded-full h-24 w-24 border-t-4 border-b-4 border-blue-200 opacity-75"></div>
          <div className="absolute animate-spin-slow rounded-full h-20 w-20 border-t-4 border-b-4 border-indigo-200 opacity-75 [animation-delay:-0.5s]"></div>
          <img src="/GoMapperW.svg" alt="GoMapper Logo" className="w-10 h-10" />
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
