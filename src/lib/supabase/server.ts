import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Client Supabase côté serveur (Server Client)
// Utilisé dans les Server Components, les Route Handlers et les Server Actions
// Ce client a accès aux cookies pour maintenir la session utilisateur
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Ignoré dans les Server Components (lecture seule)
            // Les cookies seront mis à jour via le middleware
          }
        },
      },
    },
  );
}
