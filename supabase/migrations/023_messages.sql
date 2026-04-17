-- ==========================================
-- MIGRATION : Système de Messages (Chat)
-- Date : 2026-04-03
-- ==========================================

-- Création de la table des messages
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    receiver_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    group_id UUID REFERENCES public.shared_groups(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Un message doit être envoyé SOIT à un utilisateur, SOIT à un groupe, pas les deux.
    CONSTRAINT message_destination_check CHECK (
        (receiver_id IS NOT NULL AND group_id IS NULL) OR 
        (receiver_id IS NULL AND group_id IS NOT NULL)
    )
);

-- Index pour la performance des requêtes (très important pour les chats)
CREATE INDEX IF NOT EXISTS idx_messages_sender ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver ON public.messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_group ON public.messages(group_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at);

-- Activer RLS
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- POLITIQUE : LECTURE
-- Un utilisateur peut lire un message si :
-- 1. Il est l'expéditeur
-- 2. Il est le destinataire
-- 3. Le message est dans un groupe auquel il appartient
CREATE POLICY "Les utilisateurs peuvent lire leurs messages"
    ON public.messages FOR SELECT
    USING (
        auth.uid() = sender_id OR 
        auth.uid() = receiver_id OR 
        (group_id IS NOT NULL AND auth.uid() IN (
            SELECT user_id FROM public.shared_group_members 
            WHERE shared_group_members.group_id = messages.group_id 
        ))
    );

-- POLITIQUE : INSERTION
-- Un utilisateur ne peut envoyer un message qu'en son propre nom
CREATE POLICY "Les utilisateurs peuvent envoyer des messages"
    ON public.messages FOR INSERT
    WITH CHECK (auth.uid() = sender_id);

-- POLITIQUE : MISE À JOUR (pour passer en "lu")
-- Seul le destinataire peut marquer un message privé comme lu
CREATE POLICY "Seul le destinataire peut marquer comme lu"
    ON public.messages FOR UPDATE
    USING (auth.uid() = receiver_id)
    WITH CHECK (auth.uid() = receiver_id);

-- ==========================================
-- Temps Réel (Realtime)
-- Autoriser la table messages à émettre des événements Realtime
-- ==========================================
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
