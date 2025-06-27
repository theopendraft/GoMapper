export type VillageStatus = 'visited' | 'not-visited' | 'planned';
import type { Parent } from "../../components/Map";

export interface Village {
  id: string;
  name: string;
  status: VillageStatus;
  location: {
    lat: number;
    lng: number;
  };
  lastVisit?: string;
  parentsName?: string;
  parentsContact?: string;
  interactionHistory?: string;
  nextVisitTarget?: string;
  notes?: string;
  tehsil?: string;
  population?: number;
  parents: ExtendedParent[];
}

export interface ExtendedParent extends Parent {
  lastInteraction?: string;
  nextVisitTarget?: string;
  notes?: string;
}

export type { Parent };

