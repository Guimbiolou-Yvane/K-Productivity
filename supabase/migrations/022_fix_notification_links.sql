-- =================================================================
-- Migration 022 : Correction des liens de notifications
-- La page /partages est désormais intégrée à la page principale /
-- =================================================================

-- 1. Mettre à jour les anciennes notifications déjà insérées en base
UPDATE notifications
  SET link = '/'
  WHERE link = '/partages';

-- 2. Corriger le trigger : invitation dans un groupe partagé
CREATE OR REPLACE FUNCTION notify_on_group_invite()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  group_name TEXT;
  inviter_username TEXT;
BEGIN
  SELECT g.name, p.username INTO group_name, inviter_username
  FROM shared_groups g
  JOIN profiles p ON p.id = g.creator_id
  WHERE g.id = NEW.group_id;

  INSERT INTO notifications(user_id, type, title, body, link)
  VALUES (
    NEW.user_id,
    'group_invite',
    '👥 Invitation à un groupe',
    'Vous avez été ajouté au groupe « ' || group_name || ' ».',
    '/'
  );
  RETURN NEW;
END;
$$;

-- 3. Corriger le trigger : validation d'un objectif partagé
CREATE OR REPLACE FUNCTION notify_on_shared_habit_log()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  habit_name    TEXT;
  group_name    TEXT;
  group_id_val  UUID;
  validator_username TEXT;
  member_row    RECORD;
BEGIN
  SELECT sh.name, sh.group_id, sg.name
  INTO habit_name, group_id_val, group_name
  FROM shared_habits sh
  JOIN shared_groups sg ON sg.id = sh.group_id
  WHERE sh.id = NEW.shared_habit_id;

  SELECT username INTO validator_username
  FROM profiles WHERE id = NEW.user_id;

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
      '/'
    );
  END LOOP;

  RETURN NEW;
END;
$$;
