# Karisma Productivity (K-Productivity)

> Application PWA de suivi d'objectifs et de productivité avec une identité visuelle **Néo-Brutaliste**.

---

## 📋 Vue d'ensemble

**Karisma Productivity** est une application web progressive (PWA) qui permet aux utilisateurs de créer des objectifs mensuels récurrents (habits), de les cocher quotidiennement, de suivre leurs statistiques (streaks, taux de réussite, calendrier mensuel), et de gérer des tâches temporaires (todos) à durée de vie de 24h.

L'application inclut un système d'authentification complet (email/password + OAuth Google/Facebook), un système de profils utilisateurs, système de liste d'amis complet avec invitations, la possibilité de créer des **groupes avec des objectifs partagés**, l'envoi de **notifications Push (rappels automatiques via OneSignal)**, et une page de paramètres avancée.

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
| **Backend / BDD** | Supabase (Auth + PostgreSQL)   | @supabase/supabase-js 2.98.0, @supabase/ssr 0.9.0 |
| **PWA**           | @ducanh2912/next-pwa           | 10.2.9                                            |
| **Notifications** | OneSignal (react-onesignal)    | 3.5.1                                             |
| **Utilitaires**   | date-fns, clsx, tailwind-merge | —                                                 |

---

## 📁 Architecture du Projet

```
Karisma Productivity/
├── public/
│   ├── K_SVG.png              # Favicon PNG
│   ├── Logo.png               # Logo PNG (PWA icons)
│   ├── manifest.json          # Manifeste PWA
│   ├── sw.js                  # Service Worker (auto-généré)
│   └── ...                    # Autres assets statiques
│
├── src/
│   ├── app/                   # App Router (Next.js)
│   │   ├── layout.tsx         # Layout racine (Montserrat font, Navigation)
│   │   ├── page.tsx           # Page d'accueil (HabitTracker + TodoList)
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
│   │   │       └── page.tsx   # Page profil (propre ou d'un autre utilisateur)
│   │   │
│   │   ├── amis/
│   │   │   └── page.tsx       # Page Amis (recherche utilisateurs, liste d'amis, demandes)
│   │   │
│   │   └── parametres/
│   │       └── page.tsx       # Page Paramètres (modifier profil, mot de passe, déconnexion)
│   │
│   ├── components/
│   │   ├── HabitTracker.tsx   # Composant principal : grille d'objectifs hebdomadaire (716 lignes)
│   │   ├── Navigation.tsx     # Barre de navigation bottom (mobile) + sidebar (desktop)
│   │   └── TodoList.tsx       # Liste de tâches temporaires (24h)
│   │
│   ├── lib/
│   │   ├── models/
│   │   │   ├── user.ts        # Interface UserProfile
│   │   │   ├── habit.ts       # Interfaces Habit, HabitLog, UIHabit, StreakStats, MonthlyStatsData, SuccessRatePoint
│   │   │   └── todo.ts        # Interface Todo
│   │   │
│   │   ├── services/
│   │   │   ├── authService.ts        # Authentification (signUp, signIn, OAuth, profil, mot de passe, listeners)
│   │   │   ├── habitService.ts       # CRUD Habits + Statistiques complètes
│   │   │   ├── todoService.ts        # CRUD Todos (fetch, add, toggle, delete)
│   │   │   ├── friendService.ts      # Recherche, demandes d'amis, consultation amis
│   │   │   └── sharedHabitService.ts # Groupes, invitations, habitudes partagées et progression inter-membres
│   │   │
│   │   └── supabase/
│   │       ├── client.ts      # Client Supabase côté navigateur (createBrowserClient)
│   │       └── server.ts      # Client Supabase côté serveur (createServerClient avec cookies)
│   │
│   └── middleware.ts          # Middleware Next.js : rafraîchit la session Supabase + protège les routes privées
│
├── supabase/
│   ├── schema.sql             # Schéma SQL de base (profiles, habits, habit_logs) + RLS + Triggers
│   ├── fresh_setup.sql        # Script complet "from scratch" consolidant tout (⚡ RECOMMANDÉ pour un fresh install)
│   ├── seed.sql               # Script de peuplement (3 habitudes + logs + todos de test)
│   └── migrations/
│       ├── 001_update_handle_new_user.sql    # Trigger anti-fantômes (profil créé à la confirmation email)
│       ├── 003_temporary_todos.sql           # Création table todos + trigger auto-cleanup 24h
│       ├── ...                               # Différentes modifications RLS & colonnes
│       ├── 010_friendships.sql               # Ajout du système d'amitié (demandes, acceptations, pending)
│       └── 012_shared_habits.sql             # Groupes partagés et objectifs multi-utilisateurs
│
├── DesignUI.md                # Charte graphique Néo-Brutalisme (couleurs, typo, formes, ombres)
├── Motion.md                  # Guide des bonnes pratiques d'animation avec Motion v12
├── Recharts.md                # Guide d'utilisation de Recharts
│
├── tailwind.config.ts         # Config Tailwind (couleurs, ombres néo, polices)
├── next.config.ts             # Config Next.js (PWA, remote images Google/Facebook)
├── package.json               # Dépendances et scripts
└── .env.local                 # Variables d'environnement (Supabase URL + Anon Key)
```

