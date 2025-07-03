import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const formData = await req.formData();
  const screenId = formData.get("screen_id") as string;
  const groupId = formData.get("group_id") as string;
  const action = formData.get("action") as string;

  if (!screenId || !action) {
    return new Response("Missing parameters", { status: 400 });
  }

  if (action === "add") {
    await supabase
      .from("screens_table")
      .update({ screen_group_id: groupId })
      .eq("id", screenId)
      .eq("user_id", user.id);
  } else if (action === "remove") {
    await supabase
      .from("screens_table")
      .update({ screen_group_id: null })
      .eq("id", screenId)
      .eq("user_id", user.id);
  } else {
    return new Response("Invalid action", { status: 400 });
  }

  return redirect(`/screen-groups/${groupId}`);
}
