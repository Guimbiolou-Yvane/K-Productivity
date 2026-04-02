// generate-pptx.cjs
// Génère la présentation Karisma Productivity en .pptx
// Exécuter : node generate-pptx.cjs

const PptxGenJS = require("pptxgenjs");
const pptx = new PptxGenJS();

// ─── PALETTES & THÈME ──────────────────────────────────────────────────────────
const C = {
  black:    "000000",
  yellow:   "FFDA59",
  yellowV:  "FFFF00",
  white:    "FFFFFF",
  grey:     "F4F4F4",
  greyMid:  "CCCCCC",
  green:    "1FB05A",
  blue:     "4FACFF",
  purple:   "9D4EDD",
  orange:   "FF9E00",
  red:      "FF6B6B",
  cyan:     "06B6D4",
  dark:     "111111",
};

pptx.layout   = "LAYOUT_WIDE"; // 33.8 × 19.05 cm
pptx.theme    = { headFontFace: "Montserrat", bodyFontFace: "Montserrat" };
pptx.author   = "Karisma Team";
pptx.company  = "K-Productivity";
pptx.subject  = "Présentation Karisma Productivity";
pptx.title    = "Karisma Productivity";

// ─── HELPERS ───────────────────────────────────────────────────────────────────
function addBg(slide, color = C.grey) {
  slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: "100%", h: "100%", fill: { color } });
}

function addBorder(slide, opts = {}) {
  const { x = 0.3, y = 0.3, w = 9.14, h = 6.45, color = C.black, size = 4 } = opts;
  slide.addShape(pptx.ShapeType.rect, {
    x, y, w, h,
    fill: { type: "none" },
    line: { color, width: size },
  });
}

function tag(slide, text, x, y, bg = C.yellow, textColor = C.black) {
  slide.addShape(pptx.ShapeType.rect, { x, y, w: 2.2, h: 0.38, fill: { color: bg }, line: { color: C.black, width: 2 } });
  slide.addText(text, {
    x, y, w: 2.2, h: 0.38,
    fontSize: 9, bold: true, color: textColor, align: "center", valign: "middle",
    charSpacing: 2,
  });
}

function sectionBar(slide, color = C.yellow) {
  slide.addShape(pptx.ShapeType.rect, { x: 0, y: 6.4, w: "100%", h: 0.55, fill: { color }, line: { color: C.black, width: 3 } });
}

function hardShadowRect(slide, x, y, w, h, fillColor, offset = 0.07) {
  // shadow
  slide.addShape(pptx.ShapeType.rect, { x: x + offset, y: y + offset, w, h, fill: { color: C.black } });
  // box
  slide.addShape(pptx.ShapeType.rect, { x, y, w, h, fill: { color: fillColor }, line: { color: C.black, width: 3 } });
}

function titleText(slide, text, opts = {}) {
  slide.addText(text, {
    x: 0.5, y: 0.25, w: 8.9, h: 1.1,
    fontSize: 36, bold: true, color: C.black, align: "left",
    charSpacing: 1,
    ...opts,
  });
}

function subText(slide, text, opts = {}) {
  slide.addText(text, {
    x: 0.5, y: 1.2, w: 8.9, h: 0.5,
    fontSize: 13, color: "555555", align: "left",
    ...opts,
  });
}

function bulletList(slide, items, x = 0.5, y = 1.85, w = 8.6, h = 4.5, size = 14) {
  const shaped = items.map((item) =>
    typeof item === "string"
      ? { text: item, options: { bullet: { type: "bullet", characterCode: "25A0", color: C.black }, indentLevel: 0 } }
      : item
  );
  slide.addText(shaped, {
    x, y, w, h,
    fontSize: size, color: C.dark, bold: false, valign: "top",
    paraSpaceBefore: 6,
  });
}