---

## 🗄️ Base de Données Supabase

### Tables

| Table                      | Description                                    | Clés étrangères                                       |
| -------------------------- | ---------------------------------------------- | ----------------------------------------------------- |
| **`profiles`**             | Profil utilisateur (lié à `auth.users`)        | `id` → `auth.users(id)` ON DELETE CASCADE             |
| **`habits`**               | Objectifs mensuels récurrents                  | `user_id` → `profiles(id)` ON DELETE CASCADE          |
| **`habit_logs`**           | Logs de complétion journalière                 | `habit_id` → `habits(id)`, `user_id` → `profiles(id)` |
| **`todos`**                | Tâches temporaires (auto-supprimées après 24h) | `user_id` → `profiles(id)` ON DELETE CASCADE          |
| **`friendships`**          | Relations d'amitié entre utilisateurs          | `user_id`, `friend_id` → `profiles(id)`               |
| **`shared_groups`**        | Groupes collaboratifs                          | `creator_id` → `profiles(id)`                         |
| **`shared_group_members`** | Membres des groupes avec date de join          | `group_id` → `shared_groups(id)`, `user_id`           |
| **`shared_habits`**        | Objectifs appartenant à un groupe              | `group_id` → `shared_groups(id)`, `created_by`        |
| **`shared_habit_logs`**    | Complétions journalières par membre du groupe  | `shared_habit_id` → `shared_habits(id)`, `user_id`    |

### Modèles TypeScript ↔ Tables SQL

