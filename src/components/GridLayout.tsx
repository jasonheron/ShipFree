// src/components/GridLayout.tsx
"use client";

// Define the types for the props this component receives
type Media = { id: string; file_url: string; file_type: string; file_name: string; };
type ScheduleSlot = { layout: string; media_ids: (string | null)[] };

interface GridLayoutProps {
  slot: ScheduleSlot;
  mediaMap: Map<string, Media>;
}

// Helper objects for layout properties
const layoutToGridClass: Record<string, string> = {
  "1": "grid-cols-1", "1-1": "grid-cols-2", "2-2": "grid-cols-2", "1-1-1": "grid-cols-3", "1-1-1-1": "grid-cols-4",
};

const layoutSlotSpans: Record<string, number[]> = {
  "1-1-1-1": [1, 1, 1, 1], "2-2": [2, 2], "1-1-1": [1, 1, 1], "1-1": [1, 1], "1": [4],
};

export default function GridLayout({ slot, mediaMap }: GridLayoutProps) {
  const gridCols = layoutToGridClass[slot.layout] || 'grid-cols-1';
  const spans = layoutSlotSpans[slot.layout] || [1];

  return (
    <div className={`w-full h-full bg-black grid ${gridCols} gap-1`}>
      {spans.map((span, index) => {
        const mediaId = slot.media_ids[index];
        const mediaItem = mediaId ? mediaMap.get(mediaId) : null;
        const uniqueKey = mediaItem ? `${mediaItem.id}-${index}` : `empty-${index}`;

        if (!mediaItem) {
          return <div key={uniqueKey} className="bg-gray-900" style={{ gridColumn: `span ${span}` }}></div>;
        }
        if (mediaItem.file_type.startsWith("video")) {
          return <div key={uniqueKey} style={{ gridColumn: `span ${span}` }}><video src={mediaItem.file_url} autoPlay muted loop className="w-full h-full object-cover" /></div>;
        } else {
          return <div key={uniqueKey} style={{ gridColumn: `span ${span}` }}><img src={mediaItem.file_url} alt={mediaItem.file_name} className="w-full h-full object-cover" /></div>;
        }
      })}
    </div>
  );
}
