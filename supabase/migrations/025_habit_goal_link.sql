ALTER TABLE public.habits ADD COLUMN linked_goal_id UUID REFERENCES public.goals(id) ON DELETE SET NULL;
