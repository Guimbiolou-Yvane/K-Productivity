"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Mail, Lock, User, Eye, EyeOff, ArrowRight, LogIn } from "lucide-react";
import { authService } from "@/lib/services/authService";
import { supabase } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

type AuthMode = "login" | "signup";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const toggleMode = () => {
    setMode(mode === "login" ? "signup" : "login");
    setError(null);
    setSuccess(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    // Validations côté client
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Veuillez entrer une adresse email valide.");
      setIsLoading(false);
      return;
    }
    if (password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères.");
      setIsLoading(false);
      return;
    }
    if (mode === "signup" && username.trim().length < 3) {
      setError("Le pseudo doit contenir au moins 3 caractères.");
      setIsLoading(false);
      return;
    }

    try {
      if (mode === "signup") {
        const result = await authService.signUpWithEmail(email, password, username);

        // Supabase retourne un user avec identities vide si l'email est déjà utilisé
        if (result.user && result.user.identities && result.user.identities.length === 0) {
          setError("Un compte avec cet email existe déjà.");
        } else {
          setSuccess("Un email de confirmation a été envoyé à " + email + ". Vérifiez votre boîte de réception (et les spams) pour activer votre compte.");
        }
      } else {
        const loginResult = await authService.signInWithEmail(email, password);

        // Détection automatique du fuseau horaire et sauvegarde dans le profil
        try {
          const detectedTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
          if (detectedTz && loginResult.user) {
            supabase.from("profiles").update({ timezone: detectedTz }).eq("id", loginResult.user.id).then();
          }
        } catch {}

        router.push("/");
      }
    } catch (err: any) {
      setError(err.message || "Une erreur est survenue.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuth = async (provider: "google" | "facebook") => {
    setIsLoading(true);
    setError(null);
    try {
      await authService.signInWithOAuth(provider);
    } catch (err: any) {
      setError(err.message || "Erreur lors de la connexion.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 font-sans">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
        className="w-full max-w-md flex flex-col gap-6"
      >
        {/* HEADER */}
        <div className="text-center">
          <motion.h1
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="text-4xl sm:text-5xl font-black uppercase tracking-tighter"
          >
            Karisma
          </motion.h1>
          <p className="font-bold text-sm uppercase tracking-widest mt-2 text-foreground/60">
            Productivité & Habitudes
          </p>
        </div>

        {/* TOGGLE LOGIN / SIGNUP */}
        <div className="neo-card !p-0 flex overflow-hidden">
          <button
            onClick={() => toggleMode()}
            className={`flex-1 py-3 font-black uppercase text-sm transition-all border-r-4 border-foreground ${
              mode === "login"
                ? "bg-primary shadow-none"
                : "bg-surface hover:bg-primary/20"
            }`}
          >
            Connexion
          </button>
          <button
            onClick={() => toggleMode()}
            className={`flex-1 py-3 font-black uppercase text-sm transition-all ${
              mode === "signup"
                ? "bg-primary shadow-none"
                : "bg-surface hover:bg-primary/20"
            }`}
          >
            Inscription
          </button>
        </div>

        {/* FORMULAIRE */}
        <form
          onSubmit={handleSubmit}
          className="neo-card flex flex-col gap-4"
        >
          <AnimatePresence initial={false}>
            {/* USERNAME (Inscription uniquement) */}
            {mode === "signup" && (
              <motion.div
                key="username-field"
                initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                animate={{ opacity: 1, height: "auto", marginBottom: 0 }}
                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                transition={{ duration: 0.2, ease: "easeInOut" }}
                style={{ overflow: "hidden" }}
              >
                <label className="font-black uppercase text-xs tracking-wider mb-2 block">
                  Pseudo
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/50" strokeWidth={3} />
                  <input
                    type="text"
                    placeholder="Votre pseudo..."
                    className="neo-input font-bold !pl-12 w-full"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required={mode === "signup"}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* EMAIL */}
          <div>
            <label className="font-black uppercase text-xs tracking-wider mb-2 block">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/50" strokeWidth={3} />
              <input
                type="email"
                placeholder="votre@email.com"
                className="neo-input font-bold !pl-12 w-full"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          {/* MOT DE PASSE */}
          <div>
            <label className="font-black uppercase text-xs tracking-wider mb-2 block">
              Mot de passe
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/50" strokeWidth={3} />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                className="neo-input font-bold !pl-12 !pr-14 w-full"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-foreground/50 hover:text-foreground transition-colors"
              >
                {showPassword ? <EyeOff size={20} strokeWidth={3} /> : <Eye size={20} strokeWidth={3} />}
              </button>
            </div>
          </div>

          {/* MOT DE PASSE OUBLIÉ (Connexion uniquement) */}
          {mode === "login" && (
            <button
              type="button"
              onClick={async () => {
                if (!email) { setError("Entrez votre email d'abord."); return; }
                try {
                  await authService.resetPassword(email);
                  setSuccess("Email de réinitialisation envoyé !");
                } catch { setError("Erreur lors de l'envoi."); }
              }}
              className="text-xs font-bold uppercase text-foreground/50 hover:text-primary transition-colors text-right -mt-2"
            >
              Mot de passe oublié ?
            </button>
          )}

          {/* MESSAGES D'ERREUR ET DE SUCCÈS */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-[#ff6b6b] border-4 border-foreground p-3 font-bold text-sm text-foreground shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
              >
                {error}
              </motion.div>
            )}
            {success && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-[#1fb05a] border-4 border-foreground p-3 font-bold text-sm text-foreground shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
              >
                {success}
              </motion.div>
            )}
          </AnimatePresence>

          {/* BOUTON SUBMIT */}
          <motion.button
            whileTap={{ scale: 0.97 }}
            type="submit"
            disabled={isLoading}
            className="neo-btn w-full flex items-center justify-center gap-3 text-base disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-5 h-5 border-4 border-foreground border-t-transparent rounded-full"
              />
            ) : (
              <>
                {mode === "login" ? <LogIn size={20} strokeWidth={3} /> : <ArrowRight size={20} strokeWidth={3} />}
                {mode === "login" ? "Se connecter" : "Créer mon compte"}
              </>
            )}
          </motion.button>
        </form>

        {/* SÉPARATEUR */}
        <div className="flex items-center gap-4">
          <div className="flex-1 h-1 bg-foreground" />
          <span className="font-black uppercase text-xs tracking-widest">Ou</span>
          <div className="flex-1 h-1 bg-foreground" />
        </div>

        {/* BOUTONS OAUTH */}
        <div className="flex flex-col gap-3">
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => handleOAuth("google")}
            disabled={isLoading}
            className="neo-card !bg-surface hover:!bg-primary/10 flex items-center justify-center gap-3 font-black uppercase text-sm py-4 cursor-pointer transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:opacity-50"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continuer avec Google
          </motion.button>

          {/*
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => handleOAuth("facebook")}
            disabled={isLoading}
            className="neo-card !bg-surface hover:!bg-[#1877F2]/10 flex items-center justify-center gap-3 font-black uppercase text-sm py-4 cursor-pointer transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:opacity-50"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#1877F2">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
            Continuer avec Facebook
          </motion.button>
          */}
        </div>

        {/* FOOTER */}
        <p className="text-center text-xs font-bold text-foreground/40 uppercase tracking-wider">
          En continuant, vous acceptez nos conditions d&apos;utilisation
        </p>
      </motion.div>
    </div>
  );
}
