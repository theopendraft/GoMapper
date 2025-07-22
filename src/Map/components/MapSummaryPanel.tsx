// src/components/MapSummaryPanel.tsx
import React, { useEffect, useState, useMemo, useRef } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../../services/firebase";
// Assuming Village is exported from Map.tsx, adjust path if needed
import type { Village } from "./Map";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import {
  FiSearch,
  FiX,
  FiDownload,
  // FiPlus, // Not used for actions in this panel now
} from "react-icons/fi";
import { TfiMenuAlt } from "react-icons/tfi"; // This icon is used for toggle
import { useLocation } from "react-router-dom";

type Props = {
  search: string;
  setSearch: React.Dispatch<React.SetStateAction<string>>;
  filter: "all" | "visited" | "planned" | "not-visited";
  setFilter: React.Dispatch<
    React.SetStateAction<"all" | "visited" | "planned" | "not-visited">
  >;
  // onAddVillage?: () => void; // This prop seems commented out in usage, remove if not needed
  isOpen: boolean; // Prop from parent (MapWithPanel)
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>; // Callback to update parent
  // If MapSummaryPanel needs to display villages that are specific to the current map view
  // or filtered differently than Map.tsx, you might pass a `villages` prop here,
  // but currently, it fetches its own.
};

export default function MapSummaryPanel({
  search,
  setSearch,
  filter,
  setFilter,
  // onAddVillage, // Remove if not used
  isOpen, // Prop from parent
  setIsOpen, // Callback to parent
}: Props) {
  const [villages, setVillages] = useState<Village[]>([]);
  const [showAll, setShowAll] = useState(false);
  const [loading, setLoading] = useState(true);
  // Synchronize local panelOpen state with prop `isOpen`
  const [panelOpen, setPanelOpen] = useState(isOpen);

  // Width resize state & refs
  const panelRef = useRef<HTMLDivElement>(null);
  const resizerRef = useRef<HTMLDivElement>(null);
  const isResizing = useRef(false);
  const startX = useRef(0);
  const startWidth = useRef(0);

  const location = useLocation();

  // EFFECT 1: Synchronize local `panelOpen` state with the `isOpen` prop
  // This ensures that external changes to `isOpen` (e.g., from MapPage) reflect in the panel
  useEffect(() => {
    setPanelOpen(isOpen);
  }, [isOpen]);


  useEffect(() => {
    const unsub = onSnapshot(collection(db, "villages"), (snap) => {
      const data = snap.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as any),
      }));
      setVillages(data as Village[]);
      setLoading(false);
    });
    return () => {
      unsub();
    };
  }, []);

  // EFFECT 2: Close summary panel when navigating away from /map
  // or initial load on /map (ensure it's closed by default)
  useEffect(() => {
    if (location.pathname !== "/map") { // If we navigate away from the map page
        setPanelOpen(false);
        setIsOpen(false);
    }
    // If you want it always closed when first landing on /map,
    // you might add a check here, but the `isOpen` prop already controls initial state.
  }, [location.pathname, setIsOpen]);


  // Resize handlers
  useEffect(() => {
    function onMouseMove(e: MouseEvent) {
      if (!isResizing.current || !panelRef.current) return;
      const dx = e.clientX - startX.current;
      const newWidth = Math.min(Math.max(startWidth.current + dx, 220), 600); // Min 220px, Max 600px
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
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };
  }, []);

  function onMouseDown(e: React.MouseEvent) {
    if (!panelRef.current) return; // <-- Existing null check
    isResizing.current = true;
    startX.current = e.clientX;
    startWidth.current = panelRef.current.offsetWidth; // <-- This line is fine because of the `if` above
    document.body.style.cursor = "ew-resize";
    document.body.style.userSelect = "none";
  }

  // Filtered villages
  const filteredVillages = useMemo(() => {
    return villages.filter(
      (v) =>
        v.name.toLowerCase().includes(search.toLowerCase()) &&
        (filter === "all" || v.status === filter)
    );
  }, [villages, search, filter]);

  // Stats
  const stats = useMemo(
    () => ({
      total: villages.length,
      visited: villages.filter((v) => v.status === "visited").length,
      planned: villages.filter((v) => v.status === "planned").length,
      notVisited: villages.filter((v) => v.status === "not-visited").length,
    }),
    [villages]
  );

  // Export to CSV
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
    // Only add listener if panel is open and not currently resizing
    if (!panelOpen) return; // Only attach listener when panel is open

    function handleClickOutside(event: MouseEvent) {
      // Check if click is outside the panelRef and not on the toggle button itself (if it's outside panelRef)
      // And ensure we are not currently resizing the panel
      const isClickOutsidePanel = panelRef.current && !panelRef.current.contains(event.target as Node);
      const isClickOnToggleButton = (event.target as HTMLElement).closest('button[aria-label="Open Summary Panel"], button[aria-label="Close Summary Panel"]');

      if (isClickOutsidePanel && !isResizing.current && !isClickOnToggleButton) {
        setPanelOpen(false);
        setIsOpen(false); // Close the panel in the parent component as well
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [panelOpen, setIsOpen]); // Include setIsOpen in dependencies, and re-run when panelOpen changes

  console.log("MapSummaryPanel - panelOpen:", panelOpen, "isOpen (prop):", isOpen);


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
        fixed bottom-[165px] md:bottom-[90px] right-3
        z-50
        ${
          panelOpen
            ? "p-5 h-[80vh] w-12 md:w-[360px] rounded-xl " // Expanded state
            : "h-8 w-14 items-center justify-center p-0 rounded-full" // Collapsed state (circular button)
        }
        ${!panelOpen ? "overflow-hidden" : "overflow-y-auto"}
      `}
      style={{
        // FIX: Add a null check here for panelRef.current
        width: panelOpen
          ? (panelRef.current?.offsetWidth || 360) + "px" // Use optional chaining (?.) and a fallback value (360)
          : "3.5rem", // Default to 3.5rem (56px) when collapsed
        minWidth: panelOpen ? "220px" : "3.5rem",
        maxWidth: panelOpen ? "600px" : "3.5rem",
        minHeight: panelOpen ? "300px" : "3.5rem",
        height: panelOpen ? "80vh" : "3.5rem", // Control height for collapse
        userSelect: isResizing.current ? "none" : "auto",
        display: "flex", // Keep display flex for alignment
      }}
      aria-label="Map summary panel"
    >
      {/* Toggle Button */}
      {/* Position the button correctly for both states */}
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
            {" "}
            {/* Added mt-4 to prevent overlap with button */}
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
              of <span className="font-semibold">{villages.length}</span> Pins
            </div>

            <ul className="overflow-y-auto space-y-3 max-h-full flex-1 min-h-0">
              {loading ? (
                <li
                  className="text-gray-400 text-center py-6 select-none"
                  aria-live="polite"
                  aria-busy="true"
                >
                  Loading villages...
                </li>
              ) : filteredVillages.length === 0 ? (
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