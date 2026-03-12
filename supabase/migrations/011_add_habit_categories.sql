-- ==========================================
-- MIGRATION : Ajout de nouvelles catégories d'habitudes
-- Date : 2026-03-11
-- ==========================================

-- Pour assurer la compatibilité, on utilise un bloc DO pour gérer l'ajout "IF NOT EXISTS"
-- qui n'est pas supporté de base par toutes les versions de PostgreSQL de la même façon.
-- Cependant, PostgreSQL 12+ supporte "IF NOT EXISTS" pour les Types ENUM.

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'habit_category' AND e.enumlabel = 'SPORT') THEN
        ALTER TYPE public.habit_category ADD VALUE 'SPORT';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'habit_category' AND e.enumlabel = 'MÉDITATION') THEN
        ALTER TYPE public.habit_category ADD VALUE 'MÉDITATION';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'habit_category' AND e.enumlabel = 'ÉCOLE') THEN
        ALTER TYPE public.habit_category ADD VALUE 'ÉCOLE';
    END IF;
END $$;
