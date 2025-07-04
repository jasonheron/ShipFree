// src/app/screens/actions.ts
"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

// --- All other actions (createScreen, updateScreen, etc.) remain the same ---
// NOTE: The full code for other actions is omitted for brevity, but they are unchanged.
export async function createScreen(prevState: any, formData: FormData) { /* ... */ }
export async function updateScreen(formData: FormData) { /* ... */ }
export async function deleteScreen(formData: FormData) { /* ... */ }
export async function regeneratePairingCode(formData: FormData) { /* ... */ }
export async function updateScreenGroup(formData: FormData) { /* ... */ }
export async function deleteScreenGroup(formData: FormData) { /* ... */ }


// --- CORRECTED SAVE SCHEDULE ACTION ---
export async function saveSchedule(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const screen_group_id = formData.get("screen_group_id") as string;
  const rawSlots = JSON.parse(formData.get("slots_json") as string);

  // First, delete the old schedule for this group
  await supabase
    .from("media_schedules")
    .delete()
    .eq("screen_group_id", screen_group_id);

  // Then, insert the new schedule slots if any exist
  if (rawSlots && rawSlots.length > 0) {
    const inserts = rawSlots.map((slot: any, i: number) => ({
      screen_group_id,
      slot_index: i,
      layout: slot.layout,
      // FIX #1: Parse the integer from the duration string (e.g., "10s" -> 10)
      duration_seconds: parseInt(slot.duration, 10) || 10,
      media_ids: slot.media_ids,
    }));
    
    const { error } = await supabase.from("media_schedules").insert(inserts);
    if (error) {
        console.error("Error inserting new schedule:", error);
        // Optionally, handle the error more gracefully
        return; // Stop execution if insert fails
    }
  }
  
  // FIX #2: Update the correct timestamp column that the player is listening to.
  // This is the signal for the players to refresh their schedule.
  await supabase
    .from('screen_groups')
    .update({ last_updated: new Date().toISOString() }) // Changed from 'updated_at' to 'last_updated'
    .eq('id', screen_group_id);

  // Revalidate the path to ensure the editor page shows the new schedule
  revalidatePath(`/screen-groups/${screen_group_id}`);
}
