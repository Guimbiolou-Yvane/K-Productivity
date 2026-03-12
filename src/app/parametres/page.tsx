"use client";

import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { User, Mail, Calendar, LogOut, Save, Shield, Pencil, Check, X } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { authService } from "@/lib/services/authService";
import { UserProfile } from "@/lib/models/user";

export default function ParametresPage() {
  const router = useRouter();
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
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="min-h-screen p-4 md:p-8 flex flex-col items-center max-w-4xl mx-auto font-sans pb-32 overflow-x-hidden"
    >
      {/* HEADER */}
      <div className="w-full flex justify-between items-center mb-8 border-b-8 border-foreground pb-4">
        <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tighter">Paramètres</h1>
      </div>

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
          {/* AVATAR */}
          <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-full border-[6px] border-foreground bg-primary overflow-hidden flex items-center justify-center shrink-0 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
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

          {/* INFO PRINCIPALE */}
          <div className="flex flex-col items-center sm:items-start gap-1 flex-1 min-w-0">
            <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight break-all text-center sm:text-left">
              {profile.username}
            </h2>
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

      {/* SECTION 5 : DÉCONNEXION */}
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
    </motion.div>
  );
}
