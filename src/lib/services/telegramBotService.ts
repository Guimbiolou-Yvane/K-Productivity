import { Telegraf, Markup } from 'telegraf';
import { createClient } from '@supabase/supabase-js';

const token = process.env.TELEGRAM_BOT_TOKEN;
export const bot = token ? new Telegraf(token) : null;

const getSupabaseAdmin = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  );

// =====================================================
// HELPERS : Récupération des données Karisma
// =====================================================

async function getProfile(db: ReturnType<typeof getSupabaseAdmin>, chatId: string) {
  const { data } = await db
    .from('profiles')
    .select('id, first_name')
    .eq('telegram_chat_id', chatId)
    .single();
  return data;
}

async function getTodayTasks(db: ReturnType<typeof getSupabaseAdmin>, userId: string) {
  const { data } = await db
    .from('todos')
    .select('title, is_completed, time')
    .eq('user_id', userId)
    .order('is_completed', { ascending: true });
  return data || [];
}

async function getTodayHabits(db: ReturnType<typeof getSupabaseAdmin>, userId: string) {
  const today = new Date().toISOString().split('T')[0];
  const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
  const todayDayName = dayNames[new Date().getDay()];

  const { data: habits } = await db
    .from('habits')
    .select('id, name, category, frequency, time')
    .eq('user_id', userId)
    .lte('start_date', today)
    .gte('end_date', today);

  const todaysHabits = (habits || []).filter(
    (h: any) => h.frequency && h.frequency.includes(todayDayName)
  );

  if (todaysHabits.length === 0) return [];

  const { data: logs } = await db
    .from('habit_logs')
    .select('habit_id')
    .in('habit_id', todaysHabits.map((h: any) => h.id))
    .eq('completed_date', today);

  const completedIds = new Set((logs || []).map((l: any) => l.habit_id));

  return todaysHabits.map((h: any) => ({
    ...h,
    done_today: completedIds.has(h.id),
  }));
}

async function getGoals(db: ReturnType<typeof getSupabaseAdmin>, userId: string) {
  const { data } = await db
    .from('goals')
    .select('title, is_completed, target_date, category')
    .eq('user_id', userId)
    .order('is_completed', { ascending: true });
  return data || [];
}

// =====================================================
// BUILDERS : Construction des messages de réponse
// =====================================================

function buildTasksMessage(tasks: any[]): string {
  if (tasks.length === 0) {
    return '📋 Tâches du jour\n\nAucune tâche pour l\'instant. Profitez-en ! 😌';
  }
  const pending = tasks.filter((t) => !t.is_completed);
  const done = tasks.filter((t) => t.is_completed);

  let msg = '📋 Tâches du jour\n\n';
  if (pending.length > 0) {
    msg += '⬜ À faire :\n';
    msg += pending.map((t) => `- ${t.title}${t.time ? ` (${t.time})` : ''}`).join('\n');
  }
  if (done.length > 0) {
    msg += `\n\n✅ Terminées (${done.length}) :\n`;
    msg += done.map((t) => `- ${t.title}`).join('\n');
  }
  return msg;
}

function buildHabitsMessage(habits: any[]): string {
  if (habits.length === 0) {
    return '🔁 Habitudes du jour\n\nAucune habitude prévue aujourd\'hui.';
  }
  const pending = habits.filter((h) => !h.done_today);
  const done = habits.filter((h) => h.done_today);

  let msg = '🔁 Habitudes du jour\n\n';
  if (pending.length > 0) {
    msg += '⬜ À faire :\n';
    msg += pending.map((h) => `- ${h.name} [${h.category}]${h.time ? ` à ${h.time}` : ''}`).join('\n');
  }
  if (done.length > 0) {
    msg += `\n\n✅ Complétées (${done.length}) :\n`;
    msg += done.map((h) => `- ${h.name}`).join('\n');
  }
  return msg;
}

function buildGoalsMessage(goals: any[]): string {
  if (goals.length === 0) {
    return '🎯 Objectifs\n\nAucun objectif défini pour l\'instant.';
  }
  const inProgress = goals.filter((g) => !g.is_completed);
  const done = goals.filter((g) => g.is_completed);

  let msg = '🎯 Objectifs long terme\n\n';
  if (inProgress.length > 0) {
    msg += '⏳ En cours :\n';
    msg += inProgress.map((g) => `- ${g.title} [${g.category}] → ${g.target_date}`).join('\n');
  }
  if (done.length > 0) {
    msg += `\n\n✅ Accomplis (${done.length}) :\n`;
    msg += done.map((g) => `- ${g.title}`).join('\n');
  }
  return msg;
}

async function buildSummaryMessage(
  tasks: any[],
  habits: any[],
  goals: any[]
): Promise<string> {
  const today = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long',
  });

  const pendingTasks = tasks.filter((t) => !t.is_completed).length;
  const doneTasks = tasks.filter((t) => t.is_completed).length;
  const pendingHabits = habits.filter((h) => !h.done_today).length;
  const doneHabits = habits.filter((h) => h.done_today).length;
  const activeGoals = goals.filter((g) => !g.is_completed).length;

  return `📊 Résumé du ${today}

📋 Tâches : ${doneTasks}/${tasks.length} terminée(s)
🔁 Habitudes : ${doneHabits}/${habits.length} complétée(s)
🎯 Objectifs en cours : ${activeGoals}

${pendingTasks > 0 ? `⬜ ${pendingTasks} tâche(s) restante(s)` : '✅ Toutes les tâches sont faites !'}
${pendingHabits > 0 ? `⬜ ${pendingHabits} habitude(s) à valider` : '✅ Toutes les habitudes du jour sont faites !'}`;
}

