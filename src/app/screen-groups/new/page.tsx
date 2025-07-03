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
    const layout = formData.get("layout") as string | null;

    await supabase.from("screen_groups").insert({
      user_id: user.id,
      name,
      layout,
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

        <form action={createScreenGroup} className="space-y-4 max-w-md">
          <input
            type="text"
            name="name"
            required
            placeholder="Group Name (e.g., Front Desk)"
            className="w-full border p-2 rounded"
          />
          <select
            name="layout"
            className="w-full border p-2 rounded"
            defaultValue=""
          >
            <option value="" disabled>
              Select Layout (optional)
            </option>
            <option value="single">Single Screen</option>
            <option value="2x2">2x2 Grid</option>
            <option value="horizontal">Horizontal Row</option>
            <option value="vertical">Vertical Stack</option>
          </select>
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
