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

const notifications = [
  {
    time: "07:00",
    icon: "☀️",
    title: "Bonne journée !",
    body: "Tu as 4 objectifs à accomplir aujourd'hui.",
    color: COLORS.yellow,
    delay: 20,
  },
  {
    time: "14:00",
    icon: "🔔",
    title: "N'oublie pas tes objectifs !",
    body: "Il te reste 3 habitudes à valider.",
    color: COLORS.orange,
    delay: 45,
  },
  {
    time: "17:50",
    icon: "⏰",
    title: "Dans 10 min : Méditation",
    body: "Ton objectif de 18h approche.",
    color: COLORS.purple,
    delay: 70,
  },
  {
    time: "21:00",
    icon: "🌙",
    title: "Dernière chance !",
    body: "Valide tes objectifs avant la fin de journée.",
    color: COLORS.blue,
    delay: 95,
  },
];

export const NotificationsScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOpacity = interpolate(frame, [0, 22], [0, 1], { extrapolateRight: "clamp" });
  const titleX = interpolate(frame, [0, 22], [-60, 0], {
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });

  // Phone outline scale
  const phoneSpring = spring({ frame, fps, config: { damping: 14, stiffness: 120 } });

  // Timeline bar
  const timelineH = interpolate(frame, [15, 110], [0, 680], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(140deg, #0a0a20 0%, ${COLORS.darkBg} 55%, #0a1500 100%)`,
        fontFamily,
        overflow: "hidden",
      }}
    >
      {/* Top gradient bar */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 8,
          background: `linear-gradient(90deg, ${COLORS.yellow}, ${COLORS.orange}, ${COLORS.purple}, ${COLORS.blue})`,
        }}
      />

      {/* Left — Title */}
      <div
        style={{
          position: "absolute",
          top: 60,
          left: 100,
          opacity: titleOpacity,
          transform: `translateX(${titleX}px)`,
        }}
      >
        <div
          style={{
            display: "inline-block",
            padding: "6px 20px",
            background: `${COLORS.orange}20`,
            border: `2px solid ${COLORS.orange}`,
            marginBottom: 20,
          }}
        >
          <span
            style={{
              fontSize: 15,
              fontWeight: 900,
              color: COLORS.orange,
              letterSpacing: "4px",
              textTransform: "uppercase",
            }}
          >
            🔔 Notifications Push
          </span>
        </div>
        <div
          style={{
            fontSize: 60,
            fontWeight: 900,
            color: COLORS.white,
            letterSpacing: "-2px",
            lineHeight: 1.1,
          }}
        >
          L'OUBLI EST
        </div>
        <div
          style={{
            fontSize: 60,
            fontWeight: 900,
            color: COLORS.orange,
            letterSpacing: "-2px",
            lineHeight: 1.1,
          }}
        >
          L'ENNEMI.
        </div>
        <div
          style={{
            marginTop: 20,
            fontSize: 18,
            color: `${COLORS.white}65`,
            maxWidth: 440,
            lineHeight: 1.7,
            fontWeight: 400,
          }}
        >
          Des rappels intelligents, au bon moment,
          <br />
          adaptés à ton fuseau horaire.
        </div>
      </div>

      {/* Timeline axis */}
      <div
        style={{
          position: "absolute",
          top: 200,
          left: 720,
          width: 3,
          height: timelineH,
          background: `linear-gradient(to bottom, ${COLORS.yellow}80, ${COLORS.blue}40)`,
        }}
      />

      {/* Notification cards */}
      <div
        style={{
          position: "absolute",
          top: 180,
          left: 760,
          right: 80,
          display: "flex",
          flexDirection: "column",
          gap: 20,
        }}
      >
        {notifications.map((n, i) => {
          const cardSpring = spring({
            frame: frame - n.delay,
            fps,
            config: { damping: 14, stiffness: 180 },
          });
          const cardX = interpolate(cardSpring, [0, 1], [60, 0]);
          const cardOpacity = interpolate(
            frame,
            [n.delay, n.delay + 18],
            [0, 1],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
          );

          // Dot on timeline
          const dotScale = spring({
            frame: frame - n.delay + 5,
            fps,
            config: { damping: 10, stiffness: 200 },
          });

          return (
            <div key={i} style={{ position: "relative" }}>
              {/* Timeline dot */}
              <div
                style={{
                  position: "absolute",
                  left: -56,
                  top: 20,
                  width: 16,
                  height: 16,
                  borderRadius: "50%",
                  background: n.color,
                  boxShadow: `0 0 16px ${n.color}`,
                  transform: `scale(${dotScale})`,
                  transformOrigin: "center",
                }}
              />

              {/* Card */}
              <div
                style={{
                  background: COLORS.darkCard,
                  border: `2px solid ${n.color}40`,
                  boxShadow: `4px 4px 0px ${n.color}30`,
                  padding: "18px 24px",
                  opacity: cardOpacity,
                  transform: `translateX(${cardX}px)`,
                  display: "flex",
                  alignItems: "center",
                  gap: 20,
                }}
              >
                {/* Time badge */}
                <div
                  style={{
                    background: `${n.color}20`,
                    border: `2px solid ${n.color}`,
                    padding: "6px 14px",
                    fontSize: 16,
                    fontWeight: 900,
                    color: n.color,
                    letterSpacing: "1px",
                    flexShrink: 0,
                    minWidth: 80,
                    textAlign: "center",
                  }}
                >
                  {n.time}
                </div>

                {/* Icon */}
                <div style={{ fontSize: 28, flexShrink: 0 }}>{n.icon}</div>

                {/* Text */}
                <div>
                  <div
                    style={{
                      fontSize: 18,
                      fontWeight: 800,
                      color: COLORS.white,
                      marginBottom: 4,
                    }}
                  >
                    {n.title}
                  </div>
                  <div
                    style={{
                      fontSize: 14,
                      color: `${COLORS.white}65`,
                      fontWeight: 400,
                    }}
                  >
                    {n.body}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom callout */}
      <div
        style={{
          position: "absolute",
          bottom: 48,
          left: 100,
          right: 820,
          opacity: interpolate(frame, [100, 118], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      >
        <div
          style={{
            padding: "16px 24px",
            background: `${COLORS.yellow}15`,
            border: `2px solid ${COLORS.yellow}50`,
            fontSize: 16,
            color: `${COLORS.white}80`,
            fontWeight: 500,
            lineHeight: 1.6,
          }}
        >
          ⏰ Rappel <strong style={{ color: COLORS.yellow }}>10 min avant</strong> chaque objectif horodaté
          <br />
          🌍 Synchronisé avec <strong style={{ color: COLORS.yellow }}>ton fuseau horaire</strong>
        </div>
      </div>
    </AbsoluteFill>
  );
};
