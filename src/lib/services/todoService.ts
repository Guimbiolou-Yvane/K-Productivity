import { Todo } from "@/lib/models/todo";
import { supabase } from "@/lib/supabase/client";
import { offlineCache } from "@/lib/offlineCache";

export const todoService = {
  // Fetch only active to-dos (created within the last 24 hours)
  async fetchTodos(userId?: string): Promise<Todo[]> {
    const {
      data: { user },
    } = await supabase.auth.getSession().then(res => ({ data: { user: res.data.session?.user || null }, error: res.error }));
    if (!user && !userId) return [];
    const targetUserId = userId || user?.id;

    const cacheKey = `todos_${targetUserId}`;
    return offlineCache.withFallback(cacheKey, async () => {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

      const { data, error } = await supabase
        .from("todos")
        .select("*")
        .eq("user_id", targetUserId)
        .gte("created_at", yesterday)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data || [];
    }, 30 * 60 * 1000); // 30 min de cache pour les todos
  },

  // Add a new To-Do item
  async addTodo(title: string, time?: string): Promise<Todo> {
    const {
      data: { user },
    } = await supabase.auth.getSession().then(res => ({ data: { user: res.data.session?.user || null }, error: res.error }));
    if (!user) throw new Error("User not authenticated");

    const insertData: { title: string; user_id: string; time?: string } = {
      title,
      user_id: user.id,
    };
    if (time) insertData.time = time;

    const { data, error } = await supabase
      .from("todos")
      .insert(insertData)
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

  // Update To-Do details
  async updateTodo(id: string, title: string, time?: string): Promise<boolean> {
    const updateData: { title: string; time?: string | null } = { title };
    if (time) {
      updateData.time = time;
    } else {
      updateData.time = null;
    }

    const { error } = await supabase
      .from("todos")
      .update(updateData)
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
