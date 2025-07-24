// src/components/MapSummaryPanel.tsx
import React, { useEffect, useState, useMemo, useRef } from "react";
import { onSnapshot } from "firebase/firestore";
import { db, getProjectPinsCollection } from "../../services/firebase";
// Import your Village type from types/village.ts, as MapSummaryPanel now uses it directly
import type { Village } from "../../types/village";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import {
  FiSearch,
  FiX,
  FiDownload,
} from "react-icons/fi";
import { TfiMenuAlt } from "react-icons/tfi";
import { useLocation } from "react-router-dom";
// NEW: Import User type from Firebase Auth
import { User } from 'firebase/auth';
// No need to import useMapSearch here, as currentUser/currentProjectId are passed as props
// import { useMapSearch } from '../../context/MapSearchContext'; 

// FIX: Update Props interface to include currentUser and currentProjectId
type Props = {
  search: string;
  setSearch: React.Dispatch<React.SetStateAction<string>>;
  filter: "all" | "visited" | "planned" | "not-visited";
  setFilter: React.Dispatch<
    React.SetStateAction<"all" | "visited" | "planned" | "not-visited">
  >;
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  // NEW PROPS: currentUser and currentProjectId
  currentUser: User | null;
  currentProjectId: string | null;
};

export default function MapSummaryPanel({
  search,
  setSearch,
  filter,
  setFilter,
  isOpen,
  setIsOpen,
  // FIX: Accept currentUser and currentProjectId from props
  currentUser,
  currentProjectId,
}: Props) {
  const [villages, setVillages] = useState<Village[]>([]);
  const [showAll, setShowAll] = useState(false);
  const [loading, setLoading] = useState(true); // Loading state for the panel's data
  const [panelOpen, setPanelOpen] = useState(isOpen); // Local state for panel open/close

  // Removed direct useMapSearch() call here as currentUser/currentProjectId are now props.
  // const { currentUser, currentProjectId } = useMapSearch();

  // Width resize state & refs
  const panelRef = useRef<HTMLDivElement>(null);
  const resizerRef = useRef<HTMLDivElement>(null);
  const isResizing = useRef(false);
  const startX = useRef(0);
  const startWidth = useRef(0);

  const location = useLocation();

  // EFFECT 1: Synchronize local `panelOpen` state with the `isOpen` prop
  useEffect(() => {
    setPanelOpen(isOpen);
  }, [isOpen]);


  // FIX: Fetch villages based on currentUser and currentProjectId props
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    // Only fetch if a user is logged in AND a project is selected
    if (currentUser && currentUser.uid && currentProjectId) {
      setLoading(true); // Start loading when query changes
      try {
        const pinsCollection = getProjectPinsCollection(currentUser.uid, currentProjectId);
        unsubscribe = onSnapshot(pinsCollection, (snap) => {
          const data = snap.docs.map((doc) => {
            const docData = doc.data();
            // Ensure all required fields for Village are present and correctly typed
            return {
              id: doc.id, // Firestore doc.id is a string
              projectId: currentProjectId, // Ensure projectId is included
              name: docData.name || '',
              coords: docData.coords || [0, 0],
              status: docData.status || "not-visited",
              parents: Array.isArray(docData.parents)
                ? docData.parents.map((p: any) =>
                    // Ensure Parent type consistency
                    typeof p === "string"
                      ? { name: p, contact: "" }
                      : { name: p.name ?? "", contact: p.contact ?? "" }
                  )
                : [],
              // Include all other optional properties from your Village type, providing defaults if necessary
              lastVisit: docData.lastVisit || undefined,
              tehsil: docData.tehsil || undefined,
              population: docData.population || undefined,
              interactionHistory: docData.interactionHistory || undefined,
              nextVisitTarget: docData.nextVisitTarget || undefined,
              notes: docData.notes || undefined,
              parentsName: docData.parentsName || undefined, // These might be redundant if parents array is used
              parentsContact: docData.parentsContact || undefined, // These might be redundant if parents array is used
            } as Village;
          });
          setVillages(data);
          setLoading(false);
        }, (err: any) => {
            console.error("Error fetching villages for summary panel:", err);
            setLoading(false);
        });
      } catch (err: any) {
        console.error("Error initializing summary panel data sync:", err);
        setLoading(false);
      }
    } else {
      // If no user or no project selected, clear pins and set loading to false
      setVillages([]);
      setLoading(false);
    }
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [currentUser, currentProjectId]); // Depend on currentUser and currentProjectId props


  // EFFECT 2: Close summary panel when navigating away from /map
  useEffect(() => {
    if (location.pathname !== "/map") {
      setPanelOpen(false);
      setIsOpen(false);
    }
  }, [location.pathname, setIsOpen]);


  // Resize handlers (keep as is)
  useEffect(() => {
    function onMouseMove(e: MouseEvent) {
      if (!isResizing.current || !panelRef.current) return;
      const dx = e.clientX - startX.current;
      const newWidth = Math.min(Math.max(startWidth.current + dx, 220), 600);
      panelRef.current.style.width = `${newWidth}px`;
    }
    function onMouseUp() {
      isResizing.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    }
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
    return () => {
      document.removeEventListener("mousemove", onMouseUp);
      document.removeEventListener("mouseup", onMouseUp);
    };
  }, []);

  function onMouseDown(e: React.MouseEvent) {
    if (!panelRef.current) return;
    isResizing.current = true;
    startX.current = e.clientX;
    startWidth.current = panelRef.current.offsetWidth;
    document.body.style.cursor = "ew-resize";
    document.body.style.userSelect = "none";
  }

  // Filtered villages (rely on the fetched 'villages' state)
  const filteredVillages = useMemo(() => {
    return villages.filter(
      (v) =>
        v.name.toLowerCase().includes(search.toLowerCase()) &&
        (filter === "all" || v.status === filter)
    );
  }, [villages, search, filter]);

  // Stats (rely on the fetched 'villages' state)
  const stats = useMemo(
    () => ({
      total: villages.length,
      visited: villages.filter((v) => v.status === "visited").length,
      planned: villages.filter((v) => v.status === "planned").length,
      notVisited: villages.filter((v) => v.status === "not-visited").length,
    }),
    [villages]
  );

  // Export to CSV (rely on filteredVillages)
  const handleExport = () => {
    const csvRows = [
      ["Name", "Tehsil", "Status", "Population", "Coords"],
      ...filteredVillages.map((v) => [
        v.name,
        v.tehsil || "",
        v.status.replace("-", " "),
        v.population ?? "",
        v.coords ? v.coords.join(",") : "",
      ]),
    ];
    const csvContent = csvRows
      .map((row) =>
        row.map((field) => `"${String(field).replace(/"/g, '""')}"`).join(",")
      )
      .join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "villages.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  function getStatusBadgeClasses(status: Village["status"]) {
    return (
      "mt-1 sm:mt-0 inline-block px-2 py-0.5 rounded-full text-xs font-medium " +
      (status === "visited"
        ? "bg-green-100 text-green-700"
        : status === "planned"
        ? "bg-yellow-100 text-yellow-700"
        : "bg-red-100 text-red-700")
    );
  }

  const togglePanel = () => {
    setPanelOpen((prev) => {
      const newState = !prev;
      setIsOpen(newState); // Crucial: Update the parent state
      return newState;
    });
  };

  // EFFECT 3: Close panel on outside click
  useEffect(() => {
    if (!panelOpen) return;

    function handleClickOutside(event: MouseEvent) {
      const isClickOutsidePanel = panelRef.current && !panelRef.current.contains(event.target as Node);
      const isClickOnToggleButton = (event.target as HTMLElement).closest('button[aria-label="Open Summary Panel"], button[aria-label="Close Summary Panel"]');

      if (isClickOutsidePanel && !isResizing.current && !isClickOnToggleButton) {
        setPanelOpen(false);
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [panelOpen, setIsOpen]);

  console.log("MapSummaryPanel - panelOpen:", panelOpen, "isOpen (prop):", isOpen);

  // Conditional rendering for content inside panel when closed/no project/loading
  if (!currentUser || !currentProjectId) {
    // Render the collapsed button, but disabled, with a helpful title
    return (
      <aside
        ref={panelRef}
        className={`
          bg-white border shadow-lg flex flex-col
          fixed bottom-4 md:bottom-[90px] right-3 z-50
          h-14 w-14 items-center justify-center p-0 rounded-full
          transition-all duration-300 ease-in-out
        `}
        style={{
          width: '3.5rem',
          minWidth: '3.5rem',
          maxWidth: '3.5rem',
          minHeight: '3.5rem',
          height: '3.5rem',
          userSelect: isResizing.current ? "none" : "auto",
          display: "flex",
        }}
        aria-label="Map summary panel (collapsed)"
      >
        <button
          className="transition-colors duration-300 absolute inset-0 m-auto w-14 h-14 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-800 flex items-center justify-center z-50"
          onClick={togglePanel} // Still allow opening
          aria-label={panelOpen ? "Close Summary Panel" : "Open Summary Panel"}
          disabled={!currentUser || !currentProjectId} // Disable if no user or project
          title={!currentUser ? "Login to view summary" : !currentProjectId ? "Select a project to view summary" : "Open Summary Panel"}
        >
          <TfiMenuAlt size={22} />
        </button>
      </aside>
    );
  }

  // If loading data for the current project
  if (loading) {
    return (
      <aside
        ref={panelRef}
        className={`
          bg-white border shadow-lg flex flex-col
          fixed bottom-4 md:bottom-[90px] right-3 z-[1010]
          h-14 w-14 items-center justify-center p-0 rounded-full
          transition-all duration-300 ease-in-out
          ${panelOpen ? "p-5 h-[80vh] w-12 md:w-[360px] rounded-xl overflow-y-auto" : "items-center justify-center"}
        `}
        style={{
          width: panelOpen ? (panelRef.current?.offsetWidth ?? 360) + 'px' : '3.5rem',
          minWidth: panelOpen ? "220px" : "3.5rem",
          maxWidth: panelOpen ? "600px" : "3.5rem",
          minHeight: panelOpen ? "300px" : "3.5rem",
          height: panelOpen ? "80vh" : "3.5rem",
          userSelect: isResizing.current ? "none" : "auto",
          display: "flex",
        }}
        aria-label="Map summary panel"
      >
        <button
          className={`
            transition-colors duration-300 absolute z-50 rounded-full
            bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-800
            flex items-center justify-center
            ${panelOpen ? "top-4 right-4 p-2" : "inset-0 m-auto w-14 h-14"}
          `}
          onClick={togglePanel}
          aria-label={panelOpen ? "Close Summary Panel" : "Open Summary Panel"}
        >
          <TfiMenuAlt size={22} />
        </button>
        {panelOpen && (
          <div className="flex flex-col items-center justify-center flex-grow text-gray-400 py-6">
            <svg className="animate-spin h-8 w-8 text-gray-400 mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Loading pins...
          </div>
        )}
      </aside>
    );
  }


  return (
    <aside
      ref={panelRef}
      className={`
        bg-white
        border
        shadow-lg
        flex
        flex-col
        gap-6
        transition-all
        duration-300 ease-in-out
        fixed bottom-4 md:bottom-[90px] right-3
        z-50
        ${
          panelOpen
            ? "p-5 h-[80vh] w-12 md:w-[360px] rounded-xl " // Expanded state
            : "h-14 w-14 items-center justify-center p-0 rounded-full" // Collapsed state (circular button)
        }
        ${!panelOpen ? 'overflow-hidden' : 'overflow-y-auto'}
      `}
      style={{
        width: panelOpen
          ? `${(panelRef.current?.offsetWidth ?? 360)}px`
          : '3.5rem',
        minWidth: panelOpen ? "220px" : "3.5rem",
        maxWidth: panelOpen ? "600px" : "3.5rem",
        minHeight: panelOpen ? "300px" : "3.5rem",
        height: panelOpen ? "80vh" : "3.5rem",
        userSelect: isResizing.current ? "none" : "auto",
        display: "flex",
      }}
      aria-label="Map summary panel"
    >
      {/* Toggle Button */}
      <button
        className={`
          transition-colors duration-300
          absolute z-50 rounded-full
          bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-800
          flex items-center justify-center
          ${panelOpen ? "top-4 right-4 p-2" : "inset-0 m-auto w-14 h-14"}
        `}
        onClick={togglePanel}
        aria-label={panelOpen ? "Close Summary Panel" : "Open Summary Panel"}
      >
        <TfiMenuAlt size={22} />
      </button>

      {panelOpen && (
        <>
          {/* Header */}
          <div className="flex items-center justify-between mt-4">
            <h2 className="text-[15pt] font-semibold text-gray-900 tracking-tight select-none">
              Map Summary
            </h2>
          </div>

          {/* Search */}
          <div className="relative w-full">
            <Input
              type="search"
              placeholder="Search Pins..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pr-10 bg-gray-50 placeholder-gray-400 text-gray-900 rounded-xl border border-gray-300 shadow-sm focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition"
              aria-label="Search Pins"
              spellCheck={false}
              autoComplete="off"
            />
            {search ? (
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                onClick={() => setSearch("")}
                aria-label="Clear search"
              >
                <FiX size={18} />
              </button>
            ) : (
              <FiSearch
                size={18}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none select-none"
                aria-hidden="true"
              />
            )}
          </div>

          {/* Status Filter & Stats Combined */}
          <div
            className="grid grid-cols-2 gap-3 w-full"
            role="group"
            aria-label="Filter villages by status"
          >
            {[
              {
                label: "All",
                value: "all",
                color: "bg-gray-200 text-gray-700",
                count: stats.total,
              },
              {
                label: "Visited",
                value: "visited",
                color: "bg-green-100 text-green-700",
                count: stats.visited,
              },
              {
                label: "Planned",
                value: "planned",
                color: "bg-yellow-100 text-yellow-700",
                count: stats.planned,
              },
              {
                label: "Not Visited",
                value: "not-visited",
                color: "bg-red-100 text-red-700",
                count: stats.notVisited,
              },
            ].map((opt) => (
              <button
                key={opt.value}
                className={`
                  flex flex-row items-center justify-between p-3
                  hover:border-blue-400
                  min-h-[48px] rounded-xl
                  text-sm font-semibold transition
                  focus:outline-none focus:ring-2 focus:ring-blue-400
                  ${
                    filter === opt.value
                      ? `${opt.color} ring-2 ring-blue-400 shadow`
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200 "
                  }
                `}
                onClick={() => setFilter(opt.value as any)}
                aria-pressed={filter === opt.value}
                type="button"
              >
                <span>{opt.label}</span>
                <span className="mt-1 inline-block bg-white/80 text-xs px-2 py-0.5 rounded-full border border-gray-200 font-normal">
                  {opt.count}
                </span>
              </button>
            ))}
          </div>

          {/* Actions */}
          <div className="flex gap-2 mt-2 items-center justify-between">
            <Button
              className="flex-1 flex items-center justify-center gap-2"
              variant="outline"
              onClick={handleExport}
              aria-label="Export village list as CSV"
              type="button"
            >
              <FiDownload /> Export
            </Button>
          </div>

          {/* Filtered List Preview */}
          <div className="mt-2 flex flex-col flex-1 min-h-0">
            <div className="text-xs text-gray-500 mb-1 select-none">
              Showing{" "}
              <span className="font-semibold">{filteredVillages.length}</span>{" "}
              of <span className="font-semibold">{villages.length}</span>{" "}
              Pins
            </div>

            <ul className="overflow-y-auto space-y-3 max-h-full flex-1 min-h-0">
              {/* Removed internal loading state check for this part, as overall 'loading' handles it */}
              {filteredVillages.length === 0 ? (
                <li
                  className="text-gray-400 text-center py-6 select-none"
                  aria-live="polite"
                  aria-busy="true"
                >
                  No villages found. Try adjusting your search or filters.
                </li>
              ) : (
                (showAll ? filteredVillages : filteredVillages.slice(0, 5)).map(
                  (v) => (
                    <li
                      key={v.id}
                      className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between shadow hover:bg-blue-50 transition select-text"
                      tabIndex={0}
                    >
                      <div className="flex flex-col gap-1">
                        <div className="font-semibold text-gray-900">
                          {v.name}
                        </div>
                        <div className="text-xs text-gray-500 flex flex-wrap gap-3">
                          {v.tehsil && <span>Tehsil: {v.tehsil}</span>}
                          {typeof v.population === "number" && (
                            <span>Pop: {v.population.toLocaleString()}</span>
                          )}
                        </div>
                      </div>
                      <span
                        className={getStatusBadgeClasses(v.status)}
                        aria-label={`Status: ${v.status.replace("-", " ")}`}
                      >
                        {v.status === "visited"
                          ? "Visited"
                          : v.status === "planned"
                          ? "Planned"
                          : "Not Visited"}
                      </span>
                    </li>
                  )
                )
              )}
              {!loading && filteredVillages.length > 5 && !showAll && (
                <li className="text-center mt-3 select-none">
                  <button
                    className="text-blue-600 hover:underline text-sm font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500 rounded"
                    onClick={() => setShowAll(true)}
                    type="button"
                    aria-label={`Show all ${filteredVillages.length} villages`}
                  >
                    Show all ({filteredVillages.length})
                  </button>
                </li>
              )}
              {!loading && showAll && filteredVillages.length > 5 && (
                <li className="text-center mt-3 select-none">
                  <button
                    className="text-blue-600 hover:underline text-sm font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500 rounded"
                    onClick={() => setShowAll(false)}
                    type="button"
                    aria-label="Show less villages"
                  >
                    Show less
                  </button>
                </li>
              )}
            </ul>
          </div>
        </>
      )}

      {/* Drag Resizer */}
      {panelOpen && (
        <div
          ref={resizerRef}
          onMouseDown={onMouseDown}
          className="absolute top-0 right-0 h-full w-1 cursor-ew-resize z-40"
          aria-hidden="true"
          title="Drag to resize panel width"
        />
      )}
    </aside>
  );
}