// src/components/MapSummaryPanel.tsx
import React, { useEffect, useState, useMemo, useRef } from "react";
import { onSnapshot } from "firebase/firestore";
import { db, getProjectPinsCollection } from "../../services/firebase";
import type { Village } from "../../types/village";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import { FiSearch, FiX, FiDownload } from "react-icons/fi";
import { TfiMenuAlt } from "react-icons/tfi"; // Open button icon
import { useLocation } from "react-router-dom";
import { User } from "firebase/auth";
import { Drawer } from "vaul";

// Props for the MapSummaryPanel component
type Props = {
  search: string;
  setSearch: (search: string) => void;
  filter: "all" | "visited" | "planned" | "not-visited";
  setFilter: (filter: "all" | "visited" | "planned" | "not-visited") => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  currentUser: User | null;
  currentProjectId: string | null;
};

type PanelContentProps = {
  search: string;
  setSearch: (search: string) => void;
  filter: "all" | "visited" | "planned" | "not-visited";
  setFilter: (filter: "all" | "visited" | "planned" | "not-visited") => void;
  currentUser: User | null;
  currentProjectId: string | null;
};

const PanelContent: React.FC<PanelContentProps> = ({
  search,
  setSearch,
  filter,
  setFilter,
  currentUser,
  currentProjectId,
}) => {
  const [villages, setVillages] = useState<Village[]>([]);
  const [showAll, setShowAll] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch villages based on currentUser and currentProjectId props
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    if (currentUser && currentUser.uid && currentProjectId) {
      setLoading(true);
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
                parents: Array.isArray(docData.parents)
                  ? docData.parents.map((p: any) =>
                      typeof p === "string"
                        ? { name: p, contact: "" }
                        : { name: p.name ?? "", contact: p.contact ?? "" }
                    )
                  : [],
                lastVisit: docData.lastVisit || undefined,
                tehsil: docData.tehsil || undefined,
                population: docData.population || undefined,
                interactionHistory: docData.interactionHistory || undefined,
                nextVisitTarget: docData.nextVisitTarget || undefined,
                notes: docData.notes || undefined,
                parentsName: docData.parentsName || undefined,
                parentsContact: docData.parentsContact || undefined,
              } as Village;
            });
            setVillages(data);
            setLoading(false);
          },
          (err: any) => {
            console.error("Error fetching villages for summary panel:", err);
            setLoading(false);
          }
        );
      } catch (err: any) {
        console.error("Error initializing summary panel data sync:", err);
        setLoading(false);
      }
    } else {
      setVillages([]);
      setLoading(false);
    }
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [currentUser, currentProjectId]);

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
      [
        "Name",
        "Tehsil",
        "Status",
        "Population",
        "Coords",
        "Last Visit",
        "Next Visit Target",
        "Notes",
        "Parents (Name, Contact)",
      ],
      ...filteredVillages.map((v) => [
        v.name,
        v.tehsil || "",
        v.status.replace("-", " "),
        v.population ?? "",
        v.coords ? v.coords.join(",") : "",
        v.lastVisit || "",
        v.nextVisitTarget || "",
        v.notes || "",
        v.parents
          ?.map((p) => `${p.name}${p.contact ? ` (${p.contact})` : ""}`)
          .join("; ") || "",
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

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center flex-grow text-gray-500 py-6 opacity-100 transition-opacity duration-300">
        <svg
          className="animate-spin h-8 w-8 text-blue-500 mb-2"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
        Loading pins...
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-grow w-full opacity-100 transition-opacity duration-300 delay-150 p-4 ">
      {/* Header */}
      <div className="flex items-center justify-between mt-4 mb-4">
        <h2 className="text-2xl font-bold text-gray-700 tracking-tight select-none">
          Map Summary
        </h2>
      </div>
      {/* Search */}
      <div className="relative w-full mb-4">
        <Input
          type="search"
          placeholder="Search Pins..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pr-10 bg-gray-50 placeholder-gray-400 text-gray-700 rounded-xl border border-gray-300 shadow-sm focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition"
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
        className="grid grid-cols-2 gap-3 w-full mb-4"
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
                    hover:border-blue-400 min-h-[48px] rounded-xl
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
            <span className="inline-block bg-white/80 text-xs px-2 py-0.5 rounded-full border border-gray-200 font-normal">
              {opt.count}
            </span>
          </button>
        ))}
      </div>
      {/* Actions */}
      <div className="flex gap-2 mb-4 items-center justify-between">
        <Button
          className="flex-1 flex items-center justify-center gap-2 rounded-xl shadow-sm hover:shadow-md"
          variant="outline"
          onClick={handleExport}
          aria-label="Export village list as CSV"
          type="button"
        >
          <FiDownload /> Export
        </Button>
      </div>
      {/* Filtered List Preview */}
      <div className="flex flex-col flex-1 min-h-0 pb-10">
        <div className="text-xs text-gray-500 mb-6 select-none">
          Showing{" "}
          <span className="font-semibold">{filteredVillages.length}</span> of{" "}
          <span className="font-semibold">{villages.length}</span> Pins
        </div>

        <ul className="overflow-y-auto space-y-3 max-h-full flex-1 min-h-0 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
          {filteredVillages.length === 0 ? (
            <li
              className="text-gray-400 text-center py-6 select-none"
              aria-live="polite"
              aria-busy="false" // Should be false if no villages are found
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
                    <div className="font-semibold text-gray-700">{v.name}</div>
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
    </div>
  );
};

