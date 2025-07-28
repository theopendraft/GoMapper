import React, { useState } from "react";
// Direct import of Map and MapSummaryPanel from their respective paths
import Map from "../Map/components/Map"; // Adjust path if different
import MapSummaryPanel from "../Map/components/MapSummaryPanel"; // Adjust path if different
// Import MapSearchContext hook
import { useMapSearch } from "../context/MapSearchContext";
// Import Navigate for conditional rendering
import { Navigate } from "react-router-dom";
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import start from './start.json'; // Adjust path if necessary
import Lottie from "lottie-react";





export default function MapPage() {
  // Destructure all necessary states and setters from MapSearchContext
  const {
    currentUser,
    currentProjectId,
    loadingProjects, // Indicates if user's projects are still being fetched
    isSearchModalOpen, // Controls visibility of the location search modal
    isMapSearchControlVisible, // Controls visibility of the Leaflet geosearch bar on the map
    setIsMapSearchControlVisible, // Setter for isMapSearchControlVisible
    setLocationFoundForModalDisplay, // Setter for displaying location info in search modal
    handleLocationSelectedFromMapSearchAndCloseModal, // Callback when a location is selected from map search
    requestSearchModalClose, // Callback to close the search modal (e.g., on outside click)
    openSearchModal, // NEW: Function to open the SearchModal directly from Map
  } = useMapSearch();

  // States for the MapSummaryPanel's internal search and filter inputs
  // These control the list of villages displayed in the panel and how they are filtered on the map.
  const [panelSearchQuery, setPanelSearchQuery] = useState("");
  const [panelFilterType, setPanelFilterType] = useState<
    "all" | "visited" | "planned" | "not-visited"
  >("all");

  // State to control the open/close state of the MapSummaryPanel itself
  // This allows programmatic control over the panel's visibility from MapPage.
  const [isPanelOpen, setIsPanelOpen] = useState(false); // Panel starts closed by default

  // --- Conditional Rendering for initial loading and project selection ---
  // If no user is logged in, redirect to login page (ProtectedRoute should handle this first)
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  // Show a loading indicator while user's projects are being fetched
  if (loadingProjects) {
    return (
      <div className="flex justify-center items-center h-full w-full text-lg text-gray-700 bg-gray-100">
        Loading projects for your account...
      </div>
    );
  }

  // If user is logged in, projects are loaded, but no project is currently selected
  // This might happen for a brand new user who hasn't created any projects yet.
  if (!currentProjectId) {
    return (
      <div className="flex flex-col justify-center items-center h-full w-full text-gray-700 text-center p-4 bg-gray-100">
        {/* You can replace this SVG with a GIF or a more elaborate illustration */}
        <Lottie animationData={start}
        className="w-48 h-48" />

        <p className="text-2xl font-semibold mb-2">Welcome to your Map!</p>

        <p className="text-lg max-w-md ">
          Please use the{" "}
          <span className="font-medium text-blue-600">
            sidebar (top-left menu icon)
          </span>{" "}
          to{" "}
          <span className="font-medium text-blue-600">
            create a new project
          </span>{" "}
          to start mapping.
        </p>
      </div>
    );
  }

  // --- Main Render: If we reach here, currentUser and currentProjectId are valid, and projects are loaded ---
  return (
    // The main container for the map and the summary panel.
    // `relative` positioning is crucial for `MapSummaryPanel` which uses `fixed`.
    // `h-full w-full` ensures it takes full available space in the parent (`main` tag in Layout).
    <div className="relative h-full w-full scrollbar-hide">
      {/*
        Container for the Map component.
        `flex-1 h-full` ensures the map div expands to fill available space
        and takes full height within this flex container.
      */}
      <div className="flex-1 h-full">
        <Map
          // Props for filtering existing pins on the map (controlled by MapSummaryPanel's inputs)
          search={panelSearchQuery}
          filter={panelFilterType}  

          // Props for the location search feature (controlled via SearchModal/MapSearchContext)
          isSearchActive={isSearchModalOpen} // Activates the search bar when modal is open
          isMapSearchControlVisible={isMapSearchControlVisible} // For internal control flow if needed
          onSearchControlVisibilityChange={setIsMapSearchControlVisible} // Map reports search bar visibility
          onLocationFoundForModal={setLocationFoundForModalDisplay} // Map sends found location to modal
          onLocationSelectedFromMapSearch={handleLocationSelectedFromMapSearchAndCloseModal} // Callback when a search result is selected
          onRequestModalClose={requestSearchModalClose} // Map requests modal closure on outside click

          // User and Project context for data access (crucial for fetching/saving/deleting pins)
          currentUser={currentUser}
          currentProjectId={currentProjectId}
          // NEW PROP: Function to open the SearchModal directly from Map's button
          openSearchModal={openSearchModal}
        />
      </div>

      {/*
        The MapSummaryPanel component, rendered as a sibling to the map.
        It uses `fixed` positioning, so it floats over the map content.
        It displays filtered pins and provides controls for them.
      */}
      <MapSummaryPanel
        // Pass panel's own search/filter states (from MapPage)
        search={panelSearchQuery}
        setSearch={setPanelSearchQuery}
        filter={panelFilterType}
        setFilter={setPanelFilterType}

        // Pass control for its open/close state (from MapPage)
        isOpen={isPanelOpen}
        setIsOpen={setIsPanelOpen}

        // Pass user and project context for its data fetching (required by MapSummaryPanel)
        currentUser={currentUser}
        currentProjectId={currentProjectId}
      />
    </div>
  );
}