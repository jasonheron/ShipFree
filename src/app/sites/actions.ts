//src/app/sites/actions.ts

"use server";

import { createServerActionClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function createSite(formData: FormData) {
  const supabase = createServerActionClient({ cookies: () => cookies() });
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
