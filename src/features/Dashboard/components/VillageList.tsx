// src/components/VillageList.tsx
import React from "react";
import { Village } from "../../../types/village";
import { Badge } from "../../../components/ui/badge"; // Ensure Badge supports defined variants

type VillageListProps = {
  villages: Village[];
  onPinClick?: (villageId: string) => void;
  emptyMessage?: string;
};

export default function VillageList({
  villages,
  onPinClick,
  emptyMessage = "No pins found. Try adjusting your filters or adding new pins.",
}: VillageListProps) {
  // Function to get appropriate badge variant based on status
  const getBadgeVariant = (status: string) => {
    switch (status) {
      case "visited":
        return "success";
      case "planned":
        return "warning";
      case "not-visited":
        return "danger"; // <--- CHANGE THIS FROM "destructive" to "danger"
      default:
        return "default";
    }
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4 pb-2 border-b border-gray-200 text-gray-800">All Pins</h3>
      <div className="max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
        {villages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <p>{emptyMessage}</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {villages.map((v) => (
              <li
                key={v.id}
                className={`
                  flex justify-between items-center border border-gray-200 p-3 rounded-lg
                  ${onPinClick ? 'cursor-pointer hover:bg-gray-50 transition-colors duration-200' : ''}
                `}
                onClick={onPinClick ? () => onPinClick(v.id) : undefined}
                aria-label={`View details for ${v.name}`}
              >
                <div className="flex-grow">
                  <div className="font-semibold text-gray-700 text-base">{v.name}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {v.tehsil} {v.population ? ` • Pop: ${v.population}` : ''}
                  </div>
                </div>
                <Badge variant={getBadgeVariant(v.status)}>
                  {v.status.replace(/-/g, " ").replace(/\b\w/g, (char) => char.toUpperCase())}
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}