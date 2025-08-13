// src/features/Projects/components/SavedRoutesPanel.tsx
import React from "react";
import { useMapSearch } from "../../../context/MapSearchContext";
import { useSnackbar } from "../../../context/SnackbarContext";
import { FiMap, FiTrash2, FiLoader, FiInbox } from "react-icons/fi";
import { SavedRoute } from "../../../types/savedRoute";

const SavedRoutesPanel = () => {
  const { savedRoutes, loadRoute, deleteRoute, loadingRoutes, loadedRoute } =
    useMapSearch();
  const { showSnackbar } = useSnackbar();

  const handleDelete = async (routeId: string, routeName: string) => {
    if (
      !window.confirm(
        `Are you sure you want to delete the route "${routeName}"?`
      )
    ) {
      return;
    }
    try {
      await deleteRoute(routeId);
      showSnackbar({
        message: "Route deleted successfully",
        severity: "success",
      });
    } catch (error) {
      console.error("Failed to delete route:", error);
      showSnackbar({ message: "Failed to delete route", severity: "error" });
    }
  };

  return (
    <div className="flex flex-col h-full">
      {loadingRoutes ? (
        <div className="flex-grow flex items-center justify-center text-gray-500">
          <FiLoader className="animate-spin h-8 w-8" />
        </div>
      ) : savedRoutes.length === 0 ? (
        <div className="flex-grow flex flex-col items-center justify-center text-center text-gray-500 p-4">
          <FiInbox size={48} className="mb-4 text-gray-400" />
          <h3 className="font-semibold text-lg">No Saved Routes</h3>
          <p className="text-sm">
            Create a route on the map and save it to see it here.
          </p>
        </div>
      ) : (
        <ul className="space-y-2 overflow-y-auto flex-grow pr-2">
          {savedRoutes.map((route: SavedRoute) => (
            <li
              key={route.id}
              className={`p-2 rounded-md transition-colors group ${
                loadedRoute?.id === route.id
                  ? "bg-blue-100"
                  : "hover:bg-gray-100"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm truncate">
                  {route.name}
                </span>
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => loadRoute(route)}
                    className="p-1 rounded-full text-gray-500 hover:bg-gray-200 hover:text-gray-800"
                    title="Load Route"
                  >
                    <FiMap size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(route.id, route.name)}
                    className="p-1 rounded-full text-gray-500 hover:bg-gray-200 hover:text-red-600"
                    title="Delete Route"
                  >
                    <FiTrash2 size={16} />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default SavedRoutesPanel;
