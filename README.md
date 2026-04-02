# Karisma Productivity (K-Productivity)

> Application PWA de suivi d'objectifs et de productivité avec une identité visuelle **Néo-Brutaliste**.

---

## 📋 Vue d'ensemble

**Karisma Productivity** est une application web progressive (PWA) qui permet aux utilisateurs de créer des objectifs mensuels récurrents (habits), de les cocher quotidiennement, de suivre leurs statistiques (streaks, taux de réussite, calendrier mensuel), et de gérer des tâches temporaires (todos) à durée de vie de 24h.

L'application inclut :
- ✅ **Objectifs répétitifs** (HabitTracker) avec navigation jour par jour
- 🏆 **Objectifs long terme** (GoalList) avec suivi de progression
- 📋 **Tâches temporaires** (TodoList) avec rappels horaires
- 🤝 **Objectifs en commun** (SharedHabitsTracker) — groupes collaboratifs
- 👥 **Système de liste d'amis** avec invitations
- 📊 **Page Statistiques** complète (streak, taux de réussite, calendrier mensuel)
- 🔔 **Notifications Push** automatiques (OneSignal) : matin, après-midi, soir, et à l'heure exacte de chaque objectif
- 👤 **Profil utilisateur** avec photo, bio, widgets personnalisables
- ⚙️ **Paramètres** : username, prénom/nom, photo de profil (upload), bio, mot de passe, thème, fuseau horaire, réinitialisation
- 🌗 **Mode sombre** (dark mode) complet

---

## 🛠️ Stack Technique

| Couche            | Technologie                    | Version                                           |
| ----------------- | ------------------------------ | ------------------------------------------------- |
| **Framework**     | Next.js (App Router)           | 16.1.6                                            |
| **UI**            | React                          | 19.2.3                                            |
| **Langage**       | TypeScript                     | 5.x                                               |
| **Styling**       | Tailwind CSS                   | 3.4.19                                            |
| **Animations**    | Motion (ex framer-motion)      | 12.35.0                                           |
| **Graphiques**    | Recharts                       | 3.8.0                                             |
| **Icônes**        | Lucide React                   | 0.577.0                                           |
| **Backend / BDD** | Supabase (Auth + PostgreSQL + Storage) | @supabase/supabase-js 2.98.0, @supabase/ssr 0.9.0 |
| **PWA**           | @ducanh2912/next-pwa           | 10.2.9                                            |
| **Notifications** | OneSignal (react-onesignal)    | 3.5.1                                             |
| **Utilitaires**   | date-fns, clsx, tailwind-merge | —                                                 |

---

## 📁 Architecture du Projet

