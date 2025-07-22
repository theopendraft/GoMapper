// src/components/MapWithPanel.tsx
import React, { useState, useEffect } from "react";
import Map from "./Map"; // Corrected import path for Map
import MapSummaryPanel from "./MapSummaryPanel";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../../services/firebase";
import type { Village } from "./Map"; // Import Village type if exported from Map.tsx


// FIX: Add onRequestModalClose to MapWithPanelProps interface
interface MapWithPanelProps {
  search: string;
  setSearch: React.Dispatch<React.SetStateAction<string>>;
  filter: "all" | "visited" | "planned" | "not-visited";
  setFilter: React.Dispatch<React.SetStateAction<"all" | "visited" | "planned" | "not-visited">>;

  isSearchActive: boolean;
  isMapSearchControlVisible: boolean;
  onLocationSelectedFromMapSearch: (location: { lat: number; lng: number; address: string }) => void;
  onSearchControlVisibilityChange: (isVisible: boolean) => void;
  onLocationFoundForModal: (location: { lat: number; lng: number; address: string } | null) => void;
  onRequestModalClose: () => void; // <--- ADD THIS LINE
}


// FIX: Accept onRequestModalClose in the functional component's props
export default function MapWithPanel({
  search,
  setSearch,
  filter,
  setFilter,
  isSearchActive,
  isMapSearchControlVisible,
  onLocationSelectedFromMapSearch,
  onSearchControlVisibilityChange,
  onLocationFoundForModal,
  onRequestModalClose, // <--- ACCEPT IT HERE
}: MapWithPanelProps) { // <-- Use the new interface

  const [villages, setVillages] = useState<Village[]>([]); // Keep if needed for MapSummaryPanel
  const [isOpen, setIsOpen] = useState(false); // This seems related to MapSummaryPanel's open state


  // If MapSummaryPanel (or anything else in MapWithPanel) needs `villages` data:
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "villages"), (snapshot) => {
      const data = snapshot.docs.map((doc) => {
        const docData = doc.data();
        return {
          id: Number(doc.id),
          name: docData.name,
          tehsil: docData.tehsil,
          coords: docData.coords as [number, number],
          population: docData.population,
          status: docData.status,
          parents: Array.isArray(docData.parents)
            ? docData.parents.map((p: any) =>
                typeof p === "string"
                  ? { name: p, contact: "" }
                  : { name: p.name ?? "", contact: p.contact ?? "" }
              )
            : [],
        } as Village;
      });
      setVillages(data); // This updates the 'villages' state in MapWithPanel
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className="flex h-screen z-[1001]">
      <MapSummaryPanel
        search={search}
        setSearch={setSearch}
        filter={filter}
        setFilter={setFilter}
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        // If MapSummaryPanel needs 'villages', pass it here:
        // villages={villages}
      />
      <div className="flex-1">
        <Map
          search={search}
          filter={filter}
          isSearchActive={isSearchActive}
          isMapSearchControlVisible={isMapSearchControlVisible}
          onLocationSelectedFromMapSearch={onLocationSelectedFromMapSearch}
          onSearchControlVisibilityChange={onSearchControlVisibilityChange}
          onLocationFoundForModal={onLocationFoundForModal}
          onRequestModalClose={onRequestModalClose} // <--- PASS IT DOWN HERE
        />
      </div>
    </div>
  );
}