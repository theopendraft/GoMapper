import React from 'react';
import { Village } from '../../data/types/village';

export default function ActivityLog({ villages }: { villages: Village[] }) {
  const recent = villages
    .filter((v) => v.lastVisit)
    .sort(
      (a, b) =>
        new Date(b.lastVisit!).getTime() - new Date(a.lastVisit!).getTime()
    )
    .slice(0, 5);

  return (
    <div className="bg-white p-4 rounded shadow">
      <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
      {recent.length === 0 ? (
        <p>No recent activity</p>
      ) : (
        <ul className="space-y-2">
          {recent.map((v) => (
            <li key={v.id}>
              {v.name}: <em>Last visited</em> {v.lastVisit}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
