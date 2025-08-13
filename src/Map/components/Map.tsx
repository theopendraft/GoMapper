// src/components/map/components/Map.tsx
import React, {
  useEffect,
  useState,
  useMemo,
  useRef,
  useCallback,
} from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMapEvent,
  useMap,
  Tooltip,
} from "react-leaflet";
import L from "leaflet";
import {
  // Firestore functions directly imported
  query,
  where,
  db, // Direct Firestore instance
  getProjectPinsCollection, // The utility function for project-specific pins
} from "../../services/firebase"; // Make sure this path is correct relative to Map.tsx
import { onSnapshot, doc, setDoc, deleteDoc } from "firebase/firestore"; // Import Firestore SDK functions
import { EditVillageModal } from "../../components/modals/EditVillageModal";
import { useSnackbar } from "../../context/SnackbarContext";
// FIX: Import FiSearch
import {
  FiEdit2,
  FiTrash2,
  FiMapPin,
  FiUsers,
  FiCalendar,
  FiBookOpen,
  FiClock,
  FiGlobe,
  FiPlus,
  FiCheckCircle,
  FiSearch,
  FiZap, // Import the Zap icon for optimization
} from "react-icons/fi";
import debounce from "lodash/debounce";
import MarkerClusterGroup from "react-leaflet-markercluster";
import { GeoSearchControl, OpenStreetMapProvider } from "leaflet-geosearch";
import "leaflet-geosearch/dist/geosearch.css";
import { useMapSearch } from "../../context/MapSearchContext";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";

import { User } from "firebase/auth";
// FIX: Import VillageType and ParentType from types
import { Village as VillageType } from "../../types/village";
import { Parent as ParentType } from "../../types/parent";
import GeolocationControl from "./GeolocationControl";
import RoutingComponent, {
  Instruction,
  RouteSummary,
} from "./RoutingComponent";
import DirectionsPanel from "./DirectionsPanel";

// Fix for default marker icon issue in Leaflet with bundlers
delete (L.Icon.Default.prototype as any)._getIconUrl;

// Custom default icon using a local asset for a more modern look
L.Icon.Default.mergeOptions({
  iconUrl: "/assets/map_pin.png",
  iconRetinaUrl: "/assets/map_pin.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png", // Keep leaflet's shadow
  iconSize: [30, 30], // A good size for the custom pin
  iconAnchor: [17, 35], // Anchor at the bottom center
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [20, 20],
});

