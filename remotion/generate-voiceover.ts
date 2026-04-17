/**
 * Génération du voiceover via Google Cloud Text-to-Speech (SSML)
 * Script pour la vidéo Karisma Productivity — 2min30s
 *
 * Usage:  npm run voiceover:generate
 * Output: public/voiceover/*.mp3
 *
 * SSML utilisé pour :
 *   <break time="Xms"/>      → pause
 *   <emphasis level="..."/>  → emphase
 *   <prosody rate="..." pitch="..."/>  → débit / hauteur
 */

import * as fs from "fs";
import * as path from "path";
import * as https from "https";

// ─── Chargement de .env.local ────────────────────────────────────────────────
function loadEnv() {
  const envPath = path.join(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq === -1) continue;
    const k = t.slice(0, eq).trim();
    const v = t.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
    if (!process.env[k]) process.env[k] = v;
  }
}
loadEnv();

const API_KEY = process.env.GOOGLE_TTS_API_KEY;
if (!API_KEY) {
  console.error("❌  GOOGLE_TTS_API_KEY manquante dans .env.local");
  process.exit(1);
}

const OUT_DIR = path.join(process.cwd(), "public", "voiceover");
fs.mkdirSync(OUT_DIR, { recursive: true });

// ─── Voix & Audio ────────────────────────────────────────────────────────────
// fr-FR-Neural2-D = voix masculine la plus naturelle de Google (Neural2)
const VOICE = {
  languageCode: "fr-FR",
  name: "fr-FR-Neural2-D",
  ssmlGender: "MALE",
};
const AUDIO_CFG = {
  audioEncoding: "MP3",
  speakingRate: 0.90,   // légèrement plus lent = plus posé
  pitch: -1.5,          // légèrement plus grave = plus chaleureux
  volumeGainDb: 3.0,
  effectsProfileId: ["headphone-class-device"],
};

