-- Activer l'extension "uuid-ossp" pour générer des UUID si nécessaire
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Enum pour les catégories d'habitudes
CREATE TYPE habit_category AS ENUM ('SANTÉ', 'DÉV. PERSO', 'TRAVAIL', 'SOCIAL', 'GÉNÉRAL', 'SPORT', 'MÉDITATION', 'ÉCOLE');

-- 2. Table `profiles` (Correspond au modèle UserProfile)
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

-- 3. Table `habits` (Correspond au modèle Habit)
CREATE TABLE habits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    category habit_category NOT NULL,
    frequency TEXT[] NOT NULL DEFAULT '{}', -- Tableau de jours ("Lun", "Mar", etc.)
    color TEXT,
    icon TEXT,
    time TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 4. Table `habit_logs` (Correspond au modèle HabitLog)
CREATE TABLE habit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    habit_id UUID NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    completed_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    
    -- Empêcher de valider plusieurs fois la même habitude le même jour
    UNIQUE(habit_id, completed_date)
);

-- ==========================================
-- SÉCURITÉ (Row Level Security - RLS)
-- ==========================================

-- Activer RLS sur les tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE habit_logs ENABLE ROW LEVEL SECURITY;

-- Politiques pour la table `profiles`
CREATE POLICY "Les utilisateurs peuvent voir leur propre profil" 
    ON profiles FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Les utilisateurs peuvent mettre à jour leur propre profil" 
    ON profiles FOR UPDATE USING (auth.uid() = id);

-- (Optionnel) Permettre de voir les profils publics, décommenter si besoin
-- CREATE POLICY "Les profils sont publics" ON profiles FOR SELECT USING (true);


-- Politiques pour la table `habits`
CREATE POLICY "Les utilisateurs peuvent voir leurs propres habitudes" 
    ON habits FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Les utilisateurs peuvent créer leurs propres habitudes" 
    ON habits FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Les utilisateurs peuvent modifier leurs propres habitudes" 
    ON habits FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Les utilisateurs peuvent supprimer leurs propres habitudes" 
    ON habits FOR DELETE USING (auth.uid() = user_id);


-- Politiques pour la table `habit_logs`
CREATE POLICY "Les utilisateurs peuvent voir leurs propres logs d'habitudes" 
    ON habit_logs FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Les utilisateurs peuvent créer leurs propres logs d'habitudes" 
    ON habit_logs FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Les utilisateurs peuvent supprimer leurs propres logs d'habitudes" 
    ON habit_logs FOR DELETE USING (auth.uid() = user_id);

-- ==========================================
-- TRIGGERS UTILITAIRES
-- ==========================================

-- Mettre à jour automatiquement le champ `updated_at` de la table `profiles`
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

-- Créer automatiquement un "profile" UNIQUEMENT quand l'email est confirmé
-- Le trigger se déclenche sur UPDATE (pas INSERT) pour éviter les utilisateurs fantômes
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Vérifier que l'email vient d'être confirmé (passage de NULL à une valeur)
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
    ON CONFLICT (id) DO NOTHING; -- Sécurité : ne pas dupliquer si le profil existe déjà
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Déclencher sur UPDATE au lieu de INSERT
CREATE TRIGGER on_auth_user_confirmed
  AFTER UPDATE ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
