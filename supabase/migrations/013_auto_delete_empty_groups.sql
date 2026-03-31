-- ==========================================
-- MIGRATION : Suppression automatique des groupes avec < 2 membres
-- ==========================================

CREATE OR REPLACE FUNCTION public.check_group_members_count() 
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    -- Si le nombre de membres restants pour ce groupe est strictement inférieur à 2
    IF (SELECT count(*) FROM public.shared_group_members WHERE group_id = OLD.group_id) < 2 THEN
      -- On supprime le groupe. Les clés étrangères (ON DELETE CASCADE) nettoieront les membres restants et les habitudes.
      DELETE FROM public.shared_groups WHERE id = OLD.group_id;
    END IF;
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Affectation du trigger
DROP TRIGGER IF EXISTS cleanup_empty_shared_groups ON public.shared_group_members;
CREATE TRIGGER cleanup_empty_shared_groups
AFTER DELETE ON public.shared_group_members
FOR EACH ROW
EXECUTE FUNCTION public.check_group_members_count();
