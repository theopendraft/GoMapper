// src/components/map/components/GeolocationControl.tsx
import React, { useEffect, useState, useCallback } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import { FiTarget } from "react-icons/fi"; // Icon for the button
import { useSnackbar } from "../../context/SnackbarContext"; // For user feedback

interface GeolocationControlProps {
  onLocationFound?: (latlng: L.LatLng) => void;
}

const GeolocationControl: React.FC<GeolocationControlProps> = ({
  onLocationFound,
}) => {
  const map = useMap();
  const { showSnackbar } = useSnackbar();

  const [isLocating, setIsLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGeolocationSuccess = useCallback(
    (position: GeolocationPosition) => {
      const latlng = L.latLng(
        position.coords.latitude,
        position.coords.longitude
      );

      map.flyTo(latlng, map.getZoom() || 14, { duration: 1.5 }); // Added duration for smooth flyTo
      // map.invalidateSize(); // Invalidate size usually not needed after flyTo

      const userLocationMarker = L.circleMarker(latlng, {
        radius: 6,
        color: "#3388ff",
        fillColor: "#3388ff",
        fillOpacity: 0.8,
      }).addTo(map);

      userLocationMarker.bindPopup("You are here!").openPopup();

      setTimeout(() => {
        if (map.hasLayer(userLocationMarker)) {
          map.removeLayer(userLocationMarker);
        }
      }, 5000); // Marker disappears after 5 seconds

      if (onLocationFound) {
        onLocationFound(latlng);
      }

      setIsLocating(false);
      setError(null);
      showSnackbar({ message: "Found your location!", severity: "success" });
    },
    [map, onLocationFound, showSnackbar]
  );

  const handleGeolocationError = useCallback(
    (err: GeolocationPositionError) => {
      setIsLocating(false);
      let errorMessage = "Unable to retrieve your location.";
      switch (err.code) {
        case err.PERMISSION_DENIED:
          errorMessage =
            "Location access denied. Please enable location services in your browser settings.";
          break;
        case err.POSITION_UNAVAILABLE:
          errorMessage = "Location information is unavailable.";
          break;
        case err.TIMEOUT:
          errorMessage = "The request to get user location timed out.";
          break;
        default:
          errorMessage = `Geolocation error: ${err.message || "Unknown error"}`; // Fallback for other errors
      }
      setError(errorMessage);
      showSnackbar({ message: errorMessage, severity: "error" });
      console.error("Geolocation error:", err);
    },
    [showSnackbar]
  );

  const locateUser = useCallback(() => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      showSnackbar({
        message: "Geolocation not supported.",
        severity: "error",
      });
      return;
    }

    setIsLocating(true);
    setError(null); // Clear previous error

    navigator.geolocation.getCurrentPosition(
      handleGeolocationSuccess,
      handleGeolocationError,
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, [handleGeolocationSuccess, handleGeolocationError]);

  return (
    // Positioning the button explicitly using absolute positioning within its parent container (the map)
    <div className="z-[1000]">
      <div className="flex flex-col space-y-2">
        <button
          onClick={locateUser}
          disabled={isLocating}
          className={`
            w-14 h-14 z-50 bg-white text-blue-600 p-3 rounded-full shadow-xl
            flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-blue-500
            transition-all duration-300 ease-in-out transform 
            hover:scale-105 hover:shadow-2xl hover:bg-gray-50
            active:scale-100 active:shadow-xl // Reset on active for press effect

            ${
              isLocating
                ? "opacity-70 cursor-not-allowed animate-pulse disabled:shadow-md"
                : ""
            }
          `}
          aria-label="Live me"
          title="Show my current location"
        >
          {isLocating ? (
            <svg
              className="animate-spin h-7 w-7 text-blue-600"
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
          ) : (
            <img
              src="./Live.png"
              alt="Live loation"
              className="w-7 h-7 text-blue-600"
            />
          )}
        </button>
      </div>
      {error && (
        <div className="mt-2 text-red-600 text-sm text-center">
          {/* Consider making this a more styled toast or modal */}
        </div>
      )}
    </div>
  );
};

export default GeolocationControl;
