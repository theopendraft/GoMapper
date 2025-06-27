// src/components/MapWithPanel.tsx
import React, { useState, useEffect } from 'react';
import Map from './Map';
import MapSummaryPanel from './MapSummaryPanel';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';

// Define the Village type to match the Map component's expected structure
type Village = {
  id: number;
  name: string;
  tehsil: string;
  coords: [number, number];
  population: number;
  status: 'visited' | 'planned' | 'not-visited';
  parents: { name: string; contact: string }[];
};

export default function MapWithPanel() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'visited' | 'planned' | 'not-visited'>('all');
  const [villages, setVillages] = useState<Village[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'villages'), (snapshot) => {
      const data = snapshot.docs.map(doc => {
        const docData = doc.data();
        return {
          id: Number(doc.id),
          name: docData.name,
          tehsil: docData.tehsil,
          coords: docData.coords as [number, number],
          population: docData.population,
          status: docData.status,
          parents: Array.isArray(docData.parents)
            ? docData.parents.map((p: any) =>
                typeof p === "string"
                  ? { name: p, contact: "" }
                  : { name: p.name ?? "", contact: p.contact ?? "" }
              )
            : [],
        } as Village;
      });
      setVillages(data);
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className="flex h-screen">
      <MapSummaryPanel
        search={search}
        setSearch={setSearch}
        filter={filter}
        setFilter={setFilter}
        isOpen={isOpen}
        setIsOpen={setIsOpen}
      />
      <div className="flex-1">
        <Map villages={villages} search={search} filter={filter} />
      </div>
    </div>
  );
}
