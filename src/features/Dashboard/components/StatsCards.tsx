// src/features/Dashboard/components/StatsCards.tsx
import React from "react";
import { Village, VillageStatus } from "../../../types/village"; // Ensure Village and VillageStatus are correctly imported

// Define the Props for StatsCards
// It now also needs the current filter and the setter for the filter
type Props = {
  villages: Village[];
  currentFilter: "all" | VillageStatus; // Track the currently active filter
  setFilter: (filterValue: "all" | VillageStatus) => void; // Callback to set the filter
};

export default function StatsCards({ villages, currentFilter, setFilter }: Props) {
  const total = villages.length;
  const visited = villages.filter((v) => v.status === "visited").length;
  const planned = villages.filter((v) => v.status === "planned").length;
  const notVisited = villages.filter((v) => v.status === "not-visited").length; // Use 'not-visited'

  // Define the stats cards, including their associated filter value
  const stats = [
    { label: "Total Pins", value: total, color: "bg-blue-100 text-blue-700", filterValue: "all" as "all" | VillageStatus },
    { label: "Visited", value: visited, color: "bg-green-100 text-green-700", filterValue: "visited" as "all" | VillageStatus },
    { label: "Planned", value: planned, color: "bg-yellow-100 text-yellow-700", filterValue: "planned" as "all" | VillageStatus },
    { label: "Not Visited", value: notVisited, color: "bg-red-100 text-red-700", filterValue: "not-visited" as "all" | VillageStatus },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4"> {/* Responsive grid */}
      {stats.map(({ label, value, color, filterValue }) => (
        <button
          key={label}
          onClick={() => setFilter(filterValue)} // Set the filter on click
          className={`
            ${color} p-4 rounded-lg shadow-md text-center
            flex flex-col items-center justify-center
            cursor-pointer transform transition-all duration-200 ease-in-out
            hover:scale-105 hover:shadow-lg 
            focus:outline-none focus:ring-0 focus:ring-offset-0
            ${currentFilter === filterValue ? 'ring-0 ring-offset-0 ring-blue-500' : ''} // Highlight active filter
          `}
          aria-pressed={currentFilter === filterValue}
          aria-label={`Filter by ${label}`}
        >
          <div className="text-sm font-medium">{label}</div>
          <div className="text-3xl font-bold mt-1">{value}</div> {/* Increased font size for value */}
        </button>
      ))}
    </div>
  );
}