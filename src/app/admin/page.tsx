// src/app/admin/page.tsx
import { createClient } from "@/lib/supabase/admin";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import { PlusCircle } from "lucide-react";

export default async function AdminPage() {
  const supabase = await createClient();

  // No redundant check here—middleware already enforced access

  const { data: clients } = await supabase.from("clients").select("*");

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 p-8">
        <h1 className="text-2xl font-semibold mb-4">Admin Dashboard</h1>

        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-2">Clients</h2>
          {clients?.length ? (
            <ul className="space-y-2">
              {clients.map((client) => (
                <li key={client.id} className="bg-white border rounded p-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-semibold">{client.name}</p>
                      <p className="text-gray-500 text-sm">{client.email || "No email"}</p>
                    </div>
                    <Link
                      href={`/admin/clients/${client.id}`}
                      className="text-blue-600 hover:underline"
                    >
                      Manage
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">No clients found.</p>
          )}
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">Create New Client User</h2>
          <form action="/api/admin/create-client" method="post" className="space-y-4 max-w-md">
            <input
              type="text"
              name="name"
              placeholder="Client Name"
              required
              className="w-full border p-2 rounded"
            />
            <input
              type="email"
              name="email"
              placeholder="Client Email (optional)"
              className="w-full border p-2 rounded"
            />
            <input
              type="password"
              name="password"
              placeholder="Initial Password (optional)"
              className="w-full border p-2 rounded"
            />
            <button
              type="submit"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              <PlusCircle className="w-4 h-4 mr-1" />
              Create User
            </button>
          </form>
        </section>
      </main>
    </div>
  );
}
