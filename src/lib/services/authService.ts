import { supabase } from "@/lib/supabase/client";
import { UserProfile } from "@/lib/models/user";
import type { Provider } from "@supabase/supabase-js";

export const authService = {
  // ==========================================
  // INSCRIPTION
  // ==========================================

  /**
   * Inscription classique avec email et mot de passe.
   * Le trigger SQL `handle_new_user` créera automatiquement le profil dans `profiles`.
   */
  async signUpWithEmail(email: string, password: string, username: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username, // Sera récupéré par le trigger via raw_user_meta_data->>'username'
        },
      },
    });

    if (error) throw error;
    return data;
  },

  // ==========================================
  // CONNEXION
  // ==========================================

  /**
   * Connexion classique avec email et mot de passe.
   */
  async signInWithEmail(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    return data;
  },

  /**
   * Connexion via un provider OAuth (Google, Facebook, Github, etc.)
   * Redirige l'utilisateur vers la page de connexion du provider.
   */
  async signInWithOAuth(provider: Provider) {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) throw error;
    return data;
  },

  // ==========================================
  // DÉCONNEXION
  // ==========================================

  /**
   * Déconnexion de l'utilisateur. Supprime la session et les cookies.
   */
  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  // ==========================================
  // SESSION & UTILISATEUR
  // ==========================================

  /**
   * Récupérer l'utilisateur actuellement connecté (depuis Supabase Auth).
   * Retourne `null` si aucun utilisateur n'est connecté.
   */
  async getUser() {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    if (error) throw error;
    return user;
  },

  /**
   * Récupérer la session active (token, expiration, etc.)
   */
  async getSession() {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();
    if (error) throw error;
    return session;
  },

  // ==========================================
  // PROFIL UTILISATEUR (Table `profiles`)
  // ==========================================

  /**
   * Récupérer le profil complet de l'utilisateur connecté depuis la table `profiles`.
   */
  async getProfile(): Promise<UserProfile | null> {
    const user = await this.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (error) throw error;
    return data as UserProfile;
  },

  /**
   * Mettre à jour le profil de l'utilisateur connecté.
   * Seuls les champs passés seront modifiés (Partial Update).
   */
  async updateProfile(
    updates: Partial<Omit<UserProfile, "id" | "email" | "created_at">>,
  ) {
    const user = await this.getUser();
    if (!user) throw new Error("Aucun utilisateur connecté");

    const { data, error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", user.id)
      .select()
      .single();

    if (error) throw error;
    return data as UserProfile;
  },

  // ==========================================
  // MOT DE PASSE
  // ==========================================

  /**
   * Envoyer un email de réinitialisation de mot de passe.
   */
  async resetPassword(email: string) {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });

    if (error) throw error;
    return data;
  },

  /**
   * Mettre à jour le mot de passe (après réinitialisation ou depuis le profil).
   */
  async updatePassword(newPassword: string) {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) throw error;
    return data;
  },

  // ==========================================
  // LISTENERS (Écoute en temps réel)
  // ==========================================

  /**
   * Écouter les changements d'état d'authentification.
   * Utile pour mettre à jour l'UI en temps réel (connexion, déconnexion, expiration).
   */
  onAuthStateChange(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange(callback);
  },
};