```
UserProfile  →  profiles     (id, email, first_name, last_name, username, avatar_url, longest_streak, created_at, updated_at)
Habit        →  habits       (id, user_id, name, category, frequency[], color, icon, time, target_month, created_at)
HabitLog     →  habit_logs   (id, habit_id, user_id, completed_date, created_at)  [UNIQUE: habit_id + completed_date]
Todo         →  todos        (id, user_id, title, is_completed, created_at)
Friendship   →  friendships  (id, user_id, friend_id, status, created_at)
SharedGroup  →  shared_groups, shared_group_members, shared_habits, shared_habit_logs

### Types dérivés (UI uniquement, pas de table)

| Type                | Rôle                                                                          |
| ------------------- | ----------------------------------------------------------------------------- |
| `UIHabit`           | Habit + dictionnaire `completedLogs` pour l'affichage hebdomadaire            |
| `StreakStats`       | `{ current, best }` — calculé depuis `habit_logs` + `profiles.longest_streak` |
| `DailyActivityLog`  | Données pour les cercles de la série actuelle (date, count, color)            |
| `HabitMonthlyStats` | Jours du mois où un objectif a été validé                                     |
| `MonthlyStatsData`  | Agrégation des stats mensuelles (tous objectifs + par objectif)               |
| `SuccessRatePoint`  | Point de données pour le graphique Recharts (label, rate, completed, total)   |

### Enum PostgreSQL

```sql
CREATE TYPE habit_category AS ENUM ('SANTÉ', 'DÉV. PERSO', 'TRAVAIL', 'SOCIAL', 'GÉNÉRAL');
```

### Row Level Security (RLS)

Toutes les tables ont RLS activé. Chaque utilisateur ne peut **voir, créer, modifier et supprimer que ses propres données** (`auth.uid() = user_id` ou `auth.uid() = id` pour profiles).

### Triggers & Fonctions

| Trigger                      | Table        | Événement     | Rôle                                                                                                                 |
| ---------------------------- | ------------ | ------------- | -------------------------------------------------------------------------------------------------------------------- |
| `on_auth_user_confirmed`     | `auth.users` | AFTER UPDATE  | Crée automatiquement le profil dans `profiles` quand `email_confirmed_at` passe de NULL à une valeur (anti-fantômes) |
| `update_profiles_updated_at` | `profiles`   | BEFORE UPDATE | Met à jour automatiquement `updated_at` à chaque modification                                                        |
| `trigger_cleanup_old_todos`  | `todos`      | AFTER INSERT  | Supprime les todos de plus de 24h à chaque nouvel ajout                                                              |
| `trigger_delete_empty_group_on_leave` | `shared_group_members` | AFTER DELETE | Supprime le groupe partagé automatiquement s'il compte moins de 2 membres après un départ.           |

---

## 🔐 Authentification

- **Email/Password** : Inscription avec confirmation email obligatoire, connexion classique
- **OAuth** : Google et Facebook (via `/auth/callback` route handler)
- **Middleware** (`src/middleware.ts`) : Rafraîchit la session Supabase sur chaque requête, redirige vers `/login` si non authentifié
- **Deux clients Supabase** :
  - `client.ts` : `createBrowserClient` pour les composants `"use client"`
  - `server.ts` : `createServerClient` pour les Server Components et Route Handlers

---

## 🎨 Design System — Néo-Brutalisme

Documenté en détail dans [`DesignUI.md`](DesignUI.md).

### Résumé des choix clés

- **Palette** : Jaune vif (`#FFFF00` / `#ffda59`), Noir (`#000`), Gris clair (`#F4F4F4`), Blanc (`#FFF`)
- **Couleurs fonctionnelles** : Vert (`#1fb05a`), Rouge (`#ff6b6b`), Bleu (`#4facff`), Violet (`#9d4edd`), Orange (`#ff9e00`)
- **Police** : Montserrat (poids 400, 700, 900) en variable CSS `--font-archivo-black`
- **Bordures** : 4px solides noires sur tous les éléments interactifs
- **Angles** : 0px de border-radius (strict)
- **Ombres** : Hard drop shadows (`4px 4px 0px 0px rgba(0,0,0,1)`)
- **Classes utilitaires** : `neo-btn`, `neo-card`, `neo-input`, `neo-checkbox` (définies dans `globals.css`)

### Animations (Motion v12)

Documenté dans [`Motion.md`](Motion.md).

- Import : `import { motion, AnimatePresence } from "motion/react"`
- Springs tendus : `stiffness: 400, damping: 30`
- Interactions : `whileTap={{ scale: 0.9 }}`, `whileHover={{ scale: 1.01 }}`

---

## 📱 Pages de l'Application

