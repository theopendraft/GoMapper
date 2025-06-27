import React from 'react';
import { Village } from '../../data/types/village';

export default function VillageChart({ villages }: { villages: Village[] }) {
  const visited = villages.filter((v) => v.status === 'visited').length;
  const planned = villages.filter((v) => v.status === 'planned').length;
  const notVisited = villages.filter((v) => v.status === 'not-visited').length;

  const total = visited + planned + notVisited;

  return (
    <div className="bg-white p-4 rounded shadow">
      <h3 className="text-lg font-semibold mb-4">Status Distribution</h3>
      <ul className="space-y-2">
        <li>Visited: {((visited / total) * 100).toFixed(1)}%</li>
        <li>Planned: {((planned / total) * 100).toFixed(1)}%</li>
        <li>Not Visited: {((notVisited / total) * 100).toFixed(1)}%</li>
      </ul>
    </div>
  );
}
