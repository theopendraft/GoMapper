import React from "react";
import { Drawer } from "vaul";
import { FiX, FiClock, FiMap } from "react-icons/fi";

// Define the structure of a single instruction step
interface Instruction {
  text: string;
  distance: number; // in meters
  time: number; // in seconds
}

// Define the structure for the route summary
interface RouteSummary {
  totalDistance: number; // in meters
  totalTime: number; // in seconds
}

interface DirectionsPanelProps {
  instructions: Instruction[];
  summary: RouteSummary | null;
  onClose: () => void;
  isOpen: boolean;
}

// Helper to format distance (meters to km or m)
const formatDistance = (distance: number) => {
  if (distance > 1000) {
    return `${(distance / 1000).toFixed(2)} km`;
  }
  return `${Math.round(distance)} m`;
};

// Helper to format time (seconds to min/hr)
const formatTime = (time: number) => {
  const minutes = Math.round(time / 60);
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h ${remainingMinutes}min`;
};

const DirectionsPanel: React.FC<DirectionsPanelProps> = ({
  instructions,
  summary,
  onClose,
  isOpen,
}) => {
  const content = (
    <>
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200 bg-gray-50 rounded-t-lg">
        <h3 className="font-bold text-lg text-gray-800">Route Directions</h3>
        <button
          onClick={onClose}
          className="p-1 rounded-full text-gray-500 hover:bg-gray-200 hover:text-gray-800 transition-colors"
          aria-label="Close directions"
        >
          <FiX size={20} />
        </button>
      </div>

      {/* Summary */}
      {summary && (
        <div className="flex items-center justify-around p-3 border-b border-gray-200 text-gray-700">
          <div className="flex items-center gap-2">
            <FiMap className="text-indigo-600" size={20} />
            <div>
              <div className="text-sm text-gray-500">Total Distance</div>
              <div className="font-bold text-md">
                {formatDistance(summary.totalDistance)}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <FiClock className="text-indigo-600" size={20} />
            <div>
              <div className="text-sm text-gray-500">Est. Time</div>
              <div className="font-bold text-md">
                {formatTime(summary.totalTime)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Instructions List */}
      <div className="flex-grow overflow-y-auto p-3 pb-14 space-y-3">
        {instructions.map((step, index) => (
          <div key={index} className="flex items-start gap-3 text-sm">
            <div className="flex-shrink-0 mt-1 w-5 h-5 bg-indigo-600 text-white text-xs rounded-full flex items-center justify-center font-bold">
              {index + 1}
            </div>
            <div className="flex-grow">
              <p className="text-gray-800">{step.text}</p>
              <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
                <span>{formatDistance(step.distance)}</span>
                <span>~ {formatTime(step.time)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );

  return (
    <>
      {/* Desktop: Floating Panel */}
      <div className="hidden pb-6 md:flex absolute top-24 right-4 z-[1000] bg-white w-80 max-h-[calc(100vh-12rem)] rounded-lg shadow-xl border border-gray-200 flex-col">
        {content}
      </div>

      {/* Mobile: Swipeable Drawer */}
      <div className="md:hidden">
        <Drawer.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
          <Drawer.Portal>
            <Drawer.Overlay className="fixed inset-0 bg-black/40 z-[1010]" />
            <Drawer.Content className="bg-gray-100 flex flex-col rounded-t-[10px] h-[94%] mt-24 fixed bottom-0 left-0 right-0 z-[1020]">
              <div className="p-4 bg-white rounded-t-[10px] flex-1 overflow-y-auto">
                <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-gray-300 mb-4" />
                <div className="max-w-md mx-auto">{content}</div>
              </div>
            </Drawer.Content>
          </Drawer.Portal>
        </Drawer.Root>
      </div>
    </>
  );
};

export default DirectionsPanel;
