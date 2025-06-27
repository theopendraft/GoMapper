import React from 'react';
import { Village } from '../../data/types/village';

type Props = { villages: Village[] };

export default function StatsCards({ villages }: Props) {
  const total = villages.length;
  const visited = villages.filter(v => v.status === 'visited').length;
  const planned = villages.filter(v => v.status === 'planned').length;
  const notVisited = villages.filter(v => v.status === 'not-visited').length;

  const stats = [
    { label: 'Total', value: total, color: 'bg-blue-100 text-blue-700' },
    { label: 'Visited', value: visited, color: 'bg-green-100 text-green-700' },
    { label: 'Planned', value: planned, color: 'bg-yellow-100 text-yellow-700' },
    { label: 'Not Visited', value: notVisited, color: 'bg-red-100 text-red-700' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {stats.map(({ label, value, color }) => (
        <div key={label} className={`${color} p-4 rounded shadow text-center`}>
          <div className="text-sm font-medium">{label}</div>
          <div className="text-2xl font-bold">{value}</div>
        </div>
      ))}
    </div>
  );
}
