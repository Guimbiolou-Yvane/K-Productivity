import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Easing,
} from "remotion";
import { loadFont } from "@remotion/google-fonts/Montserrat";
import { COLORS } from "../design";

const { fontFamily } = loadFont("normal", {
  weights: ["400", "700", "900"],
  subsets: ["latin"],
});

const pillars = [
  {
    icon: "🔄",
    label: "HABITUDES",
    sub: "Répétitives",
    color: COLORS.yellow,
    desc: "Journalières, hebdomadaires ou mensuelles",
  },
  {
    icon: "🏆",
    label: "OBJECTIFS",
    sub: "Long terme",
    color: COLORS.purple,
    desc: "Avec date cible & suivi de progression",
  },
  {
    icon: "📋",
    label: "TÂCHES",
    sub: "Temporaires",
    color: COLORS.orange,
    desc: "Auto-supprimées après 24h",
  },
  {
    icon: "🤝",
    label: "PARTAGE",
    sub: "Collaboratif",
    color: COLORS.cyan,
    desc: "Groupes & objectifs communs",
  },
];

export const OverviewScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOpacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" });
  const titleY = interpolate(frame, [0, 20], [-40, 0], { extrapolateRight: "clamp" });

  // Central connecting line
  const lineWidth = interpolate(frame, [20, 60], [0, 1680], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(160deg, #030314 0%, ${COLORS.darkBg} 50%, #030314 100%)`,
        fontFamily,
        overflow: "hidden",
      }}
    >
      {/* Glow behind center */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          transform: "translate(-50%,-50%)",
          width: 800,
          height: 400,
          background: `${COLORS.yellow}08`,
          filter: "blur(80px)",
          borderRadius: "50%",
        }}
      />

      {/* Title */}
      <div
        style={{
          position: "absolute",
          top: 60,
          left: "50%",
          transform: `translateX(-50%) translateY(${titleY}px)`,
          opacity: titleOpacity,
          textAlign: "center",
          whiteSpace: "nowrap",
        }}
      >
        <div
          style={{
            fontSize: 18,
            fontWeight: 700,
            color: COLORS.yellow,
            letterSpacing: "6px",
            textTransform: "uppercase",
            marginBottom: 12,
          }}
        >
          une application, quatre piliers
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
          TOUT CE DONT TU AS BESOIN
        </div>
      </div>

      {/* Horizontal connecting bar */}
      <div
        style={{
          position: "absolute",
          top: 540,
          left: (1920 - lineWidth) / 2,
          width: lineWidth,
          height: 3,
          background: `linear-gradient(90deg, transparent, ${COLORS.yellow}60, ${COLORS.purple}60, ${COLORS.orange}60, ${COLORS.cyan}60, transparent)`,
        }}
      />

      {/* Pillar cards */}
      <div
        style={{
          position: "absolute",
          top: 220,
          left: 80,
          right: 80,
          display: "flex",
          gap: 28,
        }}
      >
        {pillars.map((p, i) => {
          const cardSpring = spring({
            frame: frame - 15 - i * 12,
            fps,
            config: { damping: 12, stiffness: 140 },
          });
          const cardY = interpolate(cardSpring, [0, 1], [80, 0]);
          const cardOpacity = interpolate(
            frame,
            [15 + i * 12, 32 + i * 12],
            [0, 1],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
          );

          // Vertical connector from card to horizontal bar
          const connectorH = interpolate(frame, [50, 70], [0, 60], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });

          return (
            <div key={i} style={{ flex: 1 }}>
              <div
                style={{
                  background: COLORS.darkCard,
                  border: `3px solid ${p.color}`,
                  boxShadow: `0 0 30px ${p.color}25, 6px 6px 0px ${p.color}40`,
                  padding: "40px 32px",
                  opacity: cardOpacity,
                  transform: `translateY(${cardY}px)`,
                  position: "relative",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  textAlign: "center",
                  gap: 16,
                }}
              >
                {/* Top color bar */}
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 6,
                    background: p.color,
                  }}
                />

                <div style={{ fontSize: 52 }}>{p.icon}</div>

                <div>
                  <div
                    style={{
                      fontSize: 28,
                      fontWeight: 900,
                      color: p.color,
                      letterSpacing: "-0.5px",
                    }}
                  >
                    {p.label}
                  </div>
                  <div
                    style={{
                      fontSize: 16,
                      fontWeight: 700,
                      color: `${COLORS.white}70`,
                      letterSpacing: "3px",
                      textTransform: "uppercase",
                      marginTop: 4,
                    }}
                  >
                    {p.sub}
                  </div>
                </div>

                <div
                  style={{
                    fontSize: 15,
                    color: `${COLORS.white}60`,
                    fontWeight: 400,
                    lineHeight: 1.5,
                    marginTop: 8,
                  }}
                >
                  {p.desc}
                </div>

                {/* Vertical connector */}
                <div
                  style={{
                    position: "absolute",
                    bottom: -connectorH - 3,
                    left: "50%",
                    transform: "translateX(-50%)",
                    width: 3,
                    height: connectorH,
                    background: `linear-gradient(to bottom, ${p.color}80, ${p.color}20)`,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom tagline */}
      <div
        style={{
          position: "absolute",
          bottom: 50,
          left: "50%",
          transform: "translateX(-50%)",
          opacity: interpolate(frame, [70, 90], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
          textAlign: "center",
          whiteSpace: "nowrap",
        }}
      >
        <div
          style={{
            fontSize: 20,
            fontWeight: 400,
            color: `${COLORS.white}60`,
            letterSpacing: "4px",
            textTransform: "uppercase",
          }}
        >
          Le tout dans une seule application • PWA • Dark mode • Multi-timezone
        </div>
      </div>
    </AbsoluteFill>
  );
};
