// src/app/play-simple/[screenId]/page.tsx
"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

// --- Types and Constants ---
type Media = { id: string; file_url: string; file_type: string; file_name: string; };
type ScheduleSlot = { layout: string; duration_seconds: number; media_ids: (string | null)[] };

const layoutToGridClass: Record<string, string> = {
  "1": "grid-cols-1", "2": "grid-cols-1", "3": "grid-cols-1", "4": "grid-cols-1",
  "1-1": "grid-cols-2", "2-2": "grid-cols-2", "1-2": "grid-cols-3", "2-1": "grid-cols-3",
  "1-1-1": "grid-cols-3", "1-1-2": "grid-cols-4", "1-2-1": "grid-cols-4",
  "2-1-1": "grid-cols-4", "1-1-1-1": "grid-cols-4",
};

const layoutSlotSpans: Record<string, number[]> = {
  "1-1-1-1": [1, 1, 1, 1], "2-1-1": [2, 1, 1], "1-2-1": [1, 2, 1], "1-1-2": [1, 1, 2],
  "2-2": [2, 2], "1-1-1": [1, 1, 1], "1-2": [1, 2], "2-1": [2, 1], "1-1": [2, 2],
  "1": [4], "2": [4], "3": [4], "4": [4],
};

// --- Main Player Component ---
export default function SimplePlayerPage({ params }: { params: { screenId: string } }) {
  const supabase = createClient();
  const [status, setStatus] = useState("Initializing...");
  const [schedule, setSchedule] = useState<ScheduleSlot[]>([]);
  const [mediaMap, setMediaMap] = useState<Map<string, Media>>(new Map());
  const [currentSlotIndex, setCurrentSlotIndex] = useState(0);

  // This useEffect runs only once on page load to fetch data.
  useEffect(() => {
    async function fetchData() {
      setStatus("Fetching schedule...");
      
      // Step 1: Call the function to get the group ID.
      const { data: screenInfo, error: rpcError } = await supabase.rpc('get_group_for_screen', {
        screen_id_param: params.screenId
      });

      if (rpcError || !screenInfo || screenInfo.length === 0) {
        setStatus(`Error: Could not get group for screen. ${rpcError?.message || 'Is it assigned to a group?'}`);
        return;
      }
      
      const { group_id } = screenInfo[0];
      setStatus(`Found group ${group_id}. Fetching media...`);

      // Step 2: Fetch the schedule for that group.
      const { data: scheduleData, error: scheduleError } = await supabase
        .from("media_schedules")
        .select("*")
        .eq("screen_group_id", group_id)
        .order("slot_index");

      if (scheduleError) {
        setStatus(`Error fetching schedule: ${scheduleError.message}`);
        return;
      }
      
      const currentSchedule = scheduleData || [];
      setSchedule(currentSchedule);

      // Step 3: Fetch the media needed for the schedule.
      if (currentSchedule.length > 0) {
        const mediaIds = new Set<string>();
        currentSchedule.forEach(slot => {
            if (Array.isArray(slot.media_ids)) {
                // FIX: Added explicit type annotation for 'id'
                slot.media_ids.forEach((id: string | null) => id && mediaIds.add(id));
            }
        });

        if (mediaIds.size > 0) {
          const { data: mediaData, error: mediaError } = await supabase
            .from("media_table")
            .select("*")
            .in('id', Array.from(mediaIds));
          
          if(mediaError) {
            setStatus(`Error fetching media: ${mediaError.message}`);
            return;
          }

          if (mediaData) {
            setMediaMap(new Map(mediaData.map(item => [item.id, item])));
          }
        }
        setStatus("Playing.");
      } else {
        setStatus("No schedule found for this group.");
      }
    }

    fetchData();
  }, [params.screenId, supabase]);

  // Player loop (remains the same)
  useEffect(() => {
    if (schedule.length === 0) return;
    const currentSlot = schedule[currentSlotIndex];
    const duration = (currentSlot?.duration_seconds || 10) * 1000;
    const timer = setTimeout(() => {
      setCurrentSlotIndex((prevIndex) => (prevIndex + 1) % schedule.length);
    }, duration);
    return () => clearTimeout(timer);
  }, [currentSlotIndex, schedule]);

  if (schedule.length === 0) {
    return <div className="w-screen h-screen bg-black flex items-center justify-center text-white text-2xl">{status}</div>;
  }

  const currentSlot = schedule[currentSlotIndex];
  if (!currentSlot) return null;

  const gridCols = layoutToGridClass[currentSlot.layout] || 'grid-cols-1';
  const spans = layoutSlotSpans[currentSlot.layout] || [1];

  return (
    <div className={`w-screen h-screen bg-black grid ${gridCols} gap-1`}>
      {spans.map((span, index) => {
        const mediaId = currentSlot.media_ids[index];
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
