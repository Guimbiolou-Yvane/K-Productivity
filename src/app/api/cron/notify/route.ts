import { NextRequest, NextResponse } from 'next/server';
import { bot } from '@/lib/services/telegramBotService';
import { createClient } from '@supabase/supabase-js';
import { Markup } from 'telegraf';

export async function GET(req: NextRequest) {
  const secret = req.headers.get('authorization')?.replace('Bearer ', '');
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  if (!bot) {
    return NextResponse.json({ error: 'Bot désactivé' }, { status: 500 });
  }

  const db = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  );

  try {
    const { data: profiles } = await db
      .from('profiles')
      .select('id, first_name, telegram_chat_id, timezone')
      .not('telegram_chat_id', 'is', null);

    if (!profiles || profiles.length === 0) {
      return NextResponse.json({ checked: 0, sent: 0 });
    }

    let sentCount = 0;
    const nowUtc = new Date();

    for (const profile of profiles) {
      try {
        const tz = profile.timezone || 'Europe/Paris';

        // === Calcul de la fenêtre de notification ===
        // Le cron tourne toutes les 5 min → on notifie les activités dans [now+5, now+10]
        // Cela garantit qu'une activité ne reçoit qu'une seule notification.
        const alertWindowStart = new Date(nowUtc.getTime() + 5 * 60_000);  // +5 min
        const alertWindowEnd   = new Date(nowUtc.getTime() + 10 * 60_000); // +10 min

        // Convertir en "HH:MM" dans le fuseau de l'utilisateur
        const toLocalHHMM = (date: Date) =>
          date.toLocaleTimeString('fr-FR', {
            timeZone: tz,
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
          });

        const minTime    = toLocalHHMM(alertWindowStart); // ex: "09:05"
        const maxTime    = toLocalHHMM(alertWindowEnd);   // ex: "09:10"
        const localDateStr = nowUtc.toLocaleDateString('sv-SE', { timeZone: tz }); // YYYY-MM-DD
        const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
        const localDayName = dayNames[new Date(localDateStr + 'T12:00:00').getDay()];

        // === Tâches (Todos) dans la fenêtre ===
        const { data: dueTodos } = await db
          .from('todos')
          .select('title, time')
          .eq('user_id', profile.id)
          .eq('is_completed', false)
          .gte('time', minTime)
          .lte('time', maxTime);

        // === Habitudes dans la fenêtre ===
        const { data: activeHabits } = await db
          .from('habits')
          .select('id, name, category, time, frequency')
          .eq('user_id', profile.id)
          .gte('time', minTime)
          .lte('time', maxTime)
          .lte('start_date', localDateStr)
          .gte('end_date', localDateStr);

        // Filtrer par jour de semaine
        const dueHabits = (activeHabits || []).filter(
          (h: any) => h.frequency && h.frequency.includes(localDayName)
        );

        // Exclure les habitudes déjà complétées aujourd'hui
        const habitsTodo: any[] = [];
        if (dueHabits.length > 0) {
          const { data: logs } = await db
            .from('habit_logs')
            .select('habit_id')
            .in('habit_id', dueHabits.map((h: any) => h.id))
            .eq('completed_date', localDateStr);
          const completedIds = new Set((logs || []).map((l: any) => l.habit_id));
          dueHabits.forEach((h: any) => {
            if (!completedIds.has(h.id)) habitsTodo.push(h);
          });
        }

        // === Envoi des notifications ===
        for (const todo of (dueTodos || [])) {
          // Calcul du temps restant pour un message plus humain
          const minutesLeft = Math.round(
            (alertWindowStart.getTime() - nowUtc.getTime()) / 60_000
          ) + 5;

          await bot.telegram.sendMessage(
            profile.telegram_chat_id,
            `⏰ Rappel dans ~${minutesLeft} min\n\n📋 ${todo.title}\n→ Prévu à ${todo.time}`,
            Markup.inlineKeyboard([[Markup.button.callback('📋 Voir mes tâches', 'tasks')]])
          );
          sentCount++;
        }

        for (const habit of habitsTodo) {
          const minutesLeft = Math.round(
            (alertWindowStart.getTime() - nowUtc.getTime()) / 60_000
          ) + 5;

          await bot.telegram.sendMessage(
            profile.telegram_chat_id,
            `⏰ Rappel dans ~${minutesLeft} min\n\n🔁 ${habit.name} [${habit.category}]\n→ Prévu à ${habit.time}`,
            Markup.inlineKeyboard([[Markup.button.callback('🔁 Voir mes habitudes', 'habits')]])
          );
          sentCount++;
        }

      } catch (e) {
        console.error(`Erreur notification pour ${profile.telegram_chat_id}:`, e);
      }
    }

    return NextResponse.json({
      success: true,
      checked: profiles.length,
      notifications_sent: sentCount,
      window: `+5min à +10min de ${nowUtc.toISOString()}`,
    });

  } catch (error) {
    console.error('Erreur CRON notify:', error);
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 });
  }
}
