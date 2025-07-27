// src/features/Dashboard/components/VillageChart.tsx
import React from "react";
import { Village } from "../../../types/village";
// Assuming you've installed react-chartjs-2 and chart.js
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

// Register necessary Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend);

export default function VillageChart({ villages }: { villages: Village[] }) {
  const visited = villages.filter((v) => v.status === "visited").length;
  const planned = villages.filter((v) => v.status === "planned").length;
  const notVisited = villages.filter((v) => v.status === "not-visited").length;

  const total = visited + planned + notVisited;

  // Handle case where there are no villages to prevent NaN
  if (total === 0) {
    return (
      <div className="bg-white p-4 rounded-lg shadow-md flex items-center justify-center h-48">
        <p className="text-gray-500">No village data available to display chart.</p>
      </div>
    );
  }

  const data = {
    labels: ['Visited', 'Planned', 'Not Visited'],
    datasets: [
      {
        data: [visited, planned, notVisited],
        backgroundColor: [
          'rgb(34, 197, 94)', // Tailwind green-500
          'rgb(234, 179, 8)',  // Tailwind yellow-500
          'rgb(239, 68, 68)',  // Tailwind red-500
        ],
        hoverOffset: 4,
        borderColor: 'white', // Border between segments
        borderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false, // Allows chart to fill container
    plugins: {
      legend: {
        position: 'right' as const, // Position legend to the right
        labels: {
          usePointStyle: true, // Use colored dots instead of squares
        },
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const label = context.label || '';
            const value = context.parsed;
            const percentage = ((value / total) * 100).toFixed(1);
            return `${label}: ${value} (${percentage}%)`;
          }
        }
      }
    },
    cutout: '60%', // Makes it a donut chart
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-md h-80 flex flex-col"> {/* Added flex-col for layout */}
      <h3 className="text-lg font-semibold mb-4 text-gray-800">Pin Status Distribution</h3>
      <div className="flex-grow flex items-center justify-center"> {/* Centering chart */}
        <Doughnut data={data} options={options} />
      </div>
      {/* You could optionally keep a text list for accessibility or detailed view */}
      {/* <ul className="mt-4 space-y-1 text-sm text-gray-600">
        <li>Visited: {visited} ({((visited / total) * 100).toFixed(1)}%)</li>
        <li>Planned: {planned} ({((planned / total) * 100).toFixed(1)}%)</li>
        <li>Not Visited: {notVisited} ({((notVisited / total) * 100).toFixed(1)}%)</li>
      </ul> */}
    </div>
  );
}