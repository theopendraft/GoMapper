import React, { useEffect, useState } from "react";
import { collection, onSnapshot, setDoc, doc } from "firebase/firestore";
import { db } from "./../lib/firebase";
import { Village } from "./../data/types/village";
import ParentVillageCard from "./../components/modals/ParentVillageCard";
import { Input } from "./../components/ui/input";

export default function ParentVillagePage() {
  const [villages, setVillages] = useState<Village[]>([]);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"village" | "parent">("village");

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

  const filtered = villages
    .filter((village) => {
      const query = search.toLowerCase();
      return (
        village.name.toLowerCase().includes(query) ||
        village.parents?.some(
          (p) =>
            p.name?.toLowerCase().includes(query) ||
            p.contact?.toLowerCase().includes(query)
        )
      );
    })
    .sort((a, b) => {
      if (sort === "village") return a.name.localeCompare(b.name);
      if (sort === "parent") {
        const aName = a.parents?.[0]?.name || "";
        const bName = b.parents?.[0]?.name || "";
        return aName.localeCompare(bName);
      }
      return 0;
    });

  const updateVillage = async (updated: Village) => {
    await setDoc(doc(db, "villages", updated.id.toString()), updated);
  };

  return (
    <div className="max-w-screen-lg mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">👨‍👩‍👧 Parent Contacts</h1>

      {/* 🔍 Global Search + Sort */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by village, parent or contact..."
          className="flex-1"
        />
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as any)}
          className="border rounded px-4 py-2 text-sm"
        >
          <option value="village">Sort by Village</option>
          <option value="parent">Sort by Parent</option>
        </select>
      </div>

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
