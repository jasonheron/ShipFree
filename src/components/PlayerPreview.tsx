// src/components/PlayerPreview.tsx
"use client";

import { useState, useEffect } from "react";

// --- Types and Constants ---
type Media = { id: string; file_url: string; file_type: string; file_name: string; };
type ScheduleSlot = { layout: string; duration_seconds: number; media_ids: (string | null)[] };
type Screen = { id: string; name: string; };

interface PlayerPreviewProps {
  schedule: ScheduleSlot[];
  media: Media[];
  assignedScreens: Screen[];
  syncMode: 'sync' | 'extend'; // New prop to handle different modes
}

// Helper to get the correct grid class for Tailwind CSS
const gridColsMap: Record<number, string> = {
    1: 'grid-cols-1',
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
};

export default function PlayerPreview({ schedule, media, assignedScreens, syncMode }: PlayerPreviewProps) {
  const [currentSlotIndex, setCurrentSlotIndex] = useState(0);
  const mediaMap = new Map(media.map(item => [item.id, item]));

  useEffect(() => {
    if (schedule.length <= 1) return;
    const currentDuration = (schedule[currentSlotIndex]?.duration_seconds || 10) * 1000;
    const timer = setTimeout(() => {
      setCurrentSlotIndex(prevIndex => (prevIndex + 1) % schedule.length);
    }, currentDuration);
    return () => clearTimeout(timer);
  }, [currentSlotIndex, schedule]);

  const numScreens = assignedScreens.length;
  const gridColsClass = gridColsMap[numScreens] || 'grid-cols-1';

  // If there's no schedule, show a static grid of the assigned screens
  if (schedule.length === 0) {
    const aspectRatio = numScreens > 0 ? `${16 * numScreens} / 9` : '16 / 9';
    return (
      <div className="w-full max-w-6xl mx-auto bg-gray-800 rounded-lg p-1" style={{ aspectRatio }}>
        <div className={`grid h-full ${gridColsClass} gap-1`}>
            {assignedScreens.length > 0 ? assignedScreens.map(screen => (
                <div key={screen.id} className="bg-gray-900 rounded-md flex flex-col items-center justify-center text-xs text-gray-500">
                    <p>{screen.name}</p>
                    <p className="mt-2 text-gray-600">No Schedule Saved</p>
                </div>
            )) : (
                 <div className="bg-gray-900 rounded-md flex items-center justify-center text-xs text-gray-500">
                    <p>No screens assigned to this group.</p>
                </div>
            )}
        </div>
      </div>
    );
  }
  
  const currentSlot = schedule[currentSlotIndex];
  if (!currentSlot) return null;

  // --- RENDER LOGIC FOR 'EXTEND' MODE ---
  if (syncMode === 'extend') {
    const aspectRatio = numScreens > 0 ? `${16 * numScreens} / 9` : '16 / 9';
    const mediaItem = currentSlot.media_ids[0] ? mediaMap.get(currentSlot.media_ids[0]) : null;

    return (
      <div className="w-full max-w-6xl mx-auto bg-black rounded-lg overflow-hidden" style={{ aspectRatio }}>
        <div key={currentSlotIndex} className="w-full h-full relative">
          {mediaItem ? (
            mediaItem.file_type.startsWith("video") ? (
              <video src={mediaItem.file_url} autoPlay muted loop className="w-full h-full object-cover" />
            ) : (
              <img src={mediaItem.file_url} alt={mediaItem.file_name} className="w-full h-full object-cover" />
            )
          ) : (
            <div className="w-full h-full bg-black flex items-center justify-center text-white">No Media</div>
          )}
        </div>
      </div>
    );
  }

  // --- RENDER LOGIC FOR 'SYNC' MODE ---
  const layoutParts = currentSlot.layout.split('-').map(Number);
  const syncAspectRatio = '16 / 9'; // Sync preview shows a grid of standard screens

  return (
    <div className="w-full max-w-6xl mx-auto bg-black rounded-lg overflow-hidden" style={{ aspectRatio: syncAspectRatio }}>
        <div key={currentSlotIndex} className={`grid w-full h-full ${gridColsClass} gap-px bg-gray-700`}>
            {layoutParts.map((span, partIndex) => {
                const colSpan = Math.min(span, numScreens);
                const mediaId = currentSlot.media_ids[partIndex];
                
                if (!mediaId) {
                    return <div key={partIndex} className="bg-black" style={{ gridColumn: `span ${colSpan}` }} />;
                }
                const mediaItem = mediaMap.get(mediaId);
                if (!mediaItem) {
                    return <div key={partIndex} className="bg-black" style={{ gridColumn: `span ${colSpan}` }} />;
                }

                return (
                    <div key={partIndex} className="relative w-full h-full" style={{ gridColumn: `span ${colSpan}` }}>
                        {mediaItem.file_type.startsWith("video") ? (
                            <video src={mediaItem.file_url} autoPlay muted loop className="w-full h-full object-cover" />
                        ) : (
                            <img src={mediaItem.file_url} alt={mediaItem.file_name} className="w-full h-full object-cover" />
                        )}
                    </div>
                );
            })}
        </div>
    </div>
  );
}
