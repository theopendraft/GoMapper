// src/components/ui/GlobalSearch.tsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import { OpenStreetMapProvider } from "leaflet-geosearch";
import { useMapSearch } from "../../context/MapSearchContext";
import { FiSearch, FiX, FiMapPin } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import debounce from "lodash/debounce";

// Define the shape of a search result
interface SearchResult {
  x: number; // lon
  y: number; // lat
  label: string;
  raw: any;
}

interface GlobalSearchProps {
  onResultSelect?: () => void;
}

const GlobalSearch: React.FC<GlobalSearchProps> = ({ onResultSelect }) => {
  const { setSearchedLocation } = useMapSearch();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const provider = useRef(new OpenStreetMapProvider());
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const handleSearch = async (searchQuery: string) => {
    if (searchQuery.length < 3) {
      setResults([]);
      return;
    }
    setIsLoading(true);
    try {
      // Manually construct the URL and use fetch to avoid potential CORS issues with the provider
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        searchQuery
      )}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(
          `Network response was not ok. Status: ${response.status}`
        );
      }

      const data = await response.json();

      // Transform the API response to the format expected by the component
      const searchResults: SearchResult[] = data.map((item: any) => ({
        x: parseFloat(item.lon),
        y: parseFloat(item.lat),
        label: item.display_name,
        raw: item,
      }));

      setResults(searchResults);
    } catch (error) {
      console.error("Geocoding search failed:", error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const debouncedSearch = useCallback(debounce(handleSearch, 300), []);

  useEffect(() => {
    debouncedSearch(query);
    return () => {
      debouncedSearch.cancel();
    };
  }, [query, debouncedSearch]);

  const handleSelectResult = (result: SearchResult) => {
    setSearchedLocation({
      lat: result.y,
      lng: result.x,
      address: result.label,
    });
    setQuery("");
    setResults([]);
    setIsFocused(false);
    if (onResultSelect) {
      onResultSelect();
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setIsFocused(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div
      ref={searchContainerRef}
      className="relative w-full max-w-md md:max-w-lg "
    >
      <div className="relative">
        <FiSearch
          className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-800"
          size={20}
        />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          placeholder="Search Map..."
          className="w-full pl-12 pr-10 py-2 border border-gray-300 rounded-full bg-white/80 backdrop-blur-md focus:bg-white/60 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-800"
          >
            <FiX size={18} />
          </button>
        )}
      </div>

      <AnimatePresence>
        {isFocused && (query.length > 2 || results.length > 0) && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full mt-2 w-full bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden z-[1100]"
          >
            {isLoading && (
              <div className="p-4 text-center text-gray-500">Loading...</div>
            )}
            {!isLoading && results.length === 0 && query.length > 2 && (
              <div className="p-4 text-center text-gray-500">
                No results found.
              </div>
            )}
            <ul className="max-h-80 overflow-y-auto">
              {results.map((result, index) => (
                <li
                  key={index}
                  onClick={() => handleSelectResult(result)}
                  className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-blue-50 transition-colors"
                >
                  <FiMapPin className="text-gray-400" />
                  <span className="text-gray-700">{result.label}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GlobalSearch;
