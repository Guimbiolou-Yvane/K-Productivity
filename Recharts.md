# Recharts - Design System Néo-Brutaliste

Ce document définit les standards d'intégration de la librairie **Recharts** (`recharts`) pour l'application Karisma Productivity.

Le but est d'effacer le style "Corporate/Affiné" traditionnel des graphiques pour imposer l'esprit **Néo-Brutaliste** : des contours épais, des couleurs brutes, des ombres dures et une typographie percutante.

---

## 🖤 Les 4 Piliers Néo-Brutalistes pour les Graphiques

Pour que les statistiques s'intègrent parfaitement avec nos `neo-card` et `neo-btn`, chaque graphique doit respecter ces règles :

1. **Les Lignes et Bordures (Strokes) :** Toujours épaisses et purement noires (`stroke="var(--foreground)"` ou `stroke="#000"`, `strokeWidth={3}` minimum).
2. **Les Couleurs (Fills) :** Utiliser les couleurs primaires unies et vives du projet (Jaune `var(--primary)`, Vert, Rouge, Violet, etc.). **Zéro dégradé subtil**.
3. **Le Fond (Background) :** Le graphique repose idéalement sur un fond clair (le `var(--surface)` ou `var(--background)`) pour faire ressortir les lignes noires.
4. **Les "Dots" et Points de données :** Ils doivent ressembler à de gros clous de pixels. Gros diamètre, remplissage de couleur, et bordure noire épaisse.

---

## 🎨 Composants Recharts & Customisations

La force de Recharts est de pouvoir tout surcharger. Voici comment styliser les composants clés :

### 1. Custom Tooltip (Le plus important)

Le Tooltip par défaut de Recharts est très basique et "corporate". Il faut le remplacer par un composant `neo-card`.

```tsx
// Exemple de Tooltip Néo-Brutaliste
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="neo-card bg-surface p-3 !shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] z-50">
        <p className="font-black uppercase mb-1 border-b-2 border-foreground pb-1">
          {label}
        </p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="font-bold flex items-center gap-2">
            <span
              className="w-3 h-3 inline-block border-2 border-foreground"
              style={{ backgroundColor: entry.color }}
            />
            {entry.name} : {entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// Utilisation :
// <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
```

### 2. XAxis et YAxis (Les Axes)

Les grilles et lignes d'axe ne doivent pas être invisibles :

- `stroke="#000"` pour les axes principaux.
- `strokeWidth={3}` (ou 2) pour l'épaisseur.
- `tick={{ fill: '#000', fontWeight: 'bold' }}` pour rendre les jours/nombres impactants.

### 3. CartesianGrid (La Grille de Fond)

- Fini les grilles grises pointillées timides.
- Utiliser une grille stricte ou alors masquer l'axe avec: `strokeDasharray="0"` et `stroke="rgba(0,0,0,0.1)"`.

---

## 📊 Exemples de Designs

### A. Le Graphique en Barres (BarChart) - Pour les Habitudes Journalières

Les barres doivent ressembler à de gros blocs d'encre colorée.

- La prop `stroke` d'un `<Bar />` accepte des variables CSS !

```tsx
<ResponsiveContainer width="100%" height={300}>
  <BarChart data={data} margin={{ top: 20, right: 30, left: -20, bottom: 0 }}>
    <CartesianGrid
      strokeDasharray="0"
      stroke="rgba(0,0,0,0.1)"
      vertical={false}
    />
    <XAxis
      dataKey="jour"
      stroke="#000"
      strokeWidth={2}
      tick={{
        fill: "#000",
        fontWeight: 900,
        fontSize: 12,
        fontFamily: "sans-serif",
      }}
    />
    <YAxis
      stroke="#000"
      strokeWidth={2}
      tick={{ fill: "#000", fontWeight: 900, fontFamily: "sans-serif" }}
    />
    <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(0,0,0,0.1)" }} />
    <Bar
      dataKey="habitudesFaites"
      fill="var(--primary)"
      stroke="#000" // Bordure noire BRUTE
      strokeWidth={3}
      radius={[0, 0, 0, 0]} // Pas de coins arrondis !
      activeBar={{ stroke: "#000", strokeWidth: 4, fill: "#fff" }} // Effet hover !
    />
  </BarChart>
</ResponsiveContainer>
```

### B. Le Graphique en Ligne (LineChart) - Pour l'Expérience / Streaks

La courbe de progression (XP ou Streak) ne doit pas être esthétiquement gommée (smooth).

- Utiliser `type="linear"` (ou `type="stepBefore"` pour un rendu ultra digital 90s).
- Définir de gros `dot`.

```tsx
<ResponsiveContainer width="100%" height={250}>
  <LineChart data={streakData}>
    <CartesianGrid stroke="rgba(0,0,0,0.1)" vertical={false} />
    <XAxis
      dataKey="semaine"
      stroke="#000"
      strokeWidth={2}
      tick={{ fontWeight: "bold" }}
    />
    <Tooltip content={<CustomTooltip />} />
    <Line
      type="linear"
      dataKey="streakMax"
      stroke="#ff6b6b" // Couleur rouge brut
      strokeWidth={5} // Ligne très épaisse
      dot={{
        r: 6, // Gros points
        fill: "#ff6b6b",
        stroke: "#000",
        strokeWidth: 3,
      }}
      activeDot={{ r: 10, stroke: "#000", strokeWidth: 4 }}
    />
  </LineChart>
</ResponsiveContainer>
```

---

## ⚡ L'Animation de base

Les composants Recharts ont leurs propres animations (`isAnimationActive={true}`).
Cela crée un effet de remplissage fluide natif lors du premier rendu de la page "Statistiques" sans avoir besoin d'utiliser Framer Motion sur les barres elles-mêmes (bien qu'on gardera Motion pour l'entrée du container global `ResponsiveContainer`).
