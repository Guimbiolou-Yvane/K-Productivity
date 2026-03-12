-- ==========================================
-- NETTOYAGE : Supprimer les utilisateurs fantômes
-- Utilisateurs inscrits mais n'ayant JAMAIS confirmé leur email
-- Date : 2026-03-07
-- ==========================================

-- 1. Supprimer les profils fantômes (ceux liés à des users non confirmés)
DELETE FROM public.profiles
WHERE id IN (
  SELECT id FROM auth.users WHERE email_confirmed_at IS NULL
);

-- 2. Supprimer les utilisateurs fantômes de auth.users
DELETE FROM auth.users WHERE email_confirmed_at IS NULL;
