// src/components/map/components/Map.tsx (Updated)

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
  query,
  where,
  db,
  getProjectPinsCollection
} from "../../services/firebase";
import { onSnapshot, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { EditVillageModal } from "../../components/modals/EditVillageModal";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FiPlus, FiCheckCircle } from "react-icons/fi";
import debounce from "lodash/debounce";

import { GeoSearchControl, OpenStreetMapProvider } from 'leaflet-geosearch';
import 'leaflet-geosearch/dist/geosearch.css';

import { User } from 'firebase/auth';
// FIX: Import VillageType from types/village.ts
import { Village as VillageType } from '../../types/village';
// FIX: Import ParentType from the new types/parent.ts file
import { Parent as ParentType } from '../../types/parent';


// Fix for default marker icon issue in Leaflet with bundlers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});


// Type Aliases for Village and Parent
export type Village = VillageType;
// FIX: Now Parent is directly aliased from ParentType, which is from its own file
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
  isMapSearchControlVisible: boolean;
  onLocationSelectedFromMapSearch: (location: { lat: number; lng: number; address: string }) => void;
  onSearchControlVisibilityChange: (isVisible: boolean) => void;
  onLocationFoundForModal: (location: { lat: number; lng: number; address: string } | null) => void;
  onRequestModalClose: () => void;
  currentUser: User | null;
  currentProjectId: string | null;
}

// Village Popup Component (remains the same in usage, types are fixed)
const VillagePopup: React.FC<{
  village: Village;
  onEdit: () => void;
  onDelete: () => void;
}> = ({ village, onEdit, onDelete }) => (
  <div className="min-w-[200px]">
    <h3 className="font-bold text-lg">{village.name}</h3>
    <p>Status: {village.status}</p>
    <p>Last Interaction: {village.lastVisit || "N/A"}</p> {/* Using lastVisit as per VillageType */}
    <h4 className="font-semibold mt-2">Parents:</h4>
    {village.parents?.length > 0 ? (
      <ul className="list-disc ml-5">
        {village.parents.map((parent, idx) => (
          <li key={idx}>
            {parent.name} - {parent.contact}
          </li>
        ))}
      </ul>
    ) : (
      <p>No parent data available</p>
    )}
    <div className="mt-4 space-x-2">
      <button
        className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
        onClick={onEdit}
      >
        Edit Village
      </button>
      <button
        className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
        onClick={onDelete}
      >
        Delete Village
      </button>
    </div>
  </div>
);


// Add Village Component
const AddVillageOnMap: React.FC<{
  onSelect: (coords: [number, number]) => void;
}> = ({ onSelect }) => {
  useMapEvent("click", (e) => {
    onSelect([e.latlng.lat, e.latlng.lng]);
  });
  return null;
};

// GeoSearchControlManager component
const GeoSearchControlManager: React.FC<{
  isActive: boolean;
  onLocationFound: (location: { x: number; y: number; label: string; raw: any }) => void;
  onVisibilityChange: (isVisible: boolean) => void;
  currentMarkerLocation: [number, number] | null;
  onRequestModalClose: () => void;
}> = ({ isActive, onLocationFound, onVisibilityChange, currentMarkerLocation, onRequestModalClose }) => {
  const map = useMap();
  const searchControlRef = useRef<any>(null);

  const geoSearchEventHandler = React.useCallback((event: any) => {
    onLocationFound(event.location);
  }, [onLocationFound]);


  // EFFECT 1: Add/Remove GeoSearchControl based on `isActive`
  useEffect(() => {
    if (isActive) {
      if (!searchControlRef.current) {
        const provider = new OpenStreetMapProvider();
        const searchControl = new (GeoSearchControl as any)({
          provider: provider,
          style: 'bar',
          position: 'topright',
          showMarker: false,
          showPopup: false,
          autoClose: false,
          retainZoomLevel: false,
          animateZoom: true,
          keepResult: false,
          searchLabel: 'Search location (e.g., city, address)',
          notFoundMessage: 'Location not found.',
        });
        map.addControl(searchControl);
        searchControlRef.current = searchControl;

        map.on('geosearch/showlocation', geoSearchEventHandler);
        onVisibilityChange(true);
      }
    } else {
      if (searchControlRef.current) {
        map.removeControl(searchControlRef.current);
        map.off('geosearch/showlocation', geoSearchEventHandler);
        searchControlRef.current = null;
        onVisibilityChange(false);
      }
    }

    return () => {
      if (searchControlRef.current) {
        map.removeControl(searchControlRef.current);
        map.off('geosearch/showlocation', geoSearchEventHandler);
        searchControlRef.current = null;
        onVisibilityChange(false);
      }
    };
  }, [isActive, map, geoSearchEventHandler, onVisibilityChange]);

  // EFFECT 2: Adjust map view if a new search result comes in
  useEffect(() => {
    if (isActive && currentMarkerLocation && map) {
      map.setView(currentMarkerLocation, 56);
    }
  }, [isActive, currentMarkerLocation, map]);


  // EFFECT 3: Handle outside click to hide the search bar (by closing the modal)
  const handleClickOutside = React.useCallback((e: L.LeafletMouseEvent) => {
    // Only proceed if search control is actually present and active
    if (!isActive || !searchControlRef.current) {
        return;
    }

    const searchControlElement = searchControlRef.current.getContainer();
    const originalEventTarget = e.originalEvent.target as Node;

    // Check if the click occurred outside the search bar element
    // And ensure the click target is part of the map container (to avoid clicks on other UI elements outside map but on same page triggering it)
    if (
      searchControlElement &&
      !searchControlElement.contains(originalEventTarget) &&
      map.getContainer().contains(originalEventTarget)
    ) {
      console.log("Clicked outside search bar. Requesting modal closure.");
      onRequestModalClose(); // Request the parent (context) to close the modal
    }
  }, [isActive, map, onRequestModalClose]);


  useEffect(() => {
    // Only attach listener if search is active (and control is presumably rendered)
    if (!isActive) {
      return;
    }

    map.on('click', handleClickOutside);

    return () => {
      map.off('click', handleClickOutside);
    };
  }, [isActive, map, handleClickOutside]);


  return null;
};


