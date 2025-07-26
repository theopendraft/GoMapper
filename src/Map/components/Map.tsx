// src/components/map/components/Map.tsx
import React, { useEffect, useState, useMemo, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMapEvent,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import {
  // Firestore functions directly imported
  query,
  where,
  db, // Direct Firestore instance
  getProjectPinsCollection // The utility function for project-specific pins
} from "../../services/firebase"; // Make sure this path is correct relative to Map.tsx
import { onSnapshot, doc, setDoc, deleteDoc } from 'firebase/firestore'; // Import Firestore SDK functions
import { EditVillageModal } from "../../components/modals/EditVillageModal";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
// FIX: Import FiSearch
import {FiEdit2, FiTrash2, FiMapPin, FiUsers, FiCalendar, FiBookOpen, FiClock, FiGlobe, FiPlus, FiCheckCircle, FiSearch } from "react-icons/fi";
import debounce from "lodash/debounce";

import { GeoSearchControl, OpenStreetMapProvider } from 'leaflet-geosearch';
import 'leaflet-geosearch/dist/geosearch.css';

import { User } from 'firebase/auth';
// FIX: Import VillageType and ParentType from types
import { Village as VillageType } from '../../types/village';
import {Parent as ParentType} from '../../types/parent';


// Fix for default marker icon issue in Leaflet with bundlers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});


// Type Aliases for Village and Parent used internally in this component
export type Village = VillageType;
export type Parent = ParentType;


const iconUrls = {
  visited: "https://maps.google.com/mapfiles/ms/icons/green-dot.png",
  planned: "https://maps.google.com/mapfiles/ms/icons/yellow-dot.png",
  "not-visited": "https://maps.google.com/mapfiles/ms/icons/red-dot.png",
};

const createIcon = (status: string) =>
  new L.Icon({
    iconUrl: iconUrls[status as keyof typeof iconUrls] || iconUrls["not-visited"],
    iconSize: [25, 41],
    iconAnchor: [12, 41],
  });

interface Props {
  search: string;
  filter: "all" | "visited" | "planned" | "not-visited";
  isSearchActive: boolean;
  isMapSearchControlVisible: boolean; // Indicates if the leaflet-geosearch bar should be physically on the map
  onLocationSelectedFromMapSearch: (location: { lat: number; lng: number; address: string }) => void;
  onSearchControlVisibilityChange: (isVisible: boolean) => void; // Callback from GeoSearchControlManager to MapPage
  onLocationFoundForModal: (location: { lat: number; lng: number; address: string } | null) => void;
  onRequestModalClose: () => void; // Request MapPage to close search modal (from outside click on map)
  currentUser: User | null; // Currently authenticated Firebase User
  currentProjectId: string | null; // ID of the currently selected project
  openSearchModal: () => void; // NEW PROP: Function to open the SearchModal directly from a button on the map
}

// Village Popup Component (remains the same)
const VillagePopup: React.FC<{
  village: Village;
  onEdit: () => void;
  onDelete: () => void;
}> = ({ village, onEdit, onDelete }) => {

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
          <p className="font-semibold text-gray-800 flex items-center gap-1"><FiBookOpen size={14} /> Notes:</p>
          <p className="text-gray-600 mt-1">{village.notes}</p>
        </div>
      )}

      {/* Parents Section */}
      <div className="border-t border-gray-200 pt-2">
        <h4 className="font-semibold text-gray-800 text-sm mb-1 flex items-center gap-1">
          <FiUsers size={14} /> Parent Contacts:
        </h4>
        {village.parents?.length > 0 ? (
          <ul className="space-y-1 text-sm text-gray-700">
            {village.parents.map((parent, idx) => (
              <li key={idx} className="flex flex-wrap items-center gap-x-2">
                <span className="font-medium">{parent.name}</span>
                {parent.contact && <span className="text-gray-500">({parent.contact})</span>}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500 text-sm">No parent data available</p>
        )}
      </div>

      {/* Action Buttons */}
      <div className="mt-4 flex justify-end gap-2 border-t pt-3 border-gray-200">
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

// GeoSearchControlManager component (responsible for leaflet-geosearch lifecycle)
const GeoSearchControlManager: React.FC<{
  isActive: boolean;
  onLocationFound: (location: { x: number; y: number; label: string; raw: any }) => void;
  onVisibilityChange: (isVisible: boolean) => void;
  currentMarkerLocation: [number, number] | null;
  onRequestModalClose: () => void;
}> = ({ isActive, onLocationFound, onVisibilityChange, currentMarkerLocation, onRequestModalClose }) => {
  const map = useMap();
  const searchControlRef = useRef<any>(null); // Ref to store the actual GeoSearchControl instance

  // Memoized handler for 'geosearch/showlocation' event
  const geoSearchEventHandler = React.useCallback((event: any) => {
    // Check if event.location exists (newer versions) or if event itself is the data (older versions)
    const locationData = event.location || event.result || event; // Robustly get location data

    if (!locationData || typeof locationData.x === 'undefined' || typeof locationData.y === 'undefined' || typeof locationData.label === 'undefined') {
        console.error("Invalid location data received from geosearch event:", locationData);
        toast.error("Location search failed or returned invalid data.");
        return;
    }
    onLocationFound(locationData);
  }, [onLocationFound]);


  // EFFECT 1: Add/Remove GeoSearchControl based on `isActive` prop (from MapPage)
  useEffect(() => {
    if (isActive) {
      if (!searchControlRef.current) {
        const provider = new OpenStreetMapProvider();
        const searchControl = new (GeoSearchControl as any)({
          provider: provider,
          style: 'bar', // Visual style of the search input
          position: 'topright', // Position on the map
          showMarker: false, // We'll manage our own temporary marker
          showPopup: false,
          autoClose: false, // Keep the search bar active after a result
          retainZoomLevel: false,
          animateZoom: true,
          keepResult: false,
          searchLabel: 'Search location (e.g., city, address)',
          notFoundMessage: 'Location not found.',
        });
        map.addControl(searchControl); // Add the control to the Leaflet map
        searchControlRef.current = searchControl;

        map.on('geosearch/showlocation', geoSearchEventHandler); // Attach event listener
        onVisibilityChange(true); // Notify MapPage that search control is now visible
      }
    } else { // When isActive becomes false (e.g., search modal closes)
      if (searchControlRef.current) {
        map.removeControl(searchControlRef.current); // Remove the control from the map
        map.off('geosearch/showlocation', geoSearchEventHandler); // Detach event listener
        searchControlRef.current = null;
        onVisibilityChange(false); // Notify MapPage that search control is now hidden
      }
    }

    // Cleanup function: ensures control is removed when component unmounts or isActive changes
    return () => {
      if (searchControlRef.current) {
        map.removeControl(searchControlRef.current);
        map.off('geosearch/showlocation', geoSearchEventHandler);
        searchControlRef.current = null;
        onVisibilityChange(false);
      }
    };
  }, [isActive, map, geoSearchEventHandler, onVisibilityChange]); // Dependencies for this effect

  // EFFECT 2: Adjust map view to the current search marker's location
  useEffect(() => {
    if (isActive && currentMarkerLocation && map) {
      map.setView(currentMarkerLocation, 14); // Zoom to 14 (a reasonable level for locations)
    }
  }, [isActive, currentMarkerLocation, map]); // Dependencies for this effect


  // EFFECT 3: Handle outside click on the map to close the search modal
  // (This closes the modal, which then sets isActive=false, which hides the search bar)
  const handleClickOutside = React.useCallback((e: L.LeafletMouseEvent) => {
    // Only proceed if search control is actually present and active
    if (!isActive || !searchControlRef.current) {
        return;
    }

    const searchControlElement = searchControlRef.current.getContainer(); // Get the DOM element of the search bar
    const originalEventTarget = e.originalEvent.target as Node; // Get the actual DOM element clicked

    // Check if the click occurred outside the search bar element
    // AND ensure the click target is within the map's container (prevents false positives from UI outside the map)
    if (
      searchControlElement &&
      !searchControlElement.contains(originalEventTarget) &&
      map.getContainer().contains(originalEventTarget)
    ) {
      console.log("Clicked outside search bar. Requesting modal closure.");
      onRequestModalClose(); // Call the prop function to close the search modal
    }
  }, [isActive, map, onRequestModalClose]); // Dependencies for this callback


  // EFFECT 4: Attach/detach map click listener for outside clicks
  useEffect(() => {
    // Only attach listener if search is active (i.e., search bar is on the map)
    if (!isActive) {
      return;
    }

    map.on('click', handleClickOutside); // Attach the click listener

    // Cleanup: remove the listener when component unmounts or `isActive` changes
    return () => {
      map.off('click', handleClickOutside);
    };
  }, [isActive, map, handleClickOutside]); // Dependencies for this effect


  return null; // This component doesn't render anything itself, it manages the Leaflet control
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
}: Props) {
  // State for currently selected/edited village
  const [selectedVillage, setSelectedVillage] = useState<Village | null>(null);
  const [editingVillage, setEditingVillage] = useState<Village | null>(null);
  // State for adding a new village via map click/search
  const [addingVillage, setAddingVillage] = useState(false);
  const [newVillageCoords, setNewVillageCoords] = useState<[number, number] | null>(null);
  // State for all villages displayed on the map
  const [villagesState, setVillagesState] = useState<Village[]>([]);
  // Loading and error states for Firestore data fetching
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State for the temporary marker from search results
  const [tempSearchMarker, setTempSearchMarker] = useState<{ latlng: [number, number]; address: string } | null>(null);


  // Debounced search (for filtering existing pins on the map)
  const debouncedSearch = useMemo(() => debounce((searchQuery: string) => {
    // The actual filtering logic is in displayVillages useMemo
    // This debounced function is just to delay updating the search state if needed
  }, 300), []);

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
        const pinsCollectionRef = getProjectPinsCollection(currentUser.uid, currentProjectId);
        // Subscribe to real-time updates for the specific project's pins
        unsubscribe = onSnapshot(
          pinsCollectionRef,
          (snapshot) => {
            const pins = snapshot.docs.map((doc) => {
              const data = doc.data();
              return {
                id: doc.id,
                projectId: currentProjectId, // Ensure projectId is part of the client-side object for type safety
                name: data.name || '',
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
          (err: any) => { // Handle errors during snapshot listener
            console.error("Map.tsx Firestore Error:", err);
            setError("Failed to fetch pins");
            setIsLoading(false);
            toast.error("Error loading pins");
          }
        );
      } catch (err: any) { // Handle errors during collection reference creation
        console.error("Map.tsx Setup Error:", err);
        setError("Failed to initialize pin data sync");
        setIsLoading(false);
        toast.error("Error initializing pin data sync");
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
    };
  }, [currentUser, currentProjectId]); // Effect depends on currentUser and currentProjectId


  // Memoized filtering of pins based on search and filter props
  const displayVillages = useMemo(() => {
    const searchLower = search.toLowerCase();
    return villagesState.filter((v) => {
      const matchSearch = v.name.toLowerCase().includes(searchLower);
      const matchFilter = filter === "all" || v.status === filter;
      return matchSearch && matchFilter;
    });
  }, [villagesState, search, filter]);

  // Handler for editing an existing village
  const handleEditClick = (village: Village) => {
    setSelectedVillage(village); // Set village to be edited/displayed in popup
    setEditingVillage(village); // Open the EditVillageModal
  };

  // Handler for saving a village (called from EditVillageModal)
  const handleSaveVillage = async (updatedVillage: Village) => {
    if (!currentUser || !currentUser.uid || !currentProjectId) {
      toast.error("Authentication required or no project selected. Cannot save pin.");
      return;
    }
    try {
      const pinDocRef = doc(getProjectPinsCollection(currentUser.uid, currentProjectId), updatedVillage.id.toString());
      // Ensure the saved village includes the projectId from the current context explicitly
      const villageToSave: Village = { ...updatedVillage, projectId: currentProjectId };
      // setDoc will create a new doc if ID doesn't exist, or overwrite if it does
      await setDoc(pinDocRef, villageToSave);
      // After successful save, clear modal/temp states
      setEditingVillage(null);
      setAddingVillage(false);
      setNewVillageCoords(null);
      setTempSearchMarker(null);
      setSelectedVillage(updatedVillage); // Update selectedVillage to reflect changes
      toast.success("Pin updated successfully!"); // Confirmation toast
      onLocationFoundForModal(null); // Clear any search modal messages
    } catch (err: any) {
      console.error("Failed to save pin:", err);
      
    }
  };

  // Handler for deleting a village
  const handleDeleteVillage = async (villageId: string | number) => {
    if (!currentUser || !currentUser.uid || !currentProjectId) {
      toast.error("Authentication required or no project selected. Cannot delete pin.");
      return;
    }
    if (!window.confirm("Are you sure you want to delete this pin?")) return; // Confirmation dialog
    try {
      const pinDocRef = doc(getProjectPinsCollection(currentUser.uid, currentProjectId), villageId.toString());
      await deleteDoc(pinDocRef); // Delete the document
      setSelectedVillage(null); // Clear selected village
      toast.success("Pin deleted successfully!"); // Confirmation toast
    } catch (err: any) {
      console.error("Failed to delete pin:", err);
      toast.error("Failed to delete pin");
    }
  };

  // Handler for closing EditVillageModal
  const handleModalClose = () => {
    setEditingVillage(null); // Clear editing state
    setAddingVillage(false); // Clear adding state
    setNewVillageCoords(null); // Clear new coords
    setTempSearchMarker(null); // Clear temp search marker
    onLocationFoundForModal(null); // Clear search modal message
  };

  // Handler for when GeoSearchControl finds a location
  const handleGeoSearchLocationFound = React.useCallback((locationData: { x: number; y: number; label: string; raw: any }) => {
    console.log("geosearch/showlocation event received with locationData:", locationData);
    const latlng: [number, number] = [locationData.y, locationData.x];
    setTempSearchMarker({ latlng, address: locationData.label }); // Set temporary marker state
    onLocationFoundForModal({ lat: locationData.y, lng: locationData.x, address: locationData.label }); // Update search modal message
  }, [onLocationFoundForModal]);


  // Effect to clear temporary marker and adding state when search modal closes
  useEffect(() => {
    if (!isSearchActive) { // If SearchModal is closed
      setTempSearchMarker(null);
      setAddingVillage(false);
      setNewVillageCoords(null);
    }
  }, [isSearchActive]);

  // Handler for selecting the temporary marker (to add as a new pin)
  const handleSelectTempMarker = () => {
    if (!currentUser || !currentProjectId) {
      toast.error("Please log in and select a project to add pins from search.");
      return;
    }
    if (tempSearchMarker) {
      onLocationSelectedFromMapSearch({ // Notify MapPage/Context about selection
        lat: tempSearchMarker.latlng[0],
        lng: tempSearchMarker.latlng[1],
        address: tempSearchMarker.address,
      });
      setNewVillageCoords(tempSearchMarker.latlng); // Set coords for new pin
      setAddingVillage(true); // Activate adding flow
      setTempSearchMarker(null); // Clear temporary marker
    }
  };

  // --- Conditional Rendering for Map component based on loading/errors/project selection ---
  if (error) {
    return <div className="text-red-600 p-4 text-center">Error: {error}</div>;
  }

  if (isLoading) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-gray-100/50 z-[1000]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // This check is already done in MapPage, but good to have a fallback
  if (!currentProjectId) {
    return (
        <div className="flex justify-center items-center h-full w-full bg-gray-100 text-lg text-gray-700 text-center p-4">
            No project selected. Please select or create a project using the sidebar.
        </div>
    );
  }

  // --- Main Map Render ---
  return (
    <div className="relative h-screen w-full pt-[60px] md:pt-[100px]"> {/* Container for map and floating buttons */}
      {/* ADD NEW PINS Button (for adding pins by map click) */}
      <button
        className="fixed bottom-24 md:bottom-6 right-3 z-[1000] flex items-center bg-green-600 text-white rounded-full shadow-lg px-4 py-4 transition-all duration-300 group hover:pr-8 hover:rounded-full "
        onClick={() => {
          if (!currentUser || !currentProjectId) {
            toast.error("Please log in and select a project to add pins.");
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

      {/* GLOBAL MAP SEARCH Button */}
      {currentUser && currentProjectId && ( // Only show if user is logged in AND a project is selected
        <button
          className="fixed bottom-40 md:bottom-[90px] right-3 z-[1000] flex items-center bg-blue-600 text-white rounded-full shadow-lg px-4 py-4 transition-all duration-300 group hover:pr-8 hover:rounded-full"
          onClick={() => {
            openSearchModal(); // Call the function to open the search modal
          }}
          style={{ minWidth: 56, minHeight: 56 }}
          aria-label="Open Map Search"
          title="Search for locations on the map"
        >
          <span className="flex items-center justify-center w-6 h-6 text-2xl transition-all duration-300">
            <FiSearch />
          </span>
          <span className="overflow-hidden max-w-0 group-hover:max-w-xs group-hover:ml-3 transition-all duration-300 whitespace-nowrap">
            Search Map
          </span>
        </button>
      )}


      <MapContainer
        center={[22.68411, 77.26887]} // Default map center
        zoom={11} // Default zoom level
        className={`h-full w-full z-10 ${ // Map container fills parent and has base z-index
          (addingVillage && !newVillageCoords && !tempSearchMarker) ? "cursor-crosshair" : "" // Crosshair cursor when adding by click
        }`}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />

        {/* Component to manage the Leaflet-geosearch control */}
        <GeoSearchControlManager
            isActive={isSearchActive} // Controls whether search bar is visible on map
            onLocationFound={handleGeoSearchLocationFound} // Callback when a location is found
            onVisibilityChange={onSearchControlVisibilityChange} // Reports visibility status back
            currentMarkerLocation={tempSearchMarker ? tempSearchMarker.latlng : null} // Tells where to center map
            onRequestModalClose={onRequestModalClose} // Handles clicks outside search bar to close modal
        />
        
        {/* UI for adding a new pin by clicking directly on the map */}
        {addingVillage && !newVillageCoords && !tempSearchMarker && (
          <>
            <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-[1001] bg-yellow-100 border border-yellow-400 text-yellow-800 px-4 py-2 rounded shadow">
              Click on the map to select the new pin location
            </div>
            <AddVillageOnMap onSelect={setNewVillageCoords} /> {/* Attaches map click listener */}
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
        {displayVillages.map((village) => (
          <Marker
            key={village.id}
            position={village.coords}
            icon={createIcon(village.status)}
            eventHandlers={{
              click: () => {
                setSelectedVillage(village); // Set selected village for popup
                setEditingVillage(null); // Ensure editing modal is closed initially
              },
            }}
          >
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
                />
              </Popup>
            )}
          </Marker>
        ))}
      </MapContainer>

      {/* Edit/Add Village Modal */}
      {(editingVillage || (addingVillage && newVillageCoords)) && (
        <EditVillageModal
          village={
            editingVillage || { // If editing, use existing village data
              id: Date.now().toString(), // For new pins, generate a temporary string ID
              projectId: currentProjectId!, // Crucial: Assign the current project ID
              name: "", tehsil: "", coords: newVillageCoords!, population: 0,
              status: "not-visited", parents: [], notes: "",
              // Initialize all optional fields as undefined to match VillageType structure
              lastVisit: undefined, interactionHistory: undefined,
              nextVisitTarget: undefined, parentsName: undefined, parentsContact: undefined,
            }
          }
          onClose={handleModalClose} // Close handler
          onSave={handleSaveVillage} // Save handler
          currentUserUid={currentUser?.uid ?? null} // Pass user UID for Firestore calls
          currentProjectId={currentProjectId} // Pass project ID for Firestore calls
        />
      )}

      {/* Toast notifications container */}
      <ToastContainer
        position="top-center"
        autoClose={2000}
        icon={<FiCheckCircle className="text-green-500 w-6 h-6" />}
        toastClassName={() =>
          "flex items-center gap-2 rounded-lg bg-white/90 shadow-lg border border-green-200 px-4 py-2 min-h-0 text-sm sm:text-base text-gray-800 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700"
        }
        style={{ top: "4em", left: "2em", minWidth: 0, width: "auto", maxWidth: "90vw" }}
      />
    </div>
  );
}