// Custom SVG marker icon for the global searched location
const searchedLocationIcon = new L.DivIcon({
  className: "searched-location-marker",
  html: `<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 4px 6px rgba(0,0,0,0.2));">
    <circle cx="16" cy="16" r="12" fill="#2563eb" stroke="#fff" stroke-width="2"/>
    <circle cx="16" cy="16" r="4" fill="#fff"/>
  </svg>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

// Type Aliases for Village and Parent used internally in this component
export type Village = VillageType;
export type Parent = ParentType;

const createStatusIcon = (status: Village["status"]) => {
  const statusColors = {
    visited: "#16a34a", // Tailwind green-600
    planned: "#f59e0b", // Tailwind amber-500
    "not-visited": "#dc2626", // Tailwind red-600
  };
  const color = statusColors[status] || statusColors["not-visited"];

  // A modern, SVG-based map pin. The `stroke` helps it stand out on the map.
  const svgIcon = `
    <svg viewBox="0 0 24 24" width="32" height="32" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="${color}" stroke="#FFFFFFAA" stroke-width="0.5"/>
    </svg>
  `;

  return new L.DivIcon({
    html: svgIcon,
    className: "svg-pin", // Use this class to style the div icon
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });
};

interface Props {
  search: string;
  filter: "all" | "visited" | "planned" | "not-visited";
  isSearchActive: boolean;
  isMapSearchControlVisible: boolean; // Indicates if the leaflet-geosearch bar should be physically on the map
  onLocationSelectedFromMapSearch: (location: {
    lat: number;
    lng: number;
    address: string;
  }) => void;
  onSearchControlVisibilityChange: (isVisible: boolean) => void; // Callback from GeoSearchControlManager to MapPage
  onLocationFoundForModal: (
    location: { lat: number; lng: number; address: string } | null
  ) => void;
  onRequestModalClose: () => void; // Request MapPage to close search modal (from outside click on map)
  currentUser: User | null; // Currently authenticated Firebase User
  currentProjectId: string | null; // ID of the currently selected project
  openSearchModal: () => void; // NEW PROP: Function to open the SearchModal directly from a button on the map
  showDirections: boolean;
  setShowDirections: (show: boolean) => void;
}

// Village Popup Component (remains the same)
const VillagePopup: React.FC<{
  village: Village;
  onEdit: () => void;
  onDelete: () => void;
  onAddToRoute: () => void;
  onRemoveFromRoute: () => void;
  isInRoute: boolean;
}> = ({
  village,
  onEdit,
  onDelete,
  onAddToRoute,
  onRemoveFromRoute,
  isInRoute,
}) => {
  // Helper function for status badge classes (can be reused from MapSummaryPanel or defined here)
  function getStatusBadgeClasses(status: Village["status"]) {
    return (
      "inline-block px-2 py-0.5 rounded-full text-xs font-medium " +
      (status === "visited"
        ? "bg-green-100 text-green-700"
        : status === "planned"
        ? "bg-yellow-100 text-yellow-700"
        : "bg-red-100 text-red-700")
    );
  }

  return (
    <div className="p-2 min-w-[240px] max-w-[300px] font-sans">
      {/* Header with Pin Name and Status Badge */}
      <div className="flex items-center justify-between border-b pb-2 mb-2">
        <h3 className="font-bold text-lg text-gray-800 break-words pr-2">
          {village.name}
        </h3>
        <span className={getStatusBadgeClasses(village.status)}>
          {village.status === "visited"
            ? "Visited"
            : village.status === "planned"
            ? "Planned"
            : "Not Visited"}
        </span>
      </div>

      {/* Main Details Grid */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm text-gray-700 mb-3">
        {village.tehsil && (
          <div className="flex items-center gap-1">
            <FiMapPin size={14} className="text-gray-500" />
            <span>Tehsil: {village.tehsil}</span>
          </div>
        )}
        {typeof village.population === "number" && (
          <div className="flex items-center gap-1">
            <FiUsers size={14} className="text-gray-500" />
            <span>Pop: {village.population.toLocaleString()}</span>
          </div>
        )}
        {village.lastVisit && (
          <div className="flex items-center gap-1">
            <FiClock size={14} className="text-gray-500" />
            <span>Last Visit: {village.lastVisit}</span>
          </div>
        )}
        {village.nextVisitTarget && (
          <div className="flex items-center gap-1">
            <FiCalendar size={14} className="text-gray-500" />
            <span>Next Visit: {village.nextVisitTarget}</span>
          </div>
        )}
      </div>

      {/* Notes (if available) */}
      {village.notes && (
        <div className="mb-3 text-sm text-gray-700 border-t border-gray-200 pt-2">
          <p className="font-semibold text-gray-800 flex items-center gap-1">
            <FiBookOpen size={14} /> Notes:
          </p>
          <p className="text-gray-600 mt-1">{village.notes}</p>
        </div>
      )}

      {/* Parents Section */}
      <div className="border-t border-gray-200 pt-2">
        <h4 className="font-semibold text-gray-800 text-sm mb-1 flex items-center gap-1">
          <FiUsers size={14} /> Contacts:
        </h4>
        {village.parents?.length > 0 ? (
          <ul className="space-y-1 text-sm text-gray-700">
            {village.parents.map((parent, idx) => (
              <li key={idx} className="flex flex-wrap items-center gap-x-2">
                <span className="font-medium">{parent.name}</span>
                {parent.contact && (
                  <span className="text-gray-500">({parent.contact})</span>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500 text-sm">No contact available</p>
        )}
      </div>

      {/* Action Buttons */}
      <div className="mt-4 flex justify-end gap-2 border-t pt-3 border-gray-200">
        {isInRoute ? (
          <button
            className="flex items-center gap-1 px-3 py-1 bg-orange-600 text-white rounded-md text-sm hover:bg-orange-700 transition-colors shadow-sm"
            onClick={onRemoveFromRoute}
          >
            <FiTrash2 size={14} /> Remove from Route
          </button>
        ) : (
          <button
            className="flex items-center gap-1 px-3 py-1 bg-indigo-600 text-white rounded-md text-sm hover:bg-indigo-700 transition-colors shadow-sm"
            onClick={onAddToRoute}
          >
            <FiPlus size={14} /> Add to Route
          </button>
        )}
        <button
          className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 transition-colors shadow-sm"
          onClick={onEdit}
        >
          <FiEdit2 size={14} /> Edit Pin
        </button>
        <button
          className="flex items-center gap-1 px-3 py-1 bg-red-600 text-white rounded-md text-sm hover:bg-red-700 transition-colors shadow-sm"
          onClick={onDelete}
        >
          <FiTrash2 size={14} /> Delete Pin
        </button>
      </div>
    </div>
  );
};

// Add Village Component
const AddVillageOnMap: React.FC<{
  onSelect: (coords: [number, number]) => void;
}> = ({ onSelect }) => {
  useMapEvent("click", (e) => {
    onSelect([e.latlng.lat, e.latlng.lng]);
  });
  return null;
};

// MapController component
const MapController: React.FC<{
  searchResultLocation?: { lat: number; lng: number; address: string } | null;
  villagesToFit: Village[];
}> = ({ searchResultLocation, villagesToFit }) => {
  // FIX: Added villagesToFit prop
  const map = useMap(); // Get the Leaflet map instance from context

  // Effect 1: Adjust map view to the current search marker's location
  useEffect(() => {
    if (searchResultLocation) {
      map.setView([searchResultLocation.lat, searchResultLocation.lng], 14); // Zoom to 14 (a reasonable level for locations)
      map.invalidateSize(); // Ensure map size is correctly calculated after dynamic changes
    }
  }, [searchResultLocation, map]);

  // FIX: Effect 2: Fit map to bounds of all visible villages
  useEffect(() => {
    if (villagesToFit.length > 0) {
      // Create a LatLngBounds object
      const bounds = L.latLngBounds(
        villagesToFit.map((village) => village.coords)
      );

      // Fit the map to these bounds
      // Add padding to prevent markers from being too close to the edge
      map.fitBounds(bounds, { padding: [50, 50] }); // Adjust padding as needed
      map.invalidateSize(); // Important if map container size changes dynamically
    }
    // else if (villagesToFit.length === 0) {
    //    // Optional: If no pins, reset to a default view or center of country
    //    map.setView([22.68411, 77.26887], 5); // Example: reset to a wider view of India
    //    map.invalidateSize();
    // }
  }, [villagesToFit, map]); // Depend on villagesToFit and map instance

  return null; // This component doesn't render anything visually
};

// Component to handle effects from the global search context
const GlobalSearchMapManager = () => {
  const map = useMap();
  const { searchedLocation } = useMapSearch();

  useEffect(() => {
    if (searchedLocation) {
      map.flyTo([searchedLocation.lat, searchedLocation.lng], 14, {
        animate: true,
        duration: 1.5,
      });
    }
  }, [searchedLocation, map]);

  return null; // This component does not render anything
};

export default function Map({
  search,
  filter,
  isSearchActive,
  isMapSearchControlVisible, // This prop is passed but `isActive` is used in GeoSearchControlManager
  onLocationSelectedFromMapSearch,
  onSearchControlVisibilityChange,
  onLocationFoundForModal,
  onRequestModalClose,
  currentUser,
  currentProjectId,
  openSearchModal, // NEW: Destructure the prop for the global search button
  showDirections,
  setShowDirections,
}: Props) {
  const { showSnackbar } = useSnackbar();
  const { searchedLocation, setSearchedLocation } = useMapSearch();
  // State for currently selected/edited village
  const [selectedVillage, setSelectedVillage] = useState<Village | null>(null);
  const [editingVillage, setEditingVillage] = useState<Village | null>(null);
  // State for adding a new village via map click/search
  const [addingVillage, setAddingVillage] = useState(false);
  const [newVillageCoords, setNewVillageCoords] = useState<
    [number, number] | null
  >(null);
  const [newVillageName, setNewVillageName] = useState(""); // State for the new village name
  // State for all villages displayed on the map
  const [villagesState, setVillagesState] = useState<Village[]>([]);
  // State for pins in the current route
  const [routePins, setRoutePins] = useState<Village[]>([]);
  // Loading and error states for Firestore data fetching
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // State for route optimization
  const [isOptimizing, setIsOptimizing] = useState(false);

  // State for the temporary marker from search results
  const [tempSearchMarker, setTempSearchMarker] = useState<{
    latlng: [number, number];
    address: string;
  } | null>(null);

  // State for turn-by-turn directions
  const [instructions, setInstructions] = useState<Instruction[]>([]);
  const [routeSummary, setRouteSummary] = useState<RouteSummary | null>(null);

  // Debounced search (for filtering existing pins on the map)
  const debouncedSearch = useMemo(
    () =>
      debounce((searchQuery: string) => {
        // The actual filtering logic is in displayVillages useMemo
        // This debounced function is just to delay updating the search state if needed
      }, 300),
    []
  );

  useEffect(() => {
    // Triggers the memoized debounced function whenever 'search' prop changes
    debouncedSearch(search);
  }, [search, debouncedSearch]);

  // Effect for Firestore live synchronization of pins for the current project
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    // Only attempt to fetch pins if a user is logged in AND a project is selected
    if (currentUser && currentUser.uid && currentProjectId) {
      setIsLoading(true); // Set loading true while fetching
      setError(null); // Clear any previous errors

      try {
        const pinsCollectionRef = getProjectPinsCollection(
          currentUser.uid,
          currentProjectId
        );
        // Subscribe to real-time updates for the specific project's pins
        unsubscribe = onSnapshot(
          pinsCollectionRef,
          (snapshot) => {
            const pins = snapshot.docs.map((doc) => {
              const data = doc.data();
              return {
                id: doc.id,
                projectId: currentProjectId, // Ensure projectId is part of the client-side object for type safety
                name: data.name || "",
                coords: data.coords || [0, 0],
                status: data.status || "not-visited",
                parents: data.parents || [],
                // Populate optional fields, defaulting to undefined if not present in Firestore
                lastVisit: data.lastVisit || undefined,
                tehsil: data.tehsil || undefined,
                population: data.population || undefined,
                notes: data.notes || undefined,
                interactionHistory: data.interactionHistory || undefined,
                nextVisitTarget: data.nextVisitTarget || undefined,
                parentsName: data.parentsName || undefined,
                parentsContact: data.parentsContact || undefined,
              } as Village; // Cast to your VillageType
            });
            setVillagesState(pins); // Update state with fetched pins
            setIsLoading(false); // End loading
          },
          (err: any) => {
            // Handle errors during snapshot listener
            console.error("Map.tsx Firestore Error:", err);
            setError("Failed to fetch pins");
            setIsLoading(false);
            showSnackbar({ message: "Error loading pins", severity: "error" });
          }
        );
      } catch (err: any) {
        // Handle errors during collection reference creation
        console.error("Map.tsx Setup Error:", err);
        setError("Failed to initialize pin data sync");
        setIsLoading(false);
        showSnackbar({
          message: "Error initializing pin data sync",
          severity: "error",
        });
      }
    } else {
      // If no user or project selected, clear pins and set loading to false
      setVillagesState([]);
      setIsLoading(false);
      setError(null);
    }
    // Cleanup function for the useEffect: unsubscribe from Firestore listener
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
      // Also clear route when project changes
      setRoutePins([]);
      setInstructions([]);
      setRouteSummary(null);
      setShowDirections(false);
    };
  }, [currentUser, currentProjectId]); // Dependency array

  // Handler for editing an existing village
  const handleEditClick = (village: Village) => {
    setSelectedVillage(village); // Set village to be edited/displayed in popup
    setEditingVillage(village); // Open the EditVillageModal
  };

  // Handler for saving a village (called from EditVillageModal)
  const handleSaveVillage = async (updatedVillage: Village) => {
    if (!currentUser || !currentUser.uid || !currentProjectId) {
      showSnackbar({
        message:
          "Authentication required or no project selected. Cannot save pin.",
        severity: "error",
      });
      return;
    }
    try {
      const pinDocRef = doc(
        getProjectPinsCollection(currentUser.uid, currentProjectId),
        updatedVillage.id.toString()
      );
      // Ensure the saved village includes the projectId from the current context explicitly
      const villageToSave: Village = {
        ...updatedVillage,
        projectId: currentProjectId,
      };
      // setDoc will create a new doc if ID doesn't exist, or overwrite if it does
      await setDoc(pinDocRef, villageToSave);
      // After successful save, clear modal/temp states
      setEditingVillage(null);
      setAddingVillage(false);
      setNewVillageCoords(null);
      setTempSearchMarker(null);
      setSelectedVillage(updatedVillage); // Update selectedVillage to reflect changes
      showSnackbar({
        message: "Pin updated successfully!",
        severity: "success",
      }); // Confirmation toast
      onLocationFoundForModal(null); // Clear any search modal messages
    } catch (err: any) {
      console.error("Failed to save pin:", err);
    }
  };

  // Handler for deleting a village
  const handleDeleteVillage = async (villageId: string | number) => {
    if (!currentUser || !currentUser.uid || !currentProjectId) {
      showSnackbar({
        message:
          "Authentication required or no project selected. Cannot delete pin.",
        severity: "error",
      });
      return;
    }
    if (!window.confirm("Are you sure you want to delete this pin?")) return; // Confirmation dialog
    try {
      const pinDocRef = doc(
        getProjectPinsCollection(currentUser.uid, currentProjectId),
        villageId.toString()
      );
      await deleteDoc(pinDocRef); // Delete the document
      setSelectedVillage(null); // Clear selected village
      setRoutePins((prevPins) => prevPins.filter((p) => p.id !== villageId)); // Remove from route
      showSnackbar({
        message: "Pin deleted successfully!",
        severity: "success",
      }); // Confirmation toast
    } catch (err: any) {
      console.error("Failed to delete pin:", err);
      showSnackbar({ message: "Failed to delete pin", severity: "error" });
    }
  };

  // Handler for closing EditVillageModal
  const handleModalClose = () => {
    setEditingVillage(null); // Clear editing state
    setAddingVillage(false); // Clear adding state
    setNewVillageCoords(null); // Clear new coords
    setNewVillageName(""); // Clear the new village name
    setTempSearchMarker(null); // Clear temp search marker
    onLocationFoundForModal(null); // Clear search modal message
  };

  // Handler for when the user clicks the temporary marker from the GLOBAL search
  const handleSelectGlobalSearchMarker = () => {
    if (!currentUser || !currentProjectId) {
      showSnackbar({
        message: "Please log in and select a project to add this pin.",
        severity: "error",
      });
      return;
    }
    if (searchedLocation) {
      // Set the state needed to open the EditVillageModal in "add" mode
      setNewVillageCoords([searchedLocation.lat, searchedLocation.lng]);
      setNewVillageName(searchedLocation.address); // Pre-fill name
      setAddingVillage(true); // Trigger modal
      setSearchedLocation(null); // Clear the temporary marker from the map
    }
  };

  // Handler for when GeoSearchControl finds a location
  const handleGeoSearchLocationFound = React.useCallback(
    (locationData: { x: number; y: number; label: string; raw: any }) => {
      console.log(
        "geosearch/showlocation event received with locationData:",
        locationData
      );
      const latlng: [number, number] = [locationData.y, locationData.x];
      setTempSearchMarker({ latlng, address: locationData.label }); // Set temporary marker state
      onLocationFoundForModal({
        lat: locationData.y,
        lng: locationData.x,
        address: locationData.label,
      }); // Update search modal message
    },
    [onLocationFoundForModal]
  );

  // Handler for selecting the temporary marker (to add as a new pin)
  const handleSelectTempMarker = () => {
    if (!currentUser || !currentProjectId) {
      showSnackbar({
        message: "Please log in and select a project to add pins from search.",
        severity: "error",
      });
      return;
    }
    if (tempSearchMarker) {
      onLocationSelectedFromMapSearch({
        // Notify MapPage/Context about selection
        lat: tempSearchMarker.latlng[0],
        lng: tempSearchMarker.latlng[1],
        address: tempSearchMarker.address,
      });
      setNewVillageCoords(tempSearchMarker.latlng); // Set coords for new pin
      setNewVillageName(tempSearchMarker.address); // Set the name for the new pin
      setAddingVillage(true); // Activate adding flow
      setTempSearchMarker(null); // Clear temporary marker
    }
  };

  const handleAddToRoute = (village: Village) => {
    if (!routePins.find((p) => p.id === village.id)) {
      setRoutePins((prevPins) => [...prevPins, village]);
      showSnackbar({
        message: `${village.name} added to route.`,
        severity: "info",
      });
    } else {
      showSnackbar({
        message: `${village.name} is already in the route.`,
        severity: "warning",
      });
    }
  };

  const handleRemoveFromRoute = (villageId: string | number) => {
    setRoutePins((prevPins) => prevPins.filter((p) => p.id !== villageId));
    showSnackbar({ message: "Pin removed from route.", severity: "info" });
  };

  const handleClearRoute = () => {
    setRoutePins([]);
    showSnackbar({ message: "Route has been cleared.", severity: "info" });
    setInstructions([]);
    setRouteSummary(null);
    setShowDirections(false);
  };

  // --- Route Optimization ---

  // Helper function to generate all permutations of an array
  const getPermutations = (array: number[]): number[][] => {
    if (array.length === 0) return [[]];
    const firstEl = array[0];
    const rest = array.slice(1);
    const permsWithoutFirst = getPermutations(rest);
    const allPermutations: number[][] = [];
    permsWithoutFirst.forEach((perm) => {
      for (let i = 0; i <= perm.length; i++) {
        const permWithFirst = [...perm.slice(0, i), firstEl, ...perm.slice(i)];
        allPermutations.push(permWithFirst);
      }
    });
    return allPermutations;
  };

  // TSP solver using brute-force permutations
  const solveTsp = (distanceMatrix: number[][]): number[] => {
    const numPoints = distanceMatrix.length;
    const pointsToVisit = Array.from(
      { length: numPoints - 1 },
      (_, i) => i + 1
    );
    const permutations = getPermutations(pointsToVisit);

    let bestPermutation: number[] = [];
    let minDistance = Infinity;

    permutations.forEach((perm) => {
      let currentDistance = 0;
      let lastPoint = 0; // Start from the first pin
      perm.forEach((point) => {
        currentDistance += distanceMatrix[lastPoint][point];
        lastPoint = point;
      });

      if (currentDistance < minDistance) {
        minDistance = currentDistance;
        bestPermutation = perm;
      }
    });

    return [0, ...bestPermutation]; // Return full path including the start
  };

  const handleOptimizeRoute = async () => {
    if (routePins.length <= 2) {
      showSnackbar({
        message: "Optimization requires at least 3 pins.",
        severity: "info",
      });
      return;
    }
    if (routePins.length > 10) {
      showSnackbar({
        message:
          "Route optimization is not supported for more than 10 pins due to complexity.",
        severity: "warning",
      });
      return;
    }

    setIsOptimizing(true);
    try {
      // 1. Format coordinates for OSRM Table API
      const coordsString = routePins
        .map((p) => `${p.coords[1]},${p.coords[0]}`)
        .join(";");
      const apiUrl = `https://router.project-osrm.org/table/v1/driving/${coordsString}?annotations=distance`;

      // 2. Fetch the distance matrix
      const response = await fetch(apiUrl);
      if (!response.ok) {
        throw new Error(`OSRM API failed with status: ${response.status}`);
      }
      const data = await response.json();
      if (data.code !== "Ok" || !data.distances) {
        throw new Error("Invalid data from OSRM API.");
      }
      const distanceMatrix = data.distances;

      // 3. Solve the TSP
      const optimalOrder = solveTsp(distanceMatrix);

      // 4. Reorder the routePins array
      const optimizedRoute = optimalOrder.map((index) => routePins[index]);
      setRoutePins(optimizedRoute);

      showSnackbar({
        message: "Route optimized for the shortest path!",
        severity: "success",
      });
    } catch (err) {
      console.error("Route optimization failed:", err);
      showSnackbar({
        message: "Could not optimize route. Please try again later.",
        severity: "error",
      });
    } finally {
      setIsOptimizing(false);
    }
  };

  // Handlers for instructions from RoutingComponent, wrapped in useCallback
  const handleInstructionsReady = useCallback(
    (newInstructions: Instruction[], summary: RouteSummary) => {
      setInstructions(newInstructions);
      setRouteSummary(summary);
      setShowDirections(true); // Show panel when instructions are ready
    },
    [] // No dependencies, this function will not be recreated
  );

  const handleClearInstructions = useCallback(() => {
    setInstructions([]);
    setRouteSummary(null);
    setShowDirections(false);
  }, []); // No dependencies, this function will not be recreated

  // Filtered villages based on search and filter props
  const displayVillages = useMemo(() => {
    let filtered = villagesState;
    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter((v) =>
        v.name.toLowerCase().includes(searchLower)
      );
    }
    // Apply status filter
    if (filter !== "all") {
      filtered = filtered.filter((v) => v.status === filter);
    }
    return filtered;
  }, [villagesState, search, filter]);

  // --- Conditional Rendering for Map component based on loading/errors/project selection ---
  if (error) {
    return <div className="text-red-600 p-4 text-center">Error: {error}</div>;
  }

  if (isLoading) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-gray-100/50 z-[1000] scrollbar-hide">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // This check is already done in MapPage, but good to have a fallback
  if (!currentProjectId) {
    return (
      <div className="flex justify-center items-center h-full w-full bg-gray-100 text-lg text-gray-700 text-center p-4">
        No project selected. Please select or create a project using the
        sidebar.
      </div>
    );
  }

  // --- Main Map Render ---
  return (
    <div className="  relative h-screen w-full  scrollbar-hide">
      {" "}
      {/* Container for map and floating buttons */}
      {/* ADD NEW PINS Button (for adding pins by map0click) */}
      <button
        className="fixed bottom-56 md:bottom-[160px] right-3 z-[1000] flex items-center bg-green-600 text-white rounded-full shadow-lg px-4 py-4 transition-all duration-300 group hover:pr-8 hover:rounded-full "
        onClick={() => {
          if (!currentUser || !currentProjectId) {
            showSnackbar({
              message: "Please log in and select a project to add pins.",
              severity: "error",
            });
            return;
          }
          setAddingVillage(true); // Activate map click adding mode
          setNewVillageCoords(null); // Clear any previous coordinates
          setTempSearchMarker(null); // Clear search marker
          onLocationFoundForModal(null); // Clear search modal message
        }}
        style={{ minWidth: 56, minHeight: 56 }}
        aria-label="Add new pins by clicking on map"
        title="Add new pins by clicking on map"
      >
        <span className="flex items-center justify-center w-6 h-6 text-2xl transition-all duration-300">
          <FiPlus />
        </span>
        <span className="overflow-hidden max-w-0 group-hover:max-w-xs group-hover:ml-3 transition-all duration-300 whitespace-nowrap">
          Add New Pins
        </span>
      </button>
      {/* This button is now obsolete as the search bar is in the navbar.
          It can be removed if the modal-based search flow is no longer needed.
      */}
      {routePins.length > 1 && (
        <div className="fixed bottom-[290px] md:bottom-56 right-3 z-[1000] flex flex-col gap-2">
          {/* Clear Route Button */}
          <button
            className="flex items-center bg-yellow-500 text-white rounded-full shadow-lg px-4 py-4 transition-all duration-300 group hover:pr-8 hover:rounded-full"
            onClick={handleClearRoute}
            style={{ minWidth: 56, minHeight: 56 }}
            aria-label="Clear Route"
            title="Clear the current route"
          >
            <span className="flex items-center justify-center w-6 h-6 text-2xl transition-all duration-300">
              <FiTrash2 />
            </span>
            <span className="overflow-hidden max-w-0 group-hover:max-w-xs group-hover:ml-3 transition-all duration-300 whitespace-nowrap">
              Clear Route
            </span>
          </button>

          {/* Optimize Route Button */}
          {routePins.length > 2 && (
            <button
              className="flex items-center bg-purple-600 text-white rounded-full shadow-lg px-4 py-4 transition-all duration-300 group hover:pr-8 hover:rounded-full disabled:bg-purple-400 disabled:cursor-not-allowed"
              onClick={handleOptimizeRoute}
              disabled={isOptimizing}
              style={{ minWidth: 56, minHeight: 56 }}
              aria-label="Optimize Route"
              title="Find the shortest path for the current route"
            >
              <span
                className={`flex items-center justify-center w-6 h-6 text-2xl transition-all duration-300 ${
                  isOptimizing ? "animate-spin" : ""
                }`}
              >
                <FiZap />
              </span>
              <span className="overflow-hidden max-w-0 group-hover:max-w-xs group-hover:ml-3 transition-all duration-300 whitespace-nowrap">
                {isOptimizing ? "Optimizing..." : "Optimize Route"}
              </span>
            </button>
          )}
        </div>
      )}
      {/* No Pins Message */}
      {!isLoading && displayVillages.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center z-[1000] pointer-events-none">
          <div className="bg-white/80 backdrop-blur-sm p-6 rounded-lg shadow-lg text-center">
            <h3 className="text-xl font-semibold text-gray-800">No Pins Yet</h3>
            <p className="text-gray-600 mt-2">
              Click the 'Add New Pins' button to get started!
            </p>
          </div>
        </div>
      )}
      <MapContainer
        center={[22.68411, 77.26887]} // Default map center
        zoom={11} // Default zoom level
        className={`h-full w-full z-10 scrollbar-hide ${
          // Map container fills parent and has base z-index
          addingVillage && !newVillageCoords && !tempSearchMarker
            ? "cursor-crosshair"
            : "" // Crosshair cursor when adding by click
        }`}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />

        {/* Manager for Global Search effects */}
        <GlobalSearchMapManager />

        {/* FIX: Pass displayVillages to MapController */}
        <MapController
          searchResultLocation={
            tempSearchMarker
              ? {
                  lat: tempSearchMarker.latlng[0],
                  lng: tempSearchMarker.latlng[1],
                  address: tempSearchMarker.address,
                }
              : null
          }
          villagesToFit={displayVillages}
        />
        <RoutingComponent
          routePins={routePins}
          onInstructionsReady={handleInstructionsReady}
          onClearInstructions={handleClearInstructions}
        />

        {/* Geolocation Control */}
        <GeolocationControl />
        {/* Component to manage the Leaflet-geosearch control */}
        {/* <GeoSearchControlManager
          isActive={isSearchActive} // Controls whether search bar is visible on map
          onLocationFound={handleGeoSearchLocationFound} // Callback when a location is found
          onVisibilityChange={onSearchControlVisibilityChange} // Reports visibility status back
          currentMarkerLocation={
            tempSearchMarker ? tempSearchMarker.latlng : null
          } // Tells where to center map
          onRequestModalClose={onRequestModalClose} // Handles clicks outside search bar to close modal
          showSnackbar={showSnackbar}
        /> */}

        {/* Marker for the location selected via the GLOBAL search bar */}
        {searchedLocation && (
          <Marker
            position={[searchedLocation.lat, searchedLocation.lng]}
            icon={searchedLocationIcon}
            zIndexOffset={2000} // High z-index to appear on top
            eventHandlers={{
              click: handleSelectGlobalSearchMarker,
            }}
          >
            <Popup>
              <div className="text-center p-1">
                <p className="font-semibold mb-2">{searchedLocation.address}</p>
                <button
                  onClick={handleSelectGlobalSearchMarker}
                  className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
                >
                  Add as New Pin
                </button>
              </div>
            </Popup>
          </Marker>
        )}

        {currentUser && currentProjectId && (
          <div className="fixed bottom-40 md:bottom-[90px] right-3 z-[1000]">
            <GeolocationControl
              onLocationFound={(latlng) => {
                // Optional: Do something with the found location in Map.tsx if needed
                // For now, GeolocationControl handles flying to the location
                console.log("Geolocation found in Map.tsx:", latlng);
              }}
            />
          </div>
        )}

        {/* UI for adding a new pin by clicking directly on the map */}
        {addingVillage && !newVillageCoords && !tempSearchMarker && (
          <>
            <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-[1001] bg-yellow-100 border border-yellow-400 text-yellow-800 px-4 py-2 rounded shadow">
              Click on the map to select the new pin location
            </div>
            <AddVillageOnMap onSelect={setNewVillageCoords} />{" "}
            {/* Attaches map click listener */}
          </>
        )}

        {/* Temporary Marker for search results */}
        {tempSearchMarker && (
          <Marker
            position={tempSearchMarker.latlng} // Position the marker
            eventHandlers={{
              click: handleSelectTempMarker, // Click the marker to confirm selection
            }}
          >
            <Popup>
              <div className="text-center">
                <p className="font-semibold mb-2">{tempSearchMarker.address}</p>
                <button
                  onClick={handleSelectTempMarker}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
                >
                  Select this Location
                </button>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Render all fetched village pins */}
        <MarkerClusterGroup>
          {displayVillages.map((village) => (
            <Marker
              key={village.id}
              position={village.coords}
              icon={createStatusIcon(village.status)}
              eventHandlers={{
                click: () => {
                  setSelectedVillage(village); // Set selected village for popup
                  setEditingVillage(null); // Ensure editing modal is closed initially
                },
              }}
            >
              <Tooltip>{village.name}</Tooltip>
              {/* Render popup only for the currently selected village */}
              {selectedVillage?.id === village.id && (
                <Popup
                  position={village.coords}
                  eventHandlers={{
                    remove: () => setSelectedVillage(null), // Clear selected village when popup closes
                  }}
                >
                  <VillagePopup
                    village={village}
                    onEdit={() => handleEditClick(village)}
                    onDelete={() => handleDeleteVillage(village.id)}
                    onAddToRoute={() => handleAddToRoute(village)}
                    onRemoveFromRoute={() => handleRemoveFromRoute(village.id)}
                    isInRoute={routePins.some((p) => p.id === village.id)}
                  />
                </Popup>
              )}
            </Marker>
          ))}
        </MarkerClusterGroup>
      </MapContainer>
      {/* Edit/Add Village Modal */}
      {(editingVillage || (addingVillage && newVillageCoords)) && (
        <EditVillageModal
          village={
            editingVillage || {
              // If editing, use existing village data
              id: Date.now().toString(), // For new pins, generate a temporary string ID
              projectId: currentProjectId!, // Crucial: Assign the current project ID
              name: newVillageName, // Pre-fill name from search
              tehsil: "",
              coords: newVillageCoords!,
              population: 0,
              status: "not-visited",
              parents: [],
              notes: "",
              // Initialize all optional fields as undefined to match VillageType structure
              lastVisit: undefined,
              interactionHistory: undefined,
              nextVisitTarget: undefined,
              parentsName: undefined,
              parentsContact: undefined,
            }
          }
          onClose={handleModalClose} // Close handler
          onSave={handleSaveVillage} // Save handler
          currentUserUid={currentUser?.uid ?? null} // Pass user UID for Firestore calls
          currentProjectId={currentProjectId} // Pass project ID for Firestore calls
        />
      )}
      {/* Directions Panel - New Component for displaying turn-by-turn directions */}
      <DirectionsPanel
        isOpen={showDirections}
        instructions={instructions}
        summary={routeSummary}
        onClose={() => setShowDirections(false)}
      />
      {/* The <Toaster /> from sonner is no longer needed here as Snackbar is handled by its provider */}
    </div>
  );
}
