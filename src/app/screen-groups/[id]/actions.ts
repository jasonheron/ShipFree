// src/app/screen-groups/[id]/actions.ts
"use server";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function saveSchedule(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const screen_group_id = formData.get("screen_group_id") as string;
  const rawSlots = JSON.parse(formData.get("slots_json") as string);

  // Clear old schedule
  await supabase
    .from("media_schedules")
    .delete()
    .eq("screen_group_id", screen_group_id);

  // Insert new schedule
  const inserts = rawSlots.map((slot: any, i: number) => ({
    screen_group_id,
    slot_index: i,
    layout: slot.layout,
    duration_seconds: slot.duration,
    media_ids: JSON.stringify(slot.media_ids),
  }));
  await supabase.from("media_schedules").insert(inserts);

  redirect(`/screen-groups/${screen_group_id}`);
}
