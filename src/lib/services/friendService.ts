import { supabase } from "@/lib/supabase/client";
import { UserProfile } from "@/lib/models/user";
import { sendPushNotification } from "@/lib/utils/pushNotification";

export const friendService = {
  // ==========================================
  // RECHERCHE D'UTILISATEURS
  // ==========================================

  /**
   * Rechercher des utilisateurs par username (recherche partielle, insensible à la casse).
   * Inclut tous les utilisateurs, y compris l'utilisateur connecté.
   */
  async searchByUsername(query: string): Promise<UserProfile[]> {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .ilike("username", `%${query}%`)
      .limit(10);

    if (error) throw error;
    return (data || []) as UserProfile[];
  },

  // ==========================================
  // RÉCUPÉRATION D'UN PROFIL PAR ID
  // ==========================================

  /**
   * Récupérer le profil public d'un utilisateur par son UUID.
   */
  async getProfileById(userId: string): Promise<UserProfile | null> {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null; // Not found
      throw error;
    }
    return data as UserProfile;
  },

  // ==========================================
  // SYSTÈME D'AMITIÉ
  // ==========================================

  /**
   * Vérifier le statut de la relation avec un autre utilisateur
   */
  async checkFriendshipStatus(targetUserId: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from("friendships")
      .select("*")
      .or(`and(user_id.eq.${user.id},friend_id.eq.${targetUserId}),and(user_id.eq.${targetUserId},friend_id.eq.${user.id})`)
      .single();

    if (error && error.code !== "PGRST116") throw error; // Ignorer l'erreur non trouvé
    return data;
  },

  /**
   * Envoyer une demande d'ami
   */
  async sendFriendRequest(targetUserId: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Non connecté");

    // Vérifier si une demande n'existe pas déjà
    const existing = await this.checkFriendshipStatus(targetUserId);
    if (existing) {
      throw new Error("Une relation existe déjà avec cet utilisateur.");
    }

    const { data, error } = await supabase
      .from("friendships")
      .insert({
        user_id: user.id,
        friend_id: targetUserId,
        status: "pending"
      })
      .select()
      .single();

    if (error) throw error;

    // 🔔 Notifier la personne qu'elle a reçu une demande d'ami
    try {
      const { data: myProfile } = await supabase.from("profiles").select("username").eq("id", user.id).single();
      const myName = myProfile?.username || "Quelqu'un";
      sendPushNotification(
        targetUserId,
        "👋 Nouvelle demande d'ami !",
        `${myName} veut devenir ton ami. Accepte la demande !`
      );
    } catch {}

    return data;
  },

  /**
   * Accepter une demande d'ami entrante
   */
  async acceptFriendRequest(requestId: string) {
    const { data: { user } } = await supabase.auth.getUser();

    // Récupérer l'info de la demande avant de la modifier
    const { data: friendshipData } = await supabase
      .from("friendships")
      .select("user_id")
      .eq("id", requestId)
      .single();

    const { error } = await supabase
      .from("friendships")
      .update({ status: "accepted", updated_at: new Date().toISOString() })
      .eq("id", requestId);

    if (error) throw error;

    // 🔔 Notifier l'envoyeur que sa demande a été acceptée
    try {
      if (friendshipData && user) {
        const { data: myProfile } = await supabase.from("profiles").select("username").eq("id", user.id).single();
        const myName = myProfile?.username || "Quelqu'un";
        sendPushNotification(
          friendshipData.user_id,
          "🎉 Demande acceptée !",
          `${myName} a accepté ta demande d'ami. Vous êtes maintenant amis !`
        );
      }
    } catch {}
  },

  /**
   * Refuser ou annuler une demande d'ami
   */
  async rejectFriendRequest(requestId: string) {
    const { error } = await supabase
      .from("friendships")
      .delete()
      .eq("id", requestId);

    if (error) throw error;
  },

  /**
   * Supprimer un ami
   */
  async removeFriend(friendId: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Non connecté");

    const { error } = await supabase
      .from("friendships")
      .delete()
      .or(`and(user_id.eq.${user.id},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${user.id})`);

    if (error) throw error;
  },

  /**
   * Récupérer les demandes d'ami en attente reçues par l'utilisateur connecté
   */
  async getPendingRequests() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from("friendships")
      .select(`
        id,
        created_at,
        profiles!friendships_user_id_fkey(*)
      `)
      .eq("friend_id", user.id)
      .eq("status", "pending");

    if (error) throw error;
    
    return data.map((d: any) => ({
      id: d.id,
      created_at: d.created_at,
      from: d.profiles
    }));
  },

  /**
   * Récupérer tous les amis confirmés
   */
  async getFriends(): Promise<UserProfile[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from("friendships")
      .select(`
        id,
        user_id,
        friend_id,
        users:profiles!friendships_user_id_fkey(*),
        friends:profiles!friendships_friend_id_fkey(*)
      `)
      .eq("status", "accepted")
      .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`);

    if (error) throw error;

    // Récupérer le bon profil (celui de l'ami, pas le vôtre)
    return data.map((d: any) => {
      if (d.user_id === user.id) return d.friends;
      return d.users;
    }) as UserProfile[];
  }
};
