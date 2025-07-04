"use client";

import { useState } from "react";
import { saveSchedule } from "@/app/screens/actions";
import { PlusCircle } from "lucide-react";

// Helper objects for layout properties
const layoutSlotCount: Record<string, number> = {
  "1": 1, "2": 1, "3": 1, "4": 1, "1-1": 2, "2-2": 2, "1-2": 2, "2-1": 2, "1-1-1": 3,
  "2-1-1": 3, "1-2-1": 3, "1-1-2": 3, "1-1-1-1": 4,
};

const layoutSlotSpans: Record<string, number[]> = {
  "1-1-1-1": [1, 1, 1, 1], "2-1-1": [2, 1, 1], "1-2-1": [1, 2, 1], "1-1-2": [1, 1, 2],
  "2-2": [2, 2], "1-1-1": [1, 1, 1], "1-2": [1, 2], "2-1": [2, 1], "1-1": [2, 2], // Correct span for 1-1 layout
  "1": [4], "2": [4], "3": [4], "4": [4],
};

// Define component props
interface ScheduleEditorProps {
  groupId: string;
  layouts: string[];
  media: { id: string; file_name: string }[];
  initialSchedule: any[]; // Prop to load existing schedule
}

export default function ScheduleEditor({
  groupId,
  layouts,
  media,
  initialSchedule = [],
}: ScheduleEditorProps) {
  // Function to map the schedule data from the DB to the component's state format
  const mapInitialScheduleToState = (schedule: any[]) => {
    return schedule.map(item => ({
      id: crypto.randomUUID(),
      layout: item.layout,
      duration: `${item.duration_seconds}s`,
      // media_ids from a jsonb column is already an array
      mediaSelections: item.media_ids || [], 
    }));
  };

  const [rows, setRows] = useState(mapInitialScheduleToState(initialSchedule));

  function addRow() {
    const initialLayout = layouts[0] || "1";
    setRows([
      ...rows,
      {
        id: crypto.randomUUID(),
        layout: initialLayout,
        duration: "10s",
        mediaSelections: Array(layoutSlotCount[initialLayout] || 1).fill(null),
      },
    ]);
  }

  function updateRow(index: number, updated: Partial<(typeof rows)[0]>) {
    const newRows = [...rows];
    const currentRow = newRows[index];

    if (updated.layout && updated.layout !== currentRow.layout) {
      const newCount = layoutSlotCount[updated.layout] || 1;
      newRows[index] = { ...currentRow, ...updated, mediaSelections: Array(newCount).fill(null) };
    } else {
      newRows[index] = { ...currentRow, ...updated };
    }
    
    setRows(newRows);
  }

  // Prepare the data for the server action
  const preparedRows = rows.map(row => ({
    layout: row.layout,
    duration: parseInt(row.duration) || 10,
    media_ids: row.mediaSelections,
  }));

  return (
    <form action={saveSchedule} className="space-y-6">
      <input type="hidden" name="screen_group_id" value={groupId} />
      <input type="hidden" name="slots_json" value={JSON.stringify(preparedRows)} />

      {rows.map((row, i) => {
        // Correctly calculate the number of dropdowns needed for the layout
        const numberOfSlots = layoutSlotCount[row.layout] || 1;
        const spansForLayout = layoutSlotSpans[row.layout] || [1];
        
        return (
            <div key={row.id} className="border bg-white rounded-lg p-4 space-y-4 shadow-sm">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                <span className="text-gray-600 font-semibold">#{i + 1}</span>
                <div className="flex items-center gap-2">
                    <span className="text-gray-600">Layout:</span>
                    <div className="flex gap-1">
                    {layouts.map((l) => (
                        <button
                        key={l}
                        type="button"
                        onClick={() => updateRow(i, { layout: l })}
                        className={`px-2 py-1 border rounded text-xs ${
                            row.layout === l
                            ? "bg-blue-600 text-white border-blue-600"
                            : "bg-gray-100 hover:bg-gray-200"
                        }`}
                        >
                        {l}
                        </button>
                    ))}
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-gray-600">Duration:</span>
                    <select
                    value={row.duration}
                    onChange={(e) => updateRow(i, { duration: e.target.value })}
                    className="border rounded px-2 py-1 text-sm bg-gray-50"
                    >
                    <option value="5s">5s</option>
                    <option value="10s">10s</option>
                    <option value="15s">15s</option>
                    <option value="30s">30s</option>
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-4 gap-2 w-full">
                {/* Loop based on the number of slots, not the spans array */}
                {Array.from({ length: numberOfSlots }).map((_, idx) => {
                    const span = spansForLayout[idx] || 1;
                    return (
                        <select
                            key={idx}
                            value={row.mediaSelections[idx] ?? ""}
                            onChange={(e) => {
                            const updatedSelections = [...row.mediaSelections];
                            updatedSelections[idx] = e.target.value || null;
                            updateRow(i, { mediaSelections: updatedSelections });
                            }}
                            className="border rounded px-3 py-2 bg-gray-50 text-sm"
                            style={{ gridColumn: `span ${span}` }}
                        >
                            <option value="">— Select Media —</option>
                            {media.map((m) => (
                            <option key={m.id} value={m.id}>
                                {m.file_name}
                            </option>
                            ))}
                        </select>
                    )
                })}
            </div>
            </div>
        );
      })}

      <div className="flex gap-4 mt-6">
        <button
          type="button"
          onClick={addRow}
          className="inline-flex items-center px-4 py-2 bg-white border rounded text-black hover:bg-gray-100"
        >
          <PlusCircle className="w-4 h-4 mr-2" />
          Add to Queue
        </button>
        <button
          type="submit"
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Save Schedule
        </button>
      </div>
    </form>
  );
}