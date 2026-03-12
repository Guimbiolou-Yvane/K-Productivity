-- ==========================================
-- MIGRATION : Autoriser la lecture des todos entre utilisateurs
-- pour la fonctionnalité de profil public
-- Date : 2026-03-09
-- ==========================================

-- Permettre aux utilisateurs authentifiés de LIRE les todos de tous les utilisateurs
CREATE POLICY "Les utilisateurs authentifiés peuvent lire tous les todos"
  ON public.todos
  FOR SELECT
  TO authenticated
  USING (true);
