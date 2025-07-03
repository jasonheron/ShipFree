// src/app/admin/clients/[id]/page.tsx
import { createClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import { ArrowLeft } from "lucide-react";

export default async function AdminClientPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user?.email !== process.env.SUPER_ADMIN_EMAIL) {
    notFound();
  }

  // Load client
  const { data: client } = await supabase
    .from("clients")
    .select("*")
    .eq("id", params.id)
    .single();

  if (!client) notFound();

  // Load their screens
  const { data: screens } = await supabase
    .from("screens_table")
    .select("*")
    .eq("client_id", client.id);

  // Load their licenses
  const { data: licenses } = await supabase
    .from("licenses")
    .select("*")
    .eq("client_id", client.id);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 p-8">
        <Link
          href="/admin"
          className="inline-flex items-center mb-4 text-sm text-gray-600 hover:text-gray-800"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Admin
        </Link>

        <h1 className="text-2xl font-semibold mb-2">{client.name}</h1>
        <p className="text-gray-500 mb-6">
          {client.email || "No email"}
        </p>

        {/* Screens */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-2">Screens</h2>
          {screens?.length ? (
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {screens.map((screen) => (
                <li key={screen.id} className="bg-white border rounded p-3">
                  <p className="font-semibold">{screen.name}</p>
                  <p className="text-gray-500 text-sm">{screen.location || "No location"}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">No screens assigned.</p>
          )}
        </section>

        {/* Licenses */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-2">Licenses</h2>
          {licenses?.length ? (
            <ul className="space-y-2">
              {licenses.map((license) => (
                <li key={license.id} className="bg-white border rounded p-3 flex justify-between">
                  <span>{license.key}</span>
                  <span className="text-gray-500 text-sm">{license.status}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">No licenses.</p>
          )}
        </section>

        {/* Add License */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-2">Add License</h2>
          <form
            action="/api/admin/add-license"
            method="post"
            className="flex gap-2"
          >
            <input type="hidden" name="client_id" value={client.id} />
            <input
              type="number"
              name="quantity"
              placeholder="Quantity"
              required
              className="border rounded px-2 py-1 w-24"
            />
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-1 rounded hover:bg-blue-700"
            >
              + Add Licenses
            </button>
          </form>
        </section>
      </main>
    </div>
  );
}