```
Karisma Productivity/
├── public/
│   ├── K_SVG.png              # Favicon PNG
│   ├── Logo.png               # Logo PNG
│   ├── icon-192.png           # Icône PWA notifications push
│   ├── manifest.json          # Manifeste PWA
│   ├── sw.js                  # Service Worker (auto-généré)
│   └── ...                    # Autres assets statiques
│
├── src/
│   ├── app/                   # App Router (Next.js)
│   │   ├── layout.tsx         # Layout racine (Montserrat font, Navigation)
│   │   ├── page.tsx           # Page d'accueil (GoalList + HabitTracker + TodoList + SharedHabitsTracker)
│   │   ├── globals.css        # Styles globaux + utilities néo-brutalistes
│   │   │
│   │   ├── api/
│   │   │   ├── cron/remind/   # Cron Job Vercel (notifications journalières)
│   │   │   └── push/send/     # Envoi direct via API OneSignal
│   │   │
│   │   ├── login/
│   │   │   └── page.tsx       # Page de connexion / inscription
│   │   │
│   │   ├── auth/
│   │   │   └── callback/
│   │   │       └── route.ts   # Route Handler pour le callback OAuth
│   │   │
│   │   ├── stats/
│   │   │   └── page.tsx       # Page Statistiques (Streak, Taux de réussite, Calendrier mensuel)
│   │   │
│   │   ├── profil/
│   │   │   ├── page.tsx       # Redirection auto vers /profil/[mon-id]
│   │   │   └── [id]/
│   │   │       └── page.tsx   # Page profil (propre ou d'un autre utilisateur, avec visionneuse photo + bio couverture)
│   │   │
│   │   ├── amis/
│   │   │   └── page.tsx       # Page Amis (recherche, liste, demandes)
│   │   │
│   │   ├── notifications/
│   │   │   └── page.tsx       # Page notifications complète
│   │   │
│   │   └── parametres/
│   │       └── page.tsx       # Paramètres (profil, photo, bio, mot de passe, thème, fuseau horaire, réinitialisation)
│   │
│   ├── components/
│   │   ├── GoalList.tsx           # Objectifs long terme (collapsible, persistance localStorage)
│   │   ├── HabitTracker.tsx       # Objectifs répétitifs (grille + vue mobile)
│   │   ├── TodoList.tsx           # Tâches temporaires 24h (collapsible)
│   │   ├── SectionDivider.tsx     # Séparateur animé (cibles colorées défilantes)
│   │   ├── SectionSkeleton.tsx    # Squelette de chargement unifié pour les sections
│   │   ├── Navigation.tsx         # Barre de nav bottom (mobile) + header (desktop)
│   │   ├── NotificationSidebar.tsx# Sidebar notifications temps réel
│   │   ├── ResetObjectivesModal.tsx
│   │   ├── SectionInfo.tsx        # Tooltip d'aide contextuelle
│   │   │
│   │   ├── habit-tracker/
│   │   │   ├── HabitTableDesktop.tsx  # Vue tableau desktop
│   │   │   ├── HabitListMobile.tsx    # Vue liste mobile
│   │   │   ├── HabitModal.tsx         # Modal ajout/édition
│   │   │   └── constants.ts           # Couleurs prédéfinies, getMonthDays, etc.
│   │   │
│   │   ├── partages/
│   │   │   ├── SharedHabitsTracker.tsx  # Objectifs en commun (collapsible, intégré à la page d'accueil)
│   │   │   ├── SharedGroupModal.tsx
│   │   │   └── SharedHabitModal.tsx
│   │   │
│   │   ├── profile/
│   │   │   └── ProfileWidgets.tsx   # Widgets affichés sur la page profil
│   │   │
│   │   └── stats/
│   │       ├── StreakSection.tsx        # Section séries
│   │       ├── SuccessRateSection.tsx   # Graphique Recharts (axes adaptatifs dark mode)
│   │       ├── MonthlyOverview.tsx      # Calendrier mensuel (filtres scrollables)
│   │       └── StatsSkeleton.tsx
│   │
│   ├── hooks/
│   │   └── useTimezoneSync.ts  # Hook de synchronisation fuseau horaire
│   │
│   ├── lib/
│   │   ├── models/
│   │   │   ├── user.ts        # Interface UserProfile (+ bio, timezone)
│   │   │   ├── habit.ts       # Interfaces Habit, HabitLog, UIHabit, StreakStats, ...
│   │   │   ├── goal.ts        # Interface Goal (objectifs long terme)
│   │   │   ├── sharedHabit.ts # Interfaces SharedGroup, UISharedHabit, ...
│   │   │   └── todo.ts        # Interface Todo
│   │   │
│   │   ├── services/
│   │   │   ├── authService.ts        # Auth + profil + uploadAvatar()
│   │   │   ├── habitService.ts       # CRUD Habits + Statistiques complètes
│   │   │   ├── goalService.ts        # CRUD Objectifs long terme
│   │   │   ├── todoService.ts        # CRUD Todos
│   │   │   ├── friendService.ts      # Amis, demandes, profils publics
│   │   │   ├── sharedHabitService.ts # Groupes partagés et objectifs communs
│   │   │   └── notificationService.ts# Notifications in-app (CRUD + Realtime)
│   │   │
│   │   └── supabase/
│   │       ├── client.ts      # Client Supabase côté navigateur
│   │       └── server.ts      # Client Supabase côté serveur
│   │
│   └── middleware.ts          # Rafraîchit la session Supabase + protège les routes privées
│
├── supabase/
│   ├── schema.sql             # Schéma SQL de base
│   ├── fresh_setup.sql        # Script complet "from scratch" (⚡ RECOMMANDÉ pour un fresh install)
│   ├── seed.sql               # Script de peuplement (données de test)
│   └── migrations/
│       ├── 001_update_handle_new_user.sql    # Trigger anti-fantômes
│       ├── 003_temporary_todos.sql           # Table todos + trigger auto-cleanup 24h
│       ├── 010_friendships.sql               # Système d'amitié
│       ├── 012_shared_habits.sql             # Groupes partagés et objectifs communs
│       ├── 013_auto_delete_empty_groups.sql  # Suppression auto des groupes vides
│       ├── 014_notifications.sql             # Table notifications + triggers amis/groupes
│       ├── 015_notify_shared_habit_log.sql   # Notif à la validation d'un objectif commun
│       ├── 016_enable_realtime.sql           # Activation Supabase Realtime
│       ├── 017_add_time_to_todos.sql         # Heure optionnelle sur les todos
│       ├── 018_long_term_goals.sql           # Table goals (objectifs long terme)
│       ├── add_timezone_to_profiles.sql      # Colonne timezone dans profiles
│       ├── 020_avatars_bucket.sql            # Bucket Supabase Storage pour les photos de profil
│       ├── 021_profile_bio.sql               # Colonne bio dans profiles
│       └── 022_fix_notification_links.sql    # Correction liens /partages → / dans les triggers
│
├── DesignUI.md                # Charte graphique Néo-Brutalisme
├── Motion.md                  # Guide animations Motion v12
├── Recharts.md                # Guide Recharts
│
├── tailwind.config.ts         # Config Tailwind
├── next.config.ts             # Config Next.js (PWA + images Supabase/Google/Facebook)
├── package.json               # Dépendances et scripts
└── .env.local                 # Variables d'environnement
```

