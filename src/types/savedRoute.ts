// src/types/savedRoute.ts

import { Timestamp } from "firebase/firestore";

export interface SavedRoute {
  id: string;
  name: string;
  projectId: string;
  pinIds: string[]; // Array of pin IDs in the order of the route
  createdAt: Timestamp;
  // You can add more fields here later, like totalDistance, totalTime, etc.
}
