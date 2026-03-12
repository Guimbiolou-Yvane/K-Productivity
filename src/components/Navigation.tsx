"use client";

import { useState, useEffect } from "react";
import { Home, BarChart2, Users, User, Settings, Layers } from "lucide-react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import Image from "next/image";
import { authService } from "@/lib/services/authService";
import { UserProfile } from "@/lib/models/user";

const navItems = [
  { id: "home", label: "Objectif", icon: Home, href: "/" },
  { id: "partages", label: "Obj. Commun", icon: Layers, href: "/partages" },
  { id: "stats", label: "Stats", icon: BarChart2, href: "/stats" },
  { id: "amis", label: "Amis", icon: Users, href: "/amis" },
  { id: "parametres", label: "Paramètres", icon: Settings, href: "/parametres" },
];

export default function Navigation() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    setMounted(true);

    const loadProfile = async () => {
      try {
        const userProfile = await authService.getProfile();
        setProfile(userProfile);
      } catch (err) {
        console.error("Could not fetch user profile", err);
      }
    };
    
    // Only fetch profile if not on login pages
    const hiddenRoutes = ["/login", "/auth"];
    if (!hiddenRoutes.some(route => pathname.startsWith(route))) {
      loadProfile();
    }
  }, [pathname]);

  if (!mounted) return null;

  // Cacher la navigation sur les pages d'authentification
  const hiddenRoutes = ["/login", "/auth"];
  if (hiddenRoutes.some(route => pathname.startsWith(route))) return null;

  return (
    <>
      {/* SECTION HEADER DESKTOP (Cache sur Mobile) */}
      <header className="hidden md:flex w-full items-center justify-between p-4 md:px-8 border-b-4 border-foreground bg-surface max-w-6xl mx-auto shadow-sm">
        {/* LOGO */}
        <Link href="/" className="relative h-16 w-64 md:h-20 md:w-80">
          <Image 
            src="/Logo.png" 
            alt="Karisma Productivity" 
            fill
            className="object-contain object-left"
            priority
          />
        </Link>

        {/* NAVIGATION ET PROFIL */}
        <div className="flex items-center gap-6">
          {/* LIENS DE NAVIGATION (Pills Néo-brutalistes) */}
          <nav className="flex items-center gap-2 lg:gap-4">
            {navItems.map((item) => {
              const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
              return (
                <Link key={`desktop-${item.id}`} href={item.href}>
                  <motion.div 
                    layout
                    className={`flex items-center justify-center px-5 py-3 rounded-full border-4 transition-colors ${
                      isActive ? 'bg-primary border-foreground shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' : 'border-transparent text-foreground/60 hover:text-foreground hover:bg-black/5'
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
              )
            })}
          </nav>

          {/* PROFIL UTILISATEUR */}
          {profile && (
            <Link href="/profil" className="flex items-center gap-3 border-l-4 border-foreground pl-6 ml-2 hover:opacity-80 transition-opacity">
              <div className="flex flex-col items-end">
                <span className="font-black uppercase text-sm tracking-tight">{profile.username}</span>
                <span className="font-bold text-xs text-foreground/50">{profile.email}</span>
              </div>
              <div className="w-12 h-12 rounded-full border-4 border-foreground bg-primary overflow-hidden flex items-center justify-center shrink-0 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                {profile.avatar_url ? (
                  <Image 
                    src={profile.avatar_url} 
                    alt={profile.username} 
                    width={48} 
                    height={48} 
                    className="object-cover w-full h-full" 
                  />
                ) : (
                  <User strokeWidth={3} className="w-6 h-6" />
                )}
              </div>
            </Link>
          )}
        </div>
      </header>

      {/* HEADER MOBILE UNIQUEMENT (Logo à gauche + Profil à droite) */}
      <header className="md:hidden w-full flex items-center justify-between p-4 border-b-4 border-foreground bg-surface">
        <Link href="/" className="relative h-12 w-40 shrink-0">
          <Image 
            src="/Logo.png" 
            alt="Karisma Productivity" 
            fill
            className="object-contain object-left"
            priority
          />
        </Link>

        {/* PROFIL MOBILE (Username + Avatar) */}
        {profile && (
          <Link href="/profil" className="flex items-center gap-2 active:opacity-70 transition-opacity">
            <span className="font-black uppercase text-xs tracking-tight truncate max-w-[100px] text-right">
              {profile.username}
            </span>
            <div className="w-10 h-10 rounded-full border-[3px] border-foreground bg-primary overflow-hidden flex items-center justify-center shrink-0 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all">
              {profile.avatar_url ? (
                <Image 
                  src={profile.avatar_url} 
                  alt={profile.username} 
                  width={40} 
                  height={40} 
                  className="object-cover w-full h-full" 
                />
              ) : (
                <User strokeWidth={3} className="w-5 h-5" />
              )}
            </div>
          </Link>
        )}
      </header>

      {/* MOBILE BOTTOM NAVIGATION BAR */}
      <div className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
        <nav className="flex items-center bg-surface border-4 border-foreground shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-full p-2 gap-1 relative overflow-hidden">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
            return (
              <Link key={`mobile-${item.id}`} href={item.href}>
                <motion.div 
                  layout
                  className={`flex items-center justify-center p-3 rounded-full border-4 transition-colors ${
                    isActive ? 'bg-primary border-foreground' : 'border-transparent text-foreground/60'
                  }`}
                  style={{ minHeight: "56px" }}
                >
                  <motion.div layout>
                    <item.icon className={`w-6 h-6 shrink-0 ${isActive ? 'text-foreground' : 'text-foreground/80'}`} strokeWidth={isActive ? 3 : 2} />
                  </motion.div>
                  <AnimatePresence>
                    {isActive && (
                      <motion.span 
                        layout
                        initial={{ width: 0, paddingLeft: 0, opacity: 0 }}
                        animate={{ width: "auto", paddingLeft: 8, opacity: 1 }}
                        exit={{ width: 0, paddingLeft: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="font-black uppercase text-[11px] whitespace-nowrap overflow-hidden block"
                      >
                        {item.label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.div>
              </Link>
            )
          })}
        </nav>
      </div>
    </>
  )
}
