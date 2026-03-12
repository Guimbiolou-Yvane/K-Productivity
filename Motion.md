---
name: "Skill Motion v12"
description: "Best practices and guidelines for using the modern `motion` package (formerly `framer-motion`) inside React applications."
---

# Guide des Bonnes Pratiques : Motion pour React

Ce fichier contient les "Skills" (connaissances) pour implémenter des animations de haute qualité en utilisant le package moderne `motion` (qui remplace `framer-motion` v12+) combiné avec le style de conception **Néo-Brutalisme**.

## 1. Importation du Package

Dans les nouvelles versions, `framer-motion` a été regroupé dans le package `motion`. Vous ne devez plus utiliser `import { motion } from "framer-motion"`.

**Correct :**

```tsx
import { motion, AnimatePresence } from "motion/react";
```

## 2. L'ADN de l'Animation Néo-Brutaliste

Le _Néo-Brutalisme_ déteste les fondus lents, mous, "baveux" ou trop élégants (typés Apple/Material Design) avec un long `duration` (genre 0.5s ou 1s).
L'animation doit être:

- **Rapide & Saccadée (Snappy) :** Les choses poppent, clignotent ou se déplacent presque instantanément.
- **Lourde (Pondérée) :** Donner l'impression que l'élément UI est un bloc physique lourd qui tombe ou percute un bord.
- **Ressort Tendus (Stiff Springs) :** Utiliser des ressorts (spring) à haute rigidité (stiffness) plutôt que des `easings` classiques.

## 3. Paramètres de Transition (Transition Config)

### L'Effet de Ressort Dur (Par Défaut)

Si vous voulez déplacer un élément comme notre liste de cartes de jours (`Habit Tracker`), l'utilisation du type `spring` avec forte friction est essentielle :

```tsx
transition={{
  type: "spring",
  stiffness: 400, // très tendu (rapide)
  damping: 30, // beaucoup de friction (pas de rebond prolongé, il s'arrête net)
  mass: 1
}}
```

✅ **Excellent pour :** Les fenêtres modales qui s'ouvrent, les pages qui chassent une autre page (Slide).

### L'Effet Pop / Zoom (Boutons & Icônes)

Pour toute interaction physique de l'utilisateur (appui sur un bouton ou une checkbox) :

```tsx
whileTap={{ scale: 0.9, x: 2, y: 2 }} // Écrase le bouton, enlève l'ombre portée
```

_Note : Souvent, en Néo-Brutalisme, nous avons géré ces états de boutons via du CSS pur `awind hover:/active:` pour soulager React. Si utiliser Motion est requis, voici l'esprit._

## 4. AnimatePresence Mode & Gestions du Layout

- Utilisez `<AnimatePresence mode="popLayout">` conjointement avec l'attribut `layout` sur vos éléments adjacents (comme dans le Navigation.tsx Bottom Bar) pour que les autres composants s'écartent _physiquement_ pour contourner l'espace instantanément plutôt que d'attendre l'effacement.
- N'oubliez jamais d'ajouter la prop `key` dynamique sur vos éléments `<motion.div>` enveloppés par `<AnimatePresence>`! C'est elle qui dit à React que l'objet a réellement changé et doit déclencher l'animation `initial` -> `animate` -> `exit`.

## 5. Performance

- Motion s'appuie désormais sur le WAAPI (Web Animations API) pour l'accélération matérielle quand c'est possible.
- Évitez d'animer la largeur/hauteur (`width`, `height`) à chaque frame s'il y a un très gros flux DOM dans la page. Favorisez plutôt `scale`, `x` et `y`. _Exception pour l'effet accordéon._
