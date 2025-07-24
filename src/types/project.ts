// src/types/project.ts

export interface Project {
  id: string; // Firestore document ID (e.g., auto-generated ID)
  name: string;
  ownerId: string; // The Firebase User UID of the project owner
  createdAt: number; // Timestamp of creation (e.g., Date.now() or Firebase Timestamp)
  // Add any other project-specific metadata you might want, e.g.:
  // description?: string;
  // lastAccessed?: number;
}