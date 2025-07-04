// src/app/media/page.tsx

import Sidebar from "@/components/Sidebar";
import MediaManager from "@/components/MediaManager"; // Corrected import name
import { createClient } from "@/lib/supabase/server";

export default async function MediaPage() {
  const supabase = await createClient();

  // Fetch the initial list of media files on the server
  const { data: initialMediaFiles, error } = await supabase
    .from("media_table")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching initial media:", error.message);
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-y-auto">
        {/* Page Header */}
        <header className="flex items-center justify-between px-6 py-4 border-b bg-white">
          <div>
            <h1 className="text-2xl font-semibold">Media Library</h1>
            <p className="text-gray-500">Manage your uploaded images and videos</p>
          </div>
        </header>

        {/* Main Content Area */}
        <section className="p-6">
          <MediaManager initialMediaFiles={initialMediaFiles || []} />
        </section>
      </main>
    </div>
  );
}