// src/app/screen-groups/[id]/assign/page.tsx

import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import { ArrowLeft } from "lucide-react";

export default async function AssignScreensPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { success?: string };
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    notFound();
  }

  // Load the group
  const { data: group } = await supabase
    .from("screen_groups")
    .select("*")
    .eq("id", params.id)
    .eq("user_id", user.id)
    .single();

  if (!group) {
    notFound();
  }

  // Load all screens belonging to the user
  const { data: screens } = await supabase
    .from("screens_table")
    .select("*")
    .eq("user_id", user.id);

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 p-8">
        <Link
          href={`/screen-groups/${group.id}`}
          className="inline-flex items-center mb-4 text-sm text-gray-600 hover:text-gray-800"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Group
        </Link>

        <h1 className="text-2xl font-semibold mb-4">
          Assign Screens to "{group.name}"
        </h1>

        <form action={assignScreens} className="space-y-4">
          <input type="hidden" name="screen_group_id" value={group.id} />
          {screens && screens.length > 0 ? (
            <div className="space-y-2">
              {screens.map((screen) => (
                <label
                  key={screen.id}
                  className="flex items-center space-x-2 bg-white p-2 rounded border"
                >
                  <input
                    type="checkbox"
                    name="screen_ids"
                    value={screen.id}
                    defaultChecked={screen.screen_group_id === group.id}
                  />
                  <span>{screen.name}</span>
                </label>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">You have no screens.</p>
          )}
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Save Assignments
          </button>
        </form>
      </main>
    </div>
  );
}

async function assignScreens(formData: FormData) {
  "use server";

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const screen_group_id = formData.get("screen_group_id") as string;
  const selectedIds = formData.getAll("screen_ids") as string[];

  // First, clear any screens assigned to this group
  await supabase
    .from("screens_table")
    .update({ screen_group_id: null })
    .eq("screen_group_id", screen_group_id)
    .eq("user_id", user.id);

  // Assign selected screens to this group
  if (selectedIds.length > 0) {
    await Promise.all(
      selectedIds.map((id) =>
        supabase
          .from("screens_table")
          .update({ screen_group_id })
          .eq("id", id)
          .eq("user_id", user.id)
      )
    );
  }

  redirect(`/screen-groups/${screen_group_id}`);
}