// ─── SLIDE 1 — COUVERTURE ──────────────────────────────────────────────────────
{
  const s = pptx.addSlide();
  // fond jaune sur la moitié gauche
  s.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 4.9, h: "100%", fill: { color: C.yellow } });
  // fond blanc droite
  s.addShape(pptx.ShapeType.rect, { x: 4.9, y: 0, w: 4.74, h: "100%", fill: { color: C.white } });
  // Séparateur noir vertical brutal
  s.addShape(pptx.ShapeType.rect, { x: 4.85, y: 0, w: 0.1, h: "100%", fill: { color: C.black } });

  // Titre
  s.addText("KARISMA", {
    x: 0.35, y: 1.0, w: 4.4, h: 1.1,
    fontSize: 54, bold: true, color: C.black, align: "left", charSpacing: -1,
  });
  s.addText("PRODUCTIVITY", {
    x: 0.35, y: 1.9, w: 4.4, h: 0.9,
    fontSize: 28, bold: true, color: C.black, align: "left", charSpacing: 3,
  });

  // Ligne noire sous titre
  s.addShape(pptx.ShapeType.rect, { x: 0.35, y: 2.8, w: 4.1, h: 0.06, fill: { color: C.black } });

  s.addText("Atteins tes objectifs.\nChaque jour.", {
    x: 0.35, y: 3.0, w: 4.1, h: 1.0,
    fontSize: 16, bold: false, color: C.dark, align: "left", breakLine: true,
  });

  // Tag version
  hardShadowRect(s, 0.35, 4.3, 1.7, 0.42, C.black);
  s.addText("Version 2026", { x: 0.35, y: 4.3, w: 1.7, h: 0.42, fontSize: 10, bold: true, color: C.white, align: "center", valign: "middle" });

  // Droite — pictos features
  const feats = [
    { emoji: "🏆", label: "Objectifs long terme" },
    { emoji: "🔄", label: "Objectifs répétitifs" },
    { emoji: "📋", label: "Tâches temporaires (24h)" },
    { emoji: "🤝", label: "Objectifs en commun" },
    { emoji: "📊", label: "Statistiques détaillées" },
    { emoji: "🔔", label: "Rappels Push automatiques" },
  ];
  feats.forEach((f, i) => {
    const row = 0.85 + i * 0.88;
    hardShadowRect(s, 5.15, row, 0.6, 0.6, C.yellow, 0.05);
    s.addText(f.emoji, { x: 5.15, y: row, w: 0.6, h: 0.6, fontSize: 18, align: "center", valign: "middle" });
    s.addText(f.label, { x: 5.85, y: row + 0.08, w: 3.5, h: 0.5, fontSize: 13, bold: true, color: C.dark });
  });

  // Footer
  s.addShape(pptx.ShapeType.rect, { x: 0, y: 6.67, w: "100%", h: 0.3, fill: { color: C.black } });
  s.addText("K-PRODUCTIVITY  ·  Application Web Progressive (PWA)  ·  2026", {
    x: 0, y: 6.67, w: "100%", h: 0.3,
    fontSize: 8, color: C.white, align: "center", valign: "middle", bold: true, charSpacing: 1,
  });
}

// ─── SLIDE 2 — LE PROBLÈME ─────────────────────────────────────────────────────
{
  const s = pptx.addSlide();
  addBg(s, C.white);
  sectionBar(s, C.red);

  tag(s, "LE PROBLÈME", 0.5, 0.22, C.red, C.white);
  titleText(s, "Pourquoi on n'atteint pas nos objectifs ?", { fontSize: 28, y: 0.55, h: 0.9 });

  // 3 blocs problème
  const problems = [
    { color: C.red,    icon: "😩", title: "On oublie", desc: "Sans système de suivi,\nnos intentions restent vagues" },
    { color: C.orange, icon: "🎯", title: "On manque de cap", desc: "Les objectifs flous\nne motivent pas sur la durée" },
    { color: C.purple, icon: "🤷", title: "On perd la motivation", desc: "Sans visibilité du progrès,\non abandonne trop vite" },
  ];

  problems.forEach((p, i) => {
    const x = 0.4 + i * 3.05;
    hardShadowRect(s, x, 1.6, 2.7, 3.8, C.grey);
    // couleur top bar
    s.addShape(pptx.ShapeType.rect, { x, y: 1.6, w: 2.7, h: 0.35, fill: { color: p.color }, line: { color: C.black, width: 3 } });
    s.addText(p.icon, { x, y: 2.1, w: 2.7, h: 0.8, fontSize: 36, align: "center" });
    s.addText(p.title.toUpperCase(), { x: x + 0.1, y: 3.0, w: 2.5, h: 0.45, fontSize: 15, bold: true, color: C.black, align: "center" });
    s.addText(p.desc, { x: x + 0.1, y: 3.5, w: 2.5, h: 1.2, fontSize: 11, color: "555555", align: "center", breakLine: true });
  });

  s.addText("💡 Karisma Productivity résout ces 3 problèmes en un seul outil.", {
    x: 0.5, y: 5.65, w: 9.0, h: 0.6,
    fontSize: 13, bold: true, color: C.dark, align: "center",
    fill: { color: C.yellow }, line: { color: C.black, width: 2 },
  });
}

