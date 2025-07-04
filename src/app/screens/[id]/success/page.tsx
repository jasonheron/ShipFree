import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import { ArrowLeft, CheckCircle } from "lucide-react";

export default async function ScreenSuccessPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    notFound();
  }

  // Fetch the newly created screen to get its pairing code
  const { data: screen } = await supabase
    .from("screens_table")
    .select("name, pairing_code")
    .eq("id", params.id)
    .eq("user_id", user.id)
    .single();

  if (!screen) {
    notFound();
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 p-8 flex flex-col items-center justify-center">
        <div className="max-w-md w-full text-center bg-white p-8 rounded-lg shadow-md">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-semibold mb-2">
            Screen "{screen.name}" Registered!
          </h1>
          <p className="text-gray-600 mb-6">
            Use the following code to pair your physical device.
          </p>

          <div className="bg-gray-100 border-dashed border-2 border-gray-300 rounded-lg p-6 mb-6">
            <p className="text-gray-500 text-sm uppercase tracking-widest">
              Pairing Code
            </p>
            <p className="text-5xl font-bold tracking-[0.2em] text-gray-800">
              {screen.pairing_code}
            </p>
          </div>

          <p className="text-sm text-gray-500 mb-8">
            On your player device, open the application and enter this code when
            prompted. This code is for one-time use.
          </p>

          <Link
            href="/dashboard"
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Done
          </Link>
        </div>
      </main>
    </div>
  );
}