// =====================================================
// MENU PRINCIPAL : Clavier inline
// =====================================================

const mainMenu = Markup.inlineKeyboard([
  [
    Markup.button.callback('📋 Mes tâches', 'tasks'),
    Markup.button.callback('🔁 Mes habitudes', 'habits'),
  ],
  [
    Markup.button.callback('🎯 Mes objectifs', 'goals'),
    Markup.button.callback('📊 Résumé du jour', 'summary'),
  ],
]);

const backMenu = Markup.inlineKeyboard([
  [Markup.button.callback('↩️ Retour au menu', 'menu')],
]);

// =====================================================
// BOT SETUP
// =====================================================

if (bot) {
  // --- /start : Liaison du compte + affichage du menu ---
  bot.start(async (ctx) => {
    const userId = ctx.startPayload;
    const chatId = ctx.chat.id.toString();

    if (userId) {
      const db = getSupabaseAdmin();
      const { error } = await db
        .from('profiles')
        .update({ telegram_chat_id: chatId })
        .eq('id', userId);

      if (error) {
        return ctx.reply('❌ Impossible de lier votre compte Karisma. Réessayez.');
      }

      const { data: profile } = await db
        .from('profiles')
        .select('first_name')
        .eq('id', userId)
        .single();

      const name = profile?.first_name ? ` ${profile.first_name}` : '';

      return ctx.reply(
        `✅ Compte lié avec succès !\n\nBonjour${name} ! Je suis votre assistant Karisma. Choisissez une option :`,
        mainMenu
      );
    }

    ctx.reply(
      '👋 Bonjour ! Je suis l\'assistant Karisma.\n\nPour commencer, liez votre compte depuis l\'app Karisma → Paramètres → Assistant Telegram.'
    );
  });

  // --- /menu : Afficher le menu principal ---
  bot.command('menu', async (ctx) => {
    ctx.reply('Que souhaitez-vous consulter ?', mainMenu);
  });

  // --- /debug ---
  bot.command('debug', async (ctx) => {
    const chatId = ctx.chat.id.toString();
    const db = getSupabaseAdmin();
    const profile = await getProfile(db, chatId);
    if (!profile) return ctx.reply('❌ Compte non lié.');

    const today = new Date().toISOString().split('T')[0];
    const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
    const habits = await getTodayHabits(db, profile.id);
    const tasks = await getTodayTasks(db, profile.id);
    const goals = await getGoals(db, profile.id);
    const { data: allHabits } = await db
      .from('habits')
      .select('name, frequency, start_date, end_date')
      .eq('user_id', profile.id);

    ctx.reply([
      `🔍 DEBUG — ${today} (${dayNames[new Date().getDay()]})`,
      `📋 Tâches : ${tasks.length}`,
      `🔁 Habitudes filtrées : ${habits.length}`,
      `🎯 Objectifs : ${goals.length}`,
      ``,
      `📦 Toutes les habitudes :`,
      ...(allHabits || []).map(
        (h: any) => `  - ${h.name} | ${h.start_date} → ${h.end_date}`
      ),
    ].join('\n'));
  });

  // --- Callbacks des boutons inline ---
  bot.action('menu', (ctx) => {
    ctx.editMessageText('Que souhaitez-vous consulter ?', mainMenu);
  });

  bot.action('tasks', async (ctx) => {
    const chatId = ctx.chat?.id.toString() || '';
    const db = getSupabaseAdmin();
    const profile = await getProfile(db, chatId);
    if (!profile) return ctx.reply('⚠️ Compte non lié.');

    const tasks = await getTodayTasks(db, profile.id);
    await ctx.editMessageText(buildTasksMessage(tasks), backMenu);
  });

  bot.action('habits', async (ctx) => {
    const chatId = ctx.chat?.id.toString() || '';
    const db = getSupabaseAdmin();
    const profile = await getProfile(db, chatId);
    if (!profile) return ctx.reply('⚠️ Compte non lié.');

    const habits = await getTodayHabits(db, profile.id);
    await ctx.editMessageText(buildHabitsMessage(habits), backMenu);
  });

  bot.action('goals', async (ctx) => {
    const chatId = ctx.chat?.id.toString() || '';
    const db = getSupabaseAdmin();
    const profile = await getProfile(db, chatId);
    if (!profile) return ctx.reply('⚠️ Compte non lié.');

    const goals = await getGoals(db, profile.id);
    await ctx.editMessageText(buildGoalsMessage(goals), backMenu);
  });

  bot.action('summary', async (ctx) => {
    const chatId = ctx.chat?.id.toString() || '';
    const db = getSupabaseAdmin();
    const profile = await getProfile(db, chatId);
    if (!profile) return ctx.reply('⚠️ Compte non lié.');

    const [tasks, habits, goals] = await Promise.all([
      getTodayTasks(db, profile.id),
      getTodayHabits(db, profile.id),
      getGoals(db, profile.id),
    ]);

    const summary = await buildSummaryMessage(tasks, habits, goals);
    await ctx.editMessageText(summary, backMenu);
  });

  // --- Répondre à tout message texte libre par le menu ---
  bot.on('text', async (ctx) => {
    // Ignorer les commandes (elles sont gérées ci-dessus)
    if (ctx.message.text.startsWith('/')) return;

    const chatId = ctx.chat.id.toString();
    const db = getSupabaseAdmin();
    const profile = await getProfile(db, chatId);

    if (!profile) {
      return ctx.reply(
        '⚠️ Votre compte n\'est pas lié. Allez dans Karisma → Paramètres → Assistant Telegram.'
      );
    }

    ctx.reply('Choisissez une option :', mainMenu);
  });
}
