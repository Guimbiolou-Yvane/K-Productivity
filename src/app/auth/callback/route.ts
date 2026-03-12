import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// Cette route est appelée automatiquement par Supabase après une connexion OAuth
// L'URL ressemble à : /auth/callback?code=XXXXX
// Elle échange le code temporaire contre une session complète
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Connexion réussie → Rediriger vers la page d'accueil (ou `next`)
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // En cas d'erreur → Rediriger vers la page de connexion avec un message
  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`);
}
