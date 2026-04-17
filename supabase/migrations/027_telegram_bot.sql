-- ==========================================
-- MIGRATION : Intégration Telegram Bot
-- Objectif : Associer le chat_id Telegram au profil utilisateur
-- ==========================================

ALTER TABLE public.profiles
ADD COLUMN telegram_chat_id text UNIQUE;
