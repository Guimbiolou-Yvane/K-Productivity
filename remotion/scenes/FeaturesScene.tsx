import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Sequence,
} from "remotion";
import { loadFont } from "@remotion/google-fonts/Montserrat";
import { COLORS } from "../design";

const { fontFamily } = loadFont("normal", {
  weights: ["400", "700", "900"],
  subsets: ["latin"],
});

const features = [
  {
    icon: "🏆",
    title: "Objectifs Long Terme",
    desc: "Suivi de progression visuels avec dates cibles",
    color: COLORS.purple,
    delay: 20,
  },
  {
    icon: "🔄",
    title: "Habitudes Répétitives",
    desc: "Grille hebdomadaire avec streaks et rappels",
    color: COLORS.yellow,
    delay: 40,
  },
  {
    icon: "📋",
    title: "Tâches Temporaires",
    desc: "Todos auto-supprimés après 24h",
    color: COLORS.orange,
    delay: 60,
  },
  {
    icon: "🤝",
    title: "Objectifs Partagés",
    desc: "Groupes collaboratifs avec progression",
    color: COLORS.cyan,
    delay: 80,
  },
  {
    icon: "📊",
    title: "Statistiques",
    desc: "Streaks, taux de réussite, calendrier mensuel",
    color: COLORS.green,
    delay: 100,
  },
  {
    icon: "🔔",
    title: "Notifications Push",
    desc: "Rappels intelligents adaptés à ton fuseau horaire",
    color: COLORS.red,
    delay: 120,
  },
];

export const FeaturesScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOpacity = interpolate(frame, [0, 25], [0, 1], {
    extrapolateRight: "clamp",
  });
  const titleY = interpolate(frame, [0, 25], [-40, 0], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(160deg, ${COLORS.darkBg} 0%, #0d0d1f 100%)`,
        fontFamily,
        overflow: "hidden",
      }}
    >
      {/* Background stripe */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 8,
          background: `linear-gradient(90deg, ${COLORS.yellow}, ${COLORS.purple}, ${COLORS.cyan})`,
        }}
      />

      {/* Title section */}
      <div
        style={{
          position: "absolute",
          top: 64,
          left: 100,
          opacity: titleOpacity,
          transform: `translateY(${titleY}px)`,
        }}
      >
        <div
          style={{
            fontSize: 16,
            fontWeight: 700,
            color: COLORS.yellow,
            letterSpacing: "6px",
            textTransform: "uppercase",
            marginBottom: 12,
          }}
        >
          Ce que nous offrons
        </div>
        <div
          style={{
            fontSize: 72,
            fontWeight: 900,
            color: COLORS.white,
            letterSpacing: "-2px",
            lineHeight: 1,
          }}
        >
          TOUT CE DONT
        </div>
        <div
          style={{
            fontSize: 72,
            fontWeight: 900,
            color: COLORS.yellow,
            letterSpacing: "-2px",
            lineHeight: 1,
          }}
        >
          TU AS BESOIN
        </div>
      </div>

      {/* Features grid */}
      <div
        style={{
          position: "absolute",
          top: 240,
          left: 100,
          right: 100,
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: 28,
        }}
      >
        {features.map((f, i) => {
          const cardProgress = spring({
            frame: frame - f.delay,
            fps,
            config: { damping: 14, stiffness: 160 },
          });
          const cardOpacity = interpolate(frame, [f.delay, f.delay + 20], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          const cardY = interpolate(cardProgress, [0, 1], [60, 0]);

          return (
            <div
              key={i}
              style={{
                background: COLORS.darkCard,
                border: `3px solid ${f.color}40`,
                padding: "28px 32px",
                position: "relative",
                opacity: cardOpacity,
                transform: `translateY(${cardY}px)`,
                boxShadow: `4px 4px 0px ${f.color}60`,
              }}
            >
              {/* Color accent left bar */}
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  bottom: 0,
                  width: 5,
                  background: f.color,
                }}
              />

              <div style={{ fontSize: 40, marginBottom: 12 }}>{f.icon}</div>
              <div
                style={{
                  fontSize: 20,
                  fontWeight: 800,
                  color: COLORS.white,
                  marginBottom: 8,
                  letterSpacing: "-0.5px",
                }}
              >
                {f.title}
              </div>
              <div
                style={{
                  fontSize: 15,
                  color: `${COLORS.white}80`,
                  lineHeight: 1.5,
                  fontWeight: 400,
                }}
              >
                {f.desc}
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
