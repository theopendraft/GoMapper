import L, { Routing } from "leaflet";
import { useMap } from "react-leaflet";
import { useEffect } from "react";
import "leaflet-routing-machine";
import "leaflet-routing-machine/dist/leaflet-routing-machine.css";
import { Village } from "./Map";

// Define the structure for instructions and summary to be passed up
export interface Instruction {
  text: string;
  distance: number;
  time: number;
}

export interface RouteSummary {
  totalDistance: number;
  totalTime: number;
}

interface Props {
  routePins: Village[];
  onInstructionsReady: (
    instructions: Instruction[],
    summary: RouteSummary
  ) => void;
  onClearInstructions: () => void;
}

const RoutingComponent: React.FC<Props> = ({
  routePins,
  onInstructionsReady,
  onClearInstructions,
}) => {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    let routingControl: Routing.Control | null = null;

    if (routePins.length >= 2) {
      const waypoints = routePins.map((p) =>
        L.latLng(p.coords[0], p.coords[1])
      );

      routingControl = L.Routing.control({
        waypoints,
        routeWhileDragging: false,
        show: false,
        addWaypoints: false,
        showAlternatives: true,
        createMarker: () => null,
      } as any).addTo(map);

      routingControl.on("routesfound", (e: any) => {
        const routes = e.routes as Routing.IRoute[];
        if (routes && routes.length > 0) {
          const primaryRoute = routes[0];

          if (primaryRoute.instructions && primaryRoute.summary) {
            const instructions: Instruction[] = primaryRoute.instructions.map(
              (instr) => ({
                text: instr.text || "Unnamed step",
                distance: instr.distance,
                time: instr.time,
              })
            );

            const summary: RouteSummary = {
              totalDistance: primaryRoute.summary.totalDistance,
              totalTime: primaryRoute.summary.totalTime,
            };
            onInstructionsReady(instructions, summary);
          }
        }
      });

      // Cleanup when component unmounts or pins change
      return () => {
        if (routingControl) {
          map.removeControl(routingControl);
        }
        onClearInstructions();
      };
    } else {
      // If there are not enough pins, clear any existing instructions
      onClearInstructions();
    }

    // Cleanup function for the main effect
    return () => {
      if (routingControl) {
        map.removeControl(routingControl);
      }
    };
  }, [map, routePins, onInstructionsReady, onClearInstructions]);

  return null;
};

export default RoutingComponent;
