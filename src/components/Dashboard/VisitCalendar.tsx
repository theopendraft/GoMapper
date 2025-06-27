import React from 'react';
import { Village } from '../../data/types/village';

export default function VisitCalendar({ villages }: { villages: Village[] }) {
  const upcoming = villages
    .filter((v) => v.nextVisitTarget)
    .sort(
      (a, b) =>
        new Date(a.nextVisitTarget!).getTime() - new Date(b.nextVisitTarget!).getTime()
    )
    .slice(0, 5);

  return (
    <div className="bg-white p-4 rounded shadow">
      <h3 className="text-lg font-semibold mb-4">Upcoming Visits</h3>
      {upcoming.length === 0 ? (
        <p>No visits planned</p>
      ) : (
        <ul className="space-y-2">
          {upcoming.map((v) => (
            <li key={v.id}>
              {v.name}: <strong>{v.nextVisitTarget}</strong>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
