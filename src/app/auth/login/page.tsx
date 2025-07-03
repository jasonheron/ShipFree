"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { User, Lock } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { AuthError } from "@supabase/supabase-js";

export default function LoginPage() {
  const supabase = createClient();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<AuthError | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setError(error);
    } else {
      // Redirect to the main dashboard
      router.push("/dashboard");
      // Refresh server components to fetch user data
      router.refresh();
    }
  };

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        // Ensure this matches the redirect URL in your Supabase project
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setError(error);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 px-4">
      <div className="flex w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* Left: Form */}
        <div className="flex flex-col justify-center items-center w-full md:w-1/2 p-10">
          <div className="w-full max-w-sm">
            <h2 className="text-2xl font-semibold mb-1">Hello Again!</h2>
            <p className="text-gray-500 mb-6">Welcome Back</p>

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="relative">
                <User
                  size={20}
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                />
                <input
                  type="email"
                  placeholder="Email Address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-full bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="relative">
                <Lock
                  size={20}
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-full bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {error && <p className="text-red-500 text-sm">{error.message}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2 rounded-full bg-blue-600 text-white font-medium hover:bg-blue-700 transition disabled:bg-blue-400"
              >
                {loading ? "Logging in..." : "Login"}
              </button>
            </form>

            <div className="flex items-center my-4">
              <div className="flex-grow border-t"></div>
              <span className="mx-2 text-gray-400 text-sm">or</span>
              <div className="flex-grow border-t"></div>
            </div>

            <button
              onClick={handleGoogleLogin}
              className="w-full flex items-center justify-center gap-2 py-2 border border-gray-300 rounded-full hover:bg-gray-50 transition"
            >
              <Image src="/google.webp" alt="Google" width={20} height={20} />
              <span className="text-sm font-medium">Sign in with Google</span>
            </button>
          </div>
        </div>

        {/* Right: Branding */}
        <div className="hidden md:flex flex-col justify-center items-center w-1/2 relative bg-gradient-to-br from-indigo-500 to-blue-600 p-8">
          <div className="absolute inset-0 opacity-20 bg-[url('/pattern.svg')] bg-cover bg-center"></div>
          <div className="relative z-10 flex flex-col items-center">
            <Image src="/logo.svg" alt="Logo" width={250} height={120} />
            <p className="text-white text-sm font-bold opacity-75">A SmartEpos Solution</p>
          </div>
        </div>
      </div>
    </div>
  );
}