// ─── SLIDE 3 — QU'EST-CE QUE KARISMA ──────────────────────────────────────────
{
  const s = pptx.addSlide();
  addBg(s, C.black);

  s.addText("QU'EST-CE QUE", {
    x: 0.5, y: 0.3, w: 9.0, h: 0.5,
    fontSize: 14, bold: true, color: C.yellow, charSpacing: 4, align: "left",
  });
  s.addText("Karisma Productivity ?", {
    x: 0.5, y: 0.7, w: 9.0, h: 1.2,
    fontSize: 36, bold: true, color: C.white, align: "left",
  });

  s.addShape(pptx.ShapeType.rect, { x: 0.5, y: 1.85, w: 8.6, h: 0.06, fill: { color: C.yellow } });

  s.addText(
    "Karisma Productivity est une application web progressive (PWA) " +
    "conçue pour t'aider à créer, suivre et accomplir tes objectifs personnels — " +
    "qu'ils soient quotidiens, mensuels ou à long terme.",
    {
      x: 0.5, y: 2.0, w: 8.6, h: 1.2,
      fontSize: 14, color: C.greyMid, align: "left", breakLine: true,
    }
  );

  const points = [
    { icon: "📱", text: "Application installable sur mobile (PWA)", color: C.yellow },
    { icon: "☁️", text: "Données synchronisées en temps réel sur le cloud", color: C.blue },
    { icon: "🔒", text: "Compte sécurisé (Email, Google, Facebook)", color: C.green },
    { icon: "🌗", text: "Mode clair & sombre intégré", color: C.purple },
  ];

  points.forEach((p, i) => {
    const x = i % 2 === 0 ? 0.5 : 5.0;
    const y = 3.4 + Math.floor(i / 2) * 1.1;
    hardShadowRect(s, x, y, 4.2, 0.85, "1A1A1A", 0.06);
    s.addShape(pptx.ShapeType.rect, { x, y, w: 0.6, h: 0.85, fill: { color: p.color }, line: { color: C.black, width: 2 } });
    s.addText(p.icon, { x, y, w: 0.6, h: 0.85, fontSize: 20, align: "center", valign: "middle" });
    s.addText(p.text, { x: x + 0.7, y: y + 0.12, w: 3.4, h: 0.65, fontSize: 12, color: C.white, bold: false });
  });
}

