// File path: village-tracker-map\src\api\villagesApi.ts

// Define the properties of a village
export interface Village {
  id: number;
  name: string;
  tehsil: string;
  coords: [number, number];
  population: number;
  status: "visited" | "planned" | "not-visited";
  lastInteraction?: string;
  nextVisitTarget?: string;
  notes?: string;
  parents: { name: string; contact: string }[];
}

// Mock data for demonstration purposes
let villages: Village[] = [
  {
    id: 1,
    name: "Village A",
    tehsil: "Tehsil A",
    coords: [22.68411, 77.26887],
    population: 1000,
    status: "visited",
    lastInteraction: "2023-10-01",
    nextVisitTarget: "2023-11-01",
    notes: "Some notes about Village A",
    parents: [{ name: "Parent A", contact: "1234567890" }],
  },
  // Add more mock villages as needed
];

// Fetch villages from the local data (or replace with an API call)
export function fetchVillages(): Promise<Village[]> {
  return Promise.resolve(villages);
}

// Add a new village
export async function addVillage(village: Village): Promise<Village> {
  const newVillage = {
    ...village,
    id: Date.now(), // Generate a mock id
  };
  villages.push(newVillage); // Add to the local array
  return Promise.resolve(newVillage);
}

// Update an existing village
export async function updateVillage(id: number, data: Partial<Village>): Promise<Village | undefined> {
  const index = villages.findIndex(v => v.id === id);
  if (index !== -1) {
    villages[index] = { ...villages[index], ...data }; // Update the village
    return Promise.resolve(villages[index]);
  }
  return Promise.resolve(undefined); // Return undefined if not found
}

// Delete a village
export async function deleteVillage(id: number): Promise<boolean> {
  const index = villages.findIndex(v => v.id === id);
  if (index !== -1) {
    villages.splice(index, 1); // Remove the village from the array
    return Promise.resolve(true);
  }
  return Promise.resolve(false); // Return false if not found
}

// Subscribe to village updates
export function subscribeToVillages(callback: (villages: Village[]) => void): () => void {
  const interval = setInterval(() => {
    // Fetch or generate updated villages data here
    callback(villages); // Call the callback with the current villages
  }, 5000); // Update every 5 seconds

  // Return unsubscribe function
  return () => clearInterval(interval);
}
