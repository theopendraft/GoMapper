// src/types/village.ts (Updated)

export type VillageStatus = 'visited' | 'not-visited' | 'planned';
// FIX: Import Parent and ExtendedParent from the new types/parent.ts file
import type { Parent, ExtendedParent } from "./parent";

export interface Village {
  id: string; // Firestore document ID (for the pin)
  projectId: string; // The ID of the project this pin belongs to
  name: string;
  status: VillageStatus;
  coords: [number, number]; // Matches Leaflet's [lat, lng] format (latitude, longitude)

  lastVisit?: string;
  parentsName?: string;
  parentsContact?: string;
  interactionHistory?: string;
  nextVisitTarget?: string;
  notes?: string;
  tehsil?: string;
  population?: number;
  parents: ExtendedParent[]; // This now references the imported ExtendedParent
}

// FIX: Remove ExtendedParent definition from here if it's in types/parent.ts
// export interface ExtendedParent extends Parent {
//   lastInteraction?: string;
//   nextVisitTarget?: string;
//   notes?: string;
// }

// FIX: Remove re-export of Parent if it's not strictly necessary and avoid circularity
// export type { Parent };