// ─── SLIDE 4 — LES 4 SECTIONS ──────────────────────────────────────────────────
{
  const s = pptx.addSlide();
  addBg(s, C.grey);
  sectionBar(s, C.yellow);

  tag(s, "FONCTIONNALITÉS", 0.5, 0.2, C.black, C.yellow);
  titleText(s, "4 sections pour tout gérer", { fontSize: 30, y: 0.55, h: 0.75 });
  s.addShape(pptx.ShapeType.rect, { x: 0.5, y: 1.25, w: 8.6, h: 0.05, fill: { color: C.black } });

  const sections = [
    { color: C.purple, icon: "🏆", name: "Objectifs Long Terme", desc: "Plans sur plusieurs mois avec dates cibles, catégories et suivi de progression." },
    { color: C.yellow, icon: "🔄", name: "Objectifs Répétitifs", desc: "Habitudes quotidiennes à cocher : sport, lecture, méditation… avec vue hebdomadaire." },
    { color: C.orange, icon: "📋", name: "Tâches Temporaires", desc: "Todo-list 24h avec horaires précis et rappels push automatiques." },
    { color: C.cyan,   icon: "🤝", name: "Objectifs en Commun", desc: "Créez des groupes avec vos amis et validez vos objectifs partagés ensemble." },
  ];

  sections.forEach((sec, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = 0.45 + col * 4.65;
    const y = 1.45 + row * 2.45;
    hardShadowRect(s, x, y, 4.25, 2.15, C.white);
    s.addShape(pptx.ShapeType.rect, { x, y, w: 0.55, h: 2.15, fill: { color: sec.color }, line: { color: C.black, width: 3 } });
    s.addText(sec.icon, { x, y: y + 0.5, w: 0.55, h: 0.8, fontSize: 22, align: "center" });
    s.addText(sec.name.toUpperCase(), {
      x: x + 0.65, y: y + 0.2, w: 3.45, h: 0.55,
      fontSize: 12, bold: true, color: C.black, charSpacing: 1,
    });
    s.addText(sec.desc, {
      x: x + 0.65, y: y + 0.75, w: 3.45, h: 1.2,
      fontSize: 11, color: "444444", breakLine: true,
    });
  });
}

// ─── SLIDE 5 — POUR QUI ? ──────────────────────────────────────────────────────
{
  const s = pptx.addSlide();
  addBg(s, C.white);
  s.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: "100%", h: 1.3, fill: { color: C.black } });

  s.addText("POUR QUI ?", {
    x: 0.5, y: 0.12, w: 9.0, h: 0.5,
    fontSize: 11, bold: true, color: C.yellow, charSpacing: 4,
  });
  s.addText("Karisma est utile à chacun d'entre nous", {
    x: 0.5, y: 0.48, w: 9.0, h: 0.7,
    fontSize: 26, bold: true, color: C.white,
  });

  const profiles = [
    { icon: "🎓", color: C.blue,   title: "L'Étudiant",        points: ["Suivre ses révisions quotidiennes", "Gérer les deadlines de projets", "Partager ses objectifs d'étude avec ses collègues"] },
    { icon: "💼", color: C.green,  title: "Le Professionnel",  points: ["Tracker ses KPIs personnels", "Maintenir une routine productivité", "Collaborer sur des objectifs d'équipe"] },
    { icon: "🏃", color: C.orange, title: "Le Sportif",        points: ["Suivre son entraînement journalier", "Voir ses séries (streaks) sans interruption", "Créer des défis sportifs en groupe"] },
    { icon: "🌱", color: C.purple, title: "Le Développement Perso", points: ["Construire de nouvelles habitudes", "Visualiser ses progrès sur le long terme", "Se motiver grâce aux statistiques"] },
    { icon: "👨‍👩‍👧", color: C.red, title: "La Famille / Les Amis",  points: ["Objectifs partagés (sport, lecture, sorties…)", "Voir qui a validé quoi aujourd'hui", "Notifications quand un proche réussit"] },
    { icon: "💡", color: C.cyan,   title: "L'Entrepreneur",    points: ["Objectifs long terme (6-12 mois)", "Tâches journalières priorisées", "Rappels push personnalisés par heure"] },
  ];

  profiles.forEach((p, i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const x = 0.3 + col * 3.15;
    const y = 1.45 + row * 2.55;
    hardShadowRect(s, x, y, 2.85, 2.3, C.grey);
    s.addShape(pptx.ShapeType.rect, { x, y, w: "100%", h: 0.38, fill: { color: p.color }, line: { color: C.black, width: 0 } });
    // Correction : la barre colorée sur chaque carte individuelle
    s.addShape(pptx.ShapeType.rect, { x, y, w: 2.85, h: 0.38, fill: { color: p.color }, line: { color: C.black, width: 3 } });
    s.addText(p.icon + "  " + p.title, {
      x: x + 0.08, y: y + 0.04, w: 2.7, h: 0.35,
      fontSize: 10, bold: true, color: C.black,
    });
    p.points.forEach((pt, j) => {
      s.addText("▪ " + pt, {
        x: x + 0.12, y: y + 0.5 + j * 0.55, w: 2.6, h: 0.5,
        fontSize: 9.5, color: C.dark, breakLine: true,
      });
    });
  });
}

