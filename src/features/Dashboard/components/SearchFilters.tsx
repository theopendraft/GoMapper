//searchfilter.tsx
import React, { useState, useEffect } from "react";
import { Input } from "../../../components/ui/input";
import { Button } from "../../../components/ui/button";

export default function SearchFilters({
  search,
  setSearch,
  filter,
  setFilter,
  // Assuming you might pass counts down in the future
  // filterCounts = { all: 0, visited: 0, planned: 0, not_visited: 0 },
}: {
  search: string;
  setSearch: (v: string) => void;
  filter: "all" | "visited" | "planned" | "not_visited";
  setFilter: (v: "all" | "visited" | "planned" | "not_visited") => void;
  // filterCounts?: { [key: string]: number };
}) {
  const [inputValue, setInputValue] = useState(search);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setSearch(inputValue);
    }, 300); // 300ms debounce delay

    return () => {
      clearTimeout(handler);
    };
  }, [inputValue, setSearch]);

  // Sync internal input value with external search prop
  useEffect(() => {
    setInputValue(search);
  }, [search]);

  const displayFilterName = (s: string) => {
    return s.replace("_", " ").split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-md mb-6"> {/* Increased padding, softer shadow, more mb */}
      <div className="relative mb-4"> {/* Added relative for potential clear button positioning */}
        <Input
          placeholder="Search pins..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          className="pr-10" // Make space for a clear button if added
        />
        {inputValue && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setInputValue("")}
            className="absolute right-2 top-1/2 -translate-y-1/2 h-auto px-2 py-1"
            aria-label="Clear search"
          >
            &times; {/* Simple 'x' for clear */}
          </Button>
        )}
      </div>
      <div className="grid md:grid-cols-4 grid-cols-2 sm:grid-cols-2 gap-3" role="group" aria-label="Filter pins by status"> {/* Adjusted grid for smaller screens, gap between buttons */}
        {["all", "visited", "planned", "not_visited"].map((s) => (
          <Button
            key={s}
            variant={filter === s ? "default" : "outline"}
            onClick={() => setFilter(s as any)}
            className="w-full text-sm" // Ensure buttons take full width of their grid column, consistent text size
          >
            {displayFilterName(s)}
            {/* {filterCounts[s] !== undefined && ` (${filterCounts[s]})`} */} {/* Example for displaying counts */}
          </Button>
        ))}
      </div>
    </div>
  );
}