-- Ajout de la colonne profile_widgets à la table profiles
-- Stocke la liste des widgets affichés sur le profil de l'utilisateur
-- Format : JSONB array de strings, ex: ["streak", "completion", "habits"]
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS profile_widgets jsonb DEFAULT '["streak", "completion"]'::jsonb;

-- Commentaire
COMMENT ON COLUMN profiles.profile_widgets IS 'Liste des widgets affichés sur le profil (ex: ["streak", "completion", "habits"])';
