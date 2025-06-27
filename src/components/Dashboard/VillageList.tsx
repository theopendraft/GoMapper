import React from 'react';
import { Village } from '../../data/types/village';
import { Badge } from '../../components/ui/badge';

export default function VillageList({ villages }: { villages: Village[] }) {
  return (
    <div className="bg-white p-4 rounded shadow">
      <h3 className="text-lg font-semibold mb-4">All Villages</h3>
      <ul className="space-y-2 max-h-[300px] overflow-y-auto">
        {villages.map((v) => (
          <li
            key={v.id}
            className="flex justify-between items-center border p-2 rounded"
          >
            <div>
              <div className="font-semibold">{v.name}</div>
              <div className="text-xs text-gray-500">
                {v.tehsil} • Pop: {v.population}
              </div>
            </div>
            <Badge
              variant={
                v.status === 'visited'
                  ? 'success'
                  : v.status === 'planned'
                  ? 'warning'
                  : 'danger'
              }
            >
              {v.status.replace('_', ' ')}
            </Badge>
          </li>
        ))}
      </ul>
    </div>
  );
}
