-- ==========================================
-- MIGRATION 026 : Fix RLS UPDATE sur shared_habits
-- Problème : La policy UPDATE n'avait pas de WITH CHECK,
--            ce qui bloquait silencieusement les mises à jour
--            lors de l'utilisation de .select() après .update()
-- ==========================================

DROP POLICY IF EXISTS "update_shared_habits" ON shared_habits;

CREATE POLICY "update_shared_habits"
    ON shared_habits FOR UPDATE
    USING ( is_member_of_group(group_id) )
    WITH CHECK ( is_member_of_group(group_id) );
