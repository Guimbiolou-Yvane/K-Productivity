import { Goal, GoalCategory, GoalDuration } from "@/lib/models/goal";
import { supabase } from "@/lib/supabase/client";

export const goalService = {
  async fetchGoals(userId?: string): Promise<Goal[]> {
    const {
      data: { user },
    } = await supabase.auth.getSession().then(res => ({ data: { user: res.data.session?.user || null }, error: res.error }));
    if (!user && !userId) return [];

    const targetUserId = userId || user?.id;

    const { data, error } = await supabase
      .from("goals")
      .select("*")
      .eq("user_id", targetUserId)
      .order("is_completed", { ascending: true })
      .order("target_date", { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async addGoal(
    title: string,
    category: GoalCategory,
    icon: string,
    color: string,
    duration: GoalDuration,
    startDate: string,
    targetDate: string,
    description?: string,
  ): Promise<Goal> {
    const {
      data: { user },
    } = await supabase.auth.getSession().then(res => ({ data: { user: res.data.session?.user || null }, error: res.error }));
    if (!user) throw new Error("User not authenticated");

    const { data, error } = await supabase
      .from("goals")
      .insert({
        user_id: user.id,
        title,
        category,
        icon,
        color,
        duration,
        start_date: startDate,
        target_date: targetDate,
        description: description || null,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateGoal(
    goalId: string,
    title: string,
    category: GoalCategory,
    icon: string,
    color: string,
    duration: GoalDuration,
    startDate: string,
    targetDate: string,
    description?: string,
  ): Promise<Goal> {
    const { data, error } = await supabase
      .from("goals")
      .update({
        title,
        category,
        icon,
        color,
        duration,
        start_date: startDate,
        target_date: targetDate,
        description: description || null,
      })
      .eq("id", goalId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async toggleGoal(goalId: string, isCompleted: boolean): Promise<void> {
    const { error } = await supabase
      .from("goals")
      .update({
        is_completed: isCompleted,
        completed_at: isCompleted ? new Date().toISOString() : null,
      })
      .eq("id", goalId);

    if (error) throw error;
  },

  async deleteGoal(goalId: string): Promise<void> {
    const { error } = await supabase
      .from("goals")
      .delete()
      .eq("id", goalId);

    if (error) throw error;
  },
};
