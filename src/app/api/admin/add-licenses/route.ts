import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const supabase = await createClient();
  const form = await req.formData();
  const user_id = form.get("user_id") as string;
  const count = parseInt(form.get("count") as string);

  const inserts = Array.from({ length: count }).map((_, i) => ({
    user_id,
    license_key: `LIC-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
    assigned: false,
  }));

  await supabase.from("license_keys_table").insert(inserts);

  return NextResponse.redirect(req.headers.get("referer") || "/admin", 303);
}
