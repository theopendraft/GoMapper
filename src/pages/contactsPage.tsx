// src/pages/contactsPage.tsx
import React, { useEffect, useState, useMemo } from "react";
import { onSnapshot, setDoc, doc } from "firebase/firestore";
import { db, getProjectPinsCollection } from "../services/firebase";
import { Village } from "../types/village";
import ParentVillageCard from "../Parents/ParentVillageCard"; // Assuming this is correct path
import { Input } from "../components/ui/input"; // Assuming you need this for general input
import SearchFilters from "../features/Dashboard/components/SearchFilters"; // Assuming this path is correct
import StatsCards from "../features/Dashboard/components/StatsCards";
import { useMapSearch } from "../context/MapSearchContext";
import { toast } from 'react-toastify';
import { ToastContainer } from "react-toastify"; // Added ToastContainer
import "react-toastify/dist/ReactToastify.css"; // Correct CSS import
import {FiCheckCircle} from "react-icons/fi";

export default function ContactsPage() {
  const [villages, setVillages] = useState<Village[]>([]);
  const [loadingVillages, setLoadingVillages] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<
    "all" | "visited" | "planned" | "not-visited" // FIX: Consistent filter types
  >("all");

  const { currentUser, currentProjectId, loadingProjects, userProjects } = useMapSearch(); // Include userProjects

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    if (currentUser && currentUser.uid && currentProjectId) {
      setLoadingVillages(true);
      setError(null);
      try {
        const pinsCollection = getProjectPinsCollection(currentUser.uid, currentProjectId);
        unsubscribe = onSnapshot(pinsCollection, (snap) => {
          const data = snap.docs.map((doc) => {
            const docData = doc.data();
            return {
              id: doc.id,
              projectId: currentProjectId,
              name: docData.name || '',
              coords: docData.coords || [0, 0],
              status: docData.status || "not-visited",
              parents: docData.parents || [],
              lastVisit: docData.lastVisit || undefined,
              tehsil: docData.tehsil || undefined,
              population: docData.population || undefined,
              notes: docData.notes || undefined,
              interactionHistory: docData.interactionHistory || undefined,
              nextVisitTarget: docData.nextVisitTarget || undefined,
              parentsName: docData.parentsName || undefined,
              parentsContact: docData.parentsContact || undefined,
            } as Village;
          });
          setVillages(data);
          setLoadingVillages(false);
        }, (err: any) => {
            console.error("Contacts: Error fetching villages:", err);
            setError("Failed to load contacts data.");
            setLoadingVillages(false);
        });
      } catch (err: any) {
        console.error("Contacts: Error initializing data sync:", err);
        setError("Failed to initialize contacts data.");
        setLoadingVillages(false);
      }
    } else {
      setVillages([]);
      setLoadingVillages(false);
      setError(null);
    }
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [currentUser, currentProjectId]);

  const updateVillage = async (updated: Village) => {
    if (!currentUser || !currentUser.uid || !currentProjectId) {
      toast.error("Authentication or project not selected. Cannot update pin.");
      return;
    }
    try {
      const pinDocRef = doc(getProjectPinsCollection(currentUser.uid, currentProjectId), updated.id.toString());
      const villageToSave: Village = { ...updated, projectId: currentProjectId };
      await setDoc(pinDocRef, villageToSave);
      toast.success("Pin updated successfully");
    } catch (err: any) {
      console.error("Failed to update pin:", err);
      toast.error("Failed to update pin: " + err.message);
    }
  };

  const filteredVillages = useMemo(() => {
    return villages.filter((v) => {
      const matchSearch = search.trim() === "" || v.name.toLowerCase().includes(search.toLowerCase()); // Handle empty search
      const matchFilter = filter === "all" || v.status === filter;
      return matchSearch && matchFilter;
    });
  }, [villages, search, filter]);

  // Conditional Rendering for loading/error/no project
  if (loadingProjects || loadingVillages) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-64px)] w-full text-lg text-gray-700 bg-gray-100">
        <svg className="animate-spin h-10 w-10 text-blue-500 mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        Loading contacts...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-64px)] w-full text-red-600 bg-gray-100 p-4 text-center">
        Error: {error} Please try again later.
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-64px)] w-full text-gray-700 bg-gray-100 p-4 text-center">
        Please log in to view your contacts.
      </div>
    );
  }

  if (!currentProjectId) {
    return (
      <div className="flex flex-col justify-center items-center h-[calc(100vh-64px)] w-full text-gray-700 bg-gray-100 p-4 text-center">
        <p className="text-xl font-semibold mb-4">No project selected.</p>
        <p>Please select or create a project using the sidebar to view its contacts.</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-100 min-h-screen space-y-6">
      <h1 className="text-3xl font-bold mb-4 text-gray-800">👨‍👩‍👧 Contacts for "{userProjects.find(p => p.id === currentProjectId)?.name || "Current Project"}"</h1>

{/* Search Input - Moved to DashboardPage directly */}
      <div className="bg-white p-4 rounded-lg shadow-md mb-4">
        <input
          type="search"
          placeholder="Search Pins by Name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full p-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
        />
      </div>

      <StatsCards 
        villages={villages} // Pass all fetched villages to StatsCards
        currentFilter={filter} // Pass current active filter
        setFilter={setFilter} // Pass setter to allow StatsCards to change filter
      />

      {/* 📋 Results */}
      <div className="space-y-4 mt-4">
        {filteredVillages.length === 0 ? (
          <p className="text-sm text-gray-500 italic text-center py-4 mt-4">
            No matching records found.
          </p>
        ) : (
          filteredVillages.map((village) => (
            <ParentVillageCard
              key={village.id}
              village={village}
              onUpdate={updateVillage}
            />
          ))
        )}
      </div>
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