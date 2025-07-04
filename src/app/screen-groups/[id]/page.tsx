// src/app/screen-groups/[id]/page.tsx

import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import { ArrowLeft } from "lucide-react";
import ScheduleEditor from "@/components/ScheduleEditor";
import PlayerPreview from "@/components/PlayerPreview";

const ALL_LAYOUTS: Record<number, string[]> = {
  1: ["1"],
  2: ["1-1", "2"],
  3: ["1-1-1", "2-1", "1-2", "3"],
  4: ["1-1-1-1", "2-1-1", "1-2-1", "1-1-2", "2-2", "4"],
};

export default async function ScreenGroupPage({
  params: { id }, // THE FIX IS HERE: Destructure `id` directly from params
}: {
  params: { id: string };
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) notFound();

  // Fetch the screen group using the destructured `id`
  const { data: group } = await supabase
    .from("screen_groups")
    .select("*")
    .eq("id", id) // Use the `id` variable directly
    .eq("user_id", user.id)
    .single();
  if (!group) notFound();

  // Fetch all screens for the user to determine assignments
  const { data: allScreens } = await supabase
    .from("screens_table")
    .select("id, name, screen_group_id")
    .eq("user_id", user.id);

  const assignedScreens =
    allScreens?.filter((s) => s.screen_group_id === group.id) ?? [];

  // Fetch all available media for the schedule editor
  const { data: media } = await supabase
    .from("media_table")
    .select("id, file_name, file_url, file_type")
    .eq("user_id", user.id);

  // Fetch the existing schedule for this group to populate the editor and preview
  const { data: schedule } = await supabase
    .from("media_schedules")
    .select("*")
    .eq("screen_group_id", group.id)
    .order("slot_index", { ascending: true });

  const numScreens = assignedScreens.length;
  const layouts = ALL_LAYOUTS[numScreens] ?? [];

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 p-8 overflow-y-auto">
        <header className="flex items-center justify-between mb-6">
          <Link
            href="/dashboard"
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-800"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Dashboard
          </Link>
        </header>

        <div className="mb-8">
            <h1 className="text-2xl font-semibold mb-1">{group.name}</h1>
            <p className="text-gray-500">Manage screens and schedule.</p>
        </div>

        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-4">
            Live Preview
          </h2>
          {/* Pass the assignedScreens to the preview component */}
          <PlayerPreview 
            schedule={schedule ?? []} 
            media={media ?? []} 
            assignedScreens={assignedScreens} 
          />
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">Schedule Editor</h2>
          {layouts.length > 0 ? (
            <ScheduleEditor
              groupId={group.id}
              layouts={layouts}
              media={media ?? []}
              initialSchedule={schedule ?? []}
            />
          ) : (
            <div className="p-6 bg-white border rounded-lg text-center text-gray-500">
              <p>No layouts are available for this number of screens.</p>
              <p className="text-sm">Please assign at least one screen to create a schedule.</p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
