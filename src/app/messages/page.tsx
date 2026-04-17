"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Send, Users, User, ArrowLeft, Loader2, MessageSquare, Search, Plus, X, ListChecks, Trash2 } from "lucide-react";
import Image from "next/image";
import { chatService } from "@/lib/services/chatService";
import { Message, Conversation } from "@/lib/models/message";
import { authService } from "@/lib/services/authService";
import { UserProfile } from "@/lib/models/user";

function HighlightedText({ text, highlight, className = "" }: { text: string; highlight: string; className?: string }) {
  if (!highlight.trim()) return <span className={className}>{text}</span>;
  const parts = text.split(new RegExp(`(${highlight})`, "gi"));
  return (
    <span className={className}>
      {parts.map((part, i) =>
        part.toLowerCase() === highlight.toLowerCase() ? (
          <span key={i} className="bg-primary text-foreground px-0.5 rounded-sm">{part}</span>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </span>
  );
}

function NewChatModal({  
  isOpen, 
  onClose, 
  conversations, 
  onSelect 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  conversations: Conversation[];
  onSelect: (conv: Conversation) => void;
}) {
  const [search, setSearch] = useState("");

  if (!isOpen) return null;

  const filtered = conversations.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm" onClick={onClose}>
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }} 
        animate={{ scale: 1, opacity: 1 }} 
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-background border-4 border-foreground rounded-2xl w-full max-w-md shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col max-h-[80vh] overflow-hidden"
      >
        <div className="p-4 border-b-4 border-foreground bg-primary/20 flex justify-between items-center shrink-0">
          <h2 className="text-xl font-black uppercase tracking-tight">Nouveau Message</h2>
          <button onClick={onClose} className="p-1 hover:bg-black/5 rounded-full transition-colors"><X strokeWidth={3} className="w-6 h-6" /></button>
        </div>
        
        <div className="p-4 shrink-0">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-foreground/50 absolute left-3 top-1/2 -translate-y-1/2" strokeWidth={3} />
            <input 
              autoFocus
              className="w-full pl-9 pr-3 py-3 border-[3px] border-foreground rounded-xl bg-surface font-bold outline-none focus:ring-4 focus:ring-primary/20 transition-all text-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
              placeholder="Rechercher un contact..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 scrollbar-thin bg-surface">
          {filtered.length === 0 ? (
            <div className="text-center p-6 text-foreground/50 font-bold">Aucun contact trouvé.</div>
          ) : (
            filtered.map((conv) => (
              <button 
                key={conv.id} 
                onClick={() => onSelect(conv)} 
                className="w-full p-3 flex items-center gap-3 hover:bg-primary/20 hover:border-foreground/20 border-[3px] border-transparent rounded-xl transition-colors mb-1 text-left"
              >
                <div className="relative w-10 h-10 rounded-full border-[3px] border-foreground bg-background overflow-hidden shrink-0 flex items-center justify-center shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                  {conv.type === "group" ? (
                    <Users strokeWidth={2.5} className="w-4 h-4 text-foreground/70" />
                  ) : conv.avatarUrl ? (
                    <Image src={conv.avatarUrl} alt="" fill className="object-cover" unoptimized/>
                  ) : (
                    <User strokeWidth={2.5} className="w-4 h-4 text-foreground/70" />
                  )}
                </div>
                <div className="flex-1 overflow-hidden">
                  <h3 className="font-black truncate text-sm">
                    {conv.type === "group" && "[Groupe] "}
                    <HighlightedText text={conv.name} highlight={search} />
                  </h3>
                </div>
              </button>
            ))
          )}
        </div>
      </motion.div>
    </div>
  );
}

// Helper pour formater la date d'en-tête (ex: Aujourd'hui, Hier, Mercredi, 15/04/24)
const formatMessageDateSeparator = (dateStr: string) => {
  const d = new Date(dateStr);
  const now = new Date();
  
  // Reset hours to compare pure days
  const resetDate = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());
  
  const date1 = resetDate(d);
  const date2 = resetDate(now);
  
  const diffTime = Math.abs(date2.getTime() - date1.getTime());
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return "Aujourd'hui";
  if (diffDays === 1) return "Hier";
  
  if (diffDays < 7 && d.getDay() !== now.getDay()) {
    const days = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
    return days[d.getDay()];
  }
  
  return d.toLocaleDateString("fr-FR", { day: '2-digit', month: '2-digit', year: '2-digit' });
};

