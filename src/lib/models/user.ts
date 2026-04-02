export interface UserProfile {
  id: string; // UUID venant de Supabase Auth
  email: string;
  first_name?: string; // Prénom (optionnel)
  last_name?: string; // Nom (optionnel)
  username: string; // Pseudo affiché
  avatar_url?: string; // Lien vers l'image de profil (optionnel)
  bio?: string;         // Biographie (affichée en couverture)
  profile_widgets?: string[]; // Widgets affichés sur le profil
  timezone?: string; // Fuseau horaire IANA (ex: "Europe/Paris", "Africa/Douala")

  // === STATISTIQUES GLOBALES ===
  longest_streak: number; // Record absolu (Stocké ici pour accès rapide)

  created_at: string; // Date de création du compte
  updated_at: string; // Dernière mise à jour du profil
}
