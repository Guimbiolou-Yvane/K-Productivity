"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Bell, BellOff, Trash2, CheckCheck, ExternalLink,
  Users, UserPlus, Zap, Info, ArrowLeft, Filter
} from "lucide-react";
import { useRouter } from "next/navigation";
import { notificationService, AppNotification } from "@/lib/services/notificationService";
import { authService } from "@/lib/services/authService";
import { supabase } from "@/lib/supabase/client";

const TYPE_CONFIG: Record<AppNotification["type"], { icon: React.ElementType; color: string; bg: string; label: string }> = {
  friend_request:  { icon: UserPlus, color: "text-blue-600",   bg: "bg-blue-400",   label: "Ami" },
  group_invite:    { icon: Users,    color: "text-purple-600", bg: "bg-purple-400", label: "Groupe" },
  habit_completed: { icon: Zap,      color: "text-green-600",  bg: "bg-green-400",  label: "Objectif" },
  reminder:        { icon: Bell,     color: "text-yellow-600", bg: "bg-yellow-400", label: "Rappel" },
  info:            { icon: Info,     color: "text-gray-600",   bg: "bg-gray-400",   label: "Info" },
};

const ALL_TYPES = ["tous", "friend_request", "group_invite", "habit_completed", "reminder", "info"] as const;
type FilterType = typeof ALL_TYPES[number];

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "À l'instant";
  if (m < 60) return `il y a ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `il y a ${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `il y a ${d}j`;
  return new Date(dateStr).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

function groupByDate(notifications: AppNotification[]): { label: string; items: AppNotification[] }[] {
  const groups: Record<string, AppNotification[]> = {};
  const today = new Date().toDateString();
  const yesterday = new Date(Date.now() - 86400000).toDateString();

  for (const n of notifications) {
    const d = new Date(n.created_at).toDateString();
    const label = d === today ? "Aujourd'hui" : d === yesterday ? "Hier" : new Date(n.created_at).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
    if (!groups[label]) groups[label] = [];
    groups[label].push(n);
  }

  return Object.entries(groups).map(([label, items]) => ({ label, items }));
}

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>("tous");

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await notificationService.getNotifications();
      setNotifications(data);
    } catch (e) { console.error(e); }
    finally { setIsLoading(false); }
  }, []);

  useEffect(() => {
    load();

    let channel: ReturnType<typeof supabase.channel> | null = null;
    authService.getProfile().then((profile) => {
      if (!profile) return;
      channel = supabase
        .channel("notif-page-realtime-" + profile.id)
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${profile.id}` },
          (payload) => { setNotifications((prev) => [payload.new as AppNotification, ...prev]); }
        )
        .subscribe();
    });

    return () => { channel?.unsubscribe(); };
  }, [load]);

  // Marquer comme lu à l'arrivée
  useEffect(() => {
    notificationService.markAllAsRead().catch(() => {});
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  }, []);

  const handleClick = (notif: AppNotification) => {
    if (notif.link) router.push(notif.link);
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await notificationService.deleteNotification(id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const handleClearAll = async () => {
    await notificationService.clearAll();
    setNotifications([]);
  };

  const filtered = filter === "tous"
    ? notifications
    : notifications.filter((n) => n.type === filter);

  const grouped = groupByDate(filtered);
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* HEADER */}
      <div className="sticky top-0 z-10 bg-surface border-b-4 border-foreground">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => router.back()}
              className="p-2 border-[3px] border-foreground bg-surface shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all"
            >
              <ArrowLeft size={18} strokeWidth={3} />
            </motion.button>
            <div className="w-9 h-9 flex items-center justify-center bg-primary border-[3px] border-foreground shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] shrink-0">
              <Bell size={18} strokeWidth={3} />
            </div>
            <div>
              <h1 className="text-xl font-black uppercase tracking-tight leading-none flex items-center gap-2">
                Notifications
                {unreadCount > 0 && (
                  <span className="bg-red-500 text-white text-xs font-black px-2 py-0.5 rounded-full">
                    {unreadCount}
                  </span>
                )}
              </h1>
              <p className="font-bold text-foreground/50 text-xs mt-0.5 hidden sm:block">
                Toutes vos activités et interactions.
              </p>
            </div>
          </div>

          {notifications.length > 0 && (
            <div className="flex items-center gap-2">
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => {
                  notificationService.markAllAsRead();
                  setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
                }}
                title="Tout marquer comme lu"
                className="p-2 border-[3px] border-foreground bg-surface shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all"
              >
                <CheckCheck size={16} strokeWidth={3} />
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={handleClearAll}
                title="Tout supprimer"
                className="p-2 border-[3px] border-foreground bg-red-400 text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all"
              >
                <Trash2 size={16} strokeWidth={3} />
              </motion.button>
            </div>
          )}
        </div>

        {/* FILTRES */}
        <div className="max-w-3xl mx-auto px-4 pb-3 flex items-center gap-2">
          <div className="flex items-center gap-1.5 shrink-0">
            <Filter size={14} strokeWidth={3} className="text-foreground/40" />
            <span className="text-[10px] font-black uppercase text-foreground/40 whitespace-nowrap">Filtrer par :</span>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            {ALL_TYPES.map((type) => {
              const cfg = type !== "tous" ? TYPE_CONFIG[type] : null;
              const isActive = filter === type;
              return (
                <motion.button
                  key={type}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setFilter(type)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 border-[3px] text-xs font-black uppercase whitespace-nowrap transition-all shrink-0 ${
                    isActive
                      ? "bg-foreground text-background border-foreground shadow-none"
                      : "bg-surface border-foreground shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:brightness-95 active:shadow-none active:translate-x-[2px] active:translate-y-[2px]"
                  }`}
                >
                  {cfg && <cfg.icon size={12} strokeWidth={3} />}
                  {type === "tous" ? "Toutes" : cfg?.label}
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>

      {/* CONTENU */}
      <div className="max-w-3xl mx-auto px-4 py-6">
        {isLoading ? (
          <div className="flex flex-col gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-start gap-3 p-4 border-4 border-foreground bg-surface animate-pulse">
                <div className="w-12 h-12 bg-foreground/10 shrink-0" />
                <div className="flex-1 flex flex-col gap-2">
                  <div className="h-4 bg-foreground/10 rounded w-3/4" />
                  <div className="h-3 bg-foreground/10 rounded w-full" />
                  <div className="h-2 bg-foreground/10 rounded w-1/4" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-5">
            <div className="w-20 h-20 border-4 border-foreground/10 flex items-center justify-center bg-surface">
              <BellOff size={40} strokeWidth={1.5} className="text-foreground/20" />
            </div>
            <p className="font-black uppercase text-foreground/30 text-sm tracking-wider text-center">
              {filter === "tous" ? "Aucune notification" : `Aucune notification de type « ${TYPE_CONFIG[filter as keyof typeof TYPE_CONFIG]?.label} »`}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-8">
            {grouped.map(({ label, items }) => (
              <section key={label}>
                <div className="flex items-center gap-3 mb-3">
                  <span className="font-black uppercase text-xs tracking-widest text-foreground/40">{label}</span>
                  <div className="flex-1 h-[2px] bg-foreground/10" />
                </div>

                <AnimatePresence initial={false}>
                  <div className="flex flex-col gap-2">
                    {items.map((notif) => {
                      const cfg = TYPE_CONFIG[notif.type] ?? TYPE_CONFIG.info;
                      const Icon = cfg.icon;
                      return (
                        <motion.div
                          key={notif.id}
                          layout
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, x: 30, height: 0 }}
                          transition={{ type: "spring", stiffness: 400, damping: 30 }}
                          onClick={() => handleClick(notif)}
                          className={`flex items-start gap-4 p-4 border-4 border-foreground relative group cursor-pointer transition-all shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] ${
                            notif.is_read ? "bg-surface opacity-70" : "bg-surface"
                          }`}
                        >
                          {!notif.is_read && (
                            <span className="absolute left-0 top-0 bottom-0 w-1.5 bg-primary" />
                          )}
                          <div className={`w-12 h-12 shrink-0 flex items-center justify-center border-[3px] border-foreground shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${cfg.bg}`}>
                            <Icon size={20} strokeWidth={3} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <p className="font-black text-base leading-tight">{notif.title}</p>
                              <span className="text-[10px] font-bold uppercase text-muted whitespace-nowrap shrink-0 mt-0.5">
                                {timeAgo(notif.created_at)}
                              </span>
                            </div>
                            <p className="text-sm text-foreground/70 mt-1 leading-snug">{notif.body}</p>
                            {notif.link && (
                              <div className="flex items-center gap-1 mt-2">
                                <ExternalLink size={11} strokeWidth={3} className="text-primary" />
                                <span className="text-[11px] font-black uppercase text-primary">Voir</span>
                              </div>
                            )}
                          </div>
                          <motion.button
                            whileTap={{ scale: 0.9 }}
                            onClick={(e) => handleDelete(e, notif.id)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity p-2 border-[3px] border-foreground bg-red-100 hover:bg-red-300 shrink-0 self-center"
                            title="Supprimer"
                          >
                            <Trash2 size={14} strokeWidth={3} />
                          </motion.button>
                        </motion.div>
                      );
                    })}
                  </div>
                </AnimatePresence>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