// ─── SLIDE 6 — STATISTIQUES & PROGRESSION ──────────────────────────────────────
{
  const s = pptx.addSlide();
  addBg(s, C.black);
  sectionBar(s, C.green);

  s.addText("STATISTIQUES & PROGRESSION", {
    x: 0.5, y: 0.2, w: 9.0, h: 0.45,
    fontSize: 11, bold: true, color: C.green, charSpacing: 3,
  });
  titleText(s, "Visualise ton évolution en un coup d'œil", { fontSize: 26, color: C.white, y: 0.6, h: 0.8 });
  s.addShape(pptx.ShapeType.rect, { x: 0.5, y: 1.38, w: 8.6, h: 0.06, fill: { color: C.green } });

  const stats = [
    { icon: "🔥", label: "Série en cours\n(Streak)", color: C.orange, desc: "Combien de jours consécutifs tu as respecté tes objectifs. 0 jours = remise à zéro." },
    { icon: "📅", label: "Calendrier\nmensuel", color: C.blue, desc: "Un calendrier coloré qui montre chaque jour du mois si tes objectifs ont été validés." },
    { icon: "📈", label: "Taux de réussite", color: C.green, desc: "Graphique du % d'objectifs complétés par jour, semaine ou mois." },
    { icon: "🥇", label: "Record absolu", color: C.yellow, desc: "Ta meilleure série de tous les temps. Enregistrée automatiquement." },
  ];

  stats.forEach((st, i) => {
    const x = 0.4 + i * 2.35;
    hardShadowRect(s, x, 1.55, 2.15, 4.5, "1A1A1A", 0.07);
    s.addShape(pptx.ShapeType.rect, { x, y: 1.55, w: 2.15, h: 0.45, fill: { color: st.color }, line: { color: C.black, width: 3 } });
    s.addText(st.icon, { x: x + 0.1, y: 1.55, w: 2.0, h: 0.45, fontSize: 18, align: "left", valign: "middle" });
    s.addText(st.label, {
      x: x + 0.1, y: 2.1, w: 2.0, h: 0.85,
      fontSize: 13, bold: true, color: C.white, breakLine: true,
    });
    s.addShape(pptx.ShapeType.rect, { x: x + 0.1, y: 2.95, w: 1.9, h: 0.04, fill: { color: st.color } });
    s.addText(st.desc, {
      x: x + 0.1, y: 3.05, w: 1.92, h: 2.5,
      fontSize: 10, color: C.greyMid, breakLine: true,
    });
  });
}

// ─── SLIDE 7 — NOTIFICATIONS PUSH ──────────────────────────────────────────────
{
  const s = pptx.addSlide();
  addBg(s, C.grey);
  sectionBar(s, C.yellow);

  tag(s, "RAPPELS AUTOMATIQUES", 0.5, 0.2, C.black, C.yellow);
  titleText(s, "L'app pense à toi avant que tu l'oublies", { fontSize: 26, y: 0.55, h: 0.75 });

  const notifs = [
    { time: "07:00",  icon: "☀️", color: C.orange, title: "Rappel Matinal",      desc: "\"Bonjour ! 3 objectifs aujourd'hui — C'est parti ! 💪\"" },
    { time: "14:00",  icon: "🔔", color: C.blue,   title: "Mi-journée",          desc: "\"N'oublie pas tes objectifs ! Tu peux le faire ! 🔥\"" },
    { time: "21:00",  icon: "🌙", color: C.purple,  title: "Bilan du soir",      desc: "\"As-tu complété tous tes objectifs ? Dernière chance ⏳\"" },
    { time: "À l'heure", icon: "⏰", color: C.green, title: "Heure exacte",      desc: "\"C'est l'heure : Gym ! Lance-toi et valide ✅\"" },
    { time: "H - 10min", icon: "📍", color: C.red,  title: "10 min avant",       desc: "\"Prépare-toi : Méditation dans 10 min 🧘\"" },
    { time: "Temps réel", icon: "🤝", color: C.cyan, title: "Objectif commun",   desc: "\"Alex a validé 'Running' dans votre groupe ⚡\"" },
  ];

  notifs.forEach((n, i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const x = 0.4 + col * 3.1;
    const y = 1.5 + row * 2.5;
    hardShadowRect(s, x, y, 2.8, 2.2, C.white);
    tag(s, n.time, x + 0.08, y + 0.1, n.color, n.color === C.yellow ? C.black : C.white);
    s.addText(n.icon + " " + n.title, { x: x + 0.1, y: y + 0.55, w: 2.6, h: 0.5, fontSize: 12, bold: true, color: C.black });
    s.addText(n.desc, { x: x + 0.1, y: y + 1.05, w: 2.6, h: 1.0, fontSize: 10, color: "555555", italic: true, breakLine: true });
  });
}

