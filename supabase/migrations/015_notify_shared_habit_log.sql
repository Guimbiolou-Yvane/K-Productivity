-- =================================================================
-- Migration 015: Notification quand un membre valide un objectif commun
-- =================================================================

CREATE OR REPLACE FUNCTION notify_on_shared_habit_log()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  habit_name    TEXT;
  group_name    TEXT;
  group_id_val  UUID;
  validator_username TEXT;
  member_row    RECORD;
BEGIN
  -- Récupérer le nom de l'objectif et du groupe
  SELECT sh.name, sh.group_id, sg.name
  INTO habit_name, group_id_val, group_name
  FROM shared_habits sh
  JOIN shared_groups sg ON sg.id = sh.group_id
  WHERE sh.id = NEW.shared_habit_id;

  -- Récupérer le username du validateur
  SELECT username INTO validator_username
  FROM profiles WHERE id = NEW.user_id;

  -- Notifier chaque AUTRE membre du groupe (pas le validateur lui-même)
  FOR member_row IN
    SELECT user_id
    FROM shared_group_members
    WHERE group_id = group_id_val
      AND user_id <> NEW.user_id
  LOOP
    INSERT INTO notifications(user_id, type, title, body, link)
    VALUES (
      member_row.user_id,
      'habit_completed',
      '⚡ Objectif validé !',
      validator_username || ' a validé « ' || habit_name || ' » dans le groupe ' || group_name || '.',
      '/partages'
    );
  END LOOP;

  RETURN NEW;
END;
$$;

-- On ne déclenche la notif QUE lors de la VALIDATION (INSERT), pas à la dé-validation
DROP TRIGGER IF EXISTS on_shared_habit_log ON shared_habit_logs;
CREATE TRIGGER on_shared_habit_log
  AFTER INSERT ON shared_habit_logs
  FOR EACH ROW
  EXECUTE FUNCTION notify_on_shared_habit_log();