---

## 🗄️ Base de Données Supabase

### Tables

| Table                      | Description                                    | Clés étrangères                                       |
| -------------------------- | ---------------------------------------------- | ----------------------------------------------------- |
| **`profiles`**             | Profil utilisateur (+ `bio`, `timezone`, `avatar_url`) | `id` → `auth.users(id)` ON DELETE CASCADE    |
| **`habits`**               | Objectifs répétitifs mensuels                  | `user_id` → `profiles(id)` ON DELETE CASCADE          |
| **`habit_logs`**           | Logs de complétion journalière                 | `habit_id` → `habits(id)`, `user_id` → `profiles(id)` |
| **`todos`**                | Tâches temporaires (auto-supprimées après 24h, `time` optionnel) | `user_id` → `profiles(id)` ON DELETE CASCADE |
| **`goals`**                | Objectifs long terme (avec date cible, couleur, catégorie) | `user_id` → `profiles(id)` ON DELETE CASCADE |
| **`friendships`**          | Relations d'amitié entre utilisateurs          | `user_id`, `friend_id` → `profiles(id)`               |
| **`shared_groups`**        | Groupes collaboratifs                          | `creator_id` → `profiles(id)`                         |
| **`shared_group_members`** | Membres des groupes avec date de join          | `group_id` → `shared_groups(id)`, `user_id`           |
| **`shared_habits`**        | Objectifs appartenant à un groupe              | `group_id` → `shared_groups(id)`, `created_by`        |
| **`shared_habit_logs`**    | Complétions journalières par membre du groupe  | `shared_habit_id` → `shared_habits(id)`, `user_id`    |
| **`notifications`**        | Notifications in-app (amis, groupes, validations) | `user_id` → `profiles(id)` ON DELETE CASCADE       |

