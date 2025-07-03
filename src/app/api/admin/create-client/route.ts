import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const formData  = await request.formData();

  const name      = (formData.get("name")     as string)?.trim();
  const email     = (formData.get("email")    as string)?.trim();
  const password  = (formData.get("password") as string)?.trim() || crypto.randomUUID();

  /* ── 1. basic validation ───────────────────────────────────────────── */
  if (!email) {
    const url = new URL("/admin", request.url);
    url.searchParams.set("error", "missing_email");
    return NextResponse.redirect(url);
  }

  /* ── 2. create AUTH user  ───────────────────────────────────────────── */
  const { error: authErr, data: authUser } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: false        // no confirmation e-mail
  });

  if (authErr) {
    const url = new URL("/admin", request.url);
    url.searchParams.set("error", authErr.message);
    return NextResponse.redirect(url);
  }

  /* ── 3. create client row  ─────────────────────────────────────────── */
  await supabase
    .from("clients")
    .insert({ id: crypto.randomUUID(), user_id: authUser.user.id, name, email });

  const url = new URL("/admin", request.url);
  url.searchParams.set("success", "created");
  return NextResponse.redirect(url);
}
