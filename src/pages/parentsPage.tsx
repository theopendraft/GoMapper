import React, { useEffect, useState } from "react";
import { collection, onSnapshot, setDoc, doc } from "firebase/firestore";
import { db } from "../services/firebase";
import { Village } from "../types/village";
import ParentVillageCard from "../Parents/ParentVillageCard";
import { Input } from "./../components/ui/input";
import SearchFilters from "../features/Dashboard/components/SearchFilters";



export default function DashboardPage() {
  const [villages, setVillages] = useState<Village[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<
    "all" | "visited" | "planned" | "not_visited"
  >("all");

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "villages"), (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Village[];
      setVillages(data);
    });

    return () => unsubscribe();
  }, []);

  

  const updateVillage = async (updated: Village) => {
    await setDoc(doc(db, "villages", updated.id.toString()), updated);
  };

  const filtered = villages.filter((v) => {
    return (
      v.name.toLowerCase().includes(search.toLowerCase()) &&
      (filter === "all" || v.status === filter)
    );
  });

  return (
    <div className="max-w-screen-lg mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">👨‍👩‍👧 Parent Contacts</h1>

      {/* 🔍 Global Search + Sort */}
      <SearchFilters
              search={search}
              setSearch={setSearch}
              filter={filter}
              setFilter={setFilter}
            />

      {/* 📋 Results */}
      <div className="space-y-4">
        {filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">
            No matching records found.
          </p>
        ) : (
          filtered.map((village) => (
            <ParentVillageCard
              key={village.id}
              village={village}
              onUpdate={updateVillage}
            />
          ))
        )}
      </div>
    </div>
  );
}
