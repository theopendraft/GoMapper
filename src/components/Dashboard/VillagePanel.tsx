// import React, { useState } from "react";
// import villagesData from "../../data/villages.json";
// import { Input } from "../ui/input";
// import { Button } from "../ui/button";
// import { Badge } from "../ui/badge";
// import { useFilteredVillages } from "./useFilteredVillages"; // Custom hook (optional)
// import type { Village } from "./types";

// export const VillageContext = React.createContext<{
//   filteredVillages: Village[];
// }>({ filteredVillages: [] });

// export default function VillagePanel() {
//   const allVillages: Village[] = villagesData as Village[];
//   const [search, setSearch] = useState("");
//   const [filter, setFilter] = useState<"all" | "visited" | "planned" | "not_visited">("all");

//   const filteredVillages = allVillages.filter((village) => {
//     const matchesSearch = village.name.toLowerCase().includes(search.toLowerCase());
//     const matchesFilter = filter === "all" || village.status === filter;
//     return matchesSearch && matchesFilter;
//   });

//   const stats = {
//     visited: allVillages.filter(v => v.status === "visited").length,
//     planned: allVillages.filter(v => v.status === "planned").length,
//     notVisited: allVillages.filter(v => v.status === "not_visited").length,
//   };

//   return (
//     <VillageContext.Provider value={{ filteredVillages }}>
//       <div className="w-full md:w-[20rem] lg:w-[22rem] border-r p-4 space-y-4 bg-white overflow-y-auto">
//         <h2 className="text-xl font-bold">📍 Village Dashboard</h2>

//         {/* Stats */}
//         <div className="space-y-1">
//           <Badge variant="default">Visited: {stats.visited}</Badge>
//           <Badge variant="default">Planned: {stats.planned}</Badge>
//           <Badge variant="default">Not Visited: {stats.notVisited}</Badge>
//         </div>

//         {/* Search */}
//         <Input
//           type="text"
//           placeholder="Search village..."
//           value={search}
//           onChange={(e) => setSearch(e.target.value)}
//         />

//         {/* Filters */}
//         <div className="space-x-2">
//           {["all", "visited", "planned", "not_visited"].map((status) => (
//             <Button
//               key={status}
//               variant={filter === status ? "default" : "outline"}
//               onClick={() => setFilter(status as any)}
//             >
//               {status.replace("_", " ").toUpperCase()}
//             </Button>
//           ))}
//         </div>

//         {/* Results */}
//         <ul className="space-y-1 text-sm pt-2">
//           {filteredVillages.length === 0 ? (
//             <p className="text-sm text-muted-foreground italic">No villages found.</p>
//           ) : (
//             filteredVillages.map((v) => (
//               <li key={v.id} className="border p-2 rounded-md">
//                 <p className="font-semibold">{v.name}</p>
//                 <p className="text-xs text-muted-foreground">{v.tehsil} • Pop: {v.population}</p>
//               </li>
//             ))
//           )}
//         </ul>
//       </div>
//     </VillageContext.Provider>
//   );
// }
