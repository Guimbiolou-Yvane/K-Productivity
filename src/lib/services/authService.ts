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
    } = await supabase.auth.getSession().then(res => ({ data: { user: res.data.session?.user || null }, error: res.error }));
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

  /**
   * Récupérer le complet de l'utilisateur. Retourne le fallback en mode hors-ligne.
   */
  async getProfile(): Promise<UserProfile | null> {
    const user = await this.getUser().catch(() => null);
    if (!user) return null;

    const cacheKey = `profile_${user.id}`;

    // On importe dynamiquement pour éviter un top-level import complexe si besoin, mais standard c'est en haut.
    const { offlineCache } = await import("@/lib/offlineCache");

    return offlineCache.withFallback(cacheKey, async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) throw error;
      return data as UserProfile;
    });
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

  /**
   * Uploader une photo de profil dans Supabase Storage et mettre à jour le profil.
   */
  async uploadAvatar(file: File): Promise<string> {
    const user = await this.getUser();
    if (!user) throw new Error("Aucun utilisateur connecté");

    const ext = file.name.split(".").pop();
    const fileName = `${user.id}.${ext}`;
    const filePath = `avatars/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, file, { upsert: true, contentType: file.type });

    if (uploadError) throw uploadError;

    const { data: urlData } = supabase.storage
      .from("avatars")
      .getPublicUrl(filePath);

    const publicUrl = urlData.publicUrl + `?t=${Date.now()}`;

    await this.updateProfile({ avatar_url: publicUrl });

    return publicUrl;
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
