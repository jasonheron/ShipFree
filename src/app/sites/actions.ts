//src/app/sites/actions.ts

"use server";

import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function createSite(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const name = formData.get("name") as string;
  const description = formData.get("description") as string;

  if (!user) throw new Error("Unauthorized");

  await supabase.from("sites_table").insert({
    name,
    description,
    user_id: user.id,
  });

  redirect("/dashboard?success=1");
}