// ─── Scripts SSML par scène ──────────────────────────────────────────────────
// Chaque scène dure environ 15 secondes → total ≈ 2min30s
const SCENES: { id: string; ssml: string }[] = [
  // 01 — Accroche (15s)
  {
    id: "01-intro",
    ssml: `<speak>
<prosody rate="slow">
  Et si chaque journée te rapprochait,
  <break time="400ms"/>
  un peu plus de la vie que tu veux mener ?
</prosody>
<break time="800ms"/>
<prosody rate="medium">
  C'est exactement la promesse de
  <emphasis level="strong">Karisma Productivity</emphasis>.
</prosody>
<break time="600ms"/>
<prosody rate="medium">
  Une application pensée pour transformer tes ambitions
  <break time="300ms"/>
  en habitudes concrètes,
  <break time="300ms"/>
  et tes habitudes en résultats durables.
</prosody>
</speak>`,
  },

  // 02 — Problème (14s)
  {
    id: "02-problem",
    ssml: `<speak>
<prosody rate="medium">
  On le sait tous :
  <break time="400ms"/>
  fixer des objectifs, c'est facile.
</prosody>
<break time="500ms"/>
<prosody rate="medium">
  Les tenir sur la durée…
  <break time="500ms"/>
  c'est une toute autre histoire.
</prosody>
<break time="600ms"/>
<prosody rate="medium">
  Entre les listes qui s'accumulent,
  les rappels qu'on ignore,
  <break time="300ms"/>
  et la motivation qui s'étiole,
  <break time="400ms"/>
  il manque quelque chose.
</prosody>
<break time="500ms"/>
<prosody rate="medium">
  <emphasis level="moderate">Un système. Une routine. Un compagnon de progression.</emphasis>
</prosody>
</speak>`,
  },

  // 03 — Vue d'ensemble (15s)
  {
    id: "03-overview",
    ssml: `<speak>
<prosody rate="medium">
  Karisma Productivity centralise tout ce qu'il te faut
  <break time="300ms"/>
  en un seul endroit.
</prosody>
<break time="600ms"/>
<prosody rate="medium">
  Des objectifs long terme avec suivi de progression.
  <break time="500ms"/>
  Des habitudes répétitives avec rappels personnalisés.
  <break time="500ms"/>
  Des tâches quotidiennes qui disparaissent automatiquement.
  <break time="500ms"/>
  Et des objectifs partagés pour progresser en groupe.
</prosody>
<break time="500ms"/>
<prosody rate="slow">
  Le tout dans une interface moderne,
  <break time="300ms"/>
  rapide,
  <break time="200ms"/>
  et disponible partout.
</prosody>
</speak>`,
  },

  // 04 — HabitTracker (15s)
  {
    id: "04-habits",
    ssml: `<speak>
<prosody rate="medium">
  Le cœur de l'application,
  <break time="300ms"/>
  c'est le <emphasis level="moderate">suivi des habitudes répétitives</emphasis>.
</prosody>
<break time="600ms"/>
<prosody rate="medium">
  Chaque jour, tu coches tes objectifs :
  <break time="400ms"/>
  sport, lecture, méditation, hydratation…
  <break time="400ms"/>
  ce que tu veux construire comme routine.
</prosody>
<break time="500ms"/>
<prosody rate="medium">
  Une grille hebdomadaire claire te montre d'un coup d'œil
  <break time="300ms"/>
  où tu en es.
</prosody>
<break time="500ms"/>
<prosody rate="medium">
  Et quand les jours s'enchaînent,
  <break time="300ms"/>
  le <emphasis level="strong">streak</emphasis> s'allume.
  <break time="400ms"/>
  Cette flamme devient ta meilleure motivation.
</prosody>
</speak>`,
  },

  // 05 — Goals long terme (14s)
  {
    id: "05-goals",
    ssml: `<speak>
<prosody rate="medium">
  Derrière chaque habitude,
  <break time="300ms"/>
  il y a souvent un grand objectif.
</prosody>
<break time="600ms"/>
<prosody rate="medium">
  Apprendre une langue.
  <break time="400ms"/>
  Lancer un projet.
  <break time="400ms"/>
  Courir un marathon.
</prosody>
<break time="600ms"/>
<prosody rate="medium">
  Avec les <emphasis level="moderate">objectifs long terme</emphasis>,
  tu définis une date cible,
  <break time="300ms"/>
  une catégorie,
  <break time="300ms"/>
  et tu suis ta progression visuellement.
</prosody>
<break time="500ms"/>
<prosody rate="medium">
  Chaque étape franchie rapproche la barre de progression de cent pour cent.
  <break time="400ms"/>
  Et ce sentiment d'avancer…
  <break time="400ms"/>
  il n'a pas de prix.
</prosody>
</speak>`,
  },

  // 06 — Notifications (13s)
  {
    id: "06-notifications",
    ssml: `<speak>
<prosody rate="medium">
  L'oubli est l'ennemi de la régularité.
</prosody>
<break time="600ms"/>
<prosody rate="medium">
  Karisma Productivity t'envoie des <emphasis level="moderate">notifications push intelligentes</emphasis>
  <break time="400ms"/>
  adaptées à ton fuseau horaire.
</prosody>
<break time="500ms"/>
<prosody rate="medium">
  Le matin pour préparer ta journée.
  <break time="400ms"/>
  L'après-midi pour te rappeler où tu en es.
  <break time="400ms"/>
  Le soir, une dernière chance de valider.
</prosody>
<break time="500ms"/>
<prosody rate="medium">
  Et si tu as un objectif prévu à une heure précise,
  <break time="300ms"/>
  tu reçois un rappel
  <break time="200ms"/>
  dix minutes avant.
</prosody>
</speak>`,
  },

  // 07 — Social (15s)
  {
    id: "07-social",
    ssml: `<speak>
<prosody rate="medium">
  Progresser seul, c'est bien.
  <break time="400ms"/>
  Progresser ensemble, c'est encore plus puissant.
</prosody>
<break time="700ms"/>
<prosody rate="medium">
  Avec les <emphasis level="moderate">objectifs partagés</emphasis>,
  tu crées un groupe avec tes amis,
  <break time="400ms"/>
  tu choisis des habitudes communes,
  <break time="400ms"/>
  et vous vous suivez mutuellement.
</prosody>
<break time="600ms"/>
<prosody rate="medium">
  Chaque validation d'un membre déclenche une notification.
  <break time="400ms"/>
  L'émulation crée de la dynamique.
  <break time="400ms"/>
  Et cette dynamique crée des résultats.
</prosody>
</speak>`,
  },

  // 08 — Stats (14s)
  {
    id: "08-stats",
    ssml: `<speak>
<prosody rate="medium">
  Ce qu'on mesure,
  <break time="300ms"/>
  on peut l'améliorer.
</prosody>
<break time="700ms"/>
<prosody rate="medium">
  La page statistiques te donne une vue complète de ton évolution :
</prosody>
<break time="500ms"/>
<prosody rate="medium">
  ton streak actuel et ton record personnel,
  <break time="400ms"/>
  ton taux de réussite semaine par semaine,
  <break time="400ms"/>
  et un calendrier mensuel qui colorie chaque journée accomplie.
</prosody>
<break time="600ms"/>
<prosody rate="medium">
  Ces données ne sont pas là pour te juger.
  <break time="400ms"/>
  Elles sont là pour te montrer le chemin parcouru
  <break time="300ms"/>
  et t'inspirer à continuer.
</prosody>
</speak>`,
  },

  // 09 — Profil & Settings (13s)
  {
    id: "09-profile",
    ssml: `<speak>
<prosody rate="medium">
  L'application s'adapte à toi,
  <break time="300ms"/>
  pas l'inverse.
</prosody>
<break time="700ms"/>
<prosody rate="medium">
  Personnalise ton profil avec une photo et une bio.
  <break time="500ms"/>
  Configure ton fuseau horaire pour des rappels parfaitement synchronisés.
  <break time="500ms"/>
  Choisis entre le mode clair et le mode sombre.
</prosody>
<break time="500ms"/>
<prosody rate="medium">
  Et grâce à sa conception en
  <emphasis level="moderate">application web progressive</emphasis>,
  <break time="400ms"/>
  installe Karisma sur ton téléphone
  <break time="300ms"/>
  comme une vraie app native,
  <break time="300ms"/>
  sans passer par un store.
</prosody>
</speak>`,
  },

  // 10 — Outro CTA (16s)
  {
    id: "10-outro",
    ssml: `<speak>
<prosody rate="slow">
  La discipline n'est pas une question de volonté.
</prosody>
<break time="500ms"/>
<prosody rate="slow">
  C'est une question de système.
</prosody>
<break time="900ms"/>
<prosody rate="medium">
  <emphasis level="strong">Karisma Productivity</emphasis>
  est ce système.
</prosody>
<break time="700ms"/>
<prosody rate="medium">
  Gratuit. Sécurisé. Toujours disponible.
</prosody>
<break time="700ms"/>
<prosody rate="medium">
  Commence dès aujourd'hui,
  <break time="400ms"/>
  et découvre ce que tu es vraiment capable d'accomplir.
</prosody>
<break time="800ms"/>
<prosody rate="slow">
  <emphasis level="strong">Karisma Productivity.</emphasis>
  <break time="500ms"/>
  Ta progression, chaque jour.
</prosody>
</speak>`,
  },
];

