import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import { ArrowLeft, Monitor, X } from "lucide-react";
import ScheduleEditor from "@/components/ScheduleEditor";

const ALL_LAYOUTS: Record<number, string[]> = {
  1: ["1"],
  2: ["1-1", "2"],
  3: ["1-1-1", "2-1", "1-2", "3"],
  4: ["1-1-1-1", "2-1-1", "1-2-1", "1-1-2", "2-2", "4"],
};

export default async function ScreenGroupPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) notFound();

  const { data: group } = await supabase
    .from("screen_groups")
    .select("*")
    .eq("id", params.id)
    .eq("user_id", user.id)
    .single();
  if (!group) notFound();

  const { data: allScreens } = await supabase
    .from("screens_table")
    .select("*")
    .eq("user_id", user.id);

  const assignedScreens = allScreens?.filter(s => s.screen_group_id === group.id) ?? [];
  const unassignedScreens = allScreens?.filter(s => s.screen_group_id !== group.id) ?? [];

  const { data: media } = await supabase
    .from("media_table")
    .select("*")
    .eq("user_id", user.id);

  const numScreens = assignedScreens.length;
  const layouts = ALL_LAYOUTS[numScreens] ?? [];

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 p-8">
        <Link
          href="/dashboard"
          className="inline-flex items-center mb-4 text-sm text-gray-600 hover:text-gray-800"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Dashboard
        </Link>

        <h1 className="text-2xl font-semibold mb-2">{group.name}</h1>
        <p className="text-gray-500 mb-6">Manage screens and schedule.</p>

        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-2">Screens ({assignedScreens.length}/4)</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {assignedScreens.map((screen, index) => (
              <form
                key={screen.id}
                action="/api/screen-groups/toggle-screen"
                method="post"
                className="relative border rounded bg-white flex flex-col"
              >
                <input type="hidden" name="group_id" value={group.id} />
                <input type="hidden" name="screen_id" value={screen.id} />
                <input type="hidden" name="action" value="remove" />
                <button
                  type="submit"
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                  title="Remove"
                >
                  <X className="w-4 h-4" />
                </button>
                <div className="w-full aspect-video overflow-hidden rounded-t">
                  <img
                    src={`/${index + 1}.png`}
                    alt={screen.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="text-sm text-center p-2">{screen.name}</div>
              </form>
            ))}
            {unassignedScreens.length > 0 && (
              <form
                action="/api/screen-groups/toggle-screen"
                method="post"
                className="border rounded p-2 bg-white flex flex-col justify-between"
              >
                <input type="hidden" name="group_id" value={group.id} />
                <select
                  name="screen_id"
                  className="border rounded px-2 py-1 mb-2"
                  required
                  defaultValue=""
                >
                  <option value="" disabled>
                    Select Screen
                  </option>
                  {unassignedScreens.map((screen) => (
                    <option key={screen.id} value={screen.id}>
                      {screen.name}
                    </option>
                  ))}
                </select>
                <button
                  type="submit"
                  name="action"
                  value="add"
                  className="w-full bg-blue-600 text-white rounded px-2 py-1 hover:bg-blue-700 text-sm"
                >
                  + Add
                </button>
              </form>
            )}
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-4">Schedule</h2>
          {layouts.length > 0 ? (
            <ScheduleEditor layouts={layouts} media={media ?? []} />
          ) : (
            <p className="text-gray-500">
              No layouts available. Please assign screens to this group.
            </p>
          )}
        </section>
      </main>
    </div>
  );
}