### Modèles TypeScript ↔ Tables SQL

```
UserProfile  →  profiles      (id, email, first_name, last_name, username, avatar_url, bio, timezone, longest_streak, created_at, updated_at)
Habit        →  habits        (id, user_id, name, category, frequency[], color, icon, time, start_date, end_date, created_at)
HabitLog     →  habit_logs    (id, habit_id, user_id, completed_date, created_at)
Todo         →  todos         (id, user_id, title, time?, is_completed, created_at)
Goal         →  goals         (id, user_id, name, color, category, duration, target_date, is_completed, created_at)
Friendship   →  friendships   (id, user_id, friend_id, status, created_at)
SharedGroup  →  shared_groups, shared_group_members, shared_habits, shared_habit_logs
Notification →  notifications (id, user_id, type, title, body, link, is_read, created_at)
```

### Stockage (Supabase Storage)

| Bucket      | Accès  | Limite | Types autorisés       |
| ----------- | ------ | ------ | --------------------- |
| **avatars** | Public | 3 Mo   | image/jpeg, png, gif, webp |

### Triggers & Fonctions SQL

| Trigger                               | Table                   | Événement     | Rôle                                                                      |
| ------------------------------------- | ----------------------- | ------------- | ------------------------------------------------------------------------- |
| `on_auth_user_confirmed`              | `auth.users`            | AFTER UPDATE  | Crée automatiquement le profil dans `profiles` à la confirmation email    |
| `update_profiles_updated_at`          | `profiles`              | BEFORE UPDATE | Met à jour `updated_at` à chaque modification                             |
| `trigger_cleanup_old_todos`           | `todos`                 | AFTER INSERT  | Supprime les todos de plus de 24h à chaque nouvel ajout                   |
| `trigger_delete_empty_group_on_leave` | `shared_group_members`  | AFTER DELETE  | Supprime le groupe s'il reste moins de 2 membres                          |
| `notify_on_friend_request`            | `friendships`           | AFTER INSERT  | Crée une notif in-app + lien `/amis` à la réception d'une demande d'ami   |
| `notify_on_friend_accept`             | `friendships`           | AFTER UPDATE  | Crée une notif in-app quand une demande est acceptée                      |
| `notify_on_group_invite`              | `shared_group_members`  | AFTER INSERT  | Crée une notif in-app + lien `/` à l'invitation dans un groupe            |
| `notify_on_shared_habit_log`          | `shared_habit_logs`     | AFTER INSERT  | Notifie les membres du groupe quand quelqu'un valide un objectif commun   |

### Row Level Security (RLS)

Toutes les tables ont RLS activé. Chaque utilisateur ne peut **voir, créer, modifier et supprimer que ses propres données**.

---

## 🔐 Authentification

- **Email/Password** : Inscription avec confirmation email, connexion classique
- **OAuth** : Google et Facebook (via `/auth/callback` route handler)
- **Middleware** (`src/middleware.ts`) : Rafraîchit la session Supabase + redirige vers `/login` si non authentifié
- **Deux clients Supabase** :
  - `client.ts` : `createBrowserClient` pour les composants `"use client"`
  - `server.ts` : `createServerClient` pour les Route Handlers

---

## 📱 Pages de l'Application

| Route            | Composant                                              | Description                                                                             |
| ---------------- | ------------------------------------------------------ | --------------------------------------------------------------------------------------- |
| `/`              | `GoalList` + `HabitTracker` + `TodoList` + `SharedHabitsTracker` | Page d'accueil — toutes les sections d'objectifs, collapsibles avec persistance |
| `/login`         | `LoginPage`                                            | Connexion / Inscription (email + OAuth Google/Facebook)                                 |
| `/stats`         | `StatsPage`                                            | Statistiques : Streak, Taux de réussite (Recharts), Calendrier mensuel                 |
| `/profil`        | `ProfilRedirect`                                       | Redirige vers `/profil/[mon-id]`                                                        |
| `/profil/[id]`   | `ProfilIdPage`                                         | Profil (visionneuse photo, bio en couverture, modal édition, upload avatar)             |
| `/amis`          | `AmisPage`                                             | Recherche d'utilisateurs, liste d'amis, demandes en attente                             |
| `/notifications` | `NotificationsPage`                                    | Historique complet des notifications                                                    |
| `/parametres`    | `ParametresPage`                                       | Photo de profil (upload), username, nom, bio, mot de passe, thème, fuseau horaire      |
| `/auth/callback` | Route Handler (GET)                                    | Échange le code OAuth contre une session                                                |

