import React from "react";
import { Input } from "../../../components/ui/input";
import { Button } from "../../../components/ui/button";

export default function SearchFilters({
  search,
  setSearch,
  filter,
  setFilter,
}: {
  search: string;
  setSearch: (v: string) => void;
  filter: "all" | "visited" | "planned" | "not_visited";
  setFilter: (v: "all" | "visited" | "planned" | "not_visited") => void;
}) {
  return (
    <div className="bg-white p-4 rounded shadow mb-4">
      <Input
        placeholder="Search Pins..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      <div className="grid md:grid-cols-4 grid-cols-1 gap-3 mt-2 w-full " role="group" aria-label="Filter villages by status">
        {["all", "visited", "planned", "not_visited"].map((s) => (
          <Button
            key={s}
            variant={filter === s ? "default" : "outline"}
            onClick={() => setFilter(s as any)}
          >
            {s.replace("_", " ").toUpperCase()}
          </Button>
        ))}
      </div>
    </div>
  );
}
