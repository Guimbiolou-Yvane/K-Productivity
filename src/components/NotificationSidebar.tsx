"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Bell, BellOff, Trash2, CheckCheck, ExternalLink, Users, UserPlus, Zap, Info } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { notificationService, AppNotification } from "@/lib/services/notificationService";
import { authService } from "@/lib/services/authService";

interface NotificationSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onUnreadCountChange?: (count: number) => void;
}

const TYPE_CONFIG: Record<AppNotification["type"], { icon: React.ElementType; color: string; label: string }> = {
  friend_request: { icon: UserPlus, color: "bg-blue-400", label: "Ami" },
  group_invite:   { icon: Users,    color: "bg-purple-400", label: "Groupe" },
  habit_completed:{ icon: Zap,      color: "bg-green-400", label: "Objectif" },
  reminder:       { icon: Bell,     color: "bg-yellow-400", label: "Rappel" },
  info:           { icon: Info,     color: "bg-gray-400", label: "Info" },
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "À l'instant";
  if (m < 60) return `il y a ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `il y a ${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `il y a ${d}j`;
  return new Date(dateStr).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

export default function NotificationSidebar({ isOpen, onClose, onUnreadCountChange }: NotificationSidebarProps) {
  const router = useRouter();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await notificationService.getNotifications();
      setNotifications(data);
    } catch (e) { console.error(e); }
    finally { setIsLoading(false); }
  }, []);

  // Charger dès l'ouverture + souscrire en temps réel
  useEffect(() => {
    if (!isOpen) return;
    load();

    let channel: ReturnType<typeof notificationService.subscribe> | null = null;
    authService.getProfile().then((profile) => {
      if (!profile) return;
      channel = notificationService.subscribe(profile.id, (newNotif) => {
        setNotifications((prev) => [newNotif, ...prev]);
      });
    });

    return () => { channel?.unsubscribe(); };
  }, [isOpen, load]);

  const handleClick = async (notif: AppNotification) => {
    if (!notif.is_read) {
      await notificationService.markAsRead(notif.id);
      setNotifications((prev) =>
        prev.map((n) => n.id === notif.id ? { ...n, is_read: true } : n)
      );
    }
    if (notif.link) {
      router.push(notif.link);
      onClose();
    }
  };

  const handleMarkAllRead = async () => {
    await notificationService.markAllAsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
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

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  // Informer le parent du compteur de non-lus
  useEffect(() => {
    onUnreadCountChange?.(unreadCount);
  }, [unreadCount, onUnreadCountChange]);

  // Quand la sidebar se ferme, marquer tout comme lu automatiquement
  useEffect(() => {
    if (!isOpen && notifications.some((n) => !n.is_read)) {
      notificationService.markAllAsRead().catch(() => {});
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    }
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* OVERLAY */}
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm"
          />

          {/* SIDEBAR */}
          <motion.aside
            key="sidebar"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 400, damping: 38 }}
            className="fixed top-0 right-0 h-full w-full max-w-sm z-50 flex flex-col bg-surface border-l-4 border-foreground shadow-[-6px_0px_0px_0px_rgba(0,0,0,1)]"
          >
            {/* FOOTER sidebar → lien page complète */}
            <div className="shrink-0 border-t-4 border-foreground p-3 bg-surface">
              <Link
                href="/notifications"
                onClick={onClose}
                className="flex items-center justify-center gap-2 w-full py-2 border-[3px] border-foreground bg-primary font-black uppercase text-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all hover:brightness-95"
              >
                <ExternalLink size={14} strokeWidth={3} />
                Voir toutes les notifications
              </Link>
            </div>
            <div className="flex items-center justify-between p-4 border-b-4 border-foreground bg-primary shrink-0">
              <div className="flex items-center gap-3">
                <Bell strokeWidth={3} size={22} />
                <h2 className="font-black uppercase tracking-tight text-lg">
                  Notifications
                </h2>
                {unreadCount > 0 && (
                  <span className="bg-foreground text-background text-xs font-black px-2 py-0.5 rounded-full">
                    {unreadCount}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={handleMarkAllRead}
                    title="Tout marquer comme lu"
                    className="p-1.5 border-2 border-foreground bg-surface shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all"
                  >
                    <CheckCheck size={16} strokeWidth={3} />
                  </motion.button>
                )}
                {notifications.length > 0 && (
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={handleClearAll}
                    title="Tout supprimer"
                    className="p-1.5 border-2 border-foreground bg-red-400 text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all"
                  >
                    <Trash2 size={16} strokeWidth={3} />
                  </motion.button>
                )}
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={onClose}
                  className="p-1.5 border-2 border-foreground bg-surface shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all"
                >
                  <X size={18} strokeWidth={3} />
                </motion.button>
              </div>
            </div>

            {/* LISTE */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {isLoading ? (
                /* SKELETON */
                <div className="flex flex-col gap-0">
                  {[1,2,3].map((i) => (
                    <div key={i} className="flex items-start gap-3 p-4 border-b-2 border-foreground/10 animate-pulse">
                      <div className="w-10 h-10 bg-foreground/10 rounded shrink-0" />
                      <div className="flex-1 flex flex-col gap-2">
                        <div className="h-4 bg-foreground/10 rounded w-3/4" />
                        <div className="h-3 bg-foreground/10 rounded w-full" />
                        <div className="h-2 bg-foreground/10 rounded w-1/3" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-4 p-8 text-center">
                  <BellOff size={48} strokeWidth={1.5} className="text-foreground/20" />
                  <p className="font-bold uppercase text-foreground/40 text-sm">
                    Aucune notification pour le moment
                  </p>
                </div>
              ) : (
                <AnimatePresence initial={false}>
                  {notifications.map((notif) => {
                    const cfg = TYPE_CONFIG[notif.type] ?? TYPE_CONFIG.info;
                    const Icon = cfg.icon;
                    return (
                      <motion.div
                        key={notif.id}
                        layout
                        initial={{ opacity: 0, x: 30 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 30, height: 0 }}
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                        onClick={() => handleClick(notif)}
                        className={`flex items-start gap-3 p-4 border-b-2 border-foreground/10 cursor-pointer transition-colors relative group ${
                          notif.is_read ? "bg-surface opacity-70" : "bg-surface hover:brightness-105"
                        }`}
                      >
                        {/* Indicateur non lu */}
                        {!notif.is_read && (
                          <span className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />
                        )}

                        {/* Icone type */}
                        <div className={`w-10 h-10 shrink-0 flex items-center justify-center border-2 border-foreground shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${cfg.color}`}>
                          <Icon size={18} strokeWidth={3} />
                        </div>

                        {/* Contenu */}
                        <div className="flex-1 min-w-0">
                          <p className="font-black text-sm leading-tight truncate">{notif.title}</p>
                          <p className="text-xs text-foreground/70 mt-0.5 leading-snug line-clamp-2">{notif.body}</p>
                          <div className="flex items-center gap-2 mt-1.5">
                            <span className="text-[10px] font-bold uppercase text-muted">{timeAgo(notif.created_at)}</span>
                            {notif.link && (
                              <span className="text-[10px] font-bold uppercase text-primary flex items-center gap-0.5">
                                <ExternalLink size={9} /> Voir
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Bouton supprimer */}
                        <motion.button
                          whileTap={{ scale: 0.9 }}
                          onClick={(e) => handleDelete(e, notif.id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 border-2 border-foreground bg-red-100 hover:bg-red-300 shrink-0"
                          title="Supprimer"
                        >
                          <X size={12} strokeWidth={3} />
                        </motion.button>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
