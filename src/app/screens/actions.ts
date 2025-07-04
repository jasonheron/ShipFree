// src/app/screens/actions.ts
"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

// Helper to generate a random 6-digit code
function generatePairingCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// --- CREATE SCREEN ACTION ---
export type FormState = {
  error: 'nolicense' | 'db_error' | 'missing_fields' | null;
};

export async function createScreen(prevState: FormState, formData: FormData): Promise<FormState> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) { redirect("/login"); }

  const name = formData.get("name") as string;
  const site_id = formData.get("site_id") as string;
  const screen_group_id = formData.get("screen_group_id") as string;

  if (!name || !site_id || !screen_group_id) {
    return { error: 'missing_fields' };
  }

  const { data: newScreenId, error } = await supabase.rpc('create_screen_with_license', {
    user_id_param: user.id,
    site_id_param: site_id,
    screen_name_param: name,
    pairing_code_param: generatePairingCode(),
    screen_group_id_param: screen_group_id
  });

  if (error) {
    if (error.message.includes('NO_LICENSE_AVAILABLE')) { return { error: 'nolicense' }; }
    console.error("Error creating screen with license:", error);
    return { error: 'db_error' };
  }
  
  revalidatePath('/screens');
  revalidatePath('/dashboard');
  redirect(`/screens/${newScreenId}/success`);
}

// --- UPDATE SCREEN ACTION ---
export async function updateScreen(formData: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    const screenId = formData.get('screen_id') as string;
    const newName = formData.get('name') as string;

    if (!screenId || !newName) throw new Error("Missing data for screen update");

    await supabase
        .from('screens_table')
        .update({ name: newName })
        .eq('id', screenId)
        .eq('user_id', user.id);

    revalidatePath('/screens');
    revalidatePath('/dashboard');
}

// --- DELETE SCREEN ACTION ---
export async function deleteScreen(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  
  const screenId = formData.get('screen_id') as string;
  if (!screenId) throw new Error("Screen ID is missing");

  // This RPC function should handle un-assigning and releasing the license key
  await supabase.rpc('release_license_key', { screen_id_param: screenId });

  revalidatePath('/screens');
  revalidatePath('/dashboard');
}

// --- REGENERATE PAIRING CODE ACTION ---
export async function regeneratePairingCode(formData: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    const screenId = formData.get('screen_id') as string;
    if (!screenId) throw new Error("Missing screen ID");

    await supabase
        .from('screens_table')
        .update({ pairing_code: generatePairingCode() })
        .eq('id', screenId)
        .eq('user_id', user.id);
    
    revalidatePath('/screens');
    revalidatePath('/dashboard');
}


// --- SCREEN GROUP ACTIONS ---
export async function updateScreenGroup(formData: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    const groupId = formData.get('group_id') as string;
    const newName = formData.get('name') as string;

    if (!groupId || !newName) throw new Error("Missing data for group update");

    await supabase
        .from('screen_groups')
        .update({ name: newName })
        .eq('id', groupId)
        .eq('user_id', user.id);
    
    revalidatePath('/dashboard');
    revalidatePath(`/screen-groups/${groupId}`);
}

export async function deleteScreenGroup(formData: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    const groupId = formData.get('group_id') as string;
    if (!groupId) throw new Error("Missing group ID");

    // Un-assign all screens from this group
    await supabase
        .from('screens_table')
        .update({ screen_group_id: null, display_order: 0 }) // Also reset display order
        .eq('screen_group_id', groupId)
        .eq('user_id', user.id);

    // Delete the group itself
    await supabase
        .from('screen_groups')
        .delete()
        .eq('id', groupId)
        .eq('user_id', user.id);
    
    revalidatePath('/dashboard');
}

// --- SAVE SCHEDULE ACTION ---
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
      duration_seconds: parseInt(slot.duration, 10) || 10,
      media_ids: slot.media_ids,
    }));
    
    const { error } = await supabase.from("media_schedules").insert(inserts);
    if (error) {
        console.error("Error inserting new schedule:", error);
        return; 
    }
  }
  
  // Update the timestamp to signal players to refresh
  await supabase
    .from('screen_groups')
    .update({ last_updated: new Date().toISOString() })
    .eq('id', screen_group_id);

  revalidatePath(`/screen-groups/${screen_group_id}`);
}

// --- UPDATE SCREEN ORDER ACTION ---
export async function updateScreenOrder(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const groupId = formData.get('group_id') as string;
  const orderedScreenIds = JSON.parse(formData.get('ordered_ids') as string) as string[];

  if (!groupId || !orderedScreenIds || !Array.isArray(orderedScreenIds)) {
    throw new Error("Missing or invalid data for screen order update");
  }

  // Create an array of update promises to run in parallel
  const updatePromises = orderedScreenIds.map((screenId, index) =>
    supabase
      .from('screens_table')
      .update({ display_order: index })
      .eq('id', screenId)
      .eq('user_id', user.id)
  );

  // Execute all update queries
  const results = await Promise.all(updatePromises);

  const firstError = results.find(result => result.error);
  if (firstError) {
    console.error("Error updating screen order:", firstError.error);
  }

  // Update the group's timestamp to signal players to refresh their screen list order
  await supabase
    .from('screen_groups')
    .update({ last_updated: new Date().toISOString() })
    .eq('id', groupId);

  revalidatePath(`/screen-groups/${groupId}`);
}
