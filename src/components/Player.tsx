// src/components/Player.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { openDB } from "idb";
import { RefreshCw } from "lucide-react";
import type { RealtimeChannel } from "@supabase/supabase-js";

// --- Types and Constants ---
type Media = { id: string; file_url: string; file_type: string; file_name: string; blob?: Blob };
type ScheduleSlot = { layout: string; duration_seconds: number; media_ids: (string | null)[] };
type ScreenInfo = { group_id: string; sync_mode: "extend" | "sync"; last_updated: string; all_screen_ids: string[] };

const DB_NAME = "player-cache";
const DB_VERSION = 1;

// --- Helper to initialize IndexedDB ---
const initDB = () =>
  openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains("schedule-store")) db.createObjectStore("schedule-store");
      if (!db.objectStoreNames.contains("media-store")) db.createObjectStore("media-store");
    },
  });

// --- Main Player Component ---
export default function Player() {
  const params = useParams();
  const screenId = params.screenId as string;
  const supabase = createClient();

  const [status, setStatus] = useState("Initializing...");
  const [schedule, setSchedule] = useState<ScheduleSlot[]>([]);
  const [mediaMap, setMediaMap] = useState<Map<string, Media>>(new Map());
  const [currentSlotIndex, setCurrentSlotIndex] = useState(0);
  const [groupId, setGroupId] = useState<string | null>(null);
  const [syncMode, setSyncMode] = useState<"extend" | "sync" | null>(null);
  const [screenIndex, setScreenIndex] = useState(0);
  const [totalScreens, setTotalScreens] = useState(1);
  const [isLeader, setIsLeader] = useState(false);
  const channelRef = useRef<RealtimeChannel | null>(null);

  const handleRePair = () => {
    if (window.confirm("Are you sure you want to un-pair this device?")) {
      localStorage.removeItem("screenId");
      window.location.href = "/pair";
    }
  };

  // Data fetching and update logic
  useEffect(() => {
    if (!screenId) return;

    async function runPlayer() {
      setStatus("Contacting server...");

      try {
        const { data: screenInfoResult, error: rpcError } = await supabase.rpc("get_group_for_screen", {
          screen_id_param: screenId,
        });

        if (rpcError || !screenInfoResult || screenInfoResult.length === 0) {
          setStatus(rpcError ? `RPC Error: ${rpcError.message}` : "Error: Screen not assigned to a group.");
          return;
        }

        const screenInfo: ScreenInfo = screenInfoResult[0];
        const db = await initDB();
        const cachedLastUpdated = await db.get("schedule-store", "last_updated");
        const cachedGroupId = await db.get("schedule-store", "group_id");

        if (
          !cachedLastUpdated ||
          !cachedGroupId ||
          cachedGroupId !== screenInfo.group_id ||
          new Date(screenInfo.last_updated) > new Date(cachedLastUpdated)
        ) {
          setStatus("New schedule or group assignment found. Downloading...");
          const { data: newSchedule } = await supabase
            .from("media_schedules")
            .select("*")
            .eq("screen_group_id", screenInfo.group_id)
            .order("slot_index");

          await db.put("schedule-store", newSchedule || [], "schedule");
          await db.put("schedule-store", screenInfo.last_updated, "last_updated");
          await db.put("schedule-store", screenInfo.group_id, "group_id");

          const mediaIdsToFetch = new Set<string>();
          (newSchedule || []).forEach((slot) => {
            if (Array.isArray(slot.media_ids)) {
              slot.media_ids.forEach((id) => id && mediaIdsToFetch.add(id));
            }
          });

          if (mediaIdsToFetch.size > 0) {
            const { data: mediaToDownload } = await supabase
              .from("media_table")
              .select("*")
              .in("id", Array.from(mediaIdsToFetch));
            for (const media of mediaToDownload || []) {
              const response = await fetch(media.file_url);
              const blob = await response.blob();
              await db.put("media-store", blob, media.id);
            }
          }

          setStatus("Update complete. Reloading player...");
          window.location.reload();
        } else {
          setStatus("Loading from cache...");
          const cachedSchedule = await db.get("schedule-store", "schedule");
          setSchedule(cachedSchedule || []);

          const mediaIds = new Set<string>();
          (cachedSchedule || []).forEach((slot) => {
            if (Array.isArray(slot.media_ids)) {
              slot.media_ids.forEach((id) => id && mediaIds.add(id));
            }
          });

          const newMediaMap = new Map();
          for (const id of mediaIds) {
            const blob = await db.get("media-store", id);
            if (blob) {
              newMediaMap.set(id, { id, file_url: URL.createObjectURL(blob), file_type: blob.type, file_name: "" });
            }
          }
          setMediaMap(newMediaMap);

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
      supabase.rpc("heartbeat", { screen_id_param: screenId }).then(({ error }) => {
        if (error) console.error("Heartbeat failed:", error);
      });
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [screenId, supabase]);

  // Realtime channel for 'sync' mode
  useEffect(() => {
    if (syncMode !== "sync" || !groupId) return;

    const channel = supabase.channel(`player-sync-${groupId}`, {
      config: { presence: { key: screenId } },
    });
    channelRef.current = channel;

    const onSlideChange = (message: { payload: { newIndex: number } }) => {
      setCurrentSlotIndex((prev) => (message.payload.newIndex !== prev ? message.payload.newIndex : prev));
    };

    const handlePresenceChange = () => {
      const presences = channel.presenceState();
      const self = presences[screenId];
      if (!self || self.length === 0) return;

      const sorted = Object.values(presences).sort(
        (a: any, b: any) => new Date(a[0].online_at).getTime() - new Date(b[0].online_at).getTime()
      );
      const leader = sorted[0] as any[];
      setIsLeader(self[0].presence_ref === leader[0].presence_ref);
    };

    channel.on("broadcast", { event: "slide-change" }, onSlideChange);
    channel.on("presence", { event: "sync" }, handlePresenceChange);

    channel.subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        await channel.track({ online_at: new Date().toISOString() });
        handlePresenceChange();
      }
    });

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [syncMode, groupId]);

  // Timer logic
  useEffect(() => {
    if (schedule.length === 0) return;

    if (syncMode === "extend") {
      const duration = (schedule[currentSlotIndex]?.duration_seconds || 10) * 1000;
      const timerId = setTimeout(() => {
        setCurrentSlotIndex((prev) => (prev + 1) % schedule.length);
      }, duration);
      return () => clearTimeout(timerId);
    }

    if (syncMode === "sync" && isLeader) {
      const channel = channelRef.current;
      if (!channel) return;

      const duration = (schedule[currentSlotIndex]?.duration_seconds || 10) * 1000;
      const timerId = setTimeout(() => {
        const next = (currentSlotIndex + 1) % schedule.length;
        setCurrentSlotIndex(next);
        channel.send({
          type: "broadcast",
          event: "slide-change",
          payload: { newIndex: next },
        });
      }, duration);

      return () => clearTimeout(timerId);
    }
  }, [syncMode, currentSlotIndex, schedule, isLeader]);

  // Content rendering
  const renderContent = () => {
    const currentSlot = schedule[currentSlotIndex];
    if (!currentSlot) return <div className="w-full h-full bg-black" />;

    if (syncMode === "sync") {
      const layoutParts = currentSlot.layout.includes("-")
        ? currentSlot.layout.split("-").map(Number)
        : [parseInt(currentSlot.layout, 10)];

      let mediaIndex = 0;
      let screenCounter = 0;
      let renderInfo = null;

      for (const part of layoutParts) {
        const start = screenCounter;
        const end = screenCounter + part - 1;
        if (screenIndex >= start && screenIndex <= end) {
          renderInfo = {
            mediaId: currentSlot.media_ids[mediaIndex],
            spanSize: part,
            indexInSpan: screenIndex - start,
          };
          break;
        }
        mediaIndex++;
        screenCounter += part;
      }

      if (!renderInfo || !renderInfo.mediaId) return <div className="w-full h-full bg-black" />;
      const mediaItem = mediaMap.get(renderInfo.mediaId);
      if (!mediaItem) return <div className="w-full h-full bg-black" />;

      if (renderInfo.spanSize > 1) {
        // NEW: Use object-position to crop rather than stretch
        const mediaStyle: React.CSSProperties = {
          width: "100%",
          height: "100%",
          objectFit: "cover",
          objectPosition: `${(renderInfo.indexInSpan / (renderInfo.spanSize - 1)) * 100}% 50%`,
        };

        return (
          <div className="relative w-full h-full overflow-hidden">
            {mediaItem.file_type.startsWith("video") ? (
              <video
                key={mediaItem.id}
                src={mediaItem.file_url}
                style={mediaStyle}
                autoPlay
                muted
                loop
              />
            ) : (
              <img
                key={mediaItem.id}
                src={mediaItem.file_url}
                alt={mediaItem.file_name}
                style={mediaStyle}
              />
            )}
          </div>
        );
      }

      return mediaItem.file_type.startsWith("video") ? (
        <video key={mediaItem.id} src={mediaItem.file_url} autoPlay muted loop className="w-full h-full object-cover" />
      ) : (
        <img key={mediaItem.id} src={mediaItem.file_url} alt={mediaItem.file_name} className="w-full h-full object-cover" />
      );
    }

    return <div className="w-full h-full bg-black" />;
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black">
      {schedule.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center text-white text-2xl z-20">
          {status}
        </div>
      )}
      <div className="w-full h-full">{renderContent()}</div>
      <button
        onClick={handleRePair}
        className="absolute bottom-2 right-2 bg-gray-800 bg-opacity-75 text-white text-xs p-2 rounded-full hover:bg-opacity-75"
        title="Un-pair this device"
      >
        <RefreshCw className="h-4 w-4" />
      </button>
    </div>
  );
}