---

## 🎨 Design System — Néo-Brutalisme

Documenté en détail dans [`DesignUI.md`](DesignUI.md).

### Résumé des choix clés

- **Palette** : Jaune vif (`#FFFF00` / `#ffda59`), Noir (`#000`), Gris clair (`#F4F4F4`), Blanc (`#FFF`)
- **Couleurs fonctionnelles** : Vert (`#1fb05a`), Rouge (`#ff6b6b`), Bleu (`#4facff`), Violet (`#9d4edd`), Orange (`#ff9e00`)
- **Police** : Montserrat (poids 400, 700, 900)
- **Bordures** : 4px solides sur tous les éléments interactifs
- **Angles** : 0px de border-radius (strict)
- **Ombres** : Hard drop shadows (`4px 4px 0px 0px rgba(0,0,0,1)`)
- **Classes utilitaires** : `neo-btn`, `neo-card`, `neo-input`, `neo-checkbox` (définies dans `globals.css`)
- **Dark mode** : Icônes et bordures d'icônes en blanc, badges en noir fixe, graphiques adaptatifs

### Composants UI récurrents

- **Sections collapsibles** : Header cliquable avec `ChevronDown` animé, contenu en `AnimatePresence`, état persisté en `localStorage`
- **SectionDivider** : Cibles concentriques SVG animées défilant horizontalement à l'infini
- **SectionSkeleton** : Squelette de chargement unifié (icône + chevron + titre + badge)
- **Animations d'entrée** : `motion.div` avec `initial={{ opacity: 0, y: 20 }}` sur toutes les sections

### Animations (Motion v12)

Documenté dans [`Motion.md`](Motion.md).

- Import : `import { motion, AnimatePresence } from "motion/react"`
- Springs tendus : `stiffness: 400, damping: 30`
- Interactions : `whileTap={{ scale: 0.9 }}`, `whileHover={{ scale: 1.01 }}`

---

## 🧩 Composants Principaux

### Page d'accueil `/` — 4 sections empilées

| Section                  | Composant                | Couleur icône | Par défaut |
| ------------------------ | ------------------------ | ------------- | ---------- |
| Objectifs long terme     | `GoalList`               | Violet        | Réduit     |
| Objectifs répétitifs     | `HabitTracker`           | Jaune         | Réduit     |
| Tâches temporaires       | `TodoList`               | Orange        | Réduit     |
| Objectifs en commun      | `SharedHabitsTracker`    | Cyan          | Réduit     |

Chaque section est séparée par un `SectionDivider` animé.

### `GoalList.tsx`

- Objectifs avec date cible, couleur, catégorie, pourcentage de complétion visuel
- Filtres par catégorie (scrollables)
- Section collapsible avec persistance `localStorage`

### `HabitTracker.tsx`

- Grille hebdomadaire (desktop) + sélecteur de jour mobile (carrousel)
- Toggle optimiste + synchro Supabase
- Modal complet (nom, catégorie, fréquence, couleur, icône, heure)

### `SharedHabitsTracker.tsx`

- Groupes collaboratifs avec membres
- Barre de progression de completion par objectif
- Navigation temporelle (sélecteur de jour)
- Intégré dans la page `/` (plus de page dédiée `/partages`)

### `Navigation.tsx`

