"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "motion/react";
import { Search, Users, UserPlus, Clock, User } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { friendService } from "@/lib/services/friendService";
import { UserProfile } from "@/lib/models/user";

interface FriendRequest {
  id: string;
  from: UserProfile;
  created_at: string;
}

export default function AmisPage() {
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [friends, setFriends] = useState<UserProfile[]>([]);
  const [pendingRequests, setPendingRequests] = useState<FriendRequest[]>([]);
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setMounted(true);
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [fetchedFriends, fetchedRequests] = await Promise.all([
        friendService.getFriends(),
        friendService.getPendingRequests(),
      ]);
      setFriends(fetchedFriends);
      setPendingRequests(fetchedRequests);
    } catch (error) {
      console.error("Erreur lors de la récupération des amis :", error);
    }
  };

  const handleAcceptRequest = async (requestId: string) => {
    try {
      await friendService.acceptFriendRequest(requestId);
      fetchData(); // Rafraîchir les listes
    } catch (error) {
      console.error(error);
      alert("Erreur");
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    try {
      await friendService.rejectFriendRequest(requestId);
      fetchData(); // Rafraîchir la liste
    } catch (error) {
      console.error(error);
      alert("Erreur");
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (query.trim().length === 0) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const results = await friendService.searchByUsername(query.trim());
        setSearchResults(results);
      } catch (error) {
        console.error("Erreur recherche:", error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 400);
  };

  if (!mounted) {
    return (
      <div className="min-h-screen p-4 md:p-8 flex flex-col items-center max-w-4xl mx-auto font-sans pb-32 overflow-x-hidden">
        <div className="w-full flex justify-between items-center mb-8 border-b-8 border-gray-200 pb-4">
          <div className="h-10 md:h-12 w-32 sm:w-48 bg-gray-200 animate-pulse" />
        </div>
        <div className="w-full h-14 bg-gray-200 animate-pulse border-4 border-gray-200 mb-8" />
        <div className="w-full flex flex-col gap-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="w-full h-32 bg-gray-100 animate-pulse border-4 border-gray-200" />
          ))}
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
        <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tighter">Amis</h1>
      </div>

      {/* ============================== */}
      {/* BARRE DE RECHERCHE */}
      {/* ============================== */}
      <section className="w-full mb-8">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/50" strokeWidth={3} />
          <input
            type="text"
            placeholder="Rechercher un utilisateur..."
            className="neo-input font-bold !pl-12 w-full"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>

        {/* RÉSULTATS DE RECHERCHE */}
        {searchQuery.trim().length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="neo-card mt-3 !p-0 overflow-hidden"
          >
            {isSearching ? (
              <div className="flex items-center justify-center p-6 gap-3">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-5 h-5 border-4 border-foreground border-t-transparent rounded-full"
                />
                <span className="font-bold text-sm uppercase">Recherche...</span>
              </div>
            ) : searchResults.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-6 gap-2">
                <Search size={28} strokeWidth={2} className="text-foreground/30" />
                <span className="font-bold text-sm text-foreground/50 uppercase text-center">
                  Aucun utilisateur trouvé pour &quot;{searchQuery}&quot;
                </span>
              </div>
            ) : (
              <div className="flex flex-col divide-y-4 divide-foreground">
                {searchResults.map((user) => (
                  <Link
                    key={user.id}
                    href={`/profil/${user.id}`}
                    className="flex items-center gap-3 p-4 hover:bg-primary/10 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-full border-[3px] border-foreground bg-primary overflow-hidden flex items-center justify-center shrink-0 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                      {user.avatar_url ? (
                        <Image src={user.avatar_url} alt={user.username} width={40} height={40} className="object-cover w-full h-full" />
                      ) : (
                        <User strokeWidth={3} className="w-5 h-5" />
                      )}
                    </div>
                    <span className="font-black uppercase text-sm tracking-tight">{user.username}</span>
                  </Link>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </section>

      {/* ============================== */}
      {/* SECTION : MES AMIS */}
      {/* ============================== */}
      <section className="w-full mb-8">
        <h2 className="text-xl sm:text-2xl font-black uppercase text-foreground pl-2 border-l-8 border-primary mb-4 flex items-center gap-3">
          <span>Mes Amis</span>
          <span className="text-sm font-black bg-primary border-2 border-foreground px-2 py-0.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            {friends.length}
          </span>
        </h2>

        {friends.length === 0 ? (
          <div className="neo-card flex flex-col items-center justify-center py-12 gap-3">
            <div className="w-16 h-16 border-4 border-foreground/20 rounded-full flex items-center justify-center bg-surface">
              <Users size={32} strokeWidth={2} className="text-foreground/20" />
            </div>
            <p className="font-bold text-sm text-foreground/40 uppercase text-center">
              Vous n&apos;avez pas encore d&apos;amis
            </p>
            <p className="font-bold text-xs text-foreground/30 text-center max-w-xs">
              Utilisez la barre de recherche pour trouver des utilisateurs et leur envoyer une demande d&apos;ami
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {friends.map((friend) => (
              <Link
                key={friend.id}
                href={`/profil/${friend.id}`}
                className="neo-card flex items-center gap-4 hover:bg-primary/10 transition-colors cursor-pointer"
              >
                <div className="w-12 h-12 rounded-full border-4 border-foreground bg-primary overflow-hidden flex items-center justify-center shrink-0 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  {friend.avatar_url ? (
                    <Image src={friend.avatar_url} alt={friend.username} width={48} height={48} className="object-cover w-full h-full" />
                  ) : (
                    <User strokeWidth={3} className="w-6 h-6" />
                  )}
                </div>
                <span className="font-black uppercase text-base tracking-tight">{friend.username}</span>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* ============================== */}
      {/* SECTION : DEMANDES EN ATTENTE */}
      {/* ============================== */}
      <section className="w-full mb-8">
        <h2 className="text-xl sm:text-2xl font-black uppercase text-foreground pl-2 border-l-8 border-[#ff6b6b] mb-4 flex items-center gap-3">
          <span>Demandes en attente</span>
          {pendingRequests.length > 0 && (
            <span className="text-sm font-black bg-[#ff6b6b] border-2 border-foreground px-2 py-0.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              {pendingRequests.length}
            </span>
          )}
        </h2>

        {pendingRequests.length === 0 ? (
          <div className="neo-card flex flex-col items-center justify-center py-12 gap-3">
            <div className="w-16 h-16 border-4 border-foreground/20 rounded-full flex items-center justify-center bg-surface">
              <Clock size={32} strokeWidth={2} className="text-foreground/20" />
            </div>
            <p className="font-bold text-sm text-foreground/40 uppercase text-center">
              Aucune demande en attente
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {pendingRequests.map((request) => (
              <div
                key={request.id}
                className="neo-card flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full border-4 border-foreground bg-primary overflow-hidden flex items-center justify-center shrink-0 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    {request.from.avatar_url ? (
                      <Image src={request.from.avatar_url} alt={request.from.username} width={48} height={48} className="object-cover w-full h-full" />
                    ) : (
                      <User strokeWidth={3} className="w-6 h-6" />
                    )}
                  </div>
                  <div className="flex flex-col">
                    <span className="font-black uppercase text-sm tracking-tight">{request.from.username}</span>
                    <span className="text-xs font-bold text-foreground/40">
                      {new Date(request.created_at).toLocaleDateString("fr-FR")}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  {/* ACCEPTER */}
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleAcceptRequest(request.id)}
                    className="neo-btn !bg-[#1fb05a] !px-3 !py-2 text-xs flex items-center gap-1"
                  >
                    <UserPlus size={16} strokeWidth={3} />
                    <span className="hidden sm:inline">Accepter</span>
                  </motion.button>
                  {/* REFUSER */}
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleRejectRequest(request.id)}
                    className="neo-btn !bg-[#ff6b6b] !px-3 !py-2 text-xs"
                  >
                    ✕
                  </motion.button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </motion.div>
  );
}
