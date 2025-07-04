// src/components/PlayerPreview.tsx
"use client";

import { useState, useEffect } from "react";
import GridLayout from "./GridLayout"; // Import the separated layout components
import SpannedLayout from "./SpannedLayout";

// --- Types and Constants ---
type Media = { id: string; file_url: string; file_type: string; file_name: string; };
type ScheduleSlot = { layout: string; duration_seconds: number; media_ids: (string | null)[] };
type Screen = { id: string; name: string; };

interface PlayerPreviewProps {
  schedule: ScheduleSlot[];
  media: Media[];
  assignedScreens: Screen[];
}

export default function PlayerPreview({ schedule, media, assignedScreens }: PlayerPreviewProps) {
  const [currentSlotIndex, setCurrentSlotIndex] = useState(0);
  const mediaMap = new Map(media.map(item => [item.id, item]));

  // For the preview, we simulate the view from the first screen's perspective (index 0).
  const screenIndex = 0; 
  const totalScreens = assignedScreens.length;

  useEffect(() => {
    if (schedule.length === 0) return;
    const currentDuration = (schedule[currentSlotIndex]?.duration_seconds || 10) * 1000;
    const timer = setTimeout(() => {
      setCurrentSlotIndex(prevIndex => (prevIndex + 1) % schedule.length);
    }, currentDuration);
    return () => clearTimeout(timer);
  }, [currentSlotIndex, schedule]);

  // If there's no schedule, show a static grid of the assigned screens
  if (schedule.length === 0) {
    return (
      <div className="w-full max-w-4xl mx-auto aspect-video bg-gray-800 rounded-lg p-1" style={{ maxHeight: '300px' }}>
        <div className={`grid h-full grid-cols-${assignedScreens.length || 1} gap-1`}>
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

  // --- CORRECTED: Use the same conditional rendering logic as the main Player ---
  const isSpannedLayout = ['2', '3', '4'].includes(currentSlot.layout);
  const rawMediaItem = currentSlot.media_ids[0] ? mediaMap.get(currentSlot.media_ids[0]) : null;
  const mediaItem: Media | null = rawMediaItem === undefined ? null : rawMediaItem;

  return (
    <div className="w-full max-w-4xl mx-auto aspect-video bg-black rounded-lg overflow-hidden" style={{ maxHeight: '300px' }}>
        <div key={currentSlotIndex} className="w-full h-full relative">
            {isSpannedLayout ? (
                <SpannedLayout 
                    mediaItem={mediaItem}
                    screenIndex={screenIndex}
                    totalScreens={totalScreens}
                />
            ) : (
                <GridLayout 
                    slot={currentSlot}
                    mediaMap={mediaMap}
                />
            )}
        </div>
    </div>
  );
}
