-- Ajouter la colonne time (heure optionnelle) à la table todos
ALTER TABLE todos
ADD COLUMN IF NOT EXISTS time TEXT DEFAULT NULL;
