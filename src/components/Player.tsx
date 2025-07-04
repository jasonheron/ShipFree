// src/components/Player.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from 'next/navigation';
import { createClient } from "@/lib/supabase/client";
import { openDB } from 'idb';
import { RefreshCw } from "lucide-react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import GridLayout from "./GridLayout";
import SpannedLayout from "./SpannedLayout";

// --- Types and Constants ---
type Media = { id: string; file_url: string; file_type: string; file_name: string; blob?: Blob };
type ScheduleSlot = { layout: string; duration_seconds: number; media_ids: (string | null)[] };
type ScreenInfo = { group_id: string; sync_mode: 'extend' | 'sync'; last_updated: string; all_screen_ids: string[] };
const DB_NAME = 'player-cache';
const DB_VERSION = 1;

// --- Helper to initialize IndexedDB ---
const initDB = () => openDB(DB_NAME, DB_VERSION, {
  upgrade(db) {
    if (!db.objectStoreNames.contains('schedule-store')) { db.createObjectStore('schedule-store'); }
    if (!db.objectStoreNames.contains('media-store')) { db.createObjectStore('media-store'); }
  },
});

// --- Main Player Component ---
export default function Player() {
  const params = useParams();
  const screenId = params.screenId as string;
  const supabase = createClient();

  // State
  const [status, setStatus] = useState("Initializing...");
  const [schedule, setSchedule] = useState<ScheduleSlot[]>([]);
  const [mediaMap, setMediaMap] = useState<Map<string, Media>>(new Map());
  const [currentSlotIndex, setCurrentSlotIndex] = useState(0);
  const [groupId, setGroupId] = useState<string | null>(null);
  const [syncMode, setSyncMode] = useState<'extend' | 'sync' | null>(null);
  const [screenIndex, setScreenIndex] = useState(0);
  const [totalScreens, setTotalScreens] = useState(1);
  
  const isLeader = useRef(false);
  const leaderTimeout = useRef<NodeJS.Timeout | null>(null);
  const currentIndexRef = useRef(currentSlotIndex);

  useEffect(() => {
    currentIndexRef.current = currentSlotIndex;
  }, [currentSlotIndex]);

  const handleRePair = () => {
    if (window.confirm("Are you sure you want to un-pair this device?")) {
        localStorage.removeItem('screenId');
        window.location.href = '/pair';
    }
  }

  useEffect(() => {
    if (!screenId) return;

    async function runPlayer() {
      const db = await initDB();
      setStatus("Loading from cache...");
      const cachedSchedule = await db.get('schedule-store', 'schedule');
      const cachedLastUpdated = await db.get('schedule-store', 'last_updated');

      if (cachedSchedule && cachedSchedule.length > 0) {
        setSchedule(cachedSchedule);
        const mediaIds = new Set<string>();
        cachedSchedule.forEach((slot: ScheduleSlot) => {
            if(Array.isArray(slot.media_ids)) {
                slot.media_ids.forEach((id: string | null) => id && mediaIds.add(id));
            }
        });
        
        const newMediaMap = new Map();
        for (const id of mediaIds) {
          const blob = await db.get('media-store', id);
          if (blob) {
            newMediaMap.set(id, { id: id, file_url: URL.createObjectURL(blob), file_type: blob.type, file_name: '' });
          }
        }
        setMediaMap(newMediaMap);
        setStatus("Playing from cache...");
      } else {
         setStatus("No cached schedule. Checking server...");
      }

      try {
        const { data: screenInfoResult, error: rpcError } = await supabase.rpc('get_group_for_screen', { screen_id_param: screenId });
        
        if (rpcError || !screenInfoResult || screenInfoResult.length === 0) {
          setStatus(rpcError ? `RPC Error: ${rpcError.message}` : "Error: Screen not assigned to a group.");
          return;
        }
        
        const screenInfo: ScreenInfo = screenInfoResult[0];
        
        // The core update logic: check if server timestamp is newer than cached timestamp
        if (!cachedLastUpdated || new Date(screenInfo.last_updated) > new Date(cachedLastUpdated)) {
          setStatus("New schedule found. Downloading...");
          const { data: newSchedule } = await supabase.from("media_schedules").select("*").eq("screen_group_id", screenInfo.group_id).order("slot_index");
          
          await db.put('schedule-store', newSchedule || [], 'schedule');
          await db.put('schedule-store', screenInfo.last_updated, 'last_updated');

          const mediaIdsToFetch = new Set<string>();
          (newSchedule || []).forEach(slot => {
            if (Array.isArray(slot.media_ids)) {
              slot.media_ids.forEach((id: string | null) => id && mediaIdsToFetch.add(id));
            }
          });

          if (mediaIdsToFetch.size > 0) {
              const { data: mediaToDownload } = await supabase.from("media_table").select("*").in('id', Array.from(mediaIdsToFetch));
              for (const media of (mediaToDownload || [])) {
                  const response = await fetch(media.file_url);
                  const blob = await response.blob();
                  await db.put('media-store', blob, media.id);
              }
          }
          setStatus("Update complete. Reloading player...");
          window.location.reload();
        } else {
          // If no update, set the group info from the RPC call and continue
          setGroupId(screenInfo.group_id);
          setSyncMode(screenInfo.sync_mode);
          const myIndex = screenInfo.all_screen_ids.indexOf(screenId);
          setScreenIndex(myIndex >= 0 ? myIndex : 0);
          setTotalScreens(screenInfo.all_screen_ids.length);
          setStatus("Playing.");
        }
      } catch (error) {
        console.error("A critical error occurred in runPlayer:", error);
        setStatus("Connection error. Playing from cache.");
      }
    }

    runPlayer();

    const interval = setInterval(() => {
        supabase.rpc('heartbeat', { screen_id_param: screenId }).then(({error}) => {
            if(error) console.error('Heartbeat failed:', error);
        });
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [screenId, supabase]);

  useEffect(() => {
    if (schedule.length === 0 || !syncMode || !groupId) return;

    if (syncMode === 'extend') {
      const duration = (schedule[currentSlotIndex]?.duration_seconds || 10) * 1000;
      const timer = setTimeout(() => {
        setCurrentSlotIndex((prev) => (prev + 1) % schedule.length);
      }, duration);
      return () => clearTimeout(timer);
    }
    
    if (syncMode === 'sync') {
      const channel = supabase.channel(`player-sync-${groupId}`, {
        config: { presence: { key: screenId } },
      });

      const onSlideChange = (message: { payload: { newIndex: number } }) => {
        if (message.payload.newIndex !== currentIndexRef.current) {
          setCurrentSlotIndex(message.payload.newIndex);
        }
      };

      const handlePresenceChange = () => {
        const presences = channel.presenceState();
        const self = presences[screenId];
        if (!self || self.length === 0) return;

        const sortedPresences = Object.values(presences).sort((a: any, b: any) => 
          new Date(a[0].online_at).getTime() - new Date(b[0].online_at).getTime()
        );
        
        if (sortedPresences.length === 0) return;
        
        const leaderPresence = sortedPresences[0] as any[];
        isLeader.current = self[0].presence_ref === leaderPresence[0].presence_ref;

        if (isLeader.current && !leaderTimeout.current) {
            const advanceAndBroadcast = () => {
              const nextIndex = (currentIndexRef.current + 1) % schedule.length;
              setCurrentSlotIndex(nextIndex);
              channel.send({
                type: 'broadcast',
                event: 'slide-change',
                payload: { newIndex: nextIndex },
              });
              const durationForNextSlide = (schedule[nextIndex]?.duration_seconds || 10) * 1000;
              leaderTimeout.current = setTimeout(advanceAndBroadcast, durationForNextSlide);
            };
            const initialDuration = (schedule[currentIndexRef.current]?.duration_seconds || 10) * 1000;
            leaderTimeout.current = setTimeout(advanceAndBroadcast, initialDuration);
        }
      };
      
      channel.on('broadcast', { event: 'slide-change' }, onSlideChange);
      channel.on('presence', { event: 'sync' }, handlePresenceChange);
      
      channel.subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ online_at: new Date().toISOString() });
        }
      });

      return () => {
        if (leaderTimeout.current) {
            clearTimeout(leaderTimeout.current);
            leaderTimeout.current = null;
        }
        supabase.removeChannel(channel);
      };
    }
  }, [schedule, syncMode, groupId, screenId, supabase]);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black">
      {schedule.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center text-white text-2xl z-20">
          {status}
        </div>
      )}
      <div className="w-full h-full">
        {schedule.length > 0 && (() => {
          const currentSlot = schedule[currentSlotIndex];
          if (!currentSlot) return null;

          if (syncMode === 'extend') {
            const isSpannedLayout = ['2', '3', '4'].includes(currentSlot.layout);
            if (isSpannedLayout) {
                return <SpannedLayout mediaItem={currentSlot.media_ids[0] ? mediaMap.get(currentSlot.media_ids[0]) ?? null : null} screenIndex={0} totalScreens={1} />;
            } else {
                return <GridLayout slot={currentSlot} mediaMap={mediaMap} />;
            }
          }

          if (syncMode === 'sync') {
            const layoutParts = currentSlot.layout.split('-').map(Number);
            let mediaIndexCounter = 0;
            let screenIndexCounter = 0;
            let renderInfo = null;

            for (const part of layoutParts) {
                const startScreen = screenIndexCounter;
                const endScreen = screenIndexCounter + part - 1;

                if (screenIndex >= startScreen && screenIndex <= endScreen) {
                    renderInfo = {
                        mediaId: currentSlot.media_ids[mediaIndexCounter],
                        spanGroupSize: part,
                        indexInSpanGroup: screenIndex - startScreen,
                    };
                    break;
                }
                mediaIndexCounter++;
                screenIndexCounter += part;
            }

            if (!renderInfo || !renderInfo.mediaId) {
                return <div className="w-full h-full bg-black" />;
            }

            const mediaItem = mediaMap.get(renderInfo.mediaId);
            if (!mediaItem) {
                return <div className="w-full h-full bg-black" />;
            }

            if (renderInfo.spanGroupSize > 1) {
                return (
                    <SpannedLayout 
                        mediaItem={mediaItem} 
                        screenIndex={renderInfo.indexInSpanGroup} 
                        totalScreens={renderInfo.spanGroupSize} 
                    />
                );
            } 
            else {
                if (mediaItem.file_type.startsWith("video")) {
                    return <video key={mediaItem.id} src={mediaItem.file_url} autoPlay muted loop className="w-full h-full object-cover" />;
                } else {
                    return <img key={mediaItem.id} src={mediaItem.file_url} alt={mediaItem.file_name} className="w-full h-full object-cover" />;
                }
            }
          }
          return null;
        })()}
      </div>
      <button 
        onClick={handleRePair}
        className="absolute bottom-2 right-2 bg-gray-800 bg-opacity-50 text-white text-xs p-2 rounded-full hover:bg-opacity-75"
        title="Un-pair this device"
      >
        <RefreshCw className="h-4 w-4" />
      </button>
    </div>
  );
}
