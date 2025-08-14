// src/pages/contactsPage.tsx
import React, { useEffect, useState, useMemo } from "react";
import { onSnapshot, setDoc, doc } from "firebase/firestore";
import { getProjectPinsCollection } from "../services/firebase";
import { Village } from "../types/village";
import ParentVillageCard from "../Parents/ParentVillageCard";
import { Input } from "../components/ui/input";
import StatsCards from "../features/Dashboard/components/StatsCards";
import { useMapSearch } from "../context/MapSearchContext";
import { useSnackbar } from "../context/SnackbarContext";
import { FiSearch, FiX, FiLoader, FiAlertTriangle } from "react-icons/fi";
import start from "../../public/start.json";
import Lottie from "lottie-react";
import { AnimatePresence, motion } from "framer-motion";

export default function ContactsPage() {
  const [villages, setVillages] = useState<Village[]>([]);
  const [loadingVillages, setLoadingVillages] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<
    "all" | "visited" | "planned" | "not-visited"
  >("all");

  const { currentUser, currentProjectId, loadingProjects, userProjects } =
    useMapSearch();
  const { showSnackbar } = useSnackbar();

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
            console.error("Contacts: Error fetching villages:", err);
            setError("Failed to load contacts data.");
            setLoadingVillages(false);
          }
        );
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
      showSnackbar({
        message: "Authentication or project not selected. Cannot update pin.",
        severity: "error",
      });
      return;
    }
    try {
      const pinDocRef = doc(
        getProjectPinsCollection(currentUser.uid, currentProjectId),
        updated.id.toString()
      );

      // Create a deep copy to avoid mutating the state directly
      const villageToSave = JSON.parse(JSON.stringify(updated));

      // Firestore doesn't allow 'undefined'. We must clean the object.
      // This function recursively cleans the object.
      const cleanObject = (obj: any) => {
        Object.keys(obj).forEach((key) => {
          if (obj[key] && typeof obj[key] === "object") {
            cleanObject(obj[key]);
          } else if (obj[key] === undefined) {
            obj[key] = null; // Or delete obj[key];
          }
        });
        return obj;
      };

      const cleanedVillage = cleanObject(villageToSave);

      await setDoc(pinDocRef, cleanedVillage);
      showSnackbar({
        message: "Pin updated successfully",
        severity: "success",
      });
    } catch (err: any) {
      console.error("Failed to update pin:", err);
      showSnackbar({ message: "Failed to update pin", severity: "error" });
    }
  };

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
        <div className="flex flex-col justify-center items-center h-full w-full text-gray-700">
          <FiLoader className="animate-spin h-12 w-12 text-blue-500 mb-4" />
          <p className="text-lg font-semibold text-gray-600">
            Loading contacts...
          </p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col justify-center items-center h-full w-full bg-red-50 rounded-2xl p-8 text-center border border-red-200">
          <FiAlertTriangle className="h-12 w-12 text-red-500 mb-4" />
          <p className="text-xl font-semibold text-red-700 mb-2">
            Error loading data!
          </p>
          <p className="text-red-600">{error} Please try again later.</p>
        </div>
      );
    }

    if (!currentUser) {
      return (
        <div className="flex flex-col justify-center items-center h-full w-full text-center">
          <p className="text-2xl font-semibold text-gray-800 mb-4">
            Access Denied
          </p>
          <p className="text-gray-500">Please log in to view your contacts.</p>
        </div>
      );
    }

    if (!currentProjectId) {
      return (
        <div className="flex flex-col justify-center items-center h-full w-full text-center p-4">
          <Lottie animationData={start} className="w-48 h-48" />
          <p className="text-2xl font-semibold mb-2 text-gray-800">
            Welcome to Your Project!
          </p>
          <p className="text-lg max-w-md text-gray-600">
            Select a project from the sidebar, or create a new one to get
            started and see your contacts here.
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
                  placeholder="Search Contacts by Name..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-12 pr-10 py-3 rounded-xl border-gray-300 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 text-gray-800 placeholder-gray-500"
                  aria-label="Search Contacts by Name"
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

        <main className=" ">
          <AnimatePresence>
            {filteredVillages.length > 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
              >
                {filteredVillages.map((village, index) => (
                  <motion.div
                    key={village.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                  >
                    <ParentVillageCard
                      village={village}
                      onUpdate={updateVillage}
                    />
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="flex flex-col items-center justify-center h-full min-h-[400px] bg-white rounded-2xl p-8 text-center shadow-lg"
              >
                <FiSearch size={48} className="text-gray-400 mb-4" />
                <h3 className="text-2xl font-semibold text-gray-800">
                  No Contacts Found
                </h3>
                <p className="text-gray-500 mt-2 max-w-sm">
                  Your search for "{search}" with the filter "{filter}" did not
                  return any results.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100 text-gray-800 p-4 sm:p-6 lg:p-8">
      <div className="relative max-w-screen-2xl mx-auto z-10">
        <header className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
            Project Contacts
          </h1>
          <p className="mt-2 text-lg text-gray-600">
            Manage all contacts for project:{" "}
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
