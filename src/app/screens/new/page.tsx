import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createScreen } from "../actions";
import Sidebar from "@/components/Sidebar";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function NewScreenPage({ searchParams }: { searchParams: { [key: string]: string } }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="p-6">
        <p>You must be logged in.</p>
      </div>
    );
  }

  const { data: sites } = await supabase
    .from("sites_table")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 p-6 overflow-y-auto">
        <Link href="/dashboard" className="flex items-center text-sm text-gray-500 mb-4">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Dashboard
        </Link>
        <h1 className="text-2xl font-semibold mb-4">Create New Screen</h1>

        {searchParams?.error === "nolicense" && (
          <div className="mb-4 p-3 bg-red-100 text-red-800 rounded">
            🚫 No licenses available. Contact support to add more licenses.
          </div>
        )}

        <form action={createScreen} className="space-y-4">
          <input
            type="text"
            name="name"
            required
            placeholder="Screen Name"
            className="w-full border p-2 rounded"
          />
          <select
            name="site_id"
            required
            className="w-full border p-2 rounded"
          >
            <option value="">Select Location</option>
            {sites?.map((site) => (
              <option key={site.id} value={site.id}>
                {site.name}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Create Screen
          </button>
        </form>
      </main>
    </div>
  );
}
