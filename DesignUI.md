# Système de Design UI (Extraction)

Ce document détaille les choix de conception de l'interface utilisateur (UI), caractérisée par un style audacieux, cru et à fort contraste, s'inscrivant parfaitement dans la tendance du **Néo-Brutalisme**.

## 1. Palette de Couleurs

L'interface utilise une palette extrêmement restreinte et contrastée, basée sur des aplats de couleurs solides sans aucun dégradé.

- **Couleur d'accentuation (Primary) :**
  - Jaune vif et électrique (ex: `#FFFF00` ou très proche). Utilisé pour attirer l'attention (boutons actifs, cartes sélectionnées, badges de nouveauté, surlignage de texte).
- **Couleurs de structure et de typographie :**
  - Noir absolu (`#000000`). Utilisé massivement pour tous les textes principaux, les bordures épaisses, et les ombres portées dures (hard shadows).
  - Parfois utilisé comme couleur de fond inversée pour des sections entières (ex: bloc de progression, bouton d'ajout).
- **Couleurs de fond (Background & Surface) :**
  - Gris très clair / Blanc cassé (ex: `#F4F4F4`) pour le fond général de l'application.
  - Blanc pur (`#FFFFFF`) pour l'intérieur des cartes, des boutons inactifs et des champs à cocher.

## 2. Typographie

La typographie est imposante, affirmée et priorise l'impact visuel.

- **Famille de police globale :**
  - Police Sans-serif géométrique ou grotesque très grasse (poids _Black_ ou _Extra-Bold_), semblable à _Archivo Black_, _Impact_ ou _Montserrat_ dans ses graisses maximales.
- **Titres, Boutons et Navigation :**
  - **Style :** Utilisation systématique des lettres capitales (All-Caps).
  - **Poids :** Très gras, créant des blocs de texte denses.
  - **Effets :** Certains titres de section utilisent un soulignement décalé avec la couleur d'accentuation jaune pour un effet "surligneur".
- **Texte secondaire (Métadonnées, horaires, détails) :**
  - **Style :** Minuscules/majuscules classiques, utilisation de l'italique pour contraster avec la rigidité des titres.
  - **Couleur :** Gris foncé (ex: `#555555`), pour hiérarchiser l'information sans perdre la lisibilité.

## 3. Formes et Éléments UI

L'esthétique néo-brutaliste se traduit par un refus total des effets de profondeur réalistes et des courbes douces.

- **Bordures (Borders) :**
  - Tous les éléments interactifs (boutons, cartes, icônes de menu, cases à cocher) possèdent une bordure noire unie et très épaisse (environ 2 à 4 pixels).
- **Angles (Corners) :**
  - Angles droits stricts (0px de `border-radius`). Aucune courbe ou arrondi n'est présent dans l'interface, renforçant l'aspect géométrique et brutal.
- **Ombres (Shadows) :**
  - Ombres portées "dures" (Hard Drop Shadows). L'ombre est un bloc de couleur noir solide, décalé vers le bas et la droite (offset X et Y marqués), avec un flou de zéro (`blur: 0px`).
- **Composants spécifiques :**
  - **Cases à cocher (Checkboxes) :** Larges carrés à bordure épaisse. L'état validé est une simple coche vectorielle noire et épaisse.
  - **Barre de progression :** Bloc rectangulaire simple, délimité par une bordure fine, rempli partiellement par un aplat de la couleur d'accentuation jaune.
  - **Menu de navigation (Bottom Bar) :** Les icônes sont contenues dans des carrés individuels à bordure épaisse. L'état actif est signifié par le remplissage du carré en jaune.

## 4. Iconographie et Mise en Page

- **Iconographie :** Minimaliste, pleine (filled) ou avec des traits très épais (thick stroke) pour correspondre à la typographie. Elles sont utilitaires et sans fioritures.
- **Mise en page :**
  - Structure en blocs empilés verticalement.
  - Utilisation de lignes de séparation horizontales noires et épaisses s'étendant d'un bord à l'autre de l'écran (full width) pour délimiter les grandes zones (ex: sous l'en-tête).
  - Les images sont insérées de manière brute, avec un ratio horizontal strict, intégrées directement dans les cartes bordées de noir.