- **Mobile** : Bottom bar fixe avec 4 onglets (Objectifs, Stats, Amis, Paramètres) + avatar profil
- **Desktop** : Header fixe avec disparition au scroll bas et réapparition au scroll haut
- Bouton Notifications avec badge de compteur non-lus
- Synchronisation automatique du fuseau horaire

---

## 📊 Services (Couche Données)

### `authService.ts`

- `signUpWithEmail`, `signInWithEmail`, `signInWithOAuth`, `signOut`
- `getUser()`, `getSession()`, `getProfile()`, `updateProfile(updates)`
- `uploadAvatar(file)` — Upload vers Supabase Storage bucket `avatars` + mise à jour `avatar_url`
- `resetPassword(email)`, `updatePassword(newPassword)`
- `onAuthStateChange(callback)`

### `habitService.ts`

- `fetchHabits()` → `UIHabit[]`
- `addHabit`, `updateHabit`, `deleteHabit`
- `toggleLog(habitId, dayOrDate)` — Optimistic update
- `getStreak()` → `StreakStats`
- `getRecentLogs()` → `DailyActivityLog[]`
- `getMonthlyStats(targetDate)` → `MonthlyStatsData`
- `getSuccessRate(filter)` → `SuccessRatePoint[]`

### `goalService.ts`

- `fetchGoals()` → `Goal[]`
- `addGoal`, `updateGoal`, `deleteGoal`
- `toggleGoalCompletion(goalId, is_completed)`

### `todoService.ts`

- `fetchTodos()`, `addTodo(title, time?)`, `toggleTodo`, `deleteTodo`

### `friendService.ts`

- `searchByUsername`, `getProfileById`, `getFriends`, `getPendingRequests`
- `sendFriendRequest`, `acceptFriendRequest`, `rejectFriendRequest`, `removeFriend`

### `sharedHabitService.ts`

- `createGroup`, `updateGroup`, `deleteSharedGroup`, `fetchUserGroups`, `leaveGroup`
- `inviteUserToGroup`, `removeMember`
- `addSharedHabit`, `updateSharedHabit`, `deleteSharedHabit`, `fetchHabitsByGroup`
- `toggleLog()` — Validation d'un objectif commun

### `notificationService.ts`

- `getNotifications()`, `getUnreadCount()`
- `markAsRead`, `markAllAsRead`, `deleteNotification`, `clearAll`
- `subscribe(userId, onNew)` — Listener temps réel (Supabase Realtime)

---

## 🔔 Notifications Push (OneSignal + Cron)

### Cron Job Vercel (`/api/cron/remind`)

S'exécute chaque jour à **6h UTC**. Pour chaque utilisateur avec des habitudes actives :

| Moment            | Heure locale | Message                                     |
| ----------------- | ------------ | ------------------------------------------- |
| ☀️ Matin         | 7h           | "X objectifs aujourd'hui !"                 |
| 🔔 Après-midi    | 14h          | "N'oublie pas tes objectifs !"              |
| 🌙 Soir          | 21h          | "Dernière chance pour valider !"            |
| ⏰ Heure exacte  | Définie      | "C'est l'heure : [nom de l'objectif] !"     |
| ⏰ 10 min avant  | H-10min      | "[Objectif] dans 10 min"                    |

Les rappels Todo avec heure définie sont également programmés.

Tous les horaires sont **adaptés au fuseau horaire de l'utilisateur** (colonne `timezone` dans `profiles`).

### Notifications in-app

| Type              | Déclencheur                                | Lien    |
| ----------------- | ------------------------------------------ | ------- |
| `friend_request`  | Nouvelle demande d'ami reçue               | `/amis` |
| `friend_request`  | Demande d'ami acceptée                     | `/amis` |
| `group_invite`    | Invitation dans un groupe partagé          | `/`     |
| `habit_completed` | Un membre du groupe valide un objectif     | `/`     |

---

## ⚙️ Configuration

