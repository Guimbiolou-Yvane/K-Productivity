-- Ajout de la date de début et de fin pour chaque habitude (Task)
-- start_date: DATE, end_date: DATE
ALTER TABLE habits
ADD COLUMN IF NOT EXISTS start_date DATE,
ADD COLUMN IF NOT EXISTS end_date DATE;

-- Remplir les données existantes (pour ne pas briser l'existant)
UPDATE habits
SET start_date = DATE(timezone('utc', created_at))
WHERE start_date IS NULL;

-- L'ancienne logique s'arrêtait à la fin du mois cible
UPDATE habits
SET end_date = (target_month || '-01')::DATE + INTERVAL '1 month' - INTERVAL '1 day'
WHERE end_date IS NULL;

-- Rendre les colonnes obligatoires
ALTER TABLE habits
ALTER COLUMN start_date SET NOT NULL,
ALTER COLUMN end_date SET NOT NULL;
