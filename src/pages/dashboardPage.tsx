// src/pages/dashboardPage.tsx
import React, { useEffect, useState, useMemo } from "react";
import { onSnapshot } from "firebase/firestore";
import { getProjectPinsCollection } from "../services/firebase";
import { Village } from "../types/village";
import StatsCards from "../features/Dashboard/components/StatsCards";
import VillageChart from "../features/Dashboard/components/VillageChart";
import VisitCalendar from "../features/Dashboard/components/VisitCalendar";
import ActivityLog from "../features/Dashboard/components/ActivityLog";
import VillageList from "../features/Dashboard/components/VillageList";
import { useMapSearch } from "../context/MapSearchContext";
import { Input } from "../components/ui/input";
import start from "../../public/start.json";
import Lottie from "lottie-react";
import {
  FiSearch,
  FiX,
  FiLoader,
  FiAlertTriangle,
  FiGrid,
  FiList,
} from "react-icons/fi";
import { AnimatePresence, motion } from "framer-motion";

type ViewMode = "grid" | "list";

export default function DashboardPage() {
  const [villages, setVillages] = useState<Village[]>([]);
  const [loadingVillages, setLoadingVillages] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<
    "all" | "visited" | "planned" | "not-visited"
  >("all");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  const { currentUser, currentProjectId, loadingProjects, userProjects } =
    useMapSearch();

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    if (currentUser && currentUser.uid && currentProjectId) {
      setLoadingVillages(true);
      setError(null);
      try {
        const pinsCollection = getProjectPinsCollection(
          currentUser.uid,
          currentProjectId
        );
        unsubscribe = onSnapshot(
          pinsCollection,
          (snap) => {
            const data = snap.docs.map((doc) => {
              const docData = doc.data();
              return {
                id: doc.id,
                projectId: currentProjectId,
                name: docData.name || "",
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
          },
          (err: any) => {
            console.error("Dashboard: Error fetching villages:", err);
            setError("Failed to load dashboard data.");
            setLoadingVillages(false);
          }
        );
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
      const matchSearch =
        search.trim() === "" ||
        v.name.toLowerCase().includes(search.toLowerCase());
      const matchFilter = filter === "all" || v.status === filter;
      return matchSearch && matchFilter;
    });
  }, [villages, search, filter]);

  const renderContent = () => {
    if (loadingProjects || loadingVillages) {
      return (
        <div className="flex flex-col justify-center items-center h-full w-full text-gray-600">
          <FiLoader className="animate-spin h-12 w-12 text-cyan-400 mb-4" />
          <p className="text-lg font-semibold text-gray-25">
            Loading dashboard...
          </p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col justify-center items-center h-full w-full bg-red-900/20 rounded-2xl p-8 text-center ring-1 ring-red-500/50">
          <FiAlertTriangle className="h-12 w-12 text-red-400 mb-4" />
          <p className="text-xl font-semibold text-gray-600 mb-2">
            Error loading data!
          </p>
          <p className="text-red-300">{error} Please try again later.</p>
        </div>
      );
    }

    if (!currentUser) {
      return (
        <div className="flex flex-col justify-center items-center h-full w-full text-center">
          <p className="text-2xl font-semibold text-gray-600 mb-4">
            Access Denied
          </p>
          <p className="text-gray-500">Please log in to view your dashboard.</p>
        </div>
      );
    }

    if (!currentProjectId) {
      return (
        <div className="flex flex-col justify-center items-center h-full w-full text-center p-4">
          <Lottie animationData={start} className="w-48 h-48" />
          <p className="text-2xl font-semibold mb-2 text-gray-600">
            Welcome to Your Dashboard!
          </p>
          <p className="text-lg max-w-md text-gray-500">
            Select a project from the sidebar, or create a new one to get
            started.
          </p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1  gap-8">
        <aside className="">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="bg-white rounded-2xl p-5 shadow-sm">
              <div className="relative w-full">
                <FiSearch
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                  size={20}
                />
                <Input
                  type="search"
                  placeholder="Search Locations by Name..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-12 pr-10 py-3 rounded-xl border-gray-300 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 text-gray-800 placeholder-gray-500"
                  aria-label="Search Locations by Name"
                />
                {search && (
                  <button
                    type="button"
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-full p-1"
                    onClick={() => setSearch("")}
                    aria-label="Clear search"
                  >
                    <FiX size={20} />
                  </button>
                )}
              </div>
 
              <h2 className="text-xl font-semibold mb-4 text-gray-800">
                
              </h2>
              <StatsCards
                villages={villages}
                currentFilter={filter}
                setFilter={setFilter}
              />
            </div>
          </motion.div>
        </aside>
        <main className="">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className=" bg-white rounded-2xl p-6 shadow-sm"
            >
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                Coverage Status
              </h2>
              <VillageChart villages={filteredVillages} />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className=" bg-white rounded-2xl p-6 shadow-sm"
            >
              <VisitCalendar villages={filteredVillages} />
            </motion.div>



            <AnimatePresence>
              {viewMode === "grid" ? (
                <motion.div
                  key="grid"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="grid gap-6"
                >
                  <VillageList villages={filteredVillages} />
                </motion.div>
              ) : (
                <motion.div
                  key="list"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-white rounded-2xl p-6 shadow-sm"
                >
                  <ActivityLog villages={filteredVillages} />
                </motion.div>
              )}
            </AnimatePresence>

        </div>
        </main>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100 text-gray-800 p-4 sm:p-6 lg:p-8">
      <div className="relative max-w-screen-2xl mx-auto z-10">
        <header className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
            Project Dashboard
          </h1>
          <p className="mt-2 text-lg text-gray-600">
            An overview of your progress for project:{" "}
            <span className="font-semibold text-blue-600">
              {userProjects.find((p) => p.id === currentProjectId)?.name ||
                "..."}
            </span>
          </p>
        </header>

        {renderContent()}
      </div>
    </div>
  );
}
