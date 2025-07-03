import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import { PlusCircle, Monitor, Layers } from "lucide-react";

interface ScreenGroup {
  id: string;
  name: string;
  layout: string | null;
}

interface Screen {
  id: string;
  name: string;
  screen_group_id: string | null;
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  // Fetch groups
  const { data: groups = [] } = await supabase
    .from("screen_groups")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false }) as { data: ScreenGroup[] };

  // Fetch screens
  const { data: screens = [] } = await supabase
    .from("screens_table")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false }) as { data: Screen[] };

  // Group screens by screen_group_id
  const screensByGroup = screens.reduce<Record<string, Screen[]>>((acc, screen) => {
    const key = screen.screen_group_id || "ungrouped";
    acc[key] = acc[key] || [];
    acc[key].push(screen);
    return acc;
  }, {});

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-y-auto">
        <header className="flex items-center justify-between px-6 py-4 border-b bg-white">
          <div>
            <h1 className="text-2xl font-semibold">
              Welcome{user?.email ? `, ${user.email}` : ""}
            </h1>
            <p className="text-gray-500">Manage your displays and media</p>
          </div>
          <div className="space-x-2">
            <Link
              href="/media"
              className="inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Upload Media
            </Link>
          </div>
        </header>

        <section className="p-6 space-y-10">

          {/* Screen Groups */}
          <div>
            <h2 className="text-lg font-semibold mb-4 flex items-center justify-between">
              Your Screen Groups
              <Link
                href="/screen-groups/new"
                className="flex items-center text-sm px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                <PlusCircle className="h-4 w-4 mr-1" />
                Add Group
              </Link>
            </h2>
            {groups.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {groups.map((group) => (
                  <Link
                    key={group.id}
                    href={`/screen-groups/${group.id}`}
                    className="bg-white border rounded p-4 shadow hover:shadow-md transition block"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Layers className="text-blue-500 h-5 w-5" />
                      <span className="font-semibold">{group.name}</span>
                    </div>
                    <p className="text-gray-500 text-xs mb-2">
                      {screensByGroup[group.id]?.length || 0} screens
                    </p>
                    {screensByGroup[group.id]?.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {screensByGroup[group.id].map((screen) => (
                          <span
                            key={screen.id}
                            className="text-xs bg-gray-100 px-2 py-1 rounded"
                          >
                            {screen.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No screen groups yet.</p>
            )}
          </div>

          {/* Ungrouped Screens */}
          <div>
            <h2 className="text-lg font-semibold mb-4 flex items-center justify-between">
              Ungrouped Screens
              <Link
                href="/screens/new"
                className="flex items-center text-sm px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                <PlusCircle className="h-4 w-4 mr-1" />
                Add Screen
              </Link>
            </h2>
            {screensByGroup.ungrouped?.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {screensByGroup.ungrouped.map((screen) => (
                  <div
                    key={screen.id}
                    className="bg-white border rounded p-4 shadow hover:shadow-md transition"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Monitor className="text-blue-500 h-5 w-5" />
                      <span className="font-semibold">{screen.name}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No ungrouped screens.</p>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
