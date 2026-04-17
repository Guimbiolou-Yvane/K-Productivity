import { supabase } from "@/lib/supabase/client";
import { Message, Conversation } from "@/lib/models/message";
import { sendPushNotification } from "@/lib/utils/pushNotification";
import { friendService } from "./friendService";
import { sharedHabitService } from "./sharedHabitService";

export const chatService = {
  /**
   * Envoyer un message (à un utilisateur OU à un groupe)
   */
  async sendMessage(content: string, options: { receiverId?: string; groupId?: string }): Promise<Message> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Non connecté");

    if (!options.receiverId && !options.groupId) {
      throw new Error("Il faut spécifier un destinataire (ami ou groupe).");
    }

    const { data, error } = await supabase
      .from("messages")
      .insert({
        content,
        sender_id: user.id,
        receiver_id: options.receiverId || null,
        group_id: options.groupId || null,
      })
      .select("*, sender:profiles!messages_sender_id_fkey(*)")
      .single();

    if (error) throw error;

    // 🔔 Envoyer une Push Notification (optionnel mais très utile)
    try {
      const myName = data.sender?.username || "Quelqu'un";
      if (options.receiverId) {
        sendPushNotification(
          options.receiverId,
          `Nouveau message de ${myName}`,
          content.length > 50 ? content.substring(0, 50) + "..." : content
        );
      } else if (options.groupId) {
        // Obtenir les membres du groupe
        const { data: members } = await supabase
          .from("shared_group_members")
          .select("user_id")
          .eq("group_id", options.groupId)
          .neq("user_id", user.id);
        
        if (members) {
          for (const m of members) {
            sendPushNotification(
              m.user_id,
              `💬 Message dans le groupe`,
              `${myName}: ${content}`
            );
          }
        }
      }
    } catch (e) {
      console.error("Erreur d'envoi de notification de message", e);
    }

    return data as Message;
  },

  /**
   * Récupérer les messages directs avec un ami spécifique
   */
  async getDirectMessages(friendId: string): Promise<Message[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from("messages")
      .select("*, sender:profiles!messages_sender_id_fkey(*)")
      .or(`and(sender_id.eq.${user.id},receiver_id.eq.${friendId}),and(sender_id.eq.${friendId},receiver_id.eq.${user.id})`)
      .order("created_at", { ascending: true });

    if (error) throw error;
    return data as Message[];
  },

  /**
   * Récupérer les messages d'un groupe
   */
  async getGroupMessages(groupId: string): Promise<Message[]> {
    const { data, error } = await supabase
      .from("messages")
      .select("*, sender:profiles!messages_sender_id_fkey(*)")
      .eq("group_id", groupId)
      .order("created_at", { ascending: true });

    if (error) throw error;
    return data as Message[];
  },

  /**
   * Marquer les messages privés comme lus
   */
  async markDirectMessagesAsRead(friendId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from("messages")
      .update({ is_read: true })
      .eq("sender_id", friendId)
      .eq("receiver_id", user.id)
      .eq("is_read", false);

    if (error) throw error;
  },

  /**
   * Récupère le nombre total de messages non lus
   */
  async getUnreadMessagesCount(): Promise<number> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return 0;

    const { count, error } = await supabase
      .from("messages")
      .select("*", { count: "exact", head: true })
      .eq("receiver_id", user.id)
      .eq("is_read", false);

    if (error) {
      console.error(error);
      return 0;
    }
    return count || 0;
  },

  // Supprimer un ou plusieurs messages
  async deleteMessages(messageIds: string[]) {
    const { error } = await supabase.from("messages").delete().in("id", messageIds);
    if (error) throw error;
  },

  // Supprimer toute une conversation
  async deleteConversation(convId: string, isGroup: boolean, currentUserId: string) {
    if (isGroup) {
      // Dans un groupe, on supprime au moins SES messages
      const { error } = await supabase.from("messages").delete()
        .eq("group_id", convId)
        .eq("sender_id", currentUserId);
      if (error) throw error;
    } else {
      // En privé, on supprime tout l'échange
      const { error } = await supabase.from("messages").delete()
        .or(`and(sender_id.eq.${currentUserId},receiver_id.eq.${convId}),and(sender_id.eq.${convId},receiver_id.eq.${currentUserId})`);
      if (error) throw error;
    }
  },

  /**
   * Récupérer la liste complète des conversations (Amis + Groupes)
   * pour la Sidebar des messages. Version très optimisée.
   */
  async getConversations(): Promise<Conversation[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    // Lancer toutes les requêtes coûteuses en parallèle !
    const [friends, groupsRaw, { data: privateMsgs }, { data: groupMsgs }] = await Promise.all([
      friendService.getFriends(),
      sharedHabitService.fetchUserGroups(),
      supabase
        .from("messages")
        .select("*")
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order("created_at", { ascending: false }),
      supabase
        .from("messages")
        .select("*")
        .not("group_id", "is", null)
        .order("created_at", { ascending: false })
    ]);

    const conversations: Conversation[] = [];
    const privates = privateMsgs || [];
    const groupsMsgs = groupMsgs || [];

    // 1. Amis (Direct Messages)
    for (const friend of friends) {
      // Filtrer les messages en mémoire (ultra-rapide)
      const friendMsgs = privates.filter(
        (m) => m.sender_id === friend.id || m.receiver_id === friend.id
      );

      const unreadCount = friendMsgs.filter(
        (m) => m.sender_id === friend.id && m.receiver_id === user.id && !m.is_read
      ).length;

      conversations.push({
        id: friend.id,
        type: "direct",
        name: friend.username,
        avatarUrl: friend.avatar_url,
        lastMessage: friendMsgs.length > 0 ? friendMsgs[0] : null,
        unreadCount,
        messages: friendMsgs,
      });
    }

    // 2. Groupes
    for (const { group } of groupsRaw) {
      const gMsgs = groupsMsgs.filter((m) => m.group_id === group.id);

      conversations.push({
        id: group.id,
        type: "group",
        name: group.name,
        avatarUrl: null,
        lastMessage: gMsgs.length > 0 ? gMsgs[0] : null,
        unreadCount: 0,
        messages: gMsgs,
      });
    }

    // Trier par date du dernier message (les plus récents en premier)
    conversations.sort((a, b) => {
      const dateA = a.lastMessage ? new Date(a.lastMessage.created_at).getTime() : 0;
      const dateB = b.lastMessage ? new Date(b.lastMessage.created_at).getTime() : 0;
      return dateB - dateA;
    });

    return conversations;
  },

  /**
   * S'abonner aux nouveaux messages via Realtime
   */
  subscribeToMessages(callback: () => void) {
    const channel = supabase
      .channel("public-messages-changes")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        () => {
          callback();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }
};
