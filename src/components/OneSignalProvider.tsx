"use client";

import { useEffect, useRef } from "react";
import OneSignal from "react-onesignal";
import { supabase } from "@/lib/supabase/client";

// Utilitaire appelable depuis n'importe quel composant
export async function requestNotificationPermission() {
  try {
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      await (OneSignal.User as any).PushSubscription.optIn();
    }
    return permission;
  } catch (e) {
    console.error("[OneSignal] Erreur demande permission:", e);
    return "denied";
  }
}

export function getNotificationPermission(): NotificationPermission | "unsupported" {
  if (typeof window === "undefined" || !("Notification" in window)) return "unsupported";
  return Notification.permission;
}

export default function OneSignalProvider() {
  const initialized = useRef(false);

  useEffect(() => {
    const appId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;

    if (!appId || initialized.current) return;

    // OneSignal SDK v16 exige HTTPS. On ne l'initialise pas en HTTP localhost.
    const isSecure = window.location.protocol === "https:";
    if (!isSecure) {
      console.warn(
        "[OneSignal] Ignoré : HTTPS requis. Les notifications push fonctionneront en production (Vercel, etc.)."
      );
      return;
    }

    const initOneSignal = async () => {
      try {
        const config = {
          appId,
          safari_web_id: process.env.NEXT_PUBLIC_ONESIGNAL_SAFARI_WEB_ID,
          notifyButton: {
            enable: false, // Remplacé par notre bouton personnalisé dans le header
          },
          serviceWorkerParam: { scope: "/push/onesignal/" },
          serviceWorkerPath: "push/onesignal/OneSignalSDKWorker.js",
        };

        await OneSignal.init(config as any);

        initialized.current = true;
        console.log("[OneSignal] Initialisé avec succès ✅");

        // Lier l'utilisateur Supabase connecté à OneSignal (via external_id)
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await OneSignal.login(user.id);
          console.log("[OneSignal] Utilisateur lié :", user.id);
        }
      } catch (error) {
        if (
          error instanceof Error &&
          error.message.includes("already initialized")
        ) {
          console.warn("[OneSignal] Déjà initialisé, ignoré.");
          initialized.current = true;
        } else {
          console.error("[OneSignal] Erreur d'initialisation:", error);
        }
      }
    };

    initOneSignal();
  }, []);

  return null;
}
