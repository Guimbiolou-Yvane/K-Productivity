# 🧠 Skill: PPTX Generator

## 🎯 Objectif

Générer automatiquement des présentations PowerPoint (.pptx) structurées, claires et professionnelles à partir d’un prompt utilisateur.

---

## 🧾 Format de sortie attendu

Le contenu doit être structuré sous forme de slides avec :

- Un titre de slide
- Des bullet points concis
- Optionnel : notes du présentateur
- Optionnel : suggestions visuelles (images, graphiques)

---

## 📊 Structure

Chaque présentation doit suivre cette structure :

### 1. Slide de couverture

- Titre principal
- Sous-titre
- Auteur / date (optionnel)

---

### 2. Slides de contenu

Chaque slide doit respecter :

Slide: <Titre>
Point clé 1
Point clé 2
Point clé 3

Notes:
<explication détaillée pour le présentateur>

---

### 3. Slide finale

- Conclusion
- Call to action / résumé

---

## 🎨 Règles de génération

- Maximum 5 bullet points par slide
- Phrases courtes (moins de 12 mots)
- Pas de paragraphes longs
- Utiliser un langage clair et professionnel
- Structurer logiquement (introduction → développement → conclusion)

---

## 🧩 Types de slides spéciaux

### 📈 Slide avec données

Slide: Résultats
Croissance: +25%
Utilisateurs: 10k
Revenus: 50k€

Visual:
Graphique en barres recommandé

---

### 🖼️ Slide visuel

Slide: Architecture
Backend: .NET
Frontend: Angular
Auth: JWT

Visual:
Diagramme d’architecture

---

### ⚖️ Slide comparaison

Slide: Comparaison
Solution A: Simple, rapide
Solution B: Flexible, scalable

Visual:
Tableau comparatif

---

## 🛠️ Paramètres dynamiques (input)

Le système peut recevoir :

- `topic` : sujet de la présentation
- `audience` : public cible
- `tone` : formel / casual / technique
- `length` : nombre de slides
- `language` : langue

---

## 🧪 Exemple

### Input

topic: JWT Authentication
audience: développeurs backend
length: 5
language: fr

### Output

Slide: Introduction à JWT
Standard d’authentification
Basé sur des tokens
Stateless

Notes:
JWT permet d’éviter les sessions côté serveur.

---

## ⚙️ Intégration avec ton code

Tu peux parser ce markdown pour générer un `.pptx` avec :

- C# → `OpenXML SDK` ou `PowerPoint Interop`
- Node → `pptxgenjs`
- Python → `python-pptx`

---

## 🚀 Bonus

Tu peux enrichir avec :

- Images automatiques (API)
- Icônes
- Templates visuels
- Thèmes (dark / corporate)

---

## 🧱 Contraintes importantes

- Toujours respecter la structure markdown
- Ne jamais générer de texte hors slide
- Une slide = un bloc `## Slide:`

---

## ✅ Résultat attendu
