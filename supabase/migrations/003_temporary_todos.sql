-- ==========================================
-- MIGRATION : Système de Todo List temporaire (24h)
-- Date : 2026-03-07
-- ==========================================

-- 1. Création de la table 'todos'
CREATE TABLE IF NOT EXISTS public.todos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  is_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 2. Sécurité Row Level Security (RLS)
ALTER TABLE public.todos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own todos"
  ON public.todos
  FOR ALL
  USING (auth.uid() = user_id);

-- 3. Fonction pour supprimer automatiquement les tâches de plus de 24h
CREATE OR REPLACE FUNCTION public.delete_old_todos()
RETURNS trigger AS $$
BEGIN
  -- Supprime silencieusement toutes les tâches créées il y a plus de 24 heures
  DELETE FROM public.todos WHERE created_at < NOW() - INTERVAL '24 HOURS';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Déclencheur (Trigger)
-- À chaque fois qu'une nouvelle tâche est insérée, on nettoie les anciennes !
DROP TRIGGER IF EXISTS trigger_cleanup_old_todos ON public.todos;
CREATE TRIGGER trigger_cleanup_old_todos
  AFTER INSERT ON public.todos
  FOR EACH STATEMENT EXECUTE PROCEDURE public.delete_old_todos();