### Variables d'environnement (`.env.local`)

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIs...
NEXT_PUBLIC_ONESIGNAL_APP_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
ONESIGNAL_REST_API_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
CRON_SECRET=votre_secret_cron
```

### Next.js (`next.config.ts`)

- **PWA** via `@ducanh2912/next-pwa` (désactivée en dev)
- **Images distantes autorisées** : `*.supabase.co` (avatars Storage), `lh3.googleusercontent.com`, Facebook

### Tailwind (`tailwind.config.ts`)

- Couleurs custom : `primary`, `background`, `surface`, `foreground`, `muted`
- Ombres custom : `neo` (4px), `neo-sm` (2px)
- Police : `sans` → Montserrat

---

## 🚀 Lancement

```bash
# Installation des dépendances
npm install

# Développement
npm run dev

# Build production
npx next build --webpack

# Démarrage production
npm start

# Déploiement Vercel
vercel --prod
```

---

## 🗃️ Setup de la Base de Données

### Installation complète (première fois)

1. Créer un projet sur [Supabase](https://supabase.com)
2. Ouvrir le **SQL Editor** dans le dashboard
3. Exécuter `supabase/fresh_setup.sql` (**Run**)
4. (Optionnel) Exécuter `supabase/seed.sql` pour des données de test

### Migrations nécessaires (à appliquer dans l'ordre)

```
018_long_term_goals.sql       → Table goals
add_timezone_to_profiles.sql  → Colonne timezone
020_avatars_bucket.sql        → Bucket Storage avatars
021_profile_bio.sql           → Colonne bio dans profiles
022_fix_notification_links.sql → Correction liens /partages → /
```

> ⚠️ Les migrations 020 et suivantes sont **indépendantes du fresh_setup.sql** et doivent être appliquées manuellement dans Supabase SQL Editor sur un projet existant.

---

## 🗂️ Historique des Migrations

| Fichier                                 | Description                                                |
| --------------------------------------- | ---------------------------------------------------------- |
| `001_update_handle_new_user.sql`        | Trigger anti-fantômes (profil créé à la confirmation)      |
| `002_cleanup_ghost_users.sql`           | Nettoyage des profils fantômes existants                   |
| `003_temporary_todos.sql`               | Table todos + trigger auto-cleanup 24h                     |
| `004_monthly_habits.sql`                | Contraintes date mensuelle sur les habitudes               |
| `006_add_profile_widgets.sql`           | Colonne `profile_widgets` dans profiles                    |
| `007_add_policy_habits.sql`             | Policies RLS supplémentaires pour habits                   |
| `008_add_policy_todo.sql`               | Policies RLS pour todos                                    |
| `009_habit_date_range.sql`              | Plage de dates start/end sur les habitudes                 |
| `010_friendships.sql`                   | Table friendships + RLS                                    |
| `011_add_habit_categories.sql`          | Enum catégories d'habitudes                                |
| `012_shared_habits.sql`                 | Tables groupes partagés + membres + objectifs + logs       |
| `013_auto_delete_empty_groups.sql`      | Suppression automatique des groupes vides                  |
| `014_notifications.sql`                 | Table notifications + triggers amis/groupes                |
| `015_notify_shared_habit_log.sql`       | Trigger notif à la validation d'un objectif commun         |
| `016_enable_realtime.sql`               | Activation Supabase Realtime sur les tables clés           |
| `017_add_time_to_todos.sql`             | Colonne `time` optionnelle sur les todos                   |
| `018_long_term_goals.sql`               | Table goals (objectifs long terme)                         |
| `add_timezone_to_profiles.sql`          | Colonne `timezone` dans profiles                           |
| `020_avatars_bucket.sql`                | Bucket Storage pour photos de profil + policies RLS        |
| `021_profile_bio.sql`                   | Colonne `bio TEXT` dans profiles                           |
| `022_fix_notification_links.sql`        | Correction des liens `/partages` → `/` dans les triggers   |

---

_Dernière mise à jour de ce README : 31 Mars 2026_
