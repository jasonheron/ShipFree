// src/app/sites/page.tsx

import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import Link from "next/link";
import Sidebar from "@/components/Sidebar"; // ✅ import your Sidebar

export default async function SitesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: sites } = await supabase
    .from("sites_table")
    .select("*")
    .eq("user_id", user?.id)
    .order("created_at", { ascending: false });

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />

      <main className="flex-1 p-6 overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Your Sites</h1>
          <Link
            href="/sites/new"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Add Site
          </Link>
        </div>

        {sites?.length ? (
          <ul className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {sites.map((site) => (
              <li
                key={site.id}
                className="bg-white border rounded p-4 shadow hover:shadow-md transition"
              >
                <h2 className="font-semibold">{site.name}</h2>
                <p className="text-sm text-gray-500">{site.description}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500">No sites yet.</p>
        )}
      </main>
    </div>
  );
}
