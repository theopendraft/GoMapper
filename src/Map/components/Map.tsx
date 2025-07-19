// Map/components/Map.tsx
import React, { useEffect, useState, useMemo } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMapEvent,
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

// Types
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
  villages: Village[];
  search: string;
  filter: "all" | "visited" | "planned" | "not-visited";
}

// Village Popup Component
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

// Add Village Component
const AddVillageOnMap: React.FC<{
  onSelect: (coords: [number, number]) => void;
}> = ({ onSelect }) => {
  useMapEvent("click", (e) => {
    onSelect([e.latlng.lat, e.latlng.lng]);
  });
  return null;
};

export default function Map({ search, filter }: Props) {
  const [selectedVillage, setSelectedVillage] = useState<Village | null>(null);
  const [editingVillage, setEditingVillage] = useState<Village | null>(null);
  const [addingVillage, setAddingVillage] = useState(false);
  const [newVillageCoords, setNewVillageCoords] = useState<
    [number, number] | null
  >(null);
  const [villagesState, setVillagesState] = useState<Village[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Debounced search
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

  // Firestore live sync with error handling
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

  // Filter villages with memoization
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
      setSelectedVillage(updatedVillage);
      toast.success("Village updated successfully");
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
        className="fixed bottom-24 md:bottom-6 right-3 z-[1000] flex items-center bg-green-600 text-white rounded-full shadow-lg px-4 py-4 transition-all duration-300 group hover:pr-8 hover:rounded-full"
        onClick={() => {
          setAddingVillage(true);
          setNewVillageCoords(null);
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
          addingVillage && !newVillageCoords ? "cursor-crosshair" : ""
        }`}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        
        {addingVillage && !newVillageCoords && (
          <>
            <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-[1001] bg-yellow-100 border border-yellow-400 text-yellow-800 px-4 py-2 rounded shadow">
              Click on the map to select the new village location
            </div>
            <AddVillageOnMap onSelect={setNewVillageCoords} />
          </>
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