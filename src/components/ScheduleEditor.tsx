// File: src/components/ScheduleEditor.tsx
"use client";

import { useState } from "react";
import { PlusCircle } from "lucide-react";

const layoutSlotCount: Record<string, number> = {
  "1-1-1-1": 4,
  "2-1-1": 3,
  "1-2-1": 3,
  "2-2": 2,
  "1-1-1": 3,
  "1-2": 2,
  "2-1": 2,
  "1-1-2": 3,
  "3": 1,
  "4": 1,
};

const layoutSlotSpans: Record<string, number[]> = {
  "1-1-1-1": [1, 1, 1, 1],
  "2-1-1": [2, 1, 1],
  "1-2-1": [1, 2, 1],
  "1-1-2": [1, 1, 2],
  "2-2": [2, 2],
  "1-1-1": [1, 1, 1],
  "1-2": [1, 2],
  "2-1": [2, 1],
  "3": [3],
  "4": [4],
};

export default function ScheduleEditor({
  layouts,
  media,
}: {
  layouts: string[];
  media: any[];
}) {
  const [rows, setRows] = useState<
    {
      id: string;
      layout: string;
      duration: string;
      mediaSelections: (string | null)[];
    }[]
  >([]);

  function addRow() {
    const initialLayout = layouts[0];
    setRows([
      ...rows,
      {
        id: crypto.randomUUID(),
        layout: initialLayout,
        duration: "5s",
        mediaSelections: Array(layoutSlotCount[initialLayout]).fill(null),
      },
    ]);
  }

  function updateRow(index: number, updated: Partial<typeof rows[0]>) {
    const newRows = [...rows];
    let mediaSelections = newRows[index].mediaSelections;

    if (updated.layout) {
      const newCount = layoutSlotCount[updated.layout];
      mediaSelections = Array(newCount).fill(null);
    }

    newRows[index] = { ...newRows[index], ...updated, mediaSelections };
    setRows(newRows);
  }

  return (
    <div className="space-y-6">
      {rows.map((row, i) => (
        <div
          key={row.id}
          className="border bg-white rounded p-4 space-y-4"
        >
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-gray-600 font-semibold">#{i + 1}</span>
            <span className="text-gray-600">Layout:</span>
            <div className="flex gap-1">
              {layouts.map((l) => (
                <button
                  key={l}
                  onClick={() => updateRow(i, { layout: l })}
                  className={`px-2 py-1 border rounded ${
                    row.layout === l
                      ? "bg-blue-500 text-white"
                      : "bg-gray-100 text-gray-700"
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
            <span className="ml-2 text-gray-600">Slide time:</span>
            <select
              value={row.duration}
              onChange={(e) => updateRow(i, { duration: e.target.value })}
              className="border rounded px-2 py-1"
            >
              <option value="5s">5s</option>
              <option value="10s">10s</option>
              <option value="15s">15s</option>
              <option value="auto">Auto</option>
            </select>
          </div>

          <div className="flex gap-2 w-full">
            {row.mediaSelections.map((selection, idx) => {
              const span = layoutSlotSpans[row.layout]?.[idx] || 1;
              return (
                <select
                  key={idx}
                  value={selection ?? ""}
                  onChange={(e) => {
                    const updatedSelections = [...row.mediaSelections];
                    updatedSelections[idx] = e.target.value;
                    updateRow(i, { mediaSelections: updatedSelections });
                  }}
                  className={`border rounded px-3 py-2`}
                  style={{
                    flexGrow: span,
                    flexBasis: `${span * 0}%`,
                  }}
                >
                  <option value="">— Select Media —</option>
                  {media.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.filename}
                    </option>
                  ))}
                </select>
              );
            })}
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={addRow}
        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        <PlusCircle className="w-4 h-4 mr-1" />
        Add Row
      </button>
    </div>
  );
}
