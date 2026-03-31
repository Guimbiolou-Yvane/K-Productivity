import { supabase } from "@/lib/supabase/client";

export interface AppNotification {
  id: string;
  user_id: string;
  type: "friend_request" | "group_invite" | "habit_completed" | "reminder" | "info";
  title: string;
  body: string;
  link?: string;
  is_read: boolean;
  created_at: string;
}

export const notificationService = {
  /**
   * Récupère toutes les notifications de l'utilisateur, ordre antéchronologique
   */
  async getNotifications(): Promise<AppNotification[]> {
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw error;
    return data as AppNotification[];
  },

  /**
   * Nombre de notifications non lues
   */
  async getUnreadCount(): Promise<number> {
    const { count, error } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("is_read", false);
    if (error) return 0;
    return count ?? 0;
  },

  /**
   * Marquer une notification comme lue
   */
  async markAsRead(notifId: string): Promise<void> {
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", notifId);
  },

  /**
   * Marquer toutes les notifications comme lues
   */
  async markAllAsRead(): Promise<void> {
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("is_read", false);
  },

  /**
   * Supprimer une notification
   */
  async deleteNotification(notifId: string): Promise<void> {
    await supabase.from("notifications").delete().eq("id", notifId);
  },

  /**
   * Supprimer toutes les notifications
   */
  async clearAll(): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("notifications").delete().eq("user_id", user.id);
  },

  /**
   * Souscrire aux nouvelles notifications en temps réel
   */
  subscribe(userId: string, onNew: (notif: AppNotification) => void) {
    return supabase
      .channel("notifications-" + userId)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
        (payload) => onNew(payload.new as AppNotification)
      )
      .subscribe();
  },
};
