import { NextResponse } from "next/server";

const ONESIGNAL_APP_ID = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID!;
const ONESIGNAL_REST_API_KEY = process.env.ONESIGNAL_REST_API_KEY!;

/**
 * POST /api/push/send
 * Envoie une notification push immédiate OU programmée à un utilisateur.
 *
 * Body attendu :
 * {
 *   userId: string,         // external_id (= Supabase user_id)
 *   title: string,
 *   body: string,
 *   sendAfter?: string,     // ISO date pour planifier (optionnel)
 * }
 */
export async function POST(req: Request) {
  try {
    const { userId, title, body: message, sendAfter } = await req.json();

    if (!userId || !title || !message) {
      return NextResponse.json(
        { error: "userId, title et body sont requis" },
        { status: 400 },
      );
    }

    if (!ONESIGNAL_REST_API_KEY) {
      // En dev local, on log simplement
      console.log(`[Push Mock] → ${title} : ${message} (user: ${userId})`);
      return NextResponse.json({ success: true, mock: true });
    }

    const payload: Record<string, unknown> = {
      app_id: ONESIGNAL_APP_ID,
      include_aliases: { external_id: [userId] },
      target_channel: "push",
      headings: { en: title, fr: title },
      contents: { en: message, fr: message },
      url: "https://karisma-productivity.vercel.app/",
      chrome_web_icon: "https://karisma-productivity.vercel.app/icon-192.png",
    };

    // Si une date d'envoi est spécifiée, programmer la notification
    if (sendAfter) {
      payload.send_after = sendAfter;
    }

    const response = await fetch("https://onesignal.com/api/v1/notifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${ONESIGNAL_REST_API_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error("[Push] Erreur OneSignal:", result);
      return NextResponse.json(
        { error: "Échec OneSignal", details: result },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true, id: result.id });
  } catch (error: any) {
    console.error("[Push] Erreur:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
