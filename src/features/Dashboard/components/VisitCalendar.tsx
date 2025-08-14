// src/features/Dashboard/components/VisitCalendar.tsx
import React, { useState, useEffect } from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { Village } from "../../../types/village";
import { format } from "date-fns";

const VisitCalendar = ({ villages }: { villages: Village[] }) => {
  const [selectedDay, setSelectedDay] = useState<Date | undefined>();
  const [visitDays, setVisitDays] = useState<Date[]>([]);

  useEffect(() => {
    const dates = villages
      .filter((v) => v.nextVisitTarget)
      .map((v) => new Date(v.nextVisitTarget!));
    setVisitDays(dates);
  }, [villages]);

  const selectedDayVisits = selectedDay
    ? villages.filter(
        (v) =>
          v.nextVisitTarget &&
          format(new Date(v.nextVisitTarget), "yyyy-MM-dd") ===
            format(selectedDay, "yyyy-MM-dd")
      )
    : [];

  const footer = selectedDay ? (
    selectedDayVisits.length > 0 ? (
      <div className="mt-4 text-sm">
        <h4 className="font-bold text-gray-700">
          Visits on {format(selectedDay, "PPP")}:
        </h4>
        <ul className="list-disc list-inside mt-2 space-y-1 text-gray-600">
          {selectedDayVisits.map((v) => (
            <li key={v.id}>{v.name}</li>
          ))}
        </ul>
      </div>
    ) : (
      <p className="mt-4 text-sm text-gray-500">
        No visits scheduled for {format(selectedDay, "PPP")}.
      </p>
    )
  ) : (
    <p className="mt-4 text-sm text-gray-500">
      Please select a day to see scheduled visits.
    </p>
  );

  return (
    <div>
      <h3 className="text-xl font-bold text-gray-800 mb-4">Upcoming Visits</h3>
      <div className="bg-white p-4 rounded-lg shadow-inner flex justify-center">
        <DayPicker
          mode="single"
          selected={selectedDay}
          onSelect={setSelectedDay}
          modifiers={{ scheduled: visitDays }}
          modifiersClassNames={{
            scheduled: "bg-blue-500 text-white rounded-full",
          }}
          footer={<div className="mt-4 pt-4 border-t">{footer}</div>}
          className="w-full"
          classNames={{
            caption: "flex justify-center items-center h-10",
            head_row: "flex justify-around",
            cell: "text-center",
            day: "h-9 w-9 rounded-full transition-colors hover:bg-gray-100",
            day_selected: "bg-blue-600 text-white hover:bg-blue-700",
          }}
        />
      </div>
    </div>
  );
};

export default VisitCalendar;
