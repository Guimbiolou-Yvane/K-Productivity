-- ==========================================
-- MIGRATION : Anti-utilisateurs fantômes
-- Le profil n'est créé que quand l'email est CONFIRMÉ
-- Date : 2026-03-07
-- ==========================================

-- 1. Supprimer l'ancien trigger (s'il existe)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 2. Remplacer la fonction par la version sécurisée
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Ne créer le profil que quand email_confirmed_at passe de NULL à une valeur
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

-- 3. Créer le nouveau trigger sur UPDATE
CREATE TRIGGER on_auth_user_confirmed
  AFTER UPDATE ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
