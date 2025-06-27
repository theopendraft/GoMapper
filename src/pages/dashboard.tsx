import React, { useEffect, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Village } from '../data/types/village';
import StatsCards from '../components/Dashboard/StatsCards';
import SearchFilters from '../components/Dashboard/SearchFilters';
import VillageChart from '../components/Dashboard/VillageChart';
import VisitCalendar from '../components/Dashboard/VisitCalendar';
import ActivityLog from '../components/Dashboard/ActivityLog';
import VillageList from '../components/Dashboard/VillageList';

export default function DashboardPage() {
  const [villages, setVillages] = useState<Village[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'visited' | 'planned' | 'not_visited'>('all');

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'villages'), (snap) => {
      const data = snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Village[];
      setVillages(data);
    });
    return unsubscribe;
  }, []);

  const filtered = villages.filter((v) => {
    return (
      v.name.toLowerCase().includes(search.toLowerCase()) &&
      (filter === 'all' || v.status === filter)
    );
  });

  return (
    <div className="p-6 bg-gray-100 min-h-screen space-y-6">
      <h1 className="text-3xl font-bold">📍 Village Tracker Dashboard</h1>

      <StatsCards villages={villages} />

      <SearchFilters
        search={search}
        setSearch={setSearch}
        filter={filter}
        setFilter={setFilter}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <VillageChart villages={filtered} />
        <VisitCalendar villages={filtered} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ActivityLog villages={filtered} />
        <VillageList villages={filtered} />
      </div>
    </div>
  );
}
