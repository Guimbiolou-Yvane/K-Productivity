-- ==========================================
-- MIGRATION : Objectifs Partagés (Groupes)
-- Date : 2026-03-11 (v3 - fix recursion)
-- ==========================================

-- 1. Table des groupes de partage
CREATE TABLE shared_groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    creator_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 2. Table des membres d'un groupe
CREATE TABLE shared_group_members (
    group_id UUID NOT NULL REFERENCES shared_groups(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    PRIMARY KEY(group_id, user_id)
);

-- 3. Table des habitudes partagées
CREATE TABLE shared_habits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID NOT NULL REFERENCES shared_groups(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    category habit_category NOT NULL,
    frequency TEXT[] NOT NULL DEFAULT '{}',
    color TEXT,
    icon TEXT,
    time TEXT,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    target_month VARCHAR(7) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 4. Table des validations
CREATE TABLE shared_habit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shared_habit_id UUID NOT NULL REFERENCES shared_habits(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    completed_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    UNIQUE(shared_habit_id, user_id, completed_date)
);

-- ==========================================
-- FONCTION HELPER (SECURITY DEFINER)
-- Contourne le RLS pour éviter la récursion infinie
-- quand une policy sur shared_group_members
-- doit lire shared_group_members elle-même.
-- ==========================================
CREATE OR REPLACE FUNCTION is_member_of_group(p_group_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.shared_group_members
    WHERE group_id = p_group_id AND user_id = auth.uid()
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ==========================================
-- RLS
-- ==========================================
ALTER TABLE shared_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_habit_logs ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- Politiques pour shared_groups
-- ==========================================
CREATE POLICY "select_shared_groups"
    ON shared_groups FOR SELECT
    USING (
        auth.uid() = creator_id
        OR is_member_of_group(id)
    );

CREATE POLICY "insert_shared_groups"
    ON shared_groups FOR INSERT WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "delete_shared_groups"
    ON shared_groups FOR DELETE USING (auth.uid() = creator_id);

-- ==========================================
-- Politiques pour shared_group_members
-- ==========================================

-- SELECT : un utilisateur voit les membres des groupes dont il fait partie
-- On utilise is_member_of_group() pour éviter la récursion
CREATE POLICY "select_shared_group_members"
    ON shared_group_members FOR SELECT
    USING ( is_member_of_group(group_id) );

-- INSERT : le créateur du groupe peut ajouter des membres
CREATE POLICY "insert_shared_group_members"
    ON shared_group_members FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM shared_groups
            WHERE shared_groups.id = group_id
            AND shared_groups.creator_id = auth.uid()
        )
    );

-- DELETE : un membre peut se retirer ou le créateur peut retirer quelqu'un
CREATE POLICY "delete_shared_group_members"
    ON shared_group_members FOR DELETE USING (
        auth.uid() = user_id OR
        EXISTS (
            SELECT 1 FROM shared_groups WHERE id = group_id AND creator_id = auth.uid()
        )
    );

-- ==========================================
-- Politiques pour shared_habits
-- ==========================================
CREATE POLICY "select_shared_habits"
    ON shared_habits FOR SELECT
    USING ( is_member_of_group(group_id) );

CREATE POLICY "insert_shared_habits"
    ON shared_habits FOR INSERT WITH CHECK (
        is_member_of_group(group_id) AND auth.uid() = created_by
    );

CREATE POLICY "delete_shared_habits"
    ON shared_habits FOR DELETE USING ( is_member_of_group(group_id) );

CREATE POLICY "update_shared_habits"
    ON shared_habits FOR UPDATE USING ( is_member_of_group(group_id) );

-- ==========================================
-- Politiques pour shared_habit_logs
-- ==========================================
CREATE POLICY "select_shared_habit_logs"
    ON shared_habit_logs FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM shared_habits sh
            WHERE sh.id = shared_habit_logs.shared_habit_id
            AND is_member_of_group(sh.group_id)
        )
    );

CREATE POLICY "insert_shared_habit_logs"
    ON shared_habit_logs FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "delete_shared_habit_logs"
    ON shared_habit_logs FOR DELETE USING (auth.uid() = user_id);
