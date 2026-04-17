-- ==========================================
-- MIGRATION 029 : Supabase Cron Job
-- Appelle l'endpoint de notifications Telegram toutes les 5 minutes
-- via les extensions pg_cron et pg_net
-- ==========================================

-- Étape 1 : Activer les extensions nécessaires
-- (Si déjà activées via le Dashboard Supabase, ces lignes n'ont aucun effet)
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Étape 2 : Supprimer le job s'il existe déjà (pour éviter les doublons si on relance)
SELECT cron.unschedule('karisma-telegram-notify')
WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'karisma-telegram-notify'
);

-- Étape 3 : Créer le cron job qui appelle votre API Vercel toutes les 5 minutes
SELECT cron.schedule(
  'karisma-telegram-notify',
  '*/5 * * * *',
  $$
    SELECT net.http_get(
      url     := 'https://karisma-productivity.vercel.app/api/cron/notify',
      headers := '{"Authorization": "Bearer karisma-cron-secret-2026-yesbaby"}'::jsonb
    );
  $$
);

-- Vérification : voir les jobs actifs
SELECT jobname, schedule, command FROM cron.job;
