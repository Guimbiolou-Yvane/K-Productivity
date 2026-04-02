-- Ajout d'un champ bio sur les profils utilisateurs
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bio TEXT;
