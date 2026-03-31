-- Ajouter la colonne timezone à la table profiles
-- Valeur par défaut: 'Europe/Paris' pour les utilisateurs existants
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'Europe/Paris';

-- Mettre à jour les profils existants qui n'ont pas de timezone
UPDATE profiles
SET timezone = 'Europe/Paris'
WHERE timezone IS NULL;
