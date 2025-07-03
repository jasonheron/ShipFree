// src/app/screens/actions.ts

"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function createScreen(formData: FormData) {
  // Use the existing server client
  const supabase = await createClient();
  
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    // It's better to throw an error here as this should be a protected action
    throw new Error("Unauthorized");
  }

  const siteId = formData.get("site_id") as string;
  const name = formData.get("name") as string;

  // Check available license keys
  const { data: availableKeys, error: licenseError } = await supabase
    .from("license_keys_table")
    .select("license_key") // Only select the key you need
    .eq("user_id", user.id)
    .eq("assigned", false)
    .limit(1); // We only need one

  if (licenseError || !availableKeys || availableKeys.length === 0) {
    redirect("/screens/new?error=nolicense");
  }

  const licenseKey = availableKeys[0].license_key;

  // Mark license key as assigned
  await supabase
    .from("license_keys_table")
    .update({ assigned: true })
    .eq("license_key", licenseKey);

  // Create screen
  await supabase.from("screens_table").insert({
    site_id: siteId,
    name,
    user_id: user.id,
    license_key: licenseKey,
  });

  redirect("/dashboard");
}