-- ==========================================
-- MIGRATION : Autoriser la lecture des données entre utilisateurs
-- pour la fonctionnalité de profil public
-- Date : 2026-03-09
-- ==========================================

-- Permettre aux utilisateurs authentifiés de LIRE les habitudes de tous les utilisateurs
-- (nécessaire pour afficher les widgets sur les profils publics)
CREATE POLICY "Les utilisateurs authentifiés peuvent lire toutes les habitudes"
  ON public.habits
  FOR SELECT
  TO authenticated
  USING (true);

-- Permettre aux utilisateurs authentifiés de LIRE les logs de tous les utilisateurs
CREATE POLICY "Les utilisateurs authentifiés peuvent lire tous les logs"
  ON public.habit_logs
  FOR SELECT
  TO authenticated
  USING (true);

-- Note : les politiques INSERT, UPDATE, DELETE existantes restent inchangées
-- (seul le propriétaire peut modifier ses propres données)
