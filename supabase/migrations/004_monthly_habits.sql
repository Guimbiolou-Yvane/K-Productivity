-- ==========================================
-- MIGRATION : Objectifs mensuels
-- Date : 2026-03-07
-- ==========================================

-- 1. Ajouter la colonne cible du mois (ex: "2026-03")
ALTER TABLE public.habits ADD COLUMN target_month VARCHAR(7);

-- 2. Mettre à jour les habitudes existantes avec le mois courant
UPDATE public.habits SET target_month = to_char(CURRENT_DATE, 'YYYY-MM') WHERE target_month IS NULL;

-- 3. Rendre la colonne obligatoire
ALTER TABLE public.habits ALTER COLUMN target_month SET NOT NULL;
