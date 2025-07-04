// src/app/screen-groups/[id]/page.tsx

import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import { ArrowLeft } from "lucide-react";
import ScheduleEditor from "@/components/ScheduleEditor";
import PlayerPreview from "@/components/PlayerPreview";
import ScreenOrderEditor from "@/components/ScreenOrderEditor"; // Import the new component

const ALL_LAYOUTS: Record<number, string[]> = {
  1: ["1"],
  2: ["1-1", "2"],
  3: ["1-1-1", "2-1", "1-2", "3"],
  4: ["1-1-1-1", "2-1-1", "1-2-1", "1-1-2", "2-2", "4"],
};

export default async function ScreenGroupPage({
  params: { id },
}: {
  params: { id: string };
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) notFound();

  // Fetch the screen group
  const { data: group } = await supabase
    .from("screen_groups")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();
  if (!group) notFound();

  // Fetch all screens for the user, ordering by the new display_order column
  const { data: allScreens } = await supabase
    .from("screens_table")
    .select("id, name, screen_group_id, display_order")
    .eq("user_id", user.id)
    .order("display_order", { ascending: true }); // Use the new column for sorting

  const assignedScreens =
    allScreens?.filter((s) => s.screen_group_id === group.id) ?? [];

  // Fetch all available media
  const { data: media } = await supabase
    .from("media_table")
    .select("id, file_name, file_url, file_type")
    .eq("user_id", user.id);

  // Fetch the existing schedule
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <section>
              <h2 className="text-lg font-semibold mb-4">
                Live Preview
              </h2>
              <PlayerPreview 
                schedule={schedule ?? []}
                media={media ?? []}
                assignedScreens={assignedScreens} syncMode={"sync"}              />
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
          </div>

          <div className="lg:col-span-1">
            {/* NEW SECTION FOR SCREEN ORDERING */}
            <section>
              <h2 className="text-lg font-semibold mb-4">Screen Order</h2>
              <ScreenOrderEditor 
                initialScreens={assignedScreens} 
                groupId={group.id} 
              />
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
