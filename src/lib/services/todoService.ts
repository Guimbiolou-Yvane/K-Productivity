import { Todo } from "@/lib/models/todo";
import { supabase } from "@/lib/supabase/client";

export const todoService = {
  // Fetch only active to-dos (created within the last 24 hours)
  async fetchTodos(userId?: string): Promise<Todo[]> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user && !userId) return [];

    const targetUserId = userId || user?.id;

    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from("todos")
      .select("*")
      .eq("user_id", targetUserId)
      .gte("created_at", yesterday) // Extra filter on frontend side for robustness
      .order("created_at", { ascending: true });

    if (error) throw error;
    return data || [];
  },

  // Add a new To-Do item
  async addTodo(title: string): Promise<Todo> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const { data, error } = await supabase
      .from("todos")
      .insert({ title, user_id: user.id })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Update completion status
  async toggleTodo(id: string, is_completed: boolean): Promise<boolean> {
    const { error } = await supabase
      .from("todos")
      .update({ is_completed })
      .eq("id", id);

    if (error) throw error;
    return true;
  },

  // Delete a To-Do manually
  async deleteTodo(id: string): Promise<boolean> {
    const { error } = await supabase.from("todos").delete().eq("id", id);

    if (error) throw error;
    return true;
  },
};
