// src/app/screen-groups/new/page.tsx

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import { ArrowLeft } from "lucide-react";

export default async function NewScreenGroupPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  async function createScreenGroup(formData: FormData) {
    "use server";
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      redirect("/login");
    }

    const name = formData.get("name") as string;
    const sync_mode = formData.get("sync_mode") as string; // Get the new sync_mode

    await supabase.from("screen_groups").insert({
      user_id: user.id,
      name,
      sync_mode, // Save the selected mode
    });

    redirect("/dashboard");
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 p-8">
        <Link
          href="/dashboard"
          className="inline-flex items-center mb-4 text-sm text-gray-600 hover:text-gray-800"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Dashboard
        </Link>

        <h1 className="text-2xl font-semibold mb-4">Create New Screen Group</h1>

        <form action={createScreenGroup} className="space-y-6 max-w-md">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">Group Name</label>
            <input
              id="name"
              type="text"
              name="name"
              required
              placeholder="e.g., Main Video Wall"
              className="w-full border p-2 rounded mt-1"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Sync Mode</label>
            <fieldset className="mt-2">
              <legend className="sr-only">Sync Mode</legend>
              <div className="space-y-2">
                <label htmlFor="mode_extend" className="flex items-center gap-3 p-3 border rounded-lg has-[:checked]:bg-blue-50 has-[:checked]:border-blue-500">
                  <input type="radio" id="mode_extend" name="sync_mode" value="extend" defaultChecked className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500" />
                  <div>
                    <p className="font-medium">Extend</p>
                    <p className="text-xs text-gray-500">For a single PC connected to multiple screens (e.g., a video wall).</p>
                  </div>
                </label>
                <label htmlFor="mode_sync" className="flex items-center gap-3 p-3 border rounded-lg has-[:checked]:bg-blue-50 has-[:checked]:border-blue-500">
                  <input type="radio" id="mode_sync" name="sync_mode" value="sync" className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500" />
                  <div>
                    <p className="font-medium">Sync</p>
                    <p className="text-xs text-gray-500">For multiple, separate PCs that need to play in sync over the network.</p>
                  </div>
                </label>
              </div>
            </fieldset>
          </div>

          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Create Group
          </button>
        </form>
      </main>
    </div>
  );
}
