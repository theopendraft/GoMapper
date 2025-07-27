// src/pages/dashboardPage.tsx
import React, { useEffect, useState, useMemo } from "react";
import { onSnapshot } from "firebase/firestore";
import { db, getProjectPinsCollection } from "../services/firebase";
import { Village } from "../types/village";
import StatsCards from "../features/Dashboard/components/StatsCards";
import VillageChart from "../features/Dashboard/components/VillageChart";
import VisitCalendar from "../features/Dashboard/components/VisitCalendar";
import ActivityLog from "../features/Dashboard/components/ActivityLog";
import VillageList from "../features/Dashboard/components/VillageList";
import { useMapSearch } from "../context/MapSearchContext";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FiCheckCircle, FiSearch, FiX } from "react-icons/fi"; // Added FiSearch and FiX for search input
import { Input } from "../components/ui/input"; // Assuming you have a reusable Input component

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
      const matchSearch = search.trim() === "" || v.name.toLowerCase().includes(search.toLowerCase());
      const matchFilter = filter === "all" || v.status === filter;
      return matchSearch && matchFilter;
    });
  }, [villages, search, filter]);

  // Conditional Rendering for loading/error/no project
  if (loadingProjects || loadingVillages) {
    return (
      <div className="flex flex-col justify-center items-center flex-grow h-full bg-gray-100 pt-24 md:pt-28 pb-6">
        <svg className="animate-spin h-12 w-12 text-blue-500 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p className="text-lg font-semibold text-gray-700">Loading dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col justify-center items-center flex-grow h-full bg-gray-100 p-4 text-center pt-24 md:pt-28 pb-6">
        <p className="text-xl font-semibold text-red-600 mb-4">Error loading data!</p>
        <p className="text-gray-700">{error} Please try again later.</p>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="flex flex-col justify-center items-center flex-grow h-full bg-gray-100 p-4 text-center pt-24 md:pt-28 pb-6">
        <p className="text-xl font-semibold text-gray-700 mb-4">Access Denied</p>
        <p className="text-gray-600">Please log in to view your dashboard.</p>
      </div>
    );
  }

  if (!currentProjectId) {
    return (
      <div className="flex flex-col justify-center items-center flex-grow h-full bg-gray-100 p-4 text-center pt-24 md:pt-28 pb-6">
        <p className="text-xl font-semibold text-gray-700 mb-4">No Project Selected</p>
        <p className="text-gray-600">Please select or create a project using the sidebar to view its dashboard.</p>
      </div>
    );
  }

  return (
    <div className="px-6 py-8 bg-gray-100 min-h-[calc(100vh-theme(spacing.16))] md:min-h-[calc(100vh-theme(spacing.20))] space-y-6 pb-20">
      <h1 className="text-3xl md:text-4xl font-extrabold text-gray-700 mb-8">
        Dashboard:{" "}
        {userProjects.find((p) => p.id === currentProjectId)?.name ||
          "Current Project"}
      </h1>

      {/* Search Input - Modernized */}
      <div className="bg-white p-5 rounded-xl shadow-lg mb-6">
        <div className="relative w-full">
          <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <Input
            type="search"
            placeholder="Search Pins by Name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-10 py-3 rounded-xl border border-gray-300 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-800 placeholder-gray-400"
            aria-label="Search Pins by Name"
            spellCheck={false}
            autoComplete="off"
          />
          {search && (
            <button
              type="button"
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-full p-1"
              onClick={() => setSearch("")}
              aria-label="Clear search"
            >
              <FiX size={20} />
            </button>
          )}
        </div>
      </div>

      {/* Stats Cards - Wrapped in a consistent card container */}
      <div className="bg-white p-6 rounded-xl shadow-lg">
        <StatsCards
          villages={villages} // Pass all fetched villages to StatsCards
          currentFilter={filter} // Pass current active filter
          setFilter={setFilter} // Pass setter to allow StatsCards to change filter
        />
      </div>

      {/* Charts and Calendars */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <VillageChart villages={filteredVillages} />
        </div>
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <VisitCalendar villages={filteredVillages} />
        </div>
      </div>

      {/* Activity Log and Village List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <ActivityLog villages={filteredVillages} />
        </div>
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <VillageList villages={filteredVillages} />
        </div>
      </div>

      <ToastContainer
        position="top-center"
        autoClose={2000}
        icon={<FiCheckCircle className="text-green-500 w-6 h-6" />}
        toastClassName={() =>
          "flex items-center gap-2 rounded-lg bg-white/90 shadow-lg border border-green-200 px-4 py-2 min-h-0 text-sm sm:text-base text-gray-800"
        }
        style={{
          top: "5.5em", // Adjusted for Navbar height
          left: "2em",
          minWidth: 0,
          width: "auto",
          maxWidth: "90vw",
        }}
      />
    </div>
  );
}