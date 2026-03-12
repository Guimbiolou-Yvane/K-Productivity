"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { User, Users, Pencil, Check, X, Camera, ImagePlus, UserPlus, UserCheck, Clock } from "lucide-react";
import Image from "next/image";
import { authService } from "@/lib/services/authService";
import { friendService } from "@/lib/services/friendService";
import { UserProfile } from "@/lib/models/user";
import ProfileWidgets, { DEFAULT_WIDGETS } from "@/components/profile/ProfileWidgets";

type ProfileMode = "own" | "other";

export default function ProfilIdPage() {
  const params = useParams();
  const profileId = params.id as string;

  const [mounted, setMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [mode, setMode] = useState<ProfileMode>("own");
  const [selectedWidgets, setSelectedWidgets] = useState<string[]>([]);
  
  // Amitié
  const [friendship, setFriendship] = useState<any>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isFriendActionLoading, setIsFriendActionLoading] = useState(false);

  // Modal d'édition
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFirstName, setEditFirstName] = useState("");
  const [editLastName, setEditLastName] = useState("");
  const [editAvatarUrl, setEditAvatarUrl] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    setMounted(true);
    const loadProfile = async () => {
      try {
        // Déterminer si c'est mon profil ou celui d'un autre
        const currentUser = await authService.getUser();
        const isOwn = currentUser?.id === profileId;
        setMode(isOwn ? "own" : "other");

        // Charger le profil (le mien ou celui d'un autre)
        let data: UserProfile | null;
        if (isOwn) {
          data = await authService.getProfile();
        } else {
          data = await friendService.getProfileById(profileId);
          if (currentUser) {
            setCurrentUserId(currentUser.id);
            const status = await friendService.checkFriendshipStatus(profileId);
            setFriendship(status);
          }
        }

        setProfile(data);
        // Charger les widgets depuis le profil (propres à chaque utilisateur)
        setSelectedWidgets(data?.profile_widgets || DEFAULT_WIDGETS);
        if (data && isOwn) {
          setEditFirstName(data.first_name || "");
          setEditLastName(data.last_name || "");
          setEditAvatarUrl(data.avatar_url || "");
        }
      } catch (error) {
        console.error("Erreur chargement profil:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadProfile();
  }, [profileId]);

  const openEditModal = () => {
    if (!profile) return;
    setEditFirstName(profile.first_name || "");
    setEditLastName(profile.last_name || "");
    setEditAvatarUrl(profile.avatar_url || "");
    setSaveError("");
    setShowEditModal(true);
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    setSaveError("");
    try {
      const updated = await authService.updateProfile({
        first_name: editFirstName.trim() || undefined,
        last_name: editLastName.trim() || undefined,
        avatar_url: editAvatarUrl.trim() || undefined,
      });
      setProfile(updated);
      setShowEditModal(false);
    } catch (error: any) {
      setSaveError(error?.message || "Erreur lors de la mise à jour.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleFriendAction = async () => {
    if (!profile || isFriendActionLoading || !currentUserId) return;
    setIsFriendActionLoading(true);
    
    try {
      if (!friendship) {
        // Aucune relation -> envoyer demande
        const newReq = await friendService.sendFriendRequest(profile.id);
        setFriendship(newReq);
      } else if (friendship.status === "pending") {
        if (friendship.friend_id === currentUserId) {
          // Demande reçue -> accepter
          await friendService.acceptFriendRequest(friendship.id);
          setFriendship({ ...friendship, status: "accepted" });
        } else {
          // Demande envoyée -> annuler
          await friendService.rejectFriendRequest(friendship.id);
          setFriendship(null);
        }
      } else if (friendship.status === "accepted") {
        // Déjà ami -> supprimer
        if (window.confirm("Voulez-vous vraiment retirer cet utilisateur de vos amis ?")) {
          await friendService.removeFriend(profile.id);
          setFriendship(null);
        }
      }
    } catch (error) {
      console.error(error);
      alert("Erreur lors de l'action");
    } finally {
      setIsFriendActionLoading(false);
    }
  };

  // --- SKELETON LOADING ---
  if (!mounted || isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center max-w-4xl mx-auto font-sans pb-32 overflow-x-hidden">
        <div className="w-full h-44 sm:h-56 bg-gray-200 animate-pulse" />
        <div className="relative -mt-16 sm:-mt-20 flex flex-col items-center">
          <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-full bg-gray-300 animate-pulse border-[6px] border-gray-200" />
          <div className="h-7 w-44 bg-gray-200 animate-pulse mt-4" />
          <div className="h-4 w-32 bg-gray-200 animate-pulse mt-2" />
        </div>
        <div className="flex gap-3 mt-6">
          <div className="h-12 w-32 bg-gray-200 animate-pulse border-4 border-gray-200" />
          <div className="h-12 w-32 bg-gray-200 animate-pulse border-4 border-gray-200" />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center font-black uppercase text-xl p-4">
        <div className="neo-card text-center p-8">
          <p>Profil introuvable.</p>
        </div>
      </div>
    );
  }

  const displayName =
    profile.first_name || profile.last_name
      ? `${profile.first_name || ""} ${profile.last_name || ""}`.trim()
      : null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen flex flex-col items-center max-w-4xl mx-auto font-sans pb-32 overflow-x-hidden"
    >
      {/* ============================== */}
      {/* SECTION HEADER : COVER + AVATAR */}
      {/* ============================== */}
      <div className="w-full relative">
        {/* COUVERTURE */}
        <div className="w-full h-44 sm:h-56 border-b-4 border-foreground bg-gradient-to-br from-primary via-[#ffda59] to-[#ff6b6b] relative overflow-hidden">
          {/* Motif décoratif néo-brutaliste */}
          <div className="absolute inset-0 opacity-[0.06]" style={{
            backgroundImage: `repeating-linear-gradient(
              45deg,
              #000 0px, #000 2px,
              transparent 2px, transparent 20px
            )`
          }} />
        </div>

        {/* AVATAR */}
        <div className="absolute left-1/2 -translate-x-1/2 -bottom-16 sm:-bottom-20 z-10">
          <motion.div
            initial={{ scale: 0.8, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 25, delay: 0.1 }}
            className="w-28 h-28 sm:w-36 sm:h-36 rounded-full border-[6px] border-foreground bg-primary overflow-hidden flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
          >
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
          </motion.div>
        </div>
      </div>

      {/* ============================== */}
      {/* INFO UTILISATEUR */}
      {/* ============================== */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30, delay: 0.15 }}
        className="mt-20 sm:mt-24 flex flex-col items-center gap-1 px-4"
      >
        <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-center break-all">
          {profile.username}
        </h1>
        {displayName && (
          <p className="text-sm sm:text-base font-bold text-foreground/60 text-center">
            {displayName}
          </p>
        )}
      </motion.div>

      {/* ============================== */}
      {/* BOUTONS D'ACTION */}
      {/* ============================== */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30, delay: 0.25 }}
        className="flex gap-3 mt-6 px-4"
      >
        {mode === "own" ? (
          <>
            {/* BOUTON MODIFIER (MON PROFIL) */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={openEditModal}
              className="neo-btn !bg-[#1fb05a] flex items-center gap-2 !px-5 !py-3 text-sm"
            >
              <Pencil size={18} strokeWidth={3} />
              Modifier
            </motion.button>

            {/* BOUTON AMIS (DÉSACTIVÉ) */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              disabled
              className="neo-btn !bg-surface flex items-center gap-2 !px-5 !py-3 text-sm disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-x-0 disabled:hover:translate-y-0 disabled:hover:shadow-neo"
            >
              <Users size={18} strokeWidth={3} />
              Amis
            </motion.button>
          </>
        ) : (
          <>
            {/* BOUTON S'ASSOCIER (PROFIL D'UN AUTRE) */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleFriendAction}
              disabled={isFriendActionLoading}
              className={`neo-btn flex items-center gap-2 !px-5 !py-3 text-sm disabled:opacity-50 ${
                friendship?.status === "accepted" 
                  ? "!bg-[#1fb05a]" 
                  : friendship?.status === "pending" 
                    ? "!bg-yellow-400 text-black" 
                    : "!bg-primary"
              }`}
            >
              {isFriendActionLoading ? (
                 <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="w-4 h-4 border-2 border-foreground border-t-transparent rounded-full" />
              ) : friendship?.status === "accepted" ? (
                <><UserCheck size={18} strokeWidth={3} /> Amis</>
              ) : friendship?.status === "pending" ? (
                friendship.friend_id === currentUserId ? (
                  <><UserPlus size={18} strokeWidth={3} /> Accepter la demande</>
                ) : (
                  <><Clock size={18} strokeWidth={3} /> Demande envoyée</>
                )
              ) : (
                <><UserPlus size={18} strokeWidth={3} /> Ajouter en ami</>
              )}
            </motion.button>
          </>
        )}
      </motion.div>

      {/* ============================== */}
      {/* WIDGETS PERSONNALISABLES */}
      {/* ============================== */}
      <div className="w-full px-4 mt-8">
        <ProfileWidgets widgetIds={selectedWidgets} isOwn={mode === "own"} profileUserId={profileId} />
      </div>

      {/* ============================== */}
      {/* MODAL D'ÉDITION (UNIQUEMENT MODE OWN) */}
      {/* ============================== */}
      {mode === "own" && (
        <AnimatePresence>
          {showEditModal && (
            <motion.div
              key="edit-profile-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
              onClick={() => setShowEditModal(false)}
            >
              <motion.div
                key="edit-profile-modal"
                initial={{ opacity: 0, scale: 0.9, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 30 }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                className="neo-card w-full max-w-md bg-background flex flex-col gap-5"
                onClick={(e) => e.stopPropagation()}
              >
                {/* HEADER DU MODAL */}
                <div className="flex items-center justify-between border-b-4 border-foreground pb-3">
                  <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tighter">
                    Modifier le profil
                  </h2>
                  <button
                    onClick={() => setShowEditModal(false)}
                    className="neo-btn !p-2 !bg-surface"
                  >
                    <X size={18} strokeWidth={4} />
                  </button>
                </div>

                {/* APERÇU AVATAR */}
                <div className="flex flex-col items-center gap-3">
                  <div className="w-24 h-24 rounded-full border-[5px] border-foreground bg-primary overflow-hidden flex items-center justify-center shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                    {editAvatarUrl ? (
                      <Image
                        src={editAvatarUrl}
                        alt="Aperçu"
                        width={96}
                        height={96}
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <User strokeWidth={2} className="w-10 h-10 text-foreground" />
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-xs font-bold text-foreground/50 uppercase">
                    <Camera size={14} strokeWidth={3} />
                    <span>Photo de profil</span>
                  </div>
                </div>

                {/* CHAMP URL AVATAR */}
                <div>
                  <label className="font-black uppercase text-xs tracking-wider mb-2 block">
                    URL de la photo
                  </label>
                  <div className="relative">
                    <ImagePlus className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/50" strokeWidth={3} />
                    <input
                      type="url"
                      placeholder="https://exemple.com/photo.jpg"
                      className="neo-input font-bold !pl-12 w-full text-sm"
                      value={editAvatarUrl}
                      onChange={(e) => setEditAvatarUrl(e.target.value)}
                    />
                  </div>
                </div>

                {/* CHAMP PRÉNOM */}
                <div>
                  <label className="font-black uppercase text-xs tracking-wider mb-2 block">
                    Prénom
                  </label>
                  <input
                    type="text"
                    placeholder="Votre prénom..."
                    className="neo-input font-bold w-full"
                    value={editFirstName}
                    onChange={(e) => setEditFirstName(e.target.value)}
                  />
                </div>

                {/* CHAMP NOM */}
                <div>
                  <label className="font-black uppercase text-xs tracking-wider mb-2 block">
                    Nom
                  </label>
                  <input
                    type="text"
                    placeholder="Votre nom..."
                    className="neo-input font-bold w-full"
                    value={editLastName}
                    onChange={(e) => setEditLastName(e.target.value)}
                  />
                </div>

                {/* ERREUR */}
                {saveError && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-[#ff6b6b] border-4 border-foreground p-3 font-bold text-sm text-foreground shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                  >
                    {saveError}
                  </motion.div>
                )}

                {/* BOUTON SAUVEGARDER */}
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={handleSaveProfile}
                  disabled={isSaving}
                  className="neo-btn !bg-[#1fb05a] w-full flex items-center justify-center gap-3 text-base disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-5 h-5 border-4 border-foreground border-t-transparent rounded-full"
                    />
                  ) : (
                    <>
                      <Check size={20} strokeWidth={3} />
                      Sauvegarder
                    </>
                  )}
                </motion.button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </motion.div>
  );
}