| Route            | Composant                                | Description                                                                      |
| ---------------- | ---------------------------------------- | -------------------------------------------------------------------------------- |
| `/`              | `page.tsx` → `HabitTracker` + `TodoList` | Page d'accueil avec grille d'objectifs hebdomadaire et liste de todos            |
| `/login`         | `LoginPage`                              | Connexion / Inscription (email + OAuth Google/Facebook)                          |
| `/stats`         | `StatsPage`                              | Statistiques : Streak, Taux de réussite (graphique Recharts), Calendrier mensuel |
| `/profil`        | `ProfilRedirect`                         | Redirige vers `/profil/[mon-id]`                                                 |
| `/profil/[id]`   | `ProfilIdPage`                           | Page de profil (propre ou d'un autre user, avec modal d'édition)                 |
| `/amis`          | `AmisPage`                               | Recherche d'utilisateurs, liste d'amis, demandes en attente                      |
| `/parametres`    | `ParametresPage`                         | Modifier username, nom, mot de passe, déconnexion                                |
| `/auth/callback` | Route Handler (GET)                      | Échange le code OAuth contre une session                                         |

---

## 🧩 Composants Principaux

### `HabitTracker.tsx` (~716 lignes)

Le cœur de l'application. Affiche une grille hebdomadaire des objectifs du mois en cours.

- **Navigation temporelle** : Boutons précédent/suivant pour naviguer dans les jours de la semaine, bouton "Aujourd'hui"
- **Toggle d'objectifs** : Cocher/décocher un objectif pour un jour donné (optimistic update)
- **Modal d'ajout/édition** : Formulaire complet (nom, catégorie, fréquence, couleur, icône, heure)
- **Suppression** : Avec confirmation et animation de sortie
- **Couleurs prédéfinies** : `["#ffda59", "#1fb05a", "#ff6b6b", "#4facff", "#9d4edd", "#ff9e00"]`
- **Icônes prédéfinies** : `["🎯", "🏃‍♂️", "📚", "💧", "🧘‍♂️", "💼", "🧠", "🔥", "💪", "🥦"]`

### `SharedHabitsTracker.tsx` (~644 lignes)

Page principale de suivi des objectifs communs (groupes).

- **Interface Mobile-first** : Sur smartphone, les cartes d'objectifs sont entièrement cliquables pour l'édition et les boutons sont masqués (les boutons d'action d'édition et suppression habituels existent sur Desktop).
- **Navigation Temporelle** : Sélecteur de jour carrousel pour valider l'objectif du groupe pour n'importe quelle date passée ou présente. Le filtre s'ajuste selon la fréquence de l'habitude.
- **Gestion Avancée des Groupes** : Les users peuvent éditer le nom ou les participants, et "quitter un groupe". Les groupes vides se détruisent automatiquement.
- **Ajout/Édition Avancé** : Le modal des habitudes inclut maintenant les mêmes paramètres qu'un Habit individuel (fréquence et période de durabilité).
- **Animation Skeleton** : Pendant le chargement, des blocs grisés "néo-brutalistes" clignotent en fond.

### `Navigation.tsx` (~201 lignes)

Barre de navigation responsive.

- **Mobile** : Bottom bar fixe avec 5 onglets (Accueil, Stats, Amis, Paramètres) + avatar profil
- **Desktop** : Sidebar latérale gauche
- **Onglets** : Home (`/`), Stats (`/stats`), Amis (`/amis`), Paramètres (`/parametres`)
- Charge le profil utilisateur pour afficher l'avatar

### `TodoList.tsx` (~186 lignes)

Liste de tâches temporaires (24h).

- **Ajout** avec optimistic update
- **Toggle** complétion
- **Suppression**
- **Tri** : Non complétés en premier, puis complétés
- **Auto-cleanup** : Les todos de plus de 24h sont supprimés automatiquement via un trigger SQL

---

## 📊 Services (Couche Données)

### `authService.ts`

- `signUpWithEmail(email, password, username)` — Inscription avec metadata username
- `signInWithEmail(email, password)` — Connexion classique
- `signInWithOAuth(provider)` — Connexion OAuth (Google/Facebook)
- `signOut()` — Déconnexion
- `getUser()` / `getSession()` — Récupérer l'utilisateur/session
- `getProfile()` / `updateProfile(updates)` — Lecture/écriture dans `profiles`
- `resetPassword(email)` / `updatePassword(newPassword)` — Gestion mot de passe
- `onAuthStateChange(callback)` — Listener temps réel

