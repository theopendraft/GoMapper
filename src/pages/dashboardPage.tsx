// src/pages/dashboardPage.tsx
import React, { useEffect, useState, useMemo } from "react";
import { onSnapshot } from "firebase/firestore";
import { db, getProjectPinsCollection } from "../services/firebase";
import { Village } from "../types/village";
import StatsCards from "../features/Dashboard/components/StatsCards"; // Corrected import (now accepts filter props)
// import SearchFilters from "../features/Dashboard/components/SearchFilters"; // REMOVE THIS IMPORT
import VillageChart from "../features/Dashboard/components/VillageChart";
import VisitCalendar from "../features/Dashboard/components/VisitCalendar";
import ActivityLog from "../features/Dashboard/components/ActivityLog";
import VillageList from "../features/Dashboard/components/VillageList";
import { useMapSearch } from "../context/MapSearchContext";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function DashboardPage() {
  const [villages, setVillages] = useState<Village[]>([]);
  const [loadingVillages, setLoadingVillages] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<
    "all" | "visited" | "planned" | "not-visited"
  >("all");

  const { currentUser, currentProjectId, loadingProjects, userProjects } = useMapSearch();

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
            console.error("Dashboard: Error fetching villages:", err);
            setError("Failed to load dashboard data.");
            setLoadingVillages(false);
        });
      } catch (err: any) {
        console.error("Dashboard: Error initializing data sync:", err);
        setError("Failed to initialize dashboard data.");
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
        Loading dashboard...
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
        Please log in to view your dashboard.
      </div>
    );
  }

  if (!currentProjectId) {
    return (
      <div className="flex flex-col justify-center items-center h-[calc(100vh-64px)] w-full text-gray-700 bg-gray-100 p-4 text-center">
        <p className="text-xl font-semibold mb-4">No project selected.</p>
        <p>Please select or create a project using the sidebar to view its dashboard.</p>
      </div>
    );
  }


  return (
    <div className="p-6 bg-gray-100 min-h-screen space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">📊 Dashboard: {userProjects.find(p => p.id === currentProjectId)?.name || "Current Project"}</h1>

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

      {/* The rest of the dashboard sections will use 'filteredVillages' */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <VillageChart villages={filteredVillages} />
        <VisitCalendar villages={filteredVillages} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <VillageList villages={filteredVillages} />
        <ActivityLog villages={filteredVillages} />
        
      </div>
      {/* <ToastContainer
        position="top-center"
        autoClose={2000}
        icon={<FiCheckCircle className="text-green-500 w-6 h-6" />}
        toastClassName={() =>
          "flex items-center gap-2 rounded-lg bg-white/90 shadow-lg border border-green-200 px-4 py-2 min-h-0 text-sm sm:text-base"
        }
        style={{ top: "4em", left: "2em", minWidth: 0, width: "auto", maxWidth: "90vw" }}
      /> */}
    </div>
  );
}