export default function Map({
  search,
  filter,
  isSearchActive,
  isMapSearchControlVisible,
  onLocationSelectedFromMapSearch,
  onSearchControlVisibilityChange,
  onLocationFoundForModal,
  onRequestModalClose,
  currentUser, // Destructured currentUser prop
  currentProjectId, // Destructured currentProjectId prop
}: Props) {
  const [selectedVillage, setSelectedVillage] = useState<Village | null>(null);
  const [editingVillage, setEditingVillage] = useState<Village | null>(null);
  const [addingVillage, setAddingVillage] = useState(false);
  const [newVillageCoords, setNewVillageCoords] = useState<
    [number, number] | null
  >(null);
  const [villagesState, setVillagesState] = useState<Village[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [tempSearchMarker, setTempSearchMarker] = useState<{ latlng: [number, number]; address: string } | null>(null);


  // Debounced search (keep as is)
  const debouncedSearch = useMemo(() => debounce((searchQuery: string) => {
    // This is already being used to update state, so no need for internal state and useEffect
  }, 300), []);

  useEffect(() => {
    debouncedSearch(search);
  }, [search, debouncedSearch]);


  // FIX: Firestore live sync with error handling - now depends on currentUser and currentProjectId
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    // Only proceed if we have a logged-in user and a selected project
    if (currentUser && currentUser.uid && currentProjectId) {
      setIsLoading(true); // Start loading when query changes
      setError(null); // Clear previous errors

      try {
        const pinsCollection = getProjectPinsCollection(currentUser.uid, currentProjectId);
        // You might add a query here if needed, e.g., orderBy, limit
        // const q = query(pinsCollection, orderBy("name"));
        
        unsubscribe = onSnapshot(
          pinsCollection, // Listen to the specific project's pins
          (snapshot) => {
            const pins = snapshot.docs.map((doc) => {
              const data = doc.data();
              return {
                id: doc.id,
                name: data.name || '', // Ensure name exists
                coords: data.coords || [0, 0], // Ensure coords exist
                status: data.status || "not-visited", // Ensure status exists
                parents: data.parents || [], // Ensure parents exist
                projectId: currentProjectId, // Ensure projectId is part of the client-side object
                // Assign other optional properties from Firestore data or defaults
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
            setVillagesState(pins);
            setIsLoading(false);
          },
          (err: any) => { // Explicitly type err as any for now to avoid implicit any
            setError("Failed to fetch villages: " + err.message);
            setIsLoading(false);
            toast.error("Error loading villages: " + err.message);
          }
        );
      } catch (err: any) { // Catch potential errors during collection reference creation
        setError("Failed to initialize data sync: " + err.message);
        setIsLoading(false);
        toast.error("Error initializing data sync: " + err.message);
      }
    } else {
      // If no user or no project selected, clear pins and set loading to false
      setVillagesState([]);
      setIsLoading(false);
      setError(null);
    }

    return () => {
      // Cleanup listener when component unmounts or dependencies change
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [currentUser, currentProjectId]); // Depend on currentUser and currentProjectId


  // Filter villages with memoization (keep as is)
  const displayVillages = useMemo(() => {
    const searchLower = search.toLowerCase(); // Use 'search' prop directly now for filter
    return villagesState.filter((v) => {
      const matchSearch = v.name.toLowerCase().includes(searchLower);
      const matchFilter = filter === "all" || v.status === filter;
      return matchSearch && matchFilter;
    });
  }, [villagesState, search, filter]); // Depend on 'search' prop instead of 'debouncedSearch' local state

  const handleEditClick = (village: Village) => {
    setEditingVillage(village);
    setSelectedVillage(null);
  };

  // FIX: handleSaveVillage now uses current user/project context
  const handleSaveVillage = async (updatedVillage: Village) => {
    if (!currentUser || !currentUser.uid || !currentProjectId) {
      toast.error("Authentication required or no project selected. Cannot save pin.");
      return;
    }
    try {
      const pinDocRef = doc(getProjectPinsCollection(currentUser.uid, currentProjectId), updatedVillage.id.toString());
      // Ensure the saved village includes the projectId from the current context
      const villageToSave: Village = { ...updatedVillage, projectId: currentProjectId };
      await setDoc(pinDocRef, villageToSave); // Use setDoc from firebase/firestore
      setEditingVillage(null);
      setAddingVillage(false);
      setNewVillageCoords(null);
      setTempSearchMarker(null);
      setSelectedVillage(updatedVillage);
      toast.success("Pin updated successfully");
      onLocationFoundForModal(null); // Clear the message in the modal
    } catch (err: any) {
      toast.error("Failed to save pin: " + err.message);
    }
  };

  // FIX: handleDeleteVillage now uses current user/project context
  const handleDeleteVillage = async (villageId: string | number) => {
    if (!currentUser || !currentUser.uid || !currentProjectId) {
      toast.error("Authentication required or no project selected. Cannot delete pin.");
      return;
    }
    if (!window.confirm("Are you sure you want to delete this pin?")) return;
    try {
      const pinDocRef = doc(getProjectPinsCollection(currentUser.uid, currentProjectId), villageId.toString());
      await deleteDoc(pinDocRef); // Use deleteDoc from firebase/firestore
      setSelectedVillage(null);
      toast.success("Pin deleted successfully");
    } catch (err: any) {
      toast.error("Failed to delete pin: " + err.message);
    }
  };

  const handleModalClose = () => {
    setEditingVillage(null);
    setAddingVillage(false);
    setNewVillageCoords(null);
    setTempSearchMarker(null);
    onLocationFoundForModal(null);
  };


const handleGeoSearchLocationFound = React.useCallback((event: any) => {
    // Console log the entire event object to inspect its structure
    console.log("geosearch/showlocation event received:", event);

    // Try accessing properties directly from event, not event.location
    const locationData = event; // Assume location data is directly the event object

    // Common alternative: sometimes it's `event.result` or `event.location`
    // const locationData = event.location || event.result || event;


    if (!locationData || typeof locationData.x === 'undefined' || typeof locationData.y === 'undefined' || typeof locationData.label === 'undefined') {
        console.error("Invalid location data received from geosearch event:", locationData);
        toast.error("Location search failed or returned invalid data.");
        return; // Exit if data is invalid
    }

    const latlng: [number, number] = [locationData.y, locationData.x]; // Use locationData directly
    console.log("Setting tempSearchMarker to:", { latlng, address: locationData.label });
    setTempSearchMarker({ latlng, address: locationData.label });
    onLocationFoundForModal({ lat: locationData.y, lng: locationData.x, address: locationData.label });
}, [onLocationFoundForModal]);


  useEffect(() => {
    if (!isSearchActive) {
      setTempSearchMarker(null);
      setAddingVillage(false);
      setNewVillageCoords(null);
    }
  }, [isSearchActive]);

  const handleSelectTempMarker = () => {
    if (!currentUser || !currentProjectId) {
      toast.error("Please log in and select a project to add pins from search.");
      return;
    }
    if (tempSearchMarker) {
      onLocationSelectedFromMapSearch({
        lat: tempSearchMarker.latlng[0],
        lng: tempSearchMarker.latlng[1],
        address: tempSearchMarker.address,
      });
      setNewVillageCoords(tempSearchMarker.latlng);
      setAddingVillage(true);
      setTempSearchMarker(null);
    }
  };


  if (error) {
    return <div className="text-red-600 p-4">Error: {error}</div>;
  }

  // Show loading indicator if still loading data for map
  if (isLoading) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-gray-100/50 z-[1000]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // If no current project, display a message or direct user
  if (!currentProjectId) {
    return (
        <div className="flex justify-center items-center h-full w-full bg-gray-100 text-lg text-gray-700 text-center p-4">
            No project selected. Please select or create a project using the sidebar.
        </div>
    );
  }


  return (
    <div className="relative h-full w-full"> {/* Ensure container fills available space */}
      <button
        className="fixed bottom-24 md:bottom-6 right-3 z-[1000] flex items-center bg-green-600 text-white rounded-full shadow-lg px-4 py-4 transition-all duration-300 group hover:pr-8 hover:rounded-full "
        onClick={() => {
          if (!currentUser || !currentProjectId) {
            toast.error("Please log in and select a project to add pins.");
            return;
          }
          setAddingVillage(true);
          setNewVillageCoords(null);
          setTempSearchMarker(null);
          onLocationFoundForModal(null);
        }}
        style={{ minWidth: 56, minHeight: 56 }}
      >
        <span className="flex items-center justify-center w-6 h-6 text-2xl transition-all duration-300">
          <FiPlus />
        </span>
        <span className="overflow-hidden max-w-0 group-hover:max-w-xs group-hover:ml-3 transition-all duration-300 whitespace-nowrap">
          Add New Pins
        </span>
      </button>

      <MapContainer
        center={[22.68411, 77.26887]}
        zoom={11}
        className={`h-screen w-full z-10 ${
          (addingVillage && !newVillageCoords && !tempSearchMarker) ? "cursor-crosshair" : ""
        }`}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />

        <GeoSearchControlManager
            isActive={isSearchActive}
            onLocationFound={handleGeoSearchLocationFound}
            onVisibilityChange={onSearchControlVisibilityChange}
            currentMarkerLocation={tempSearchMarker ? tempSearchMarker.latlng : null}
            onRequestModalClose={onRequestModalClose}
        />
        
        {addingVillage && !newVillageCoords && !tempSearchMarker && (
          <>
            <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-[1001] bg-yellow-100 border border-yellow-400 text-yellow-800 px-4 py-2 rounded shadow">
              Click on the map to select the new village location
            </div>
            <AddVillageOnMap onSelect={setNewVillageCoords} />
          </>
        )}

        {tempSearchMarker && (
          
            <Marker
                position={tempSearchMarker.latlng}
                eventHandlers={{
                    click: handleSelectTempMarker,
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

        {displayVillages.map((village) => (
          <Marker
            key={village.id}
            position={village.coords}
            icon={createIcon(village.status)}
            eventHandlers={{
              click: () => {
                setSelectedVillage(village);
                setEditingVillage(null);
              },
            }}
          >
            {selectedVillage?.id === village.id && (
              <Popup
                position={village.coords}
                eventHandlers={{
                  remove: () => setSelectedVillage(null),
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

      {(editingVillage || (addingVillage && newVillageCoords)) && (
        <EditVillageModal
          village={
            editingVillage || {
              // FIX: Convert Date.now() to a string for the ID
              id: Date.now().toString(), // <--- CHANGE THIS LINE
              projectId: currentProjectId!, // This is correct, ensure it's a string
              name: "",
              tehsil: "",
              coords: newVillageCoords!,
              population: 0,
              status: "not-visited",
              parents: [],
              notes: "",
              // Make sure other optional fields are initialized as per VillageType if your form expects them
              lastVisit: undefined,
              interactionHistory: undefined,
              nextVisitTarget: undefined,
              parentsName: undefined,
              parentsContact: undefined,
            }
          }
          onClose={handleModalClose}
          onSave={handleSaveVillage}
          currentUserUid={currentUser?.uid ?? null}
          currentProjectId={currentProjectId}
        />
      )}

      <ToastContainer
        position="top-center"
        autoClose={2000}
        icon={<FiCheckCircle className="text-green-500 w-6 h-6" />}
        toastClassName={() =>
          "flex items-center gap-2 rounded-lg bg-white/90 shadow-lg border border-green-200 px-4 py-2 min-h-0 text-sm sm:text-base"
        }
        style={{ top: "4em", left: "2em", minWidth: 0, width: "auto", maxWidth: "90vw" }}
      />
    </div>
  );
}