// src/types/parent.ts
// This is the standalone definition for your basic Parent type
export interface Parent {
  name: string;
  contact: string;
  // Add any other common fields for a parent here
}

// If you need ExtendedParent in other places, define it here as well
// or import Parent and define ExtendedParent where it's specifically needed (like in types/village.ts)
export interface ExtendedParent extends Parent {
  lastInteraction?: string;
  nextVisitTarget?: string;
  notes?: string;
}