"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { User, Users, Pencil, Check, X, Camera, Loader2, UserPlus, UserCheck, Clock } from "lucide-react";
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
  const [editBio, setEditBio] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  // Modal photo de profil (visionneuse)
  const [showAvatarModal, setShowAvatarModal] = useState(false);

  // Upload avatar
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [uploadError, setUploadError] = useState("");

  useEffect(() => {
    setMounted(true);
    const loadProfile = async () => {
      try {
        const currentUser = await authService.getUser();
        const isOwn = currentUser?.id === profileId;
        setMode(isOwn ? "own" : "other");

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
        setSelectedWidgets(data?.profile_widgets || DEFAULT_WIDGETS);
        if (data && isOwn) {
          setEditFirstName(data.first_name || "");
          setEditLastName(data.last_name || "");
          setEditBio(data.bio || "");
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
    setEditBio(profile.bio || "");
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
        bio: editBio.trim() || undefined,
      });
      setProfile(updated);
      setShowEditModal(false);
    } catch (error: any) {
      setSaveError(error?.message || "Erreur lors de la mise à jour.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) {
      setUploadError("La photo ne doit pas dépasser 3 Mo.");
      return;
    }
    if (!file.type.startsWith("image/")) {
      setUploadError("Veuillez sélectionner une image valide.");
      return;
    }
    setUploadError("");
    setIsUploadingAvatar(true);
    try {
      const url = await authService.uploadAvatar(file);
      setProfile((prev) => prev ? { ...prev, avatar_url: url } : prev);
    } catch (err: any) {
      setUploadError(err?.message || "Erreur lors de l'upload.");
    } finally {
      setIsUploadingAvatar(false);
      if (avatarInputRef.current) avatarInputRef.current.value = "";
    }
  };

  const handleFriendAction = async () => {
    if (!profile || isFriendActionLoading || !currentUserId) return;
    setIsFriendActionLoading(true);
    try {
      if (!friendship) {
        const newReq = await friendService.sendFriendRequest(profile.id);
        setFriendship(newReq);
      } else if (friendship.status === "pending") {
        if (friendship.friend_id === currentUserId) {
          await friendService.acceptFriendRequest(friendship.id);
          setFriendship({ ...friendship, status: "accepted" });
        } else {
          await friendService.rejectFriendRequest(friendship.id);
          setFriendship(null);
        }
      } else if (friendship.status === "accepted") {
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
        {/* COUVERTURE — Bio en grand en arrière-plan */}
        <div className="w-full h-44 sm:h-56 border-b-4 border-foreground bg-gradient-to-br from-primary via-[#ffda59] to-[#ff6b6b] relative overflow-hidden flex items-center justify-center">
          {/* Motif décoratif néo-brutaliste */}
          <div className="absolute inset-0 opacity-[0.06]" style={{
            backgroundImage: `repeating-linear-gradient(45deg, #000 0px, #000 2px, transparent 2px, transparent 20px)`
          }} />

          {/* BIO en grand en couverture */}
          {profile.bio && (
            <div className="absolute inset-0 flex items-center justify-center px-6 pointer-events-none">
              <p
                className="text-center font-black text-white uppercase leading-tight select-none"
                style={{
                  fontSize: "clamp(1.4rem, 4vw, 3rem)",
                  textShadow: "3px 3px 0px rgba(0,0,0,0.35)",
                  opacity: 0.92,
                  letterSpacing: "0.02em",
                  wordBreak: "break-word",
                  maxWidth: "90%",
                }}
              >
                {profile.bio}
              </p>
            </div>
          )}
        </div>

        {/* AVATAR cliquable */}
        <div className="absolute left-1/2 -translate-x-1/2 -bottom-16 sm:-bottom-20 z-10">
          <div className="relative group/avatar">
            <motion.div
              initial={{ scale: 0.8, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 25, delay: 0.1 }}
              className="w-28 h-28 sm:w-36 sm:h-36 rounded-full border-[6px] border-foreground bg-primary overflow-hidden flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] cursor-pointer"
              onClick={() => profile.avatar_url && setShowAvatarModal(true)}
            >
              {isUploadingAvatar ? (
                <Loader2 size={36} className="text-foreground animate-spin" />
              ) : profile.avatar_url ? (
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

            {/* Bouton upload avatar (mode own seulement) */}
            {mode === "own" && (
              <>
                <button
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={isUploadingAvatar}
                  title="Changer la photo de profil"
                  className="absolute inset-0 rounded-full flex items-end justify-center pb-1.5 bg-black/0 group-hover/avatar:bg-black/40 transition-all cursor-pointer disabled:cursor-wait"
                >
                  {!isUploadingAvatar && (
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
              </>
            )}
          </div>

          {/* Erreur upload */}
          {uploadError && (
            <p className="mt-2 text-red-600 font-bold text-xs text-center bg-red-50 border border-red-400 px-2 py-1 max-w-[180px]">
              {uploadError}
            </p>
          )}
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
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={openEditModal}
              className="neo-btn !bg-[#1fb05a] flex items-center gap-2 !px-5 !py-3 text-sm"
            >
              <Pencil size={18} strokeWidth={3} />
              Modifier
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.95 }}
              disabled
              className="neo-btn !bg-surface flex items-center gap-2 !px-5 !py-3 text-sm disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Users size={18} strokeWidth={3} />
              Amis
            </motion.button>
          </>
        ) : (
          <>
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
      {/* MODAL VISIONNEUSE PHOTO */}
      {/* ============================== */}
      <AnimatePresence>
        {showAvatarModal && profile.avatar_url && (
          <motion.div
            key="avatar-viewer"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
            onClick={() => setShowAvatarModal(false)}
          >
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="relative max-w-sm w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-full aspect-square rounded-full border-[6px] border-white overflow-hidden shadow-[8px_8px_0px_0px_rgba(255,255,255,0.2)]">
                <Image
                  src={profile.avatar_url}
                  alt={profile.username}
                  width={480}
                  height={480}
                  className="object-cover w-full h-full"
                />
              </div>
              <p className="text-center text-white font-black uppercase text-lg mt-4 tracking-tight">
                {profile.username}
              </p>
              <button
                onClick={() => setShowAvatarModal(false)}
                className="absolute -top-3 -right-3 w-9 h-9 bg-white border-4 border-foreground rounded-full flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
              >
                <X size={16} strokeWidth={4} className="text-foreground" />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ============================== */}
      {/* MODAL D'ÉDITION (MODE OWN) */}
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
                className="neo-card w-full max-w-md bg-background flex flex-col gap-5 max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                {/* HEADER */}
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

                {/* AVATAR — cliquable pour modifier */}
                <div className="flex flex-col items-center gap-3">
                  <div
                    className="relative group/avatar-modal cursor-pointer"
                    onClick={() => avatarInputRef.current?.click()}
                  >
                    <div className="w-24 h-24 rounded-full border-[5px] border-foreground bg-primary overflow-hidden flex items-center justify-center shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                      {isUploadingAvatar ? (
                        <Loader2 size={28} className="text-foreground animate-spin" />
                      ) : profile.avatar_url ? (
                        <Image
                          src={profile.avatar_url}
                          alt="Aperçu"
                          width={96}
                          height={96}
                          className="object-cover w-full h-full"
                        />
                      ) : (
                        <User strokeWidth={2} className="w-10 h-10 text-foreground" />
                      )}
                    </div>
                    <div className="absolute inset-0 rounded-full bg-black/0 group-hover/avatar-modal:bg-black/40 transition-all flex items-end justify-center pb-1">
                      <span className="flex items-center gap-1 text-white text-[9px] font-black uppercase opacity-0 group-hover/avatar-modal:opacity-100 transition-opacity bg-black/60 px-1.5 py-0.5 rounded-full">
                        <Camera size={10} strokeWidth={3} />
                        Changer
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => avatarInputRef.current?.click()}
                    disabled={isUploadingAvatar}
                    className="flex items-center gap-1.5 text-xs font-black uppercase text-foreground/70 hover:text-foreground transition-colors border-b-2 border-dashed border-foreground/40 hover:border-foreground pb-0.5"
                  >
                    <Camera size={13} strokeWidth={3} />
                    Modifier la photo de profil
                  </button>
                  {uploadError && (
                    <p className="text-red-600 font-bold text-xs text-center border border-red-400 bg-red-50 px-2 py-1">{uploadError}</p>
                  )}
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

                {/* CHAMP BIO */}
                <div>
                  <label className="font-black uppercase text-xs tracking-wider mb-2 block">
                    Bio <span className="text-foreground/40 normal-case font-bold">(affichée en couverture)</span>
                  </label>
                  <textarea
                    placeholder="Ex: Sportif, ambitieux, je repousse mes limites chaque jour…"
                    className="neo-input font-bold w-full resize-none h-24 !py-3 leading-snug"
                    value={editBio}
                    maxLength={120}
                    onChange={(e) => setEditBio(e.target.value)}
                  />
                  <p className="text-xs text-foreground/40 font-bold text-right mt-1">{editBio.length}/120</p>
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