// ─── SLIDE 8 — FONCTIONNALITÉ SOCIALE ──────────────────────────────────────────
{
  const s = pptx.addSlide();
  addBg(s, C.white);
  s.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 4.7, h: "100%", fill: { color: C.black } });

  // Gauche — côté noir
  s.addText("ENSEMBLE, C'EST\nPLUS FACILE.", {
    x: 0.35, y: 0.6, w: 4.0, h: 1.6,
    fontSize: 30, bold: true, color: C.white, breakLine: true,
  });
  s.addShape(pptx.ShapeType.rect, { x: 0.35, y: 2.22, w: 3.5, h: 0.07, fill: { color: C.yellow } });

  const social = [
    "👥 Créer des groupes d'objectifs partagés",
    "📬 Envoyer des invitations à ses amis",
    "⚡ Recevoir une notif quand un ami valide",
    "🏅 Voir la progression de chaque membre",
    "🚪 Quitter un groupe librement",
  ];
  social.forEach((t, i) => {
    s.addText(t, {
      x: 0.35, y: 2.5 + i * 0.76, w: 4.1, h: 0.65,
      fontSize: 12, color: C.white, bold: i === 0,
    });
  });

  // Droite — côté blanc
  s.addText("PROFIL UTILISATEUR", {
    x: 5.0, y: 0.35, w: 4.5, h: 0.5,
    fontSize: 11, bold: true, color: C.black, charSpacing: 2,
  });
  s.addShape(pptx.ShapeType.rect, { x: 5.0, y: 0.82, w: 4.5, h: 0.05, fill: { color: C.black } });

  const profFeats = [
    { icon: "📸", text: "Photo de profil modifiable (upload direct)" },
    { icon: "✍️", text: "Bio personnelle affichée en couverture" },
    { icon: "🔍", text: "Rechercher des amis par username" },
    { icon: "🌍", text: "Fuseau horaire adaptatif pour les rappels" },
    { icon: "🎛️", text: "Widgets personnalisables sur le profil" },
  ];

  profFeats.forEach((f, i) => {
    hardShadowRect(s, 5.0, 1.05 + i * 1.12, 4.4, 0.92, C.grey, 0.05);
    s.addText(f.icon, { x: 5.05, y: 1.1 + i * 1.12, w: 0.7, h: 0.82, fontSize: 22, align: "center", valign: "middle" });
    s.addText(f.text, { x: 5.85, y: 1.18 + i * 1.12, w: 3.5, h: 0.72, fontSize: 11, color: C.dark });
  });
}

