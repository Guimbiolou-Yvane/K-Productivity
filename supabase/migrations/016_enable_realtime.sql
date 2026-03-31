-- =================================================================
-- Migration 016: Activer Supabase Realtime sur les tables clés
-- =================================================================
-- Supabase Realtime utilise une PUBLICATION PostgreSQL nommée
-- "supabase_realtime". Les tables doivent y être ajoutées
-- explicitement pour que les souscriptions WebSocket fonctionnent.

-- On ajoute chaque table à la publication (ignorer si déjà présente)
DO $$
BEGIN
  -- habits
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'habits'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE habits;
  END IF;

  -- habit_logs
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'habit_logs'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE habit_logs;
  END IF;

  -- todos
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'todos'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE todos;
  END IF;

  -- shared_habits
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'shared_habits'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE shared_habits;
  END IF;

  -- shared_habit_logs
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'shared_habit_logs'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE shared_habit_logs;
  END IF;

  -- shared_group_members
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'shared_group_members'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE shared_group_members;
  END IF;

  -- notifications
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
  END IF;

  -- friendships
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'friendships'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE friendships;
  END IF;

END $$;
