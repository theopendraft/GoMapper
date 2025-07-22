// src/pages/mapPage.tsx
import React, { useState } from "react";
// Import your Map component (assuming path is correct from MapPage)
import Map from "../Map/components/Map";
// Import your MapSummaryPanel component
import MapSummaryPanel from "../Map/components/MapSummaryPanel";
// Import the MapSearchContext hook
import { useMapSearch } from "../context/MapSearchContext";

export default function MapPage() {
  // Destructure states and setters from MapSearchContext
  // These are primarily for the "Search Location" modal and its interaction with the Map component.
  const {
    isSearchModalOpen, // True when the "Search Location" modal is open
    isMapSearchControlVisible, // True when the geosearch input is visible on the map
    setIsMapSearchControlVisible, // Setter for isMapSearchControlVisible (passed to Map)
    setLocationFoundForModalDisplay, // Setter for the message in the SearchModal (passed to Map)
    handleLocationSelectedFromMapSearchAndCloseModal, // Callback when a search result is selected on the map
    requestSearchModalClose, // Callback to close the search modal from Map
  } = useMapSearch();

  // States for the MapSummaryPanel's internal search and filter inputs
  // These control the list of villages displayed in the panel and filtered on the map.
  const [panelSearchQuery, setPanelSearchQuery] = useState("");
  const [panelFilterType, setPanelFilterType] = useState<
    "all" | "visited" | "planned" | "not-visited"
  >("all");

  // State to control the open/close of the MapSummaryPanel itself
  // This can be used to programmatically open/close the panel if needed from MapPage.
  // The panel also has its own internal state, but this allows external control.
  const [isPanelOpen, setIsPanelOpen] = useState(false); // Initial state: panel is closed

  return (
    // The main container for the map and the summary panel.
    // Use `relative` for positioning context if MapSummaryPanel uses `fixed`
    // or if you want to explicitly place it within this div's flow.
    // `h-full w-full flex` allows the Map to take remaining space if MapSummaryPanel is inline.
    // However, since MapSummaryPanel is `fixed` positioned, flex isn't strictly necessary
    // for sibling layout, but good practice if you ever change positioning.
    <div className="relative h-full w-full">
      {/*
        The main map component, which displays village pins and the search bar
        when activated via the SearchModal.
        It receives the search/filter states from MapSummaryPanel for its own filtering,
        and search-related states/callbacks from MapSearchContext.
      */}
      <div className="flex-1 h-full"> {/* Ensures map div takes available space */}
        <Map
          // Props for filtering existing villages on the map (controlled by MapSummaryPanel's inputs)
          search={panelSearchQuery}
          filter={panelFilterType}

          // Props for the location search feature (controlled via SearchModal/MapSearchContext)
          isSearchActive={isSearchModalOpen} // Tells Map if the SearchModal is open, indicating a search intent
          isMapSearchControlVisible={isMapSearchControlVisible} // Controls visibility of the GeoSearchControl on the map
          onSearchControlVisibilityChange={setIsMapSearchControlVisible} // Map tells context if control is visible
          onLocationFoundForModal={setLocationFoundForModalDisplay} // Map tells context what location was found for modal message
          onLocationSelectedFromMapSearch={handleLocationSelectedFromMapSearchAndCloseModal} // Map tells context when a search result is selected
          onRequestModalClose={requestSearchModalClose} // NEW: Pass it to Map
        />
      </div>

      {/*
        The MapSummaryPanel component, which displays the list of villages,
        and provides search/filter inputs for those villages.
        Its open/close state is managed by `isPanelOpen`.
      */}
      <MapSummaryPanel
        // Props for its own internal search/filter inputs
        search={panelSearchQuery}
        setSearch={setPanelSearchQuery}
        filter={panelFilterType}
        setFilter={setPanelFilterType}

        // Props to control its external open/close state (from MapPage)
        isOpen={isPanelOpen}
        setIsOpen={setIsPanelOpen}
      />
    </div>
  );
}