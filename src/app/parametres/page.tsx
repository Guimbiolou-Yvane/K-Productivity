"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "motion/react";
import { User, Mail, Calendar, LogOut, Save, Shield, Pencil, Check, X, Moon, Sun, Monitor, Settings, RotateCcw, Globe, Camera, Loader2, Bot } from "lucide-react";
import ResetObjectivesModal from "@/components/ResetObjectivesModal";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { authService } from "@/lib/services/authService";
import { UserProfile } from "@/lib/models/user";

export default function ParametresPage() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  // Champs éditables
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editUsername, setEditUsername] = useState("");
  const [editFirstName, setEditFirstName] = useState("");
  const [editLastName, setEditLastName] = useState("");

  // Changement de mot de passe
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");

  // Sauvegarde
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  // Réinitialisation des objectifs
  const [showResetModal, setShowResetModal] = useState(false);

  // Avatar
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [avatarError, setAvatarError] = useState("");

  // Fuseau horaire
  const [editTimezone, setEditTimezone] = useState("");
  const [isEditingTimezone, setIsEditingTimezone] = useState(false);

  useEffect(() => {
    setMounted(true);
    const loadProfile = async () => {
      try {
        const data = await authService.getProfile();
        setProfile(data);
        if (data) {
          setEditUsername(data.username);
          setEditFirstName(data.first_name || "");
          setEditLastName(data.last_name || "");
          setEditTimezone(data.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || "Europe/Paris");
        }
      } catch (error) {
        console.error("Erreur chargement profil:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadProfile();
  }, []);

  const handleSaveUsername = async () => {
    if (!editUsername.trim()) return;
    setIsSaving(true);
    setSaveMessage("");
    try {
      const updated = await authService.updateProfile({ username: editUsername.trim() });
      setProfile(updated);
      setIsEditingUsername(false);
      setSaveMessage("Username mis à jour !");
      setTimeout(() => setSaveMessage(""), 3000);
    } catch (error: any) {
      setSaveMessage(error?.message || "Erreur lors de la mise à jour");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveName = async () => {
    setIsSaving(true);
    setSaveMessage("");
    try {
      const updated = await authService.updateProfile({
        first_name: editFirstName.trim() || undefined,
        last_name: editLastName.trim() || undefined,
      });
      setProfile(updated);
      setIsEditingName(false);
      setSaveMessage("Nom mis à jour !");
      setTimeout(() => setSaveMessage(""), 3000);
    } catch (error: any) {
      setSaveMessage(error?.message || "Erreur lors de la mise à jour");
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async () => {
    setPasswordError("");
    setPasswordSuccess("");

    if (newPassword.length < 6) {
      setPasswordError("Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("Les mots de passe ne correspondent pas.");
      return;
    }

    try {
      await authService.updatePassword(newPassword);
      setPasswordSuccess("Mot de passe modifié avec succès !");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => {
        setPasswordSuccess("");
        setShowPasswordSection(false);
      }, 3000);
    } catch (error: any) {
      setPasswordError(error?.message || "Erreur lors du changement de mot de passe.");
    }
  };

  const handleSignOut = async () => {
    try {
      await authService.signOut();
      router.push("/login");
    } catch (error) {
      console.error("Erreur de déconnexion:", error);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const maxSize = 3 * 1024 * 1024; // 3 MB
    if (file.size > maxSize) {
      setAvatarError("La photo ne doit pas dépasser 3 Mo.");
      return;
    }
    if (!file.type.startsWith("image/")) {
      setAvatarError("Veuillez sélectionner une image valide.");
      return;
    }
    setAvatarError("");
    setIsUploadingAvatar(true);
    try {
      const url = await authService.uploadAvatar(file);
      setProfile((prev) => prev ? { ...prev, avatar_url: url } : prev);
      setSaveMessage("Photo de profil mise à jour !");
      setTimeout(() => setSaveMessage(""), 3000);
    } catch (err: any) {
      setAvatarError(err?.message || "Erreur lors de l'upload.");
    } finally {
      setIsUploadingAvatar(false);
      if (avatarInputRef.current) avatarInputRef.current.value = "";
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  if (!mounted || isLoading) {
    return (
      <div className="min-h-screen p-4 md:p-8 flex flex-col items-center max-w-4xl mx-auto font-sans pb-32 overflow-x-hidden">
        {/* HEADER SKELETON */}
        <div className="w-full flex justify-between items-center mb-8 border-b-8 border-gray-200 pb-4">
          <div className="h-10 md:h-12 w-32 sm:w-48 bg-gray-200 animate-pulse"></div>
        </div>
        {/* AVATAR SKELETON */}
        <div className="w-full flex flex-col items-center mb-8">
          <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-full bg-gray-200 animate-pulse border-4 border-gray-200"></div>
          <div className="h-6 w-40 bg-gray-200 animate-pulse mt-4"></div>
          <div className="h-4 w-56 bg-gray-200 animate-pulse mt-2"></div>
        </div>
        {/* FIELDS SKELETON */}
        <div className="w-full flex flex-col gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="w-full h-20 bg-gray-100 animate-pulse border-4 border-gray-200"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center font-black uppercase text-xl p-4">
        <div className="neo-card text-center p-8">
          <p className="mb-4">Profil introuvable.</p>
          <button onClick={() => router.push("/login")} className="neo-btn bg-primary">
            Se connecter
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* HEADER sticky hors du motion.div pour éviter le conflit overflow */}
      <div className="sticky top-0 z-30 bg-surface border-b-4 border-foreground w-full">
        <div className="max-w-4xl mx-auto px-4 md:px-8 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 flex items-center justify-center bg-primary border-[3px] border-foreground shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] shrink-0">
              <Settings size={18} strokeWidth={3} />
            </div>
            <div>
              <h1 className="text-xl font-black uppercase tracking-tight leading-none">Paramètres</h1>
              <p className="font-bold text-foreground/50 text-xs mt-0.5 leading-snug hidden sm:block">
                Gérez votre profil et vos préférences.
              </p>
            </div>
          </div>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleSignOut}
            className="flex items-center gap-2 px-3 py-2 border-[3px] border-foreground bg-[#ff6b6b] text-white font-black uppercase text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all"
          >
            <LogOut size={14} strokeWidth={3} />
            <span className="hidden sm:inline">Déconnexion</span>
          </motion.button>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="min-h-screen flex flex-col items-center max-w-4xl mx-auto font-sans pb-32 w-full"
      >
      <div className="w-full px-4 md:px-8 py-6 flex flex-col gap-6">
      {/* SAVE MESSAGE */}
      {saveMessage && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="w-full mb-4 p-3 bg-green-100 border-4 border-foreground text-foreground font-black text-sm uppercase text-center shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
        >
          {saveMessage}
        </motion.div>
      )}

      {/* SECTION 1 : CARTE PROFIL */}
      <section className="w-full neo-card mb-8">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:gap-8">
          {/* AVATAR CLIQUABLE */}
          <div className="relative shrink-0 group/avatar">
            <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-full border-[6px] border-foreground bg-primary overflow-hidden flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              {profile.avatar_url ? (
                <Image
                  src={profile.avatar_url}
                  alt={profile.username}
                  width={144}
                  height={144}
                  className="object-cover w-full h-full"
                />
              ) : (
                <User strokeWidth={2} className="w-12 h-12 sm:w-16 sm:h-16 text-foreground" />
              )}
            </div>
            {/* Overlay bouton modifier */}
            <button
              onClick={() => avatarInputRef.current?.click()}
              disabled={isUploadingAvatar}
              title="Changer la photo de profil"
              className="absolute inset-0 rounded-full flex items-end justify-center pb-1.5 bg-black/0 group-hover/avatar:bg-black/40 transition-all cursor-pointer disabled:cursor-wait"
            >
              {isUploadingAvatar ? (
                <Loader2 size={22} className="text-white animate-spin mb-1" />
              ) : (
                <span className="flex items-center gap-1 text-white text-[10px] font-black uppercase opacity-0 group-hover/avatar:opacity-100 transition-opacity bg-black/60 px-2 py-0.5 rounded-full">
                  <Camera size={12} strokeWidth={3} />
                  Modifier
                </span>
              )}
            </button>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
          </div>

          {/* INFO PRINCIPALE */}
          <div className="flex flex-col items-center sm:items-start gap-1 flex-1 min-w-0">
            <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight break-all text-center sm:text-left">
              {profile.username}
            </h2>
            {avatarError && (
              <p className="text-red-600 font-bold text-xs border-2 border-red-400 bg-red-50 px-2 py-1">{avatarError}</p>
            )}
            <div className="flex items-center gap-2 text-muted">
              <Mail size={16} strokeWidth={3} />
              <span className="text-sm font-bold break-all">{profile.email}</span>
            </div>
            {(profile.first_name || profile.last_name) && (
              <p className="text-sm font-bold text-foreground/70 mt-1">
                {[profile.first_name, profile.last_name].filter(Boolean).join(" ")}
              </p>
            )}
            <div className="flex items-center gap-2 text-muted mt-2">
              <Calendar size={14} strokeWidth={3} />
              <span className="text-xs font-bold">Membre depuis {formatDate(profile.created_at)}</span>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2 : MODIFIER USERNAME */}
      <section className="w-full mb-6">
        <h3 className="text-lg sm:text-xl font-black uppercase text-foreground pl-2 border-l-8 border-primary mb-4">
          Nom d&apos;utilisateur
        </h3>
        <div className="neo-card">
          {isEditingUsername ? (
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                className="neo-input flex-1 !p-3 font-bold text-base"
                value={editUsername}
                onChange={(e) => setEditUsername(e.target.value)}
                placeholder="Nouveau username..."
                autoFocus
              />
              <div className="flex gap-2">
                <button
                  onClick={handleSaveUsername}
                  disabled={isSaving || !editUsername.trim()}
                  className="neo-btn bg-green-300 !px-4 !py-2 flex items-center gap-2 disabled:opacity-50"
                >
                  <Check size={18} strokeWidth={4} />
                  <span className="hidden sm:inline">Sauvegarder</span>
                </button>
                <button
                  onClick={() => {
                    setIsEditingUsername(false);
                    setEditUsername(profile.username);
                  }}
                  className="neo-btn bg-red-200 !px-4 !py-2 flex items-center gap-2"
                >
                  <X size={18} strokeWidth={4} />
                  <span className="hidden sm:inline">Annuler</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <User size={20} strokeWidth={3} className="text-foreground/60" />
                <span className="font-black text-lg break-all">{profile.username}</span>
              </div>
              <button
                onClick={() => setIsEditingUsername(true)}
                className="neo-btn !px-3 !py-2 bg-primary flex items-center justify-center"
              >
                <Pencil size={16} strokeWidth={3} />
              </button>
            </div>
          )}
        </div>
      </section>

      {/* SECTION 3 : MODIFIER NOM */}
      <section className="w-full mb-6">
        <h3 className="text-lg sm:text-xl font-black uppercase text-foreground pl-2 border-l-8 border-[#4facff] mb-4">
          Nom complet
        </h3>
        <div className="neo-card">
          {isEditingName ? (
            <div className="flex flex-col gap-3">
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  className="neo-input flex-1 !p-3 font-bold text-base"
                  value={editFirstName}
                  onChange={(e) => setEditFirstName(e.target.value)}
                  placeholder="Prénom"
                  autoFocus
                />
                <input
                  type="text"
                  className="neo-input flex-1 !p-3 font-bold text-base"
                  value={editLastName}
                  onChange={(e) => setEditLastName(e.target.value)}
                  placeholder="Nom"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={handleSaveName}
                  disabled={isSaving}
                  className="neo-btn bg-green-300 !px-4 !py-2 flex items-center gap-2 disabled:opacity-50"
                >
                  <Check size={18} strokeWidth={4} />
                  Sauvegarder
                </button>
                <button
                  onClick={() => {
                    setIsEditingName(false);
                    setEditFirstName(profile.first_name || "");
                    setEditLastName(profile.last_name || "");
                  }}
                  className="neo-btn bg-red-200 !px-4 !py-2 flex items-center gap-2"
                >
                  <X size={18} strokeWidth={4} />
                  Annuler
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <span className="font-bold text-lg text-foreground/80">
                {profile.first_name || profile.last_name
                  ? `${profile.first_name || ""} ${profile.last_name || ""}`.trim()
                  : "Non renseigné"}
              </span>
              <button
                onClick={() => setIsEditingName(true)}
                className="neo-btn !px-3 !py-2 bg-[#4facff] flex items-center justify-center"
              >
                <Pencil size={16} strokeWidth={3} />
              </button>
            </div>
          )}
        </div>
      </section>

      {/* SECTION 4 : SÉCURITÉ (Mot de passe) */}
      <section className="w-full mb-8">
        <h3 className="text-lg sm:text-xl font-black uppercase text-foreground pl-2 border-l-8 border-orange-400 mb-4">
          Sécurité
        </h3>
        <div className="neo-card">
          {!showPasswordSection ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Shield size={20} strokeWidth={3} className="text-foreground/60" />
                <span className="font-bold text-foreground/80">Mot de passe</span>
              </div>
              <button
                onClick={() => setShowPasswordSection(true)}
                className="neo-btn !px-3 !py-2 bg-orange-300 flex items-center justify-center"
              >
                <Pencil size={16} strokeWidth={3} />
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <input
                type="password"
                className="neo-input !p-3 font-bold text-base w-full"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Nouveau mot de passe (6 caractères min.)"
                autoFocus
              />
              <input
                type="password"
                className="neo-input !p-3 font-bold text-base w-full"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirmer le mot de passe"
              />

              {passwordError && (
                <p className="text-red-600 font-bold text-sm border-2 border-red-600 p-2 bg-red-50">{passwordError}</p>
              )}
              {passwordSuccess && (
                <p className="text-green-700 font-bold text-sm border-2 border-green-700 p-2 bg-green-50">{passwordSuccess}</p>
              )}

              <div className="flex gap-2 justify-end">
                <button
                  onClick={handleChangePassword}
                  className="neo-btn bg-orange-300 !px-4 !py-2 flex items-center gap-2"
                >
                  <Save size={18} strokeWidth={4} />
                  Sauvegarder
                </button>
                <button
                  onClick={() => {
                    setShowPasswordSection(false);
                    setNewPassword("");
                    setConfirmPassword("");
                    setPasswordError("");
                  }}
                  className="neo-btn bg-surface !px-4 !py-2 flex items-center gap-2"
                >
                  <X size={18} strokeWidth={4} />
                  Annuler
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* SECTION 4.5 : FUSEAU HORAIRE */}
      <section className="w-full mb-6">
        <h3 className="text-lg sm:text-xl font-black uppercase text-foreground pl-2 border-l-8 border-[#1fb05a] mb-4">
          Fuseau horaire
        </h3>
        <div className="neo-card">
          {isEditingTimezone ? (
            <div className="flex flex-col gap-3">
              <p className="text-xs font-bold text-foreground/50">
                Ce fuseau est utilisé pour les rappels de notifications liés aux horaires de vos objectifs.
              </p>
              <select
                value={editTimezone}
                onChange={(e) => setEditTimezone(e.target.value)}
                className="neo-input !p-3 font-bold text-base w-full"
              >
                <optgroup label="🇫🇷 France">
                  <option value="Europe/Paris">Europe/Paris (France métropolitaine)</option>
                  <option value="America/Guadeloupe">Amérique/Guadeloupe</option>
                  <option value="America/Martinique">Amérique/Martinique</option>
                  <option value="America/Cayenne">Amérique/Cayenne (Guyane)</option>
                  <option value="Indian/Reunion">Océan Indien/Réunion</option>
                  <option value="Indian/Mayotte">Océan Indien/Mayotte</option>
                  <option value="Pacific/Noumea">Pacifique/Nouméa (Nouvelle-Calédonie)</option>
                  <option value="Pacific/Tahiti">Pacifique/Tahiti (Polynésie)</option>
                </optgroup>
                <optgroup label="🇧🇪 Belgique">
                  <option value="Europe/Brussels">Europe/Bruxelles</option>
                </optgroup>
                <optgroup label="🇨🇭 Suisse">
                  <option value="Europe/Zurich">Europe/Zurich</option>
                </optgroup>
                <optgroup label="🇨🇦 Canada">
                  <option value="America/Montreal">Amérique/Montréal</option>
                  <option value="America/Toronto">Amérique/Toronto</option>
                </optgroup>
                <optgroup label="🇮🇨 Afrique">
                  <option value="Africa/Douala">Afrique/Douala (Cameroun)</option>
                  <option value="Africa/Abidjan">Afrique/Abidjan (Côte d'Ivoire)</option>
                  <option value="Africa/Dakar">Afrique/Dakar (Sénégal)</option>
                  <option value="Africa/Kinshasa">Afrique/Kinshasa (RDC Ouest)</option>
                  <option value="Africa/Lubumbashi">Afrique/Lubumbashi (RDC Est)</option>
                  <option value="Africa/Algiers">Afrique/Alger (Algérie)</option>
                  <option value="Africa/Tunis">Afrique/Tunis (Tunisie)</option>
                  <option value="Africa/Casablanca">Afrique/Casablanca (Maroc)</option>
                  <option value="Africa/Libreville">Afrique/Libreville (Gabon)</option>
                  <option value="Africa/Brazzaville">Afrique/Brazzaville (Congo)</option>
                  <option value="Indian/Antananarivo">Océan Indien/Antananarivo (Madagascar)</option>
                </optgroup>
                <optgroup label="🌍 Autres">
                  <option value="Europe/London">Europe/Londres</option>
                  <option value="Europe/Berlin">Europe/Berlin</option>
                  <option value="America/New_York">Amérique/New York</option>
                  <option value="America/Los_Angeles">Amérique/Los Angeles</option>
                  <option value="Asia/Tokyo">Asie/Tokyo</option>
                  <option value="Asia/Dubai">Asie/Dubaï</option>
                  <option value="Asia/Shanghai">Asie/Shanghai</option>
                  <option value="Australia/Sydney">Australie/Sydney</option>
                </optgroup>
              </select>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={async () => {
                    setIsSaving(true);
                    try {
                      const updated = await authService.updateProfile({ timezone: editTimezone });
                      setProfile(updated);
                      setIsEditingTimezone(false);
                      setSaveMessage("Fuseau horaire mis à jour !");
                      setTimeout(() => setSaveMessage(""), 3000);
                    } catch (error: any) {
                      setSaveMessage(error?.message || "Erreur lors de la mise à jour");
                    } finally {
                      setIsSaving(false);
                    }
                  }}
                  disabled={isSaving}
                  className="neo-btn bg-green-300 !px-4 !py-2 flex items-center gap-2 disabled:opacity-50"
                >
                  <Check size={18} strokeWidth={4} />
                  Sauvegarder
                </button>
                <button
                  onClick={() => {
                    setIsEditingTimezone(false);
                    setEditTimezone(profile?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || "Europe/Paris");
                  }}
                  className="neo-btn bg-red-200 !px-4 !py-2 flex items-center gap-2"
                >
                  <X size={18} strokeWidth={4} />
                  Annuler
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Globe size={20} strokeWidth={3} className="text-foreground/60" />
                <div>
                  <span className="font-bold text-foreground/80 block">
                    {editTimezone || "Non défini"}
                  </span>
                  <span className="text-xs font-bold text-foreground/50 block mt-0.5">
                    Utilisé pour les rappels de vos objectifs.
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsEditingTimezone(true)}
                className="neo-btn !px-3 !py-2 bg-[#1fb05a] flex items-center justify-center"
              >
                <Pencil size={16} strokeWidth={3} />
              </button>
            </div>
          )}
        </div>
      </section>

      {/* SECTION 5 : APPARENCE (THÈME) */}
      <section className="w-full mb-8">
        <h3 className="text-lg sm:text-xl font-black uppercase text-foreground pl-2 border-l-8 border-[#9d4edd] mb-4">
          Apparence
        </h3>
        <div className="neo-card flex flex-col md:flex-row gap-4">
          <button
            onClick={() => setTheme("light")}
            className={`flex-1 flex flex-col items-center justify-center p-4 border-4 transition-all cursor-pointer shadow-[2px_2px_0px_0px_var(--shadow-color)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none ${theme === 'light' ? 'border-primary bg-primary/20 scale-[0.98] shadow-none' : 'border-foreground bg-surface hover:bg-gray-100 dark:hover:bg-zinc-800'}`}
          >
            <Sun size={24} strokeWidth={3} className="mb-2" />
            <span className="font-bold uppercase text-sm">Clair</span>
          </button>
          
          <button
            onClick={() => setTheme("dark")}
            className={`flex-1 flex flex-col items-center justify-center p-4 border-4 transition-all cursor-pointer shadow-[2px_2px_0px_0px_var(--shadow-color)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none ${theme === 'dark' ? 'border-primary bg-primary/20 scale-[0.98] shadow-none' : 'border-foreground bg-surface hover:bg-gray-100 dark:hover:bg-zinc-800'}`}
          >
            <Moon size={24} strokeWidth={3} className="mb-2" />
            <span className="font-bold uppercase text-sm">Sombre</span>
          </button>

          <button
            onClick={() => setTheme("system")}
            className={`flex-1 flex flex-col items-center justify-center p-4 border-4 transition-all cursor-pointer shadow-[2px_2px_0px_0px_var(--shadow-color)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none ${theme === 'system' ? 'border-primary bg-primary/20 scale-[0.98] shadow-none' : 'border-foreground bg-surface hover:bg-gray-100 dark:hover:bg-zinc-800'}`}
          >
            <Monitor size={24} strokeWidth={3} className="mb-2" />
            <span className="font-bold uppercase text-sm">Système</span>
          </button>
        </div>
      </section>

      {/* SECTION 5.5 : TELEGRAM BOT */}
      <section className="w-full mb-8">
        <h3 className="text-lg sm:text-xl font-black uppercase text-foreground pl-2 border-l-8 border-[#0088cc] mb-4">
          Assistant Telegram
        </h3>
        <div className="neo-card">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#0088cc] flex items-center justify-center border-2 border-foreground shrink-0 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                <Bot size={20} strokeWidth={2} className="text-white" />
              </div>
              <div className="min-w-0">
                <span className="font-bold text-foreground/80 block">Intelligence Artificielle</span>
                <span className="text-xs font-bold text-foreground/50 block mt-0.5">
                  Gérez vos tâches et habitudes directement depuis Telegram.
                </span>
                {profile.telegram_chat_id && (
                  <span className="text-xs font-black text-[#1fb05a] block mt-1">✓ Compte synchronisé</span>
                )}
              </div>
            </div>
            <a
              href={`https://t.me/${process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || 'VOTRE_BOT'}?start=${profile.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="neo-btn !px-4 !py-2 !bg-[#0088cc] text-white text-sm flex items-center gap-2 shrink-0 self-stretch sm:self-auto justify-center"
            >
              <Bot size={16} strokeWidth={3} />
              <span className="font-bold uppercase">{profile.telegram_chat_id ? 'Ouvrir Telegram' : 'Connecter'}</span>
            </a>
          </div>
        </div>
      </section>

      {/* SECTION 6 : RÉINITIALISATION DES OBJECTIFS */}
      <section className="w-full mb-8">
        <h3 className="text-lg sm:text-xl font-black uppercase text-foreground pl-2 border-l-8 border-red-400 mb-4">
          Réinitialisation
        </h3>
        <div className="neo-card">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <RotateCcw size={20} strokeWidth={3} className="text-foreground/60 shrink-0" />
              <div className="min-w-0">
                <span className="font-bold text-foreground/80 block">Réinitialiser mes objectifs</span>
                <span className="text-xs font-bold text-foreground/50 block mt-0.5">
                  Supprimez vos objectifs et recommencez à zéro.
                </span>
              </div>
            </div>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowResetModal(true)}
              className="neo-btn !px-4 !py-2 !bg-red-400 hover:!bg-red-500 text-sm flex items-center gap-2 shrink-0"
            >
              <RotateCcw size={14} strokeWidth={3} />
              <span className="hidden sm:inline">Réinitialiser</span>
            </motion.button>
          </div>
        </div>
      </section>

      {/* SECTION 6 : DÉCONNEXION */}
      <section className="w-full mb-8">
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.97 }}
          onClick={handleSignOut}
          className="w-full neo-btn bg-red-400 hover:bg-red-500 text-foreground flex items-center justify-center gap-3 !py-4 text-lg"
        >
          <LogOut size={24} strokeWidth={3} />
          Se déconnecter
        </motion.button>
      </section>
      </div>
      </motion.div>

      {/* MODAL RÉINITIALISATION */}
      <ResetObjectivesModal
        isOpen={showResetModal}
        onClose={() => setShowResetModal(false)}
      />
    </>
  );
}