// ─── SLIDE 9 — PWA & ACCESSIBILITÉ ─────────────────────────────────────────────
{
  const s = pptx.addSlide();
  addBg(s, C.black);
  sectionBar(s, C.blue);

  s.addText("APPLICATION INSTALLABLE — PWA", {
    x: 0.5, y: 0.2, w: 9.0, h: 0.45,
    fontSize: 11, bold: true, color: C.blue, charSpacing: 3,
  });
  titleText(s, "Comme une vraie app mobile, sans l'App Store", { fontSize: 26, color: C.white, y: 0.6, h: 0.8 });
  s.addShape(pptx.ShapeType.rect, { x: 0.5, y: 1.38, w: 8.6, h: 0.06, fill: { color: C.blue } });

  const pwaFeats = [
    { icon: "📲", color: C.blue,   title: "Installable sur mobile", desc: "Ajouter sur l'écran d'accueil depuis son navigateur. Fonctionne comme une app native." },
    { icon: "🌐", color: C.green,  title: "Accessible partout",      desc: "Fonctionne sur iOS, Android et desktop. Aucun téléchargement requis." },
    { icon: "⚡", color: C.yellow, title: "Rapide & fluide",         desc: "Service Worker optimisé. Interface animée avec Framer Motion." },
    { icon: "🔔", color: C.orange, title: "Notifications Push",      desc: "Reçois les rappels même quand tu n'utilises pas l'app." },
  ];

  pwaFeats.forEach((f, i) => {
    const x = 0.4 + i * 2.35;
    hardShadowRect(s, x, 1.6, 2.15, 4.5, "1A1A1A", 0.07);
    s.addText(f.icon, { x, y: 1.7, w: 2.15, h: 1.0, fontSize: 36, align: "center" });
    s.addShape(pptx.ShapeType.rect, { x: x + 0.15, y: 2.75, w: 1.85, h: 0.05, fill: { color: f.color } });
    s.addText(f.title, { x: x + 0.1, y: 2.85, w: 1.95, h: 0.65, fontSize: 12, bold: true, color: C.white, breakLine: true });
    s.addText(f.desc, { x: x + 0.1, y: 3.55, w: 1.95, h: 2.3, fontSize: 10, color: C.greyMid, breakLine: true });
  });
}

// ─── SLIDE 10 — CONCLUSION / CALL TO ACTION ────────────────────────────────────
{
  const s = pptx.addSlide();
  // Fond jaune vif
  addBg(s, C.yellow);
  s.addShape(pptx.ShapeType.rect, { x: 0, y: 5.8, w: "100%", h: 1.17, fill: { color: C.black } });

  s.addText("TU ES PRÊT(E) ?", {
    x: 0.5, y: 0.3, w: 9.0, h: 0.7,
    fontSize: 13, bold: true, color: C.black, charSpacing: 5, align: "center",
  });
  s.addText("Commence à\nchanger tes habitudes.", {
    x: 0.5, y: 0.9, w: 9.0, h: 2.0,
    fontSize: 46, bold: true, color: C.black, align: "center", breakLine: true,
  });

  s.addShape(pptx.ShapeType.rect, { x: 1.5, y: 2.9, w: 6.9, h: 0.07, fill: { color: C.black } });

  const ctas = [
    "Une seule app pour tous tes objectifs",
    "Mobile, rapide, et collaborative",
    "Tes progrès visibles chaque jour",
  ];
  ctas.forEach((c, i) => {
    s.addText("✓  " + c, {
      x: 1.5, y: 3.1 + i * 0.7, w: 7.0, h: 0.6,
      fontSize: 15, bold: true, color: C.dark, align: "center",
    });
  });

  // CTA link box
  hardShadowRect(s, 2.8, 4.85, 4.1, 0.75, C.black, 0.08);
  s.addText("🔗  karisma-productivity.vercel.app", {
    x: 2.8, y: 4.85, w: 4.1, h: 0.75,
    fontSize: 13, bold: true, color: C.yellow, align: "center", valign: "middle",
  });

  s.addText("Karisma Productivity  ·  Application PWA  ·  2026", {
    x: 0, y: 5.88, w: "100%", h: 0.42,
    fontSize: 9, color: C.yellow, align: "center", valign: "middle", bold: true, charSpacing: 1,
  });
  s.addText("Conçu avec ❤️ — Stack : Next.js · Supabase · OneSignal · Tailwind CSS", {
    x: 0, y: 6.3, w: "100%", h: 0.42,
    fontSize: 8, color: "999999", align: "center",
  });
}

// ─── EXPORT ────────────────────────────────────────────────────────────────────
pptx.writeFile({ fileName: "Karisma_Productivity_Presentation.pptx" })
  .then(() => console.log("✅  Karisma_Productivity_Presentation.pptx généré avec succès !"))
  .catch((err) => { console.error("❌  Erreur :", err); process.exit(1); });