export default function MessagesPage() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoadingConvs, setIsLoadingConvs] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isMobileView, setIsMobileView] = useState(false);
  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);
  
  // Nouveaux états de suppression
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedMessageIds, setSelectedMessageIds] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // États de saisie globale (Typing Indicator)
  const [globalTyping, setGlobalTyping] = useState<Record<string, string[]>>({});
  const globalTypingTimersRef = useRef<Record<string, NodeJS.Timeout>>({});
  const globalChannelsMapRef = useRef<Map<string, any>>(new Map());

  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Ref pour conserver la valeur de selectedConv pour le Realtime (éviter de re-souscrire)
  const selectedConvRef = useRef<Conversation | null>(null);
  useEffect(() => {
    selectedConvRef.current = selectedConv;
  }, [selectedConv]);

  // Vérifier si mobile format (pour afficher/masquer la liste)
  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Défilement automatique vers le bas
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  
  // Use a string representation of the typing users for this specific conv to trigger scroll
  const currentTypingUsersStr = selectedConv ? (globalTyping[selectedConv.id] || []).join() : "";
  
  useEffect(() => {
    scrollToBottom();
  }, [messages, currentTypingUsersStr]); // scroll quand message ajouté ou qqn tape

  // --- RE-SYNCHRONISATION APRÈS VEILLE ---
  // Règle le problème du mobile qui éteint l'écran (et coupe les WebSockets).
  // Au réveil de l'écran, on force un rechargement REST des dernières données.
  useEffect(() => {
    const handleReconnexion = () => {
      if (document.visibilityState === "visible") {
        // On demande silencieusement les nouvelles données
        loadConversations();
        if (selectedConvRef.current) {
          loadMessages(true);
        }
      }
    };

    document.addEventListener("visibilitychange", handleReconnexion);
    window.addEventListener("focus", handleReconnexion);

    return () => {
      document.removeEventListener("visibilitychange", handleReconnexion);
      window.removeEventListener("focus", handleReconnexion);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Chargement initial
  const loadConversations = async () => {
    try {
      const profile = await authService.getProfile();
      setCurrentUser(profile);
      const convs = await chatService.getConversations();
      setConversations(convs);
    } catch (e) {
      console.error("Erreur gérant les conversations", e);
    } finally {
      setIsLoadingConvs(false);
    }
  };

  // Chargement des messages pour la conv active (silent: ne pas afficher le spinner)
  const loadMessages = async (silent = false) => {
    const convToLoad = selectedConvRef.current;
    if (!convToLoad) return;
    if (!silent) setIsLoadingMessages(true);
    try {
      if (convToLoad.type === "direct") {
        const msgs = await chatService.getDirectMessages(convToLoad.id);
        // Si c'est toujours la même conv, on met à jour le state
        if (selectedConvRef.current?.id === convToLoad.id) setMessages(msgs);
        
        if (convToLoad.unreadCount > 0) {
          await chatService.markDirectMessagesAsRead(convToLoad.id);
          setConversations(prev => prev.map(c => c.id === convToLoad.id ? { ...c, unreadCount: 0 } : c));
        }
      } else {
        const msgs = await chatService.getGroupMessages(convToLoad.id);
        if (selectedConvRef.current?.id === convToLoad.id) setMessages(msgs);
      }
    } catch (e) {
      console.error(e);
    } finally {
      if (!silent) setIsLoadingMessages(false);
    }
  };

  useEffect(() => {
    loadConversations();
    
    // Abonnement Realtime pour tous les messages (Se connecte UNE SEULE FOIS)
    const unsubscribe = chatService.subscribeToMessages(() => {
      // Dès qu'on reçoit un nouveau message globalement sur la BDD :
      loadConversations(); // Met à jour la gauche
      
      // Si on a un chat ouvert, on recharge aussi ses messages silencieusement
      if (selectedConvRef.current) {
        loadMessages(true);
      }
    });

    return () => {
      unsubscribe();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Vide la dépendance = Souscription PENDANT TOUT LE CYCLE

  // ====== GESTION GLOBALE DES CHANNELS DE TYPING ======
  const activeConvIds = useMemo(() => {
    return conversations
      .filter((c) => c.lastMessage || c.unreadCount > 0)
      .map((c) => c.id)
      .sort()
      .join(",");
  }, [conversations]);

  useEffect(() => {
    if (!currentUser) return;

    // On coupe tout avant de recréer
    globalChannelsMapRef.current.forEach((ch) => ch.unsubscribe());
    globalChannelsMapRef.current.clear();

    const activeConvs = conversations.filter((c) => c.lastMessage || c.unreadCount > 0);

    import("@/lib/supabase/client").then(({ supabase }) => {
      activeConvs.forEach((conv) => {
        const roomId = conv.type === "group" ? conv.id : [currentUser.id, conv.id].sort().join("-");
        
        const channel = supabase.channel(`typing-${roomId}`, {
          config: { broadcast: { ack: false } }
        });

        channel.on("broadcast", { event: "typing" }, (payload) => {
          const username = payload.payload.username;
          if (username === currentUser.username) return;

          setGlobalTyping((prev) => {
            const users = prev[conv.id] || [];
            if (!users.includes(username)) {
              return { ...prev, [conv.id]: [...users, username] };
            }
            return prev;
          });

          const timerKey = `${conv.id}-${username}`;
          if (globalTypingTimersRef.current[timerKey]) {
            clearTimeout(globalTypingTimersRef.current[timerKey]);
          }

          globalTypingTimersRef.current[timerKey] = setTimeout(() => {
            setGlobalTyping((prev) => {
              const users = prev[conv.id] || [];
              const filtered = users.filter((u) => u !== username);
              if (filtered.length === 0) {
                const newMap = { ...prev };
                delete newMap[conv.id];
                return newMap;
              }
              return { ...prev, [conv.id]: filtered };
            });
          }, 3000);
        }).subscribe((status) => {
          if (status === "SUBSCRIBED") {
            globalChannelsMapRef.current.set(conv.id, channel);
          }
        });
      });
    });

    return () => {
      globalChannelsMapRef.current.forEach((ch) => ch.unsubscribe());
      globalChannelsMapRef.current.clear();
    };
  }, [currentUser, activeConvIds, conversations]);

  // Quand on sélectionne une nouvelle conversation (au clic UI)
  useEffect(() => {
    if (selectedConv) {
      loadMessages(); // false = avec spinner la 1ère fois
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedConv]);

  // Gérer la saisie
  const handleInputChanged = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);
    
    if (selectedConv && currentUser) {
      const channel = globalChannelsMapRef.current.get(selectedConv.id);
      if (channel) {
        channel.send({
          type: "broadcast",
          event: "typing",
          payload: { username: currentUser.username }
        });
      }
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !selectedConv || isSending) return;

    const messageText = inputText.trim();
    setInputText("");
    
    // --- OPTIMISTIC UI ---
    // On l'ajoute virtuellement tout de suite
    if (currentUser) {
      const optimisticMsg: Message = {
        id: "temp-" + Date.now(),
        sender_id: currentUser.id,
        content: messageText,
        is_read: false,
        created_at: new Date().toISOString(),
        sender: currentUser,
        receiver_id: selectedConv.type === "direct" ? selectedConv.id : null,
        group_id: selectedConv.type === "group" ? selectedConv.id : null,
      };
      setMessages(prev => [...prev, optimisticMsg]);
      scrollToBottom();
    }

    setIsSending(true);
    try {
      const options = selectedConv.type === "direct" 
        ? { receiverId: selectedConv.id } 
        : { groupId: selectedConv.id };
        
      await chatService.sendMessage(messageText, options);
      // Refresh en silence
      loadMessages(true);
      loadConversations();
    } catch (e) {
      console.error("Erreur d'envoi", e);
      // En cas d'erreur, recharger les vrais messages
      loadMessages(true);
    } finally {
      setIsSending(false);
    }
  };

  const getInitials = (name: string) => name.substring(0, 2).toUpperCase();

  const renderConversationPreview = (conv: Conversation) => {
    const typs = globalTyping[conv.id];
    if (typs && typs.length > 0) {
      return (
        <span className="text-primary font-black flex items-center gap-1 opacity-90 transition-all">
          {typs.length > 1 ? "Plusieurs écrivent" : `${typs[0]} écrit`}
          <span className="flex gap-[2px] ml-1 items-end pb-[2px]">
            <motion.div animate={{ y: [0, -3, 0] }} transition={{ repeat: Infinity, duration: 0.8, delay: 0 }} className="w-1 h-1 rounded-full bg-primary" />
            <motion.div animate={{ y: [0, -3, 0] }} transition={{ repeat: Infinity, duration: 0.8, delay: 0.2 }} className="w-1 h-1 rounded-full bg-primary" />
            <motion.div animate={{ y: [0, -3, 0] }} transition={{ repeat: Infinity, duration: 0.8, delay: 0.4 }} className="w-1 h-1 rounded-full bg-primary" />
          </span>
        </span>
      );
    }
    
    if (searchQuery && conv.messages) {
      const q = searchQuery.toLowerCase();
      if (!conv.name.toLowerCase().includes(q)) {
        const matchedMessage = [...conv.messages].reverse().find((m) => m.content.toLowerCase().includes(q));
        if (matchedMessage) {
          return (
            <span className="flex items-center gap-1">
              <Search strokeWidth={3} className="w-3 h-3 text-foreground/50 shrink-0" />
              <span className="truncate inline-block w-full">
                {matchedMessage.sender_id === currentUser?.id ? "Vous: " : ""}
                <HighlightedText text={matchedMessage.content} highlight={searchQuery} />
              </span>
            </span>
          );
        }
      }
    }
    if (conv.lastMessage) {
      return (
        <span className="truncate block">
          {conv.lastMessage.sender_id === currentUser?.id ? "Vous: " : ""}
          {conv.lastMessage.content}
        </span>
      );
    }
    return <span className="italic">Nouvelle discussion</span>;
  };

  // Le filtre principal montre UNIQUEMENT les conversations ACTIVES !
  // Si une recherche est faite, on cherche dans les noms ET dans les messages des discussions actives.
  const displayedConversations = useMemo(() => {
    // Seules les conversations avec un message ou badge non lu
    const activeConvs = conversations.filter((c) => c.lastMessage || c.unreadCount > 0);
    
    if (!searchQuery) return activeConvs;
    
    const q = searchQuery.toLowerCase();
    return activeConvs.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.messages && c.messages.some((m) => m.content.toLowerCase().includes(q)))
    );
  }, [conversations, searchQuery]);

  // Rendu bulle de message
  const renderMessage = (msg: Message, isMe: boolean) => {
    const isSelected = selectedMessageIds.includes(msg.id);

    return (
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        key={msg.id} 
        className={`flex w-full mb-4 ${isMe ? 'justify-end' : 'justify-start'} ${isSelectionMode ? 'cursor-pointer' : ''}`}
        onClick={() => {
          if (isSelectionMode) {
            setSelectedMessageIds((prev) => 
              prev.includes(msg.id) ? prev.filter((id) => id !== msg.id) : [...prev, msg.id]
            );
          }
        }}
      >
        <div className={`flex max-w-[85%] md:max-w-[70%] ${isMe ? 'flex-row-reverse' : 'flex-row'} items-end gap-2`}>
          {!isMe && selectedConv?.type === 'group' && (
             <div className="w-8 h-8 rounded-full border-2 border-foreground bg-surface overflow-hidden shrink-0 flex items-center justify-center">
               {msg.sender?.avatar_url ? (
                 <Image src={msg.sender.avatar_url} alt="" width={32} height={32} className="object-cover" unoptimized/>
               ) : (
                 <span className="text-[10px] font-black">{msg.sender?.username ? getInitials(msg.sender.username) : '?'}</span>
               )}
             </div>
          )}
          <div className="flex flex-col gap-1">
             {!isMe && selectedConv?.type === 'group' && (
               <span className="text-[10px] font-bold text-foreground/60 ml-2">{msg.sender?.username}</span>
             )}
             <div className={`p-3 px-4 border-[3px] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all ${
               isSelected 
                 ? "border-red-500 scale-95 opacity-80 bg-red-100 dark:bg-red-900/40 text-foreground" 
                 : `border-foreground ${isMe ? 'bg-primary text-foreground' : 'bg-surface text-foreground'}`
             } ${isMe ? 'rounded-t-xl rounded-l-xl rounded-br-sm' : 'rounded-t-xl rounded-r-xl rounded-bl-sm'}`}>
               <p className="text-sm font-medium whitespace-pre-wrap word-break">{msg.content}</p>
             </div>
             <span className={`text-[10px] font-bold text-foreground/40 mt-1 ${isMe ? 'text-right mr-1' : 'ml-1'}`}>
               {new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
             </span>
          </div>
        </div>
      </motion.div>
    );
  };

  const isChatActiveOnMobile = isMobileView && selectedConv !== null;

  // Gérer le bouton retour natif du téléphone (popstate)
  useEffect(() => {
    const handlePopState = () => {
      const urlParams = new URLSearchParams(window.location.search);
      // Si l'URL ne contient plus 'chat', on ferme la discussion
      if (!urlParams.has("chat")) {
        setSelectedConv(null);
        setSearchQuery("");
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const handleSelectConv = (conv: Conversation) => {
    setSelectedConv(conv);
    if (isMobileView) {
      // Pousse un historique pour que le bouton retour du tel trouve une marche arrière
      window.history.pushState({ chatOpen: true }, "", "?chat=" + conv.id);
    }
  };

  const handleBackToConversations = () => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has("chat")) {
      window.history.back();
    } else {
      setSelectedConv(null);
      setSearchQuery("");
      setIsSelectionMode(false);
      setSelectedMessageIds([]);
    }
  };

  const handleDeleteConversation = async () => {
    if (!currentUser || !selectedConv) return;
    if (!confirm("Voulez-vous vraiment supprimer toute cette conversation pour vous ?")) return;
    setIsDeleting(true);
    try {
      await chatService.deleteConversation(selectedConv.id, selectedConv.type === "group", currentUser.id);
      handleBackToConversations();
      loadConversations(); // Recharger la liste pour l'effacer
    } catch (e) {
      console.error(e);
      alert("Erreur lors de la suppression.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteMessages = async () => {
    if (selectedMessageIds.length === 0) return;
    if (!confirm(`Supprimer ${selectedMessageIds.length} message(s) ?`)) return;
    setIsDeleting(true);
    try {
      await chatService.deleteMessages(selectedMessageIds);
      setMessages((prev) => prev.filter((m) => !selectedMessageIds.includes(m.id)));
      setIsSelectionMode(false);
      setSelectedMessageIds([]);
    } catch (e) {
      console.error(e);
      alert("Erreur lors de la suppression.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <div 
        className="flex flex-col bg-background overflow-hidden w-full"
        style={{
          // Sur mobile : on calcule l'espace dispo EXACT entre le header top (68px) et la nav bottom (86px)
          // La page "fond" est fixe
          height: isMobileView ? "calc(100dvh - 68px - 86px)" : "100vh",
          marginTop: "0px",
          paddingTop: isMobileView ? "0px" : "112px", // md:pt-28 sur desktop
          paddingBottom: isMobileView ? "0px" : "40px", // md:pb-10
          paddingLeft: isMobileView ? "0px" : "2rem", // md:px-8
          paddingRight: isMobileView ? "0px" : "2rem",
        }}
      >
      <div className="flex w-full h-full md:max-w-6xl mx-auto md:border-4 md:border-foreground md:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] bg-surface md:rounded-2xl overflow-hidden relative">
        
          {/* SIDEBAR CONVERSATIONS (Cachée sur mobile si on est dans un chat) */}
          {(!isMobileView || !selectedConv) && (
            <div className={`w-full md:w-1/3 flex flex-col md:border-r-4 border-foreground bg-surface/50 h-full`}>
              {/* Header Sidebar (Bloqué en haut, ne scrolle pas) */}
              <div className="p-4 border-b-4 border-foreground bg-primary/20 shrink-0">
                <h1 className="text-xl md:text-2xl font-black uppercase tracking-tight flex items-center gap-2 mb-3">
                  <MessageSquare className="w-6 h-6 hidden" /> Messages
                </h1>
                
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-foreground/50 absolute left-3 top-1/2 -translate-y-1/2" strokeWidth={3} />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Discussions, messages..."
                      className="w-full pl-9 pr-3 py-2 border-[3px] border-foreground rounded-xl bg-background font-bold text-sm outline-none focus:ring-2 focus:ring-primary/50 transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                    />
                  </div>
                  <button 
                    onClick={() => setIsNewChatModalOpen(true)}
                    className="w-[42px] h-[42px] flex flex-col items-center justify-center bg-surface border-[3px] border-foreground rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all shrink-0"
                  >
                    <Plus strokeWidth={4} className="w-5 h-5 text-foreground" />
                  </button>
                </div>
              </div>

              {/* Liste (LA SEULE CHOSE QUI SCROLLE ICI) */}
              <div className="flex-1 overflow-y-auto p-2 scrollbar-thin">
                {isLoadingConvs ? (
                  <div className="w-full h-full flex items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  </div>
                ) : displayedConversations.length === 0 ? (
                  <div className="text-center p-6 text-foreground/50 font-bold mt-10">
                    <p>{searchQuery ? "Aucun ami trouvé avec ce nom." : "Aucune conversation active."}</p>
                    {searchQuery === "" && (
                      <p className="text-xs mt-2">Utilisez la barre de recherche pour trouver un ami et démarrer la discussion !</p>
                    )}
                  </div>
                ) : (
                  displayedConversations.map((conv) => (
                    <motion.div
                      key={conv.id}
                      whileHover={{ scale: 0.98, x: 4 }}
                      onClick={() => handleSelectConv(conv)}
                      className={`flex items-center gap-3 p-3 mb-2 rounded-xl border-4 cursor-pointer transition-colors ${
                        selectedConv?.id === conv.id 
                          ? "bg-primary border-foreground shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]" 
                          : "bg-surface border-transparent hover:border-foreground/20"
                      }`}
                    >
                      {/* Avatar */}
                      <div className="relative w-12 h-12 rounded-full border-[3px] border-foreground bg-surface overflow-hidden shrink-0 flex items-center justify-center shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                        {conv.type === "group" ? (
                          <Users strokeWidth={2.5} className="w-5 h-5 text-foreground/70" />
                        ) : conv.avatarUrl ? (
                          <Image src={conv.avatarUrl} alt="" fill className="object-cover" unoptimized/>
                        ) : (
                          <User strokeWidth={2.5} className="w-5 h-5 text-foreground/70" />
                        )}
                        {conv.unreadCount > 0 && (
                          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-surface block" />
                        )}
                      </div>

                      {/* Infos */}
                      <div className="flex-1 overflow-hidden">
                        <div className="flex justify-between items-end mb-1">
                          <h3 className="font-black truncate text-sm">
                            {conv.type === "group" && "[Groupe] "}
                            <HighlightedText text={conv.name} highlight={searchQuery} />
                          </h3>
                          {conv.lastMessage && (
                            <span className="text-[10px] font-bold text-foreground/50 shrink-0 ml-2">
                              {new Date(conv.lastMessage.created_at).toLocaleDateString([], {day:'2-digit', month:'2-digit'})}
                            </span>
                          )}
                        </div>
                        <div className={`text-xs w-full overflow-hidden ${conv.unreadCount > 0 ? 'font-black text-foreground' : 'font-bold text-foreground/60'}`}>
                          {renderConversationPreview(conv)}
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* MAIN CHAT AREA (Caché sur mobile si pas de chat sélectionné) */}
          {(!isMobileView || selectedConv) && (
            <div 
              className={
                isMobileView && selectedConv
                  ? "fixed inset-0 z-[100] flex flex-col bg-background w-full h-[100dvh]"
                  : "w-full md:w-2/3 flex flex-col h-full bg-background/50 relative hidden md:flex"
              }
            >
              
              {selectedConv ? (
                <>
                  {/* Chat Header (Bloqué en haut, ne scrolle pas) */}
                  <div className="p-4 border-b-4 border-foreground bg-surface flex items-center gap-3 shrink-0">
                    {/* Bouton Retour Mobile */}
                    <button 
                      onClick={handleBackToConversations}
                      className="md:hidden w-10 h-10 border-[3px] border-foreground rounded-full flex items-center justify-center bg-surface shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all mr-2 shrink-0"
                    >
                      <ArrowLeft strokeWidth={3} className="w-5 h-5" />
                    </button>

                    <div className="relative w-12 h-12 rounded-full border-[3px] border-foreground bg-surface overflow-hidden shrink-0 flex items-center justify-center shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                        {selectedConv.type === "group" ? (
                          <Users strokeWidth={2.5} className="w-5 h-5 text-foreground/70" />
                        ) : selectedConv.avatarUrl ? (
                          <Image src={selectedConv.avatarUrl} alt="" fill className="object-cover" unoptimized/>
                        ) : (
                          <User strokeWidth={2.5} className="w-5 h-5 text-foreground/70" />
                        )}
                    </div>
                    <div>
                      <h2 className="font-black text-lg">{selectedConv.name}</h2>
                      <p className="text-xs font-bold text-foreground/50">
                        {selectedConv.type === "group" ? "Discussion de groupe" : "Discussion privée"}
                      </p>
                    </div>
                    
                    <div className="ml-auto flex items-center gap-2">
                      <button 
                        title="Sélectionner des messages"
                        onClick={() => {
                          setIsSelectionMode(!isSelectionMode);
                          if (isSelectionMode) setSelectedMessageIds([]);
                        }}
                        className={`w-10 h-10 md:w-11 md:h-11 border-[3px] border-foreground rounded-full flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all shrink-0 ${isSelectionMode ? 'bg-primary' : 'bg-surface'}`}
                      >
                        <ListChecks strokeWidth={3} className="w-5 h-5 md:w-6 md:h-6" />
                      </button>
                      <button 
                        title="Supprimer la conversation"
                        onClick={handleDeleteConversation}
                        disabled={isDeleting}
                        className="w-10 h-10 md:w-11 md:h-11 border-[3px] border-foreground rounded-full flex items-center justify-center bg-red-400 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all disabled:opacity-50 shrink-0"
                      >
                        {isDeleting && selectedMessageIds.length === 0 ? <Loader2 className="w-5 h-5 animate-spin text-white" /> : <Trash2 strokeWidth={3} className="w-5 h-5 md:w-6 md:h-6 text-white" />}
                      </button>
                    </div>
                  </div>

                  {/* Chat Messages (LA SEULE CHOSE QUI SCROLLE ICI) */}
                  <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-[#f8f9fa] dark:bg-black/20 pb-4">
                    {isLoadingMessages ? (
                      <div className="w-full h-full flex items-center justify-center">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="w-full h-full flex items-center justify-center flex-col text-foreground/40 font-bold gap-3">
                        <MessageSquare className="w-12 h-12 opacity-50" strokeWidth={1.5} />
                        <p>Dites bonjour ! 👋</p>
                      </div>
                    ) : (
                      <div className="flex flex-col justify-end min-h-[100%]">
                        {(() => {
                           let lastDateLabel = "";
                           return messages.map((msg) => {
                             const currentLabel = formatMessageDateSeparator(msg.created_at);
                             const showSeparator = currentLabel !== lastDateLabel;
                             lastDateLabel = currentLabel;
                             
                             return (
                               <React.Fragment key={msg.id}>
                                 {showSeparator && (
                                   <div className="flex justify-center w-full my-6">
                                      <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-foreground/60 border-[3px] border-foreground px-4 py-1.5 rounded-full bg-surface shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                         {currentLabel}
                                      </span>
                                   </div>
                                 )}
                                 {renderMessage(msg, msg.sender_id === currentUser?.id)}
                               </React.Fragment>
                             );
                           });
                        })()}
                        
                        {/* Typing Indicator */}
                        {(() => {
                           const currentTyps = globalTyping[selectedConv?.id || ""] || [];
                           if (currentTyps.length === 0) return null;
                           return (
                              <motion.div 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex w-full mb-4 justify-start"
                              >
                                <div className="flex items-end gap-2 max-w-[85%] md:max-w-[70%]">
                                  <div className="flex flex-col gap-1">
                                    <span className="text-[10px] font-bold text-foreground/60 ml-2">
                                      {currentTyps.join(", ")} {currentTyps.length > 1 ? "écrivent..." : "écrit..."}
                                    </span>
                                    <div className="p-3 px-4 border-[3px] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] bg-surface text-foreground rounded-t-xl rounded-r-xl rounded-bl-sm border-foreground flex gap-1.5 items-center w-fit h-fit mt-1">
                                      <motion.div animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.8, delay: 0 }} className="w-2 h-2 rounded-full bg-foreground opacity-50" />
                                      <motion.div animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.8, delay: 0.2 }} className="w-2 h-2 rounded-full bg-foreground opacity-50" />
                                      <motion.div animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.8, delay: 0.4 }} className="w-2 h-2 rounded-full bg-foreground opacity-50" />
                                    </div>
                                  </div>
                                </div>
                              </motion.div>
                           )
                        })()}

                        <div ref={messagesEndRef} />
                      </div>
                    )}
                  </div>

                  {/* Chat Input */}
                  <div className="p-3 md:p-4 border-t-4 border-foreground bg-surface shrink-0">
                    {isSelectionMode ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setIsSelectionMode(false);
                            setSelectedMessageIds([]);
                          }}
                          className="flex-1 p-3 md:p-4 border-[3px] border-foreground rounded-2xl bg-surface font-black transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none text-sm md:text-base outline-none focus:ring-4 focus:ring-primary/20"
                        >
                          Annuler
                        </button>
                        <button
                          onClick={handleDeleteMessages}
                          disabled={selectedMessageIds.length === 0 || isDeleting}
                          className="flex-[2] p-3 md:p-4 border-[3px] border-foreground rounded-2xl bg-red-500 text-white font-black transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2 text-sm md:text-base outline-none focus:ring-4 focus:ring-red-500/20"
                        >
                          {isDeleting ? <Loader2 className="w-5 h-5 animate-spin"/> : <Trash2 strokeWidth={3} className="w-5 h-5"/>}
                          Supprimer ({selectedMessageIds.length})
                        </button>
                      </div>
                    ) : (
                      <form onSubmit={handleSendMessage} className="flex gap-2">
                        <input
                          type="text"
                          value={inputText}
                          onChange={handleInputChanged}
                          placeholder="Tapez votre message..."
                          className="flex-1 p-3 border-[3px] border-foreground rounded-2xl bg-background font-bold outline-none focus:ring-4 focus:ring-primary/20 transition-all text-sm md:text-base"
                        />
                        <button
                          type="submit"
                          disabled={isSending || !inputText.trim()}
                          className="w-12 md:w-16 flex items-center justify-center bg-primary border-[3px] border-foreground rounded-2xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all disabled:opacity-50 disabled:active:translate-x-0 disabled:active:translate-y-0 disabled:active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] shrink-0"
                        >
                          {isSending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send strokeWidth={3} className="w-5 h-5 md:w-6 md:h-6" />}
                        </button>
                      </form>
                    )}
                  </div>
                </>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-foreground/40 gap-4 p-8 text-center shrink-0">
                  <div className="w-24 h-24 rounded-full border-4 border-foreground flex items-center justify-center opacity-30 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    <Send className="w-10 h-10" strokeWidth={3} />
                  </div>
                  <h3 className="text-xl font-black opacity-50">Vos Messages</h3>
                  <p className="font-bold text-sm max-w-sm">Sélectionnez une conversation dans la liste pour commencer à discuter avec vos amis ou vos groupes.</p>
                </div>
              )}

            </div>
          )}
      </div>
    </div>
    <AnimatePresence>
      {isNewChatModalOpen && (
        <NewChatModal 
            isOpen={isNewChatModalOpen} 
            onClose={() => setIsNewChatModalOpen(false)} 
            conversations={conversations} 
            onSelect={(conv: Conversation) => {
              setIsNewChatModalOpen(false);
              handleSelectConv(conv);
            }} 
        />
      )}
    </AnimatePresence>
    </>
  );
}
