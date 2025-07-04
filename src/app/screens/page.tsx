// src/app/screens/page.tsx
import { createClient } from "@/lib/supabase/server";
import Sidebar from "@/components/Sidebar";
import Link from "next/link";
import { ArrowLeft, HardDrive, Monitor, PlusCircle } from "lucide-react";
import { redirect } from "next/navigation";
import ScreenSettings from "@/components/ScreenSettings";

export default async function ScreensPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Fetch all screens and join with related tables to get names
  const { data: screens } = await supabase
    .from("screens_table")
    .select(`
      id,
      name,
      resolution,
      orientation,
      last_seen_at,
      pairing_code,
      sites_table ( name ),
      screen_groups ( name )
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold">Screen Management</h1>
            <p className="text-gray-500">View, edit, and manage all your registered screens.</p>
          </div>
          <Link
            href="/screens/new"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <PlusCircle className="h-4 w-4 mr-2" />
            Add New Screen
          </Link>
        </div>

        <div className="bg-white border rounded-lg shadow-sm">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium">Screen Name</th>
                <th className="p-4 font-medium">Location</th>
                <th className="p-4 font-medium">Group</th>
                <th className="p-4 font-medium">Last Seen</th>
                <th className="p-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {screens?.map((screen) => {
                const isOnline = screen.last_seen_at && (new Date().getTime() - new Date(screen.last_seen_at).getTime()) < 10 * 60 * 1000;
                return (
                  <tr key={screen.id} className="border-b last:border-none">
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-2 px-2 py-1 text-xs rounded-full ${isOnline ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                        <span className={`h-2 w-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-gray-500'}`}></span>
                        {isOnline ? 'Online' : 'Offline'}
                      </span>
                    </td>
                    <td className="p-4 font-medium">{screen.name}</td>
                    <td className="p-4 text-gray-600">
                      {Array.isArray(screen.sites_table) && screen.sites_table.length > 0
                        ? screen.sites_table.map((site) => site.name).join(", ")
                        : 'N/A'}
                    </td>
                    <td className="p-4 text-gray-600">
                      {Array.isArray(screen.screen_groups) && screen.screen_groups.length > 0
                        ? screen.screen_groups.map((group) => group.name).join(", ")
                        : 'N/A'}
                    </td>
                    <td className="p-4 text-gray-600">{screen.last_seen_at ? new Date(screen.last_seen_at).toLocaleString() : 'Never'}</td>
                    <td className="p-4 text-right">
                      <ScreenSettings screen={screen} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {screens?.length === 0 && (
            <div className="text-center p-8 text-gray-500">
              <HardDrive className="mx-auto h-12 w-12 text-gray-300" />
              <h3 className="mt-2 text-sm font-medium">No screens found</h3>
              <p className="mt-1 text-sm">Get started by adding a new screen.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
