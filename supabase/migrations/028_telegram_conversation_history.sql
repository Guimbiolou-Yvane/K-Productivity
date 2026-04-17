-- ==========================================
-- MIGRATION 028 : Historique de conversation Telegram
-- Objectif : Stocker les 10 derniers messages par chat pour le contexte IA
-- ==========================================

CREATE TABLE IF NOT EXISTS public.telegram_conversation_history (
  id          bigserial PRIMARY KEY,
  chat_id     text NOT NULL,                  -- ID Telegram de la conversation
  role        text NOT NULL CHECK (role IN ('user', 'model')),  -- Qui a parlé
  content     text NOT NULL,                  -- Le contenu du message
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Index pour recuperer rapidement l'historique d'une conversation
CREATE INDEX IF NOT EXISTS idx_telegram_history_chat_id 
  ON public.telegram_conversation_history (chat_id, created_at DESC);

-- RLS : Désactivé car ce service n'est utilisé que par le bot côté serveur (service role)
ALTER TABLE public.telegram_conversation_history DISABLE ROW LEVEL SECURITY;

-- Fonction qui purge automatiquement les messages les plus anciens
-- et ne garde que les 10 derniers par conversation
CREATE OR REPLACE FUNCTION public.trim_telegram_history()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM public.telegram_conversation_history
  WHERE chat_id = NEW.chat_id
    AND id NOT IN (
      SELECT id FROM public.telegram_conversation_history
      WHERE chat_id = NEW.chat_id
      ORDER BY created_at DESC
      LIMIT 10
    );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_trim_telegram_history
  AFTER INSERT ON public.telegram_conversation_history
  FOR EACH ROW EXECUTE FUNCTION public.trim_telegram_history();