// ─── Appel API Google Cloud TTS (SSML) ──────────────────────────────────────
async function synthesize(ssml: string): Promise<Buffer> {
  const body = JSON.stringify({
    input: { ssml },
    voice: VOICE,
    audioConfig: AUDIO_CFG,
  });

  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: "texttospeech.googleapis.com",
        path: `/v1/text:synthesize?key=${API_KEY}`,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(body),
        },
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on("data", (c: Buffer) => chunks.push(c));
        res.on("end", () => {
          const raw = Buffer.concat(chunks).toString("utf8");
          try {
            const json = JSON.parse(raw);
            if (json.error) reject(new Error(json.error.message));
            else if (!json.audioContent) reject(new Error(`Réponse inattendue: ${raw.slice(0, 300)}`));
            else resolve(Buffer.from(json.audioContent, "base64"));
          } catch {
            reject(new Error(`Parse error: ${raw.slice(0, 300)}`));
          }
        });
      }
    );
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

// ─── Main ────────────────────────────────────────────────────────────────────
async function main() {
  console.log(`\n🎙️  Karisma Productivity — Génération voiceover (${SCENES.length} scènes)`);
  console.log(`   Voix: fr-FR-Neural2-D  |  SSML  |  Débit: 0.90\n`);

  let totalKb = 0;
  for (const scene of SCENES) {
    const outPath = path.join(OUT_DIR, `${scene.id}.mp3`);
    process.stdout.write(`🔊  ${scene.id}... `);
    try {
      const buf = await synthesize(scene.ssml);
      fs.writeFileSync(outPath, buf);
      totalKb += buf.length / 1024;
      console.log(`✅  ${(buf.length / 1024).toFixed(1)} KB`);
    } catch (err) {
      console.error(`\n❌  Erreur: ${err}`);
      process.exit(1);
    }
    // Respecter le quota API
    await new Promise((r) => setTimeout(r, 350));
  }

  console.log(`\n✨  Done — ${totalKb.toFixed(0)} KB total dans public/voiceover/`);
  console.log(`👉  Relance le studio : npm run remotion:studio\n`);
}

main();
