"use client";

import React, { useState, useEffect, useRef } from "react";
import { Target, BarChart2, Users, User, Settings, Handshake, Bell, BellOff, BellRing } from "lucide-react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import Image from "next/image";
import { authService } from "@/lib/services/authService";
import { UserProfile } from "@/lib/models/user";
import { requestNotificationPermission, getNotificationPermission } from "@/components/OneSignalProvider";
import NotificationSidebar from "@/components/NotificationSidebar";
import { notificationService } from "@/lib/services/notificationService";
import { supabase } from "@/lib/supabase/client";
import { useTimezoneSync } from "@/hooks/useTimezoneSync";

const navItems = [
  { id: "home", label: "Objectif", icon: Target, href: "/" },
  { id: "stats", label: "Stats", icon: BarChart2, href: "/stats" },
  { id: "amis", label: "Amis", icon: Users, href: "/amis" },
  { id: "parametres", label: "Paramètres", icon: Settings, href: "/parametres" },
];

export default function Navigation() {
  const pathname = usePathname();
  useTimezoneSync();
  const [mounted, setMounted] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [notifPermission, setNotifPermission] = useState<NotificationPermission | "unsupported">("default");
  const [notifLoading, setNotifLoading] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const lastScrollY = React.useRef(0);

  useEffect(() => {
    setMounted(true);
    const perm = getNotificationPermission();
    setNotifPermission(perm);

    const hiddenRoutes = ["/login", "/auth"];
    const isHidden = hiddenRoutes.some(route => pathname.startsWith(route));

    const loadProfile = async () => {
      try {
        const userProfile = await authService.getProfile();
        setProfile(userProfile);

        if (perm === "granted" && userProfile) {
          notificationService.getUnreadCount().then(setUnreadCount).catch(() => {});

          // Souscription Realtime persistante pour le badge
          const channel = supabase
            .channel("nav-notif-realtime-" + userProfile.id)
            .on(
              "postgres_changes",
              {
                event: "INSERT",
                schema: "public",
                table: "notifications",
                filter: `user_id=eq.${userProfile.id}`,
              },
              () => {
                setUnreadCount((c) => c + 1);
                if (typeof navigator !== "undefined" && navigator.vibrate) {
                  navigator.vibrate([50, 30, 50]);
                }
              }
            )
            .on(
              "postgres_changes",
              {
                event: "UPDATE",
                schema: "public",
                table: "notifications",
                filter: `user_id=eq.${userProfile.id}`,
              },
              () => {
                notificationService.getUnreadCount().then(setUnreadCount).catch(() => {});
              }
            )
            .subscribe();

          return () => { supabase.removeChannel(channel); };
        }
      } catch (err) {
        console.error("Could not fetch user profile", err);
      }
    };

    if (!isHidden) {
      loadProfile();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const handleNotifClick = async () => {
    if (notifPermission === "granted") {
      setIsNotifOpen((v) => !v);
      return;
    }
    if (notifPermission === "denied") return;
    setNotifLoading(true);
    const result = await requestNotificationPermission();
    setNotifPermission(result as NotificationPermission);
    if (result === "granted") {
      const count = await notificationService.getUnreadCount();
      setUnreadCount(count);
      setIsNotifOpen(true);
    }
    setNotifLoading(false);
  };

  const NotifIcon = notifPermission === "granted"
    ? BellRing
    : notifPermission === "denied"
    ? BellOff
    : Bell;

  const notifLabel = notifPermission === "granted"
    ? "Notifications actives"
    : notifPermission === "denied"
    ? "Notifications bloquées"
    : "Activer les notifications";

  const notifColor = notifPermission === "granted"
    ? isNotifOpen
      ? "bg-foreground text-background border-foreground"
      : "bg-surface border-foreground"
    : notifPermission === "denied"
    ? "bg-red-400 border-foreground text-white"
    : "bg-primary border-foreground animate-pulse";

  // SCROLL : show on scroll up, hide on scroll down
  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY;
      const diff = currentY - lastScrollY.current;
      // Seuil minimal pour éviter les micro-mouvements
      if (Math.abs(diff) > 4) {
        setIsHeaderVisible(diff < 0 || currentY < 80);
        lastScrollY.current = currentY;
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (!mounted) return null;

  const hiddenRoutes = ["/login", "/auth"];
  if (hiddenRoutes.some(route => pathname.startsWith(route))) return null;

  return (
    <>
      {/* HEADER DESKTOP — visible au début, se cache au scroll bas, réapparaît au scroll haut */}
      <motion.header
        animate={{ y: isHeaderVisible ? 0 : "-100%" }}
        transition={{ duration: 0.25, ease: "easeInOut" }}
        className="hidden md:flex fixed top-0 left-0 right-0 z-50 w-full items-center justify-between p-4 md:px-8 border-b-4 border-foreground bg-surface"
      >
        <Link href="/" className="relative h-16 w-64 md:h-20 md:w-80">
          <Image src="/Logo.png" alt="Karisma Productivity" fill className="object-contain object-left" priority />
        </Link>

        <div className="flex items-center gap-6">
          <nav className="flex items-center gap-2 lg:gap-4">
            {navItems.map((item) => {
              const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
              return (
                <Link key={`desktop-${item.id}`} href={item.href}>
                  <motion.div
                    layout
                    className={`flex items-center justify-center px-5 py-3 rounded-full border-4 transition-colors ${
                      isActive ? "bg-primary border-foreground shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]" : "border-transparent text-foreground/60 hover:text-foreground hover:bg-black/5"
                    }`}
                  >
                    <motion.div layout>
                      <item.icon className="w-6 h-6 shrink-0" strokeWidth={isActive ? 3 : 2} />
                    </motion.div>
                    <AnimatePresence>
                      {isActive && (
                        <motion.span
                          layout
                          initial={{ opacity: 0, width: 0 }}
                          animate={{ opacity: 1, width: "auto" }}
                          exit={{ opacity: 0, width: 0 }}
                          transition={{ duration: 0.2 }}
                          className="ml-2 font-black uppercase text-sm whitespace-nowrap overflow-hidden block"
                        >
                          {item.label}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </motion.div>
                </Link>
              );
            })}
          </nav>

          {/* BOUTON NOTIFICATIONS DESKTOP */}
          {notifPermission !== "unsupported" && (
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={handleNotifClick}
              disabled={notifLoading || notifPermission === "denied"}
              title={notifLabel}
              className={`relative flex items-center justify-center w-10 h-10 border-[3px] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all shrink-0 ${notifColor}`}
            >
              {notifLoading ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
                  className="w-5 h-5 border-[3px] border-foreground border-t-transparent rounded-full"
                />
              ) : (
                <NotifIcon strokeWidth={2.5} className="w-5 h-5" />
              )}
              {notifPermission === "default" && !notifLoading && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 border-2 border-surface rounded-full" />
              )}
              {notifPermission === "granted" && unreadCount > 0 && !notifLoading && (
                <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] bg-red-500 border-2 border-surface rounded-full text-white text-[9px] font-black flex items-center justify-center px-0.5">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </motion.button>
          )}

          {profile && (
            <Link href="/profil" className="flex items-center gap-3 border-l-4 border-foreground pl-6 ml-2 hover:opacity-80 transition-opacity">
              <div className="flex flex-col items-end">
                <span className="font-black uppercase text-sm tracking-tight">{profile.username}</span>
                <span className="font-bold text-xs text-foreground/50">{profile.email}</span>
              </div>
              <div className="w-12 h-12 rounded-full border-4 border-foreground bg-primary overflow-hidden flex items-center justify-center shrink-0 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                {profile.avatar_url ? (
                  <Image src={profile.avatar_url} alt={profile.username} width={48} height={48} className="object-cover w-full h-full" />
                ) : (
                  <User strokeWidth={3} className="w-6 h-6" />
                )}
              </div>
            </Link>
          )}
        </div>
      </motion.header>

      {/* HEADER MOBILE */}
      <header className="md:hidden w-full flex items-center justify-between p-4 border-b-4 border-foreground bg-surface">
        <Link href="/" className="relative h-12 w-40 shrink-0">
          <Image src="/Logo.png" alt="Karisma Productivity" fill className="object-contain object-left" priority />
        </Link>

        <div className="flex items-center gap-3">
          {/* BOUTON NOTIFICATIONS */}
          {notifPermission !== "unsupported" && (
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={handleNotifClick}
              disabled={notifLoading || notifPermission === "denied"}
              title={notifLabel}
              className={`relative flex items-center justify-center w-10 h-10 border-[3px] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all shrink-0 ${notifColor}`}
            >
              {notifLoading ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
                  className="w-5 h-5 border-[3px] border-foreground border-t-transparent rounded-full"
                />
              ) : (
                <NotifIcon strokeWidth={2.5} className="w-5 h-5" />
              )}
              {notifPermission === "default" && !notifLoading && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 border-2 border-surface rounded-full" />
              )}
              {notifPermission === "granted" && unreadCount > 0 && !notifLoading && (
                <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] bg-red-500 border-2 border-surface rounded-full text-white text-[9px] font-black flex items-center justify-center px-0.5">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </motion.button>
          )}

          {/* PROFIL MOBILE */}
          {profile && (
            <Link href="/profil" className="flex items-center gap-2 active:opacity-70 transition-opacity">
              <span className="font-black uppercase text-xs tracking-tight truncate max-w-[80px] text-right">
                {profile.username}
              </span>
              <div className="w-10 h-10 rounded-full border-[3px] border-foreground bg-primary overflow-hidden flex items-center justify-center shrink-0 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all">
                {profile.avatar_url ? (
                  <Image src={profile.avatar_url} alt={profile.username} width={40} height={40} className="object-cover w-full h-full" />
                ) : (
                  <User strokeWidth={3} className="w-5 h-5" />
                )}
              </div>
            </Link>
          )}
        </div>
      </header>

      {/* MOBILE BOTTOM NAV */}
      <div className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
        <nav className="flex items-center bg-surface border-4 border-foreground shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-full p-2 gap-1 relative overflow-hidden">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
            return (
              <Link key={`mobile-${item.id}`} href={item.href}>
                <motion.div
                  whileTap={{ scale: 0.9 }}
                  className={`flex items-center justify-center p-3 rounded-full border-4 transition-colors ${
                    isActive ? "bg-primary border-foreground shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]" : "border-transparent text-foreground/60"
                  }`}
                >
                  <item.icon className={`w-6 h-6 shrink-0 ${isActive ? "text-foreground" : "text-foreground/80"}`} strokeWidth={isActive ? 3 : 2} />
                </motion.div>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* NOTIFICATION SIDEBAR */}
      <NotificationSidebar
        isOpen={isNotifOpen}
        onClose={() => setIsNotifOpen(false)}
        onUnreadCountChange={setUnreadCount}
      />
    </>
  );
}
