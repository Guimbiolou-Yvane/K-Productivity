-- Ajouter la politique de suppression des messages
CREATE POLICY "Les utilisateurs peuvent supprimer des messages"
    ON public.messages FOR DELETE
    USING (
        auth.uid() = sender_id OR 
        (receiver_id IS NOT NULL AND auth.uid() = receiver_id)
    );