### `habitService.ts`

- `fetchHabits()` — Récupère les habits du mois courant + leurs logs, retourne des `UIHabit[]`
- `addHabit(name, category, frequency, color, icon, time?)` — Crée un objectif pour le mois courant
- `updateHabit(habitId, ...)` — Met à jour un objectif
- `deleteHabit(habitId)` — Supprime un objectif
- `toggleLog(habitId, dayOrDate)` — Cocher/décocher (gère jour de la semaine ou date YYYY-MM-DD)
- `getStreak()` → `StreakStats` — Calcule la série actuelle + récupère le record
- `getRecentLogs()` → `DailyActivityLog[]` — Jours composant la série actuelle
- `getMonthlyStats(targetDate)` → `MonthlyStatsData` — Stats calendrier mensuel
- `getSuccessRate(filter: "day"|"week"|"month")` → `SuccessRatePoint[]` — Données pour le graphique Recharts

### `todoService.ts`

- `fetchTodos()` — Récupère les todos des dernières 24h
- `addTodo(title)` — Ajoute un todo
- `toggleTodo(id, is_completed)` — Toggle complétion
- `deleteTodo(id)` — Supprime un todo

### `friendService.ts`

- `searchByUsername(query)` — Recherche partielle insensible à la casse
- `getProfileById(userId)` — Récupère le profil public d'un utilisateur
- `getFriends()`, `getPendingRequests()` — Liste des amis et demandes en cours
- `sendFriendRequest(friendId)`, `acceptFriendRequest()`, `rejectFriendRequest()`, `removeFriend()` — Actions d'amitié

### `sharedHabitService.ts`

- `createGroup()`, `updateGroup()`, `deleteSharedGroup()`, `fetchUserGroups()` — Gestion complète du cycle de vie des groupes
- `inviteUserToGroup()`, `leaveGroup()`, `removeMember()` — Gestion des membres au sein du groupe
- `addSharedHabit()`, `updateSharedHabit()`, `deleteSharedHabit()`, `fetchHabitsByGroup()` — CRUD des objectifs liés au groupe
- `toggleLog()` — Validation d'un objectif de groupe par journée pour un utilisateur précis

---

## ⚙️ Configuration

### Variables d'environnement (`.env.local`)

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
```

### Next.js (`next.config.ts`)

- **PWA** via `@ducanh2912/next-pwa` (désactivée en dev)
- **Images distantes autorisées** : `lh3.googleusercontent.com` (Google), `platform-lookaside.fbsbx.com` et `graph.facebook.com` (Facebook)

### Tailwind (`tailwind.config.ts`)

- Couleurs custom : `primary`, `background`, `surface`, `foreground`, `muted`
- Ombres custom : `neo` (4px), `neo-sm` (2px)
- Bordure custom : `3` (3px)
- Police : `sans` → Montserrat via `--font-archivo-black`

---

## 🚀 Lancement

```bash
# Installation des dépendances
npm install

# Développement
npm run dev

# Build production
npm run build

# Démarrage production
npm start
```

---

## 🗃️ Setup de la Base de Données

### Installation complète (première fois)

1. Créer un projet sur [Supabase](https://supabase.com)
2. Ouvrir le **SQL Editor** dans le dashboard
3. Copier/coller le contenu de `supabase/fresh_setup.sql` et cliquer **Run**
4. (Optionnel) Après avoir créé un compte utilisateur, exécuter `supabase/seed.sql` pour des données de test

### Migrations (mises à jour incrémentales)

Les migrations dans `supabase/migrations/` sont ordonnées numériquement et documentent l'évolution du schéma.

---

## 🔮 Fonctionnalités à venir / En cours

- [ ] **Profil public étendu** : Afficher les statistiques d'un autre utilisateur sur sa page profil
- [ ] **Mode sombre** : Variante dark du thème néo-brutaliste

---

_Dernière mise à jour de ce README : 17 Mars 2026_

# K-Productivity
