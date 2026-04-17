import { NextRequest, NextResponse } from 'next/server';
import { bot } from '@/lib/services/telegramBotService';

// Le Webhook sera appelé par Telegram avec la méthode POST
export async function POST(req: NextRequest) {
  if (!bot) {
    return NextResponse.json({ error: 'Le token TELEGRAM_BOT_TOKEN est manquant' }, { status: 500 });
  }

  try {
    const body = await req.json();
    // Passer la requête directement à Telegraf pour l'analyser et déclencher nos fonctions dans le service
    await bot.handleUpdate(body);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Webhook Telegram Error:', error);
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 });
  }
}

// Optionnel: Un petit GET pour tester si l'endpoint est bien en ligne
export async function GET() {
  return NextResponse.json({ status: 'Webhook Telegram actif', bot_enabled: !!bot });
}