export default function MapSummaryPanel({
  search,
  setSearch,
  filter,
  setFilter,
  isOpen,
  setIsOpen,
  currentUser,
  currentProjectId,
}: Props) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const panelRef = useRef<HTMLDivElement>(null);
  const resizerRef = useRef<HTMLDivElement>(null);
  const isResizing = useRef(false);
  const startX = useRef(0);
  const startWidth = useRef(0);

  const location = useLocation();

  // EFFECT 1: Synchronize local `panelOpen` state with the `isOpen` prop (from parent)
  useEffect(() => {
    if (!isMobile) {
      setIsOpen(isOpen);
    }
  }, [isOpen, isMobile, setIsOpen]);

  // EFFECT 2: Close summary panel when navigating away from /map
  useEffect(() => {
    if (location.pathname !== "/map") {
      setIsOpen(false);
    }
  }, [location.pathname, setIsOpen]);

  // Resize handlers
  useEffect(() => {
    function onMouseMove(e: MouseEvent) {
      if (!isResizing.current || !panelRef.current) return;
      const dx = e.clientX - startX.current;
      const newWidth = Math.min(Math.max(startWidth.current - dx, 250), 600); // Adjusted min width
      panelRef.current.style.width = `${newWidth}px`;
    }
    function onMouseUp() {
      isResizing.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    }
    // Listeners on document for global drag
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

  const togglePanel = () => {
    setIsOpen(!isOpen);
  };

  // EFFECT 3: Close panel on outside click
  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(event: MouseEvent) {
      const isClickOutsidePanel =
        panelRef.current && !panelRef.current.contains(event.target as Node);
      const isClickOnToggleButton = (event.target as HTMLElement).closest(
        'button[aria-label="Open Summary Panel"], button[aria-label="Close Summary Panel"]'
      );

      if (
        isClickOutsidePanel &&
        !isResizing.current &&
        !isClickOnToggleButton
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, setIsOpen]);

  if (isMobile) {
    return (
      <Drawer.Root
        open={isOpen}
        onOpenChange={setIsOpen}
        snapPoints={[0.6, 0.96]}
      >
        <Drawer.Trigger asChild>
          <button
            className="fixed bottom-24 right-3 z-[1010] w-14 h-14 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg hover:scale-105 hover:shadow-2xl hover:bg-blue-700 active:scale-100 active:shadow-xl transition-all duration-300"
            aria-label="Open Summary Panel"
          >
            <TfiMenuAlt size={22} />
          </button>
        </Drawer.Trigger>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-black/40 z-[1010]" />
          <Drawer.Content className="bg-white flex flex-col rounded-t-[10px] fixed bottom-0 left-0 right-0 z-[1010]">
            <div className="p-4 pb-10 bg-white rounded-t-[10px] flex-1">
              <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-gray-300 mb-8" />
              <div className="max-w-md mx-auto">
                <Drawer.Title className="sr-only">Map Summary</Drawer.Title>
                <Drawer.Description className="sr-only">
                  A panel showing a summary of pins on the map, with filtering
                  and search capabilities.
                </Drawer.Description>
                <PanelContent
                  {...{
                    search,
                    setSearch,
                    filter,
                    setFilter,
                    currentUser,
                    currentProjectId,
                  }}
                />
              </div>
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    );
  }

  // Desktop Panel
  return (
    <aside
      ref={panelRef}
      className={`
        bg-white border shadow-xl flex flex-col
        transition-all duration-300 ease-in-out 
        fixed bottom-24 md:bottom-6 right-3 z-[1010] hover:scale-105
        ${
          isOpen
            ? "p-5 h-[63vh] md:h-[80vh] w-80 md:w-[360px] rounded-xl" // Expanded state
            : "h-14 w-14 items-center justify-center p-0 rounded-full" // Collapsed state
        }
        ${
          !isOpen ? "overflow-hidden" : "overflow-y-hidden"
        } // Hide overflow when collapsing, manage inner scroll when open
      `}
      style={{
        width: isOpen ? `${panelRef.current?.offsetWidth ?? 360}px` : "3.5rem",
        minWidth: isOpen ? "250px" : "3.5rem",
        maxWidth: isOpen ? "600px" : "3.5rem",
        minHeight: isOpen ? "300px" : "3.5rem",
        height: isOpen ? "63vh" : "3.5rem", // Adjusted height percentage
        userSelect: isResizing.current ? "none" : "auto",
      }}
      aria-label="Map summary panel"
    >
      {/* Toggle Button */}
      <button
        className={`
          transition-all duration-300 
          absolute z-50 rounded-full shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500
          ${
            isOpen
              ? "top-4 right-4 p-2 bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-800" // Expanded style
              : "inset-0 m-auto w-14 h-14 bg-blue-600 text-white hover:scale-105 hover:shadow-2xl hover:bg-blue-700 active:scale-100 active:shadow-xl " // Collapsed FAB style
          }
          flex items-center justify-center
        `}
        onClick={togglePanel}
        aria-label={isOpen ? "Close Summary Panel" : "Open Summary Panel"}
      >
        {isOpen ? <FiX size={22} /> : <TfiMenuAlt size={22} />}
      </button>

      {/* Inner Content - Only rendered and animated when panel is open */}
      {isOpen && (
        <PanelContent
          {...{
            search,
            setSearch,
            filter,
            setFilter,
            currentUser,
            currentProjectId,
          }}
        />
      )}

      {/* Drag Resizer */}
      {isOpen && (
        <div
          ref={resizerRef}
          onMouseDown={onMouseDown}
          className="absolute top-0 left-0 h-full w-2 cursor-ew-resize z-40" // Positioned on left edge for resizing
          aria-hidden="true"
          title="Drag to resize panel width"
        />
      )}
    </aside>
  );
}
