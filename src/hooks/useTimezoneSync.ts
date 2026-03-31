"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabase/client";

/**
 * Hook qui détecte automatiquement le fuseau horaire du navigateur
 * et le synchronise avec le profil Supabase de l'utilisateur.
 * 
 * À utiliser dans un composant racine (layout, Navigation, etc.)
 * pour que la détection soit faite à chaque chargement de l'app.
 */
export function useTimezoneSync() {
  useEffect(() => {
    const syncTimezone = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const detectedTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
        if (!detectedTz) return;

        // Récupérer le timezone actuel du profil
        const { data: profile } = await supabase
          .from("profiles")
          .select("timezone")
          .eq("id", user.id)
          .single();

        // Mettre à jour seulement si différent (ou absent)
        if (!profile?.timezone || profile.timezone !== detectedTz) {
          await supabase
            .from("profiles")
            .update({ timezone: detectedTz })
            .eq("id", user.id);
        }
      } catch {
        // Silencieux — ne doit jamais bloquer l'app
      }
    };

    syncTimezone();
  }, []);
}
