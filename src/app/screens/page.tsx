// src/app/screens/page.tsx

import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import Link from "next/link";
import Sidebar from "@/components/Sidebar"; // ✅ import your Sidebar

export default async function ScreensPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: screens } = await supabase
    .from("screens_table")
    .select("*, sites_table(name)")
    .eq("user_id", user?.id)
    .order("created_at", { ascending: false });

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />

      <main className="flex-1 p-6 overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Your Screens</h1>
          <Link
            href="/screens/new"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Add Screen
          </Link>
        </div>

        {screens && screens.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {screens.map((screen) => (
              <div
                key={screen.id}
                className="bg-white border rounded p-4 shadow hover:shadow-md transition"
              >
                <h2 className="text-lg font-semibold">{screen.name}</h2>
                <p className="text-sm text-gray-500">
                  Site: {screen.sites_table?.name || "Unassigned"}
                </p>
                <p className="text-sm mt-1">
                  Status:{" "}
                  <span
                    className={
                      screen.status === "online"
                        ? "text-green-600"
                        : "text-gray-500"
                    }
                  >
                    {screen.status}
                  </span>
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No screens created yet.</p>
        )}
      </main>
    </div>
  );
}
