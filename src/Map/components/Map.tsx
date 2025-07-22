// src/components/map/components/Map.tsx
import React, { useEffect, useState, useMemo, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMapEvent,
  useMap, // NEW: Hook to access the Leaflet map instance
} from "react-leaflet";
import L from "leaflet";
import {
  collection,
  onSnapshot,
  doc,
  setDoc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "../../services/firebase";
import { EditVillageModal } from "../../components/modals/EditVillageModal";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FiPlus, FiCheckCircle } from "react-icons/fi";
import debounce from "lodash/debounce";

// NEW: Import GeoSearch stuff
import { GeoSearchControl, OpenStreetMapProvider } from 'leaflet-geosearch';
import 'leaflet-geosearch/dist/geosearch.css';

// Fix for default marker icon issue in Leaflet with bundlers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});


// Types (keep as is)
export type Parent = {
  name: string;
  contact: string;
};

export type Village = {
  id: string | number;
  name: string;
  tehsil: string;
  coords: [number, number];
  population: number;
  status: "visited" | "planned" | "not-visited" | string;
  lastInteraction?: string;
  nextVisitTarget?: string;
  notes?: string;
  parents: Parent[];
};

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
  // NEW PROPS for search integration
  isSearchActive: boolean; // Indicates if the search modal is open
  isMapSearchControlVisible: boolean; // Added missing prop for mapPage.tsx usage
  onLocationSelectedFromMapSearch: (location: { lat: number; lng: number; address: string }) => void;
  onSearchControlVisibilityChange: (isVisible: boolean) => void; // To tell App.tsx if control is visible
  onLocationFoundForModal: (location: { lat: number; lng: number; address: string } | null) => void;
  onRequestModalClose: () => void;
}

