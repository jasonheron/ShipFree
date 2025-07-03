import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const supabase = await createClient();
  const form = await req.formData();
  const license_id = form.get("license_id") as string;

  await supabase
    .from("license_keys_table")
    .update({ assigned: false, assigned_screen_id: null })
    .eq("id", license_id);

  return NextResponse.redirect(req.headers.get("referer") || "/admin", 303);
}
