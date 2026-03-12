import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Les variables NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY sont manquantes dans .env.local",
  );
}

// Client Supabase côté navigateur (Browser Client)
// Utilisé dans les composants "use client" et les pages côté client
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);
