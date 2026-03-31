-- =================================================================
-- Migration 014: Table de notifications in-app
-- =================================================================

CREATE TABLE IF NOT EXISTS notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type        TEXT NOT NULL DEFAULT 'info', -- 'friend_request', 'group_invite', 'habit_completed', 'reminder', 'info'
  title       TEXT NOT NULL,
  body        TEXT NOT NULL,
  link        TEXT,          -- Route optionnelle à ouvrir au clic (ex: '/amis')
  is_read     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index pour accélérer les requêtes par utilisateur
CREATE INDEX IF NOT EXISTS notifications_user_id_idx ON notifications(user_id, created_at DESC);

-- RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can see their own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notifications"
  ON notifications FOR DELETE
  USING (auth.uid() = user_id);

-- Les autres services (ex: fonctions edge, triggers) peuvent insérer
CREATE POLICY "Service can insert notifications"
  ON notifications FOR INSERT
  WITH CHECK (true);

-- =================================================================
-- Trigger : créer une notif à la réception d'une demande d'ami
-- =================================================================
CREATE OR REPLACE FUNCTION notify_on_friend_request()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  sender_username TEXT;
BEGIN
  SELECT username INTO sender_username FROM profiles WHERE id = NEW.user_id;
  INSERT INTO notifications(user_id, type, title, body, link)
  VALUES (
    NEW.friend_id,
    'friend_request',
    '🤝 Nouvelle demande d''ami',
    sender_username || ' souhaite vous ajouter en ami.',
    '/amis'
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_friend_request ON friendships;
CREATE TRIGGER on_friend_request
  AFTER INSERT ON friendships
  FOR EACH ROW
  WHEN (NEW.status = 'pending')
  EXECUTE FUNCTION notify_on_friend_request();

-- =================================================================
-- Trigger : notif quand une demande est acceptée
-- =================================================================
CREATE OR REPLACE FUNCTION notify_on_friend_accept()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  accepter_username TEXT;
BEGIN
  IF OLD.status = 'pending' AND NEW.status = 'accepted' THEN
    SELECT username INTO accepter_username FROM profiles WHERE id = NEW.friend_id;
    INSERT INTO notifications(user_id, type, title, body, link)
    VALUES (
      NEW.user_id,
      'friend_request',
      '✅ Demande acceptée',
      accepter_username || ' a accepté votre demande d''ami !',
      '/amis'
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_friend_accept ON friendships;
CREATE TRIGGER on_friend_accept
  AFTER UPDATE ON friendships
  FOR EACH ROW
  EXECUTE FUNCTION notify_on_friend_accept();

-- =================================================================
-- Trigger : notif quand on est invité dans un groupe partagé
-- =================================================================
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
    '/partages'
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_group_invite ON shared_group_members;
CREATE TRIGGER on_group_invite
  AFTER INSERT ON shared_group_members
  FOR EACH ROW
  EXECUTE FUNCTION notify_on_group_invite();
