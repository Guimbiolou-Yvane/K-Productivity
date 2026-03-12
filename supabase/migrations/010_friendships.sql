-- ==========================================
-- MIGRATION : Système d'amis
-- ==========================================

-- 1. Extension UUID (au cas où elle ne serait pas activée)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Fonction utilitaire pour mettre à jour la date (updated_at) automatiquement
CREATE OR REPLACE FUNCTION public.update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

-- 3. Création de la table avec IF NOT EXISTS
CREATE TABLE IF NOT EXISTS public.friendships (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    friend_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('pending', 'accepted')) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    CONSTRAINT prevent_self_friendship CHECK (user_id != friend_id),
    CONSTRAINT unique_friendship UNIQUE (user_id, friend_id)
);

-- 4. Activer RLS (Row Level Security)
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;

-- 5. Création des index de performances
CREATE INDEX IF NOT EXISTS friendships_user_id_idx ON public.friendships(user_id);
CREATE INDEX IF NOT EXISTS friendships_friend_id_idx ON public.friendships(friend_id);

-- 6. Suppression et recréation des Policies (Pour pouvoir rejouer le script sans erreur)
DROP POLICY IF EXISTS "Users can read their own friendships" ON public.friendships;
DROP POLICY IF EXISTS "Users can insert friendships where they are the sender" ON public.friendships;
DROP POLICY IF EXISTS "Users can update friendships where they are the recipient" ON public.friendships;
DROP POLICY IF EXISTS "Users can delete their friendships" ON public.friendships;

-- Lecture automatique des amitiés de l'utilisateur actif
CREATE POLICY "Users can read their own friendships" 
ON public.friendships 
FOR SELECT 
USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- L'utilisateur s'ajoute en tant qu'expéditeur d'une demande
CREATE POLICY "Users can insert friendships where they are the sender" 
ON public.friendships 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Le destinataire peut accepter la demande (mettre le statut à 'accepted')
CREATE POLICY "Users can update friendships where they are the recipient" 
ON public.friendships 
FOR UPDATE 
USING (auth.uid() = friend_id);

-- Annuler/Refuser ou supprimer une amitié
CREATE POLICY "Users can delete their friendships" 
ON public.friendships 
FOR DELETE 
USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- 7. Affecter le Trigger à la table
DROP TRIGGER IF EXISTS update_friendships_updated_at ON public.friendships;
CREATE TRIGGER update_friendships_updated_at
BEFORE UPDATE ON public.friendships
FOR EACH ROW
EXECUTE FUNCTION public.update_modified_column();
