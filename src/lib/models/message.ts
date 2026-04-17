import { UserProfile } from "./user";

export interface Message {
  id: string;
  sender_id: string;
  receiver_id?: string | null;
  group_id?: string | null;
  content: string;
  is_read: boolean;
  created_at: string;
  sender?: UserProfile; // Associé lors du fetch
}

export type ConversationType = "direct" | "group";

export interface Conversation {
  id: string; // L'ID cible : ID de l'ami (pour "direct") ou ID du groupe (pour "group")
  type: ConversationType;
  name: string; // Nom de l'ami ou du groupe
  avatarUrl?: string | null;
  lastMessage?: Message | null;
  unreadCount: number;
  messages?: Message[]; // Historique pour recherche locale
}
