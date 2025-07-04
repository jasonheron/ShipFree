import { createClient } from "@/lib/supabase/server";
import Sidebar from "@/components/Sidebar";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { redirect } from "next/navigation";
import CreateScreenForm from "@/components/CreateScreenForm";

export default async function NewScreenPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/login");
  }

  // Fetch both sites and screen groups
  const { data: sites } = await supabase
    .from("sites_table")
    .select("id, name")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const { data: screenGroups } = await supabase
    .from("screen_groups")
    .select("id, name")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 p-6 overflow-y-auto">
        <Link
          href="/dashboard"
          className="flex items-center text-sm text-gray-500 mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Dashboard
        </Link>
        <h1 className="text-2xl font-semibold mb-4">Create New Screen</h1>

        {/* Pass both sites and screenGroups to the form component */}
        <CreateScreenForm sites={sites || []} screenGroups={screenGroups || []} />
      </main>
    </div>
  );
}