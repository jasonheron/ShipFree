// src/app/sites/new/page.tsx

import { createClient } from "@/lib/supabase/server";
import { createSite } from "../actions";
import Sidebar from "@/components/Sidebar";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { SuccessMessage } from "@/components/SuccessMessage";

export default async function NewSitePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 p-8">
        <Link href="/dashboard" className="inline-flex items-center mb-4 text-sm text-gray-600 hover:text-gray-800">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Dashboard
        </Link>

        <h1 className="text-2xl font-semibold mb-4">Create New Site</h1>

        <form action={createSite} className="space-y-4">
          <input type="text" name="name" required placeholder="Site Name" className="w-full border p-2 rounded" />
          <textarea name="description" placeholder="Description" className="w-full border p-2 rounded" />
          <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
            Create Site
          </button>
        </form>

        <SuccessMessage text="Site created successfully!" />
      </main>
    </div>
  );
}
