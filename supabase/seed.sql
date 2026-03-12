-- ==========================================
-- SCRIPT DE PEUPLEMENT (SEED) POUR LE MOIS COURANT
-- ==========================================
-- Ce script va prendre le premier utilisateur de votre base de données,
-- lui créer 3 habitudes et simuler des actions sur les derniers jours.
-- Vous pouvez copier/coller ceci dans le "SQL Editor" de Supabase et cliquer sur "Run".
-- ==========================================

DO $$
DECLARE
    target_user_id UUID;
    habit1_id UUID := uuid_generate_v4();
    habit2_id UUID := uuid_generate_v4();
    habit3_id UUID := uuid_generate_v4();
    current_month VARCHAR := to_char(CURRENT_DATE, 'YYYY-MM');
BEGIN
    -- 1. Récupération de l'utilisateur cible (Prend le premier profil dispo)
    -- Remplacer "SELECT id INTO target_user_id FROM public.profiles LIMIT 1;" 
    -- par "target_user_id := 'VOTRE-UUID-ICI';" si vous voulez viser un user précis.
    SELECT id INTO target_user_id FROM public.profiles LIMIT 1;
    
    IF target_user_id IS NULL THEN
        RAISE EXCEPTION 'ERREUR : Aucun profil utilisateur trouvé. Vous devez d''abord créer un compte via l''interface de connexion.';
    END IF;

    -- 2. Nettoyage (Optionnel)
    -- Décommentez les 3 lignes suivantes si vous voulez effacer toutes  
    -- les anciennes données de cet utilisateur avant de repeupler :
    -- DELETE FROM public.todos WHERE user_id = target_user_id;
    -- DELETE FROM public.habit_logs WHERE user_id = target_user_id;
    -- DELETE FROM public.habits WHERE user_id = target_user_id;

    -- 3. Création de 3 Objectifs (Habitudes)
    INSERT INTO public.habits (id, user_id, name, category, frequency, color, icon, time, target_month, created_at)
    VALUES 
        (habit1_id, target_user_id, 'ALLER À LA SALLE', 'SANTÉ', '{"Lun","Mar","Jeu","Ven"}', '#FFEB3B', '🏋️', '18:00', current_month, NOW() - INTERVAL '10 DAYS'),
        (habit2_id, target_user_id, 'LIRE 20 PAGES', 'DÉV. PERSO', '{"Lun","Mar","Mer","Jeu","Ven","Sam","Dim"}', '#4CAF50', '📚', NULL, current_month, NOW() - INTERVAL '10 DAYS'),
        (habit3_id, target_user_id, 'CODER SUR KARISMA', 'TRAVAIL', '{"Lun","Mar","Mer","Jeu","Ven"}', '#000000', '💻', '09:00', current_month, NOW() - INTERVAL '10 DAYS');

    -- 4. Simulation d'historique (Logs) pour générer des statistiques
    -- Pour l'habitude 1 (Salle de sport) - 2 logs
    INSERT INTO public.habit_logs (habit_id, user_id, completed_date, created_at)
    VALUES 
        (habit1_id, target_user_id, CURRENT_DATE - 1, NOW()),
        (habit1_id, target_user_id, CURRENT_DATE - 3, NOW());

    -- Pour l'habitude 2 (Lecture) - Une belle "Streak" de 4 jours !
    INSERT INTO public.habit_logs (habit_id, user_id, completed_date, created_at)
    VALUES 
        (habit2_id, target_user_id, CURRENT_DATE, NOW()),
        (habit2_id, target_user_id, CURRENT_DATE - 1, NOW()),
        (habit2_id, target_user_id, CURRENT_DATE - 2, NOW()),
        (habit2_id, target_user_id, CURRENT_DATE - 3, NOW());

    -- Pour l'habitude 3 (Code)
    INSERT INTO public.habit_logs (habit_id, user_id, completed_date, created_at)
    VALUES 
        (habit3_id, target_user_id, CURRENT_DATE, NOW()),
        (habit3_id, target_user_id, CURRENT_DATE - 2, NOW());

    -- 5. Création d'objectifs temporaires (Brouillon 24h)
    INSERT INTO public.todos (user_id, title, is_completed, created_at)
    VALUES 
        (target_user_id, 'Sortir les poubelles', false, NOW()),
        (target_user_id, 'Appeler le comptable', true, NOW()),
        (target_user_id, 'Acheter du lait d''avoine', false, NOW());

END $$;
