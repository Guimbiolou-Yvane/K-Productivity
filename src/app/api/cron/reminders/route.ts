import { NextResponse } from 'next/server';
import { bot } from '@/lib/services/telegramBotService';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  if (!bot) {
    return NextResponse.json({ error: 'Bot désactivé' }, { status: 500 });
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  );

  try {
    // 1. Trouver les utilisateurs qui ont lié leur Telegram
    const { data: profiles } = await supabaseAdmin
      .from('profiles')
      .select('id, first_name, telegram_chat_id')
      .not('telegram_chat_id', 'is', null);

    if (!profiles || profiles.length === 0) {
      return NextResponse.json({ message: 'Aucun utilisateur lié' });
    }

    let sentCount = 0;

    // 2. Parcourir et envoyer un rappel matinal
    for (const profile of profiles) {
      // NOTE: Ici, vous pourriez interroger la base pour vérifier s'ils ont déjà des choses à faire,
      // et adapter le message en fonction (avec Gemini ou avec des templates de texte standards).
      
      const message = `⏰ Bonjour ${profile.first_name || ''} ! 
C'est l'heure de planifier votre réussite de la journée. N'hésitez pas à me demander où vous en êtes dans vos tâches Karisma ! 💪`;

      try {
        await bot.telegram.sendMessage(profile.telegram_chat_id, message);
        sentCount++;
      } catch (e) {
        console.error(`Impossible d'envoyer à ${profile.telegram_chat_id}`);
      }
    }

    return NextResponse.json({ success: true, messages_envoyes: sentCount });

  } catch (error) {
    console.error('Erreur CRON:', error);
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 });
  }
}