// Village Popup Component (keep as is)
const VillagePopup: React.FC<{
  village: Village;
  onEdit: () => void;
  onDelete: () => void;
}> = ({ village, onEdit, onDelete }) => (
  <div className="min-w-[200px]">
    <h3 className="font-bold text-lg">{village.name}</h3>
    <p>Status: {village.status}</p>
    <p>Last Interaction: {village.lastInteraction || "N/A"}</p>
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

// Add Village Component (keep as is)
const AddVillageOnMap: React.FC<{
  onSelect: (coords: [number, number]) => void;
}> = ({ onSelect }) => {
  useMapEvent("click", (e) => {
    onSelect([e.latlng.lat, e.latlng.lng]);
  });
  return null;
};

// NEW: Component to manage the GeoSearchControl lifecycle
const GeoSearchControlManager: React.FC<{
    isActive: boolean;
    // Keep this type signature for onLocationFound, it's correct for the data you want
    onLocationFound: (location: { x: number; y: number; label: string; raw: any }) => void;
    onVisibilityChange: (isVisible: boolean) => void;
    currentMarkerLocation: [number, number] | null; // Pass current marker location
    onRequestModalClose: () => void; // Added new prop
}> = ({ isActive, onLocationFound, onVisibilityChange, currentMarkerLocation, onRequestModalClose }) => {
    const map = useMap(); // Get the Leaflet map instance
    const searchControlRef = useRef<any>(null); // Ref to store the search control instance

    // Define the event handler for 'geosearch/showlocation' outside useEffect
    // to ensure a stable reference for `map.off` cleanup.
    // It takes the Leaflet event object and extracts the `location` property.
    const geoSearchEventHandler = React.useCallback((event: any) => {
        onLocationFound(event.location);
    }, [onLocationFound]);


   // EFFECT 1: Add/Remove GeoSearchControl
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

    // EFFECT 2: Adjust map view
    useEffect(() => {
        if (isActive && currentMarkerLocation && map) {
            map.setView(currentMarkerLocation, 14);
        }
    }, [isActive, currentMarkerLocation, map]);


    // FIX: Redefine handleClickOutside to accept LeafletMouseEvent
    const handleClickOutside = React.useCallback((e: L.LeafletMouseEvent) => { // <-- Change 'MouseEvent' to 'L.LeafletMouseEvent'
        if (!isActive || !searchControlRef.current) {
            return; // Should theoretically be caught by useEffect dependency, but good for safety
        }

        const searchControlElement = searchControlRef.current.getContainer(); // Get the DOM element

        // Access the original DOM event for the contains check
        const originalEventTarget = e.originalEvent.target as Node;

        // Check if the click occurred outside the search bar element
        // And ensure the click target is part of the map container (to avoid clicks on other UI elements outside map but on same page triggering it)
        if (searchControlElement &&
            !searchControlElement.contains(originalEventTarget) &&
            map.getContainer().contains(originalEventTarget)
        ) {
            console.log("Clicked outside search bar. Requesting modal closure.");
            onRequestModalClose(); // Request the parent (context) to close the modal
        }
    }, [isActive, map, onRequestModalClose]); // Dependencies for useCallback


    // EFFECT 3: Handle outside click to hide the search bar
    useEffect(() => {
        // Only attach listener if search is active (and control is presumably rendered)
        if (!isActive) { // No need for searchControlRef.current here, as handleClickOutside handles it
            return;
        }

        // Add the click listener to the map
        map.on('click', handleClickOutside);

        // Clean up the click listener when the component unmounts or `isActive` changes
        return () => {
            map.off('click', handleClickOutside);
        };
    }, [isActive, map, handleClickOutside]); // Add handleClickOutside to dependencies


    // Adjust map view if a new search result comes in
    useEffect(() => {
        if (isActive && currentMarkerLocation && map) {
            map.setView(currentMarkerLocation, 14); // Adjust zoom as needed
        }
    }, [isActive, currentMarkerLocation, map]);


    return null;
};



export default function Map({
  search,
  filter,
  isSearchActive,
  isMapSearchControlVisible,
  onLocationSelectedFromMapSearch,
  onSearchControlVisibilityChange,
  onLocationFoundForModal, // NEW: Callback to update modal's state
  onRequestModalClose,
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

  // NEW: State for temporary marker from search
  const [tempSearchMarker, setTempSearchMarker] = useState<{ latlng: [number, number]; address: string } | null>(null);


  // Debounced search (keep as is)
  const [debouncedSearch, setDebouncedSearch] = useState(search);

  useEffect(() => {
    const handler = debounce(() => {
      setDebouncedSearch(search);
    }, 300);

    handler();

    return () => {
      handler.cancel();
    };
  }, [search]);

  // Firestore live sync with error handling (keep as is)
  useEffect(() => {
    let unsubscribe: () => void;
    try {
      unsubscribe = onSnapshot(
        collection(db, "villages"),
        (snapshot) => {
          const villages = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as Village[];
          setVillagesState(villages);
          setIsLoading(false);
        },
        (err) => {
          setError("Failed to fetch villages");
          setIsLoading(false);
          toast.error("Error loading villages");
        }
      );
    } catch (err) {
      setError("Failed to initialize data sync");
      setIsLoading(false);
      toast.error("Error initializing data sync");
    }

    return () => unsubscribe?.();
  }, []);

  // Filter villages with memoization (keep as is)
  const displayVillages = useMemo(() => {
    const searchLower = debouncedSearch.toLowerCase();
    return villagesState.filter((v) => {
      const matchSearch = v.name.toLowerCase().includes(searchLower);
      const matchFilter = filter === "all" || v.status === filter;
      return matchSearch && matchFilter;
    });
  }, [villagesState, debouncedSearch, filter]);

  const handleEditClick = (village: Village) => {
    setEditingVillage(village);
    setSelectedVillage(null);
  };

  const handleSaveVillage = async (updatedVillage: Village) => {
    try {
      await setDoc(
        doc(db, "villages", updatedVillage.id.toString()),
        updatedVillage
      );
      setEditingVillage(null);
      setAddingVillage(false);
      setNewVillageCoords(null);
      setTempSearchMarker(null); // Clear temporary search marker
      setSelectedVillage(updatedVillage);
      toast.success("Village updated successfully");
      onLocationFoundForModal(null); // Clear the message in the modal
    } catch (err) {
      toast.error("Failed to save village");
    }
  };

  const handleDeleteVillage = async (villageId: string | number) => {
    if (!window.confirm("Are you sure you want to delete this village?")) return;
    try {
      await deleteDoc(doc(db, "villages", villageId.toString()));
      setSelectedVillage(null);
      toast.success("Village deleted successfully");
    } catch (err) {
      toast.error("Failed to delete village");
    }
  };

  const handleModalClose = () => {
    setEditingVillage(null);
    setAddingVillage(false);
    setNewVillageCoords(null);
    setTempSearchMarker(null); // Clear temporary search marker
    onLocationFoundForModal(null); // Clear the message in the modal
  };


  // NEW: Callback for when GeoSearchControl finds a location
  const handleGeoSearchLocationFound = React.useCallback((event: any) => {
    const location = event.location;
    const latlng: [number, number] = [location.y, location.x];
    setTempSearchMarker({ latlng, address: location.label });
    onLocationFoundForModal({ lat: location.y, lng: location.x, address: location.label }); // Update modal state
  }, [onLocationFoundForModal]);


  // NEW: Effect to clear temporary marker when search modal closes
  useEffect(() => {
    if (!isSearchActive) {
      setTempSearchMarker(null);
      // Also clear other related states if modal is closed
      setAddingVillage(false);
      setNewVillageCoords(null);
    }
  }, [isSearchActive]);

  // NEW: Function to handle selecting the temporary marker
  const handleSelectTempMarker = () => {
    if (tempSearchMarker) {
      onLocationSelectedFromMapSearch({
        lat: tempSearchMarker.latlng[0],
        lng: tempSearchMarker.latlng[1],
        address: tempSearchMarker.address,
      });
      setNewVillageCoords(tempSearchMarker.latlng); // Set coords for the new village
      setAddingVillage(true); // Trigger new village add flow
      setTempSearchMarker(null); // Clear temp marker after selection
    }
  };


  if (error) {
    return <div className="text-red-600 p-4">Error: {error}</div>;
  }

  return (
    <div className="relative">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100/50 z-[1000]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      )}
      
      <button
        className="fixed bottom-24 md:bottom-6 right-3 z-[1000] flex items-center bg-green-600 text-white rounded-full shadow-lg px-4 py-4 transition-all duration-300 group hover:pr-8 hover:rounded-full "
        onClick={() => {
          setAddingVillage(true);
          setNewVillageCoords(null);
          setTempSearchMarker(null); // Clear temporary search marker
          onLocationFoundForModal(null); // Clear message in modal
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
          (addingVillage && !newVillageCoords && !tempSearchMarker) ? "cursor-crosshair" : "" // Only crosshair if adding via click
        }`}
        // The whenCreated prop is not needed anymore since we are using useMap hook in GeoSearchControlManager
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />

        {/* NEW: Render the GeoSearchControlManager component */}
        <GeoSearchControlManager
            isActive={isSearchActive}
            onLocationFound={handleGeoSearchLocationFound}
            onVisibilityChange={onSearchControlVisibilityChange}
            currentMarkerLocation={tempSearchMarker ? tempSearchMarker.latlng : null}
            onRequestModalClose={onRequestModalClose}
            
        />
        
        {/* Only show AddVillageOnMap when explicitly in "add new pins" mode and no coords yet from search */}
        {addingVillage && !newVillageCoords && !tempSearchMarker && (
          <>
            <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-[1001] bg-yellow-100 border border-yellow-400 text-yellow-800 px-4 py-2 rounded shadow">
              Click on the map to select the new village location
            </div>
            <AddVillageOnMap onSelect={setNewVillageCoords} />
          </>
        )}

        {/* NEW: Render temporary search marker */}
        {tempSearchMarker && (
            <Marker
                position={tempSearchMarker.latlng}
                eventHandlers={{
                    click: handleSelectTempMarker, // Click the marker to select
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
              id: Date.now(),
              name: "",
              tehsil: "",
              coords: newVillageCoords!,
              population: 0,
              status: "not-visited",
              parents: [],
              notes: "",
            }
          }
          onClose={handleModalClose}
          onSave={handleSaveVillage}
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