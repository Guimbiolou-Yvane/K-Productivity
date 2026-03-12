-- ==========================================
-- 🔥 KARISMA PRODUCTIVITY - SETUP COMPLET (FROM SCRATCH)
-- ==========================================
-- Ce script consolide :
--   - schema.sql (tables, RLS, triggers)
--   - 001_update_handle_new_user.sql
--   - 003_temporary_todos.sql
--   - 004_monthly_habits.sql
--
-- ⚡ INSTRUCTIONS :
--   1. Ouvrir Supabase → SQL Editor
--   2. Coller TOUT ce script
--   3. Cliquer "Run"
--   4. C'est tout !
-- ==========================================


-- =======================
-- ÉTAPE 0 : NETTOYAGE
-- =======================
-- Supprimer les anciens triggers/fonctions potentiellement créés par erreur
DROP TRIGGER IF EXISTS on_auth_user_confirmed ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS update_updated_at_column();
DROP FUNCTION IF EXISTS public.delete_old_todos();

-- Supprimer les tables si elles existent (dans le bon ordre pour les FK)
DROP TABLE IF EXISTS public.todos CASCADE;
DROP TABLE IF EXISTS public.habit_logs CASCADE;
DROP TABLE IF EXISTS public.habits CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Supprimer l'enum si il existe
DROP TYPE IF EXISTS habit_category CASCADE;


-- =======================
-- ÉTAPE 1 : EXTENSIONS
-- =======================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";


-- =======================
-- ÉTAPE 2 : TYPES (ENUMS)
-- =======================
CREATE TYPE habit_category AS ENUM ('SANTÉ', 'DÉV. PERSO', 'TRAVAIL', 'SOCIAL', 'GÉNÉRAL');


-- =======================
-- ÉTAPE 3 : TABLE "profiles"
-- =======================
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    first_name TEXT,
    last_name TEXT,
    username TEXT NOT NULL UNIQUE,
    avatar_url TEXT,
    longest_streak INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);


-- =======================
-- ÉTAPE 4 : TABLE "habits" (avec target_month intégré)
-- =======================
CREATE TABLE habits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    category habit_category NOT NULL,
    frequency TEXT[] NOT NULL DEFAULT '{}',
    color TEXT,
    icon TEXT,
    time TEXT,
    target_month VARCHAR(7) NOT NULL, -- Format "YYYY-MM" (ex: "2026-03")
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);


-- =======================
-- ÉTAPE 5 : TABLE "habit_logs"
-- =======================
CREATE TABLE habit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    habit_id UUID NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    completed_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    UNIQUE(habit_id, completed_date)
);


-- =======================
-- ÉTAPE 6 : TABLE "todos" (objectifs temporaires 24h)
-- =======================
CREATE TABLE todos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    is_completed BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);


-- ==========================================
-- ÉTAPE 7 : ROW LEVEL SECURITY (RLS)
-- ==========================================

-- Activer RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE habit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE todos ENABLE ROW LEVEL SECURITY;

-- Politiques "profiles"
CREATE POLICY "Les utilisateurs peuvent voir leur propre profil"
    ON profiles FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Les utilisateurs peuvent mettre à jour leur propre profil"
    ON profiles FOR UPDATE USING (auth.uid() = id);

-- Politiques "habits"
CREATE POLICY "Les utilisateurs peuvent voir leurs propres habitudes"
    ON habits FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Les utilisateurs peuvent créer leurs propres habitudes"
    ON habits FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Les utilisateurs peuvent modifier leurs propres habitudes"
    ON habits FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Les utilisateurs peuvent supprimer leurs propres habitudes"
    ON habits FOR DELETE USING (auth.uid() = user_id);

-- Politiques "habit_logs"
CREATE POLICY "Les utilisateurs peuvent voir leurs propres logs"
    ON habit_logs FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Les utilisateurs peuvent créer leurs propres logs"
    ON habit_logs FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Les utilisateurs peuvent supprimer leurs propres logs"
    ON habit_logs FOR DELETE USING (auth.uid() = user_id);

-- Politiques "todos"
CREATE POLICY "Users can manage their own todos"
    ON todos FOR ALL USING (auth.uid() = user_id);


-- ==========================================
-- ÉTAPE 8 : FONCTIONS & TRIGGERS
-- ==========================================

-- 8a. Auto-update "updated_at" sur profiles
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();


-- 8b. Création automatique du profil quand l'email est CONFIRMÉ
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  IF OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL THEN
    INSERT INTO public.profiles (id, email, first_name, last_name, username, avatar_url, created_at, updated_at)
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'first_name', NEW.raw_user_meta_data->>'given_name', NULL),
      COALESCE(NEW.raw_user_meta_data->>'last_name', NEW.raw_user_meta_data->>'family_name', NULL),
      COALESCE(NEW.raw_user_meta_data->>'username', NEW.raw_user_meta_data->>'preferred_username', split_part(NEW.email, '@', 1)),
      COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture', NULL),
      NOW(),
      NOW()
    )
    ON CONFLICT (id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_confirmed
  AFTER UPDATE ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


-- 8c. Nettoyage automatique des todos de plus de 24h
CREATE OR REPLACE FUNCTION public.delete_old_todos()
RETURNS trigger AS $$
BEGIN
  DELETE FROM public.todos WHERE created_at < NOW() - INTERVAL '24 HOURS';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_cleanup_old_todos ON public.todos;
CREATE TRIGGER trigger_cleanup_old_todos
  AFTER INSERT ON public.todos
  FOR EACH STATEMENT EXECUTE PROCEDURE public.delete_old_todos();


-- ==========================================
-- ✅ SETUP TERMINÉ !
-- ==========================================
-- Tables créées : profiles, habits, habit_logs, todos
-- RLS activé sur toutes les tables
-- Triggers : auto-profil sur confirmation email, auto-cleanup todos 24h
-- ==========================================
