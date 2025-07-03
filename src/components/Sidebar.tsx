// src/components/Sidebar.tsx
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Monitor, Upload, LayoutDashboard, LogOut, MapPin } from "lucide-react";

export default async function Sidebar() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fetch available license count
  let licenseCount = 0;

  if (user) {
    const { data: availableKeys } = await supabase
      .from("license_keys_table")
      .select("id")
      .eq("user_id", user.id)
      .eq("assigned", false);

    licenseCount = availableKeys?.length ?? 0;
  }

  return (
    <aside className="w-64 bg-black text-white flex flex-col">
      <div className="p-6 border-b border-gray-800 flex items-center space-x-3">
        <img src="/logo.webp" alt="Logo" className="h-8 w-auto" />
      </div>
      <nav className="flex-1 px-4 py-6 space-y-2">
        <Link
          href="/dashboard"
          className="flex items-center px-3 py-2 rounded hover:bg-gray-800"
        >
          <LayoutDashboard className="mr-3 h-5 w-5" />
          Dashboard
        </Link>
        <Link
          href="/media"
          className="flex items-center px-3 py-2 rounded hover:bg-gray-800"
        >
          <Upload className="mr-3 h-5 w-5" />
          Media
        </Link>
        <Link
          href="/sites"
          className="flex items-center px-3 py-2 rounded hover:bg-gray-800"
        >
          <MapPin className="mr-3 h-5 w-5" />
          Sites
        </Link>
        <Link
          href="/screens"
          className="flex items-center px-3 py-2 rounded hover:bg-gray-800"
        >
          <Monitor className="mr-3 h-5 w-5" />
          Screens
        </Link>
      </nav>

      {user && (
        <div className="p-4 text-sm text-gray-300 border-t border-gray-800">
          🎫 {licenseCount} Licenses Available
        </div>
      )}

      <form action="/auth/signout" method="post" className="p-4">
        <button
          type="submit"
          className="w-full flex items-center justify-center px-3 py-2 rounded bg-gray-800 hover:bg-gray-700"
        >
          <LogOut className="mr-2 h-5 w-5" />
          Sign Out
        </button>
      </form>
    </aside>
  );
}