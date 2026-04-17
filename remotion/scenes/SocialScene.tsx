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

const members = [
  { name: "Alex", avatar: "A", color: COLORS.purple, done: true },
  { name: "Marie", avatar: "M", color: COLORS.cyan, done: true },
  { name: "Lucas", avatar: "L", color: COLORS.orange, done: false },
  { name: "Jade", avatar: "J", color: COLORS.green, done: true },
];

const sharedHabits = [
  { name: "🏃 Courir 5km", completions: 3, total: 4, color: COLORS.green },
  { name: "📖 Lire 20 pages", completions: 4, total: 4, color: COLORS.blue },
  { name: "🧘 Méditer 10min", completions: 2, total: 4, color: COLORS.purple },
];

export const SocialScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOpacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" });
  const titleY = interpolate(frame, [0, 20], [-40, 0], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(150deg, #001a1a 0%, ${COLORS.darkBg} 50%, #001a00 100%)`,
        fontFamily,
        overflow: "hidden",
      }}
    >
      {/* Top bar */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 8,
          background: COLORS.cyan,
        }}
      />

      {/* Title */}
      <div
        style={{
          position: "absolute",
          top: 56,
          left: 100,
          opacity: titleOpacity,
          transform: `translateY(${titleY}px)`,
        }}
      >
        <div
          style={{
            display: "inline-block",
            padding: "6px 20px",
            background: `${COLORS.cyan}20`,
            border: `2px solid ${COLORS.cyan}`,
            marginBottom: 16,
          }}
        >
          <span
            style={{
              fontSize: 16,
              fontWeight: 900,
              color: COLORS.cyan,
              letterSpacing: "4px",
              textTransform: "uppercase",
            }}
          >
            🤝 Objectifs Partagés
          </span>
        </div>
        <div
          style={{
            fontSize: 64,
            fontWeight: 900,
            color: COLORS.white,
            letterSpacing: "-2px",
            lineHeight: 1.1,
          }}
        >
          PROGRESSE
        </div>
        <div
          style={{
            fontSize: 64,
            fontWeight: 900,
            color: COLORS.cyan,
            letterSpacing: "-2px",
            lineHeight: 1.1,
          }}
        >
          ENSEMBLE.
        </div>
      </div>

      {/* Group card */}
      <div
        style={{
          position: "absolute",
          top: 280,
          left: 100,
          right: 100,
          background: COLORS.darkCard,
          border: `3px solid ${COLORS.cyan}40`,
          boxShadow: `8px 8px 0px ${COLORS.cyan}20`,
          padding: "32px 40px",
        }}
      >
        {/* Group header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 28,
          }}
        >
          <div>
            <div
              style={{
                fontSize: 28,
                fontWeight: 900,
                color: COLORS.white,
                letterSpacing: "-1px",
              }}
            >
              💪 Groupe Productivité
            </div>
            <div
              style={{
                fontSize: 15,
                color: `${COLORS.white}60`,
                marginTop: 4,
                fontWeight: 400,
              }}
            >
              {members.length} membres · Aujourd'hui
            </div>
          </div>

          {/* Members avatars */}
          <div style={{ display: "flex", gap: -8 }}>
            {members.map((m, i) => {
              const avatarSpring = spring({
                frame: frame - i * 8,
                fps,
                config: { damping: 12, stiffness: 200 },
              });
              const avatarScale = interpolate(avatarSpring, [0, 1], [0, 1]);

              return (
                <div
                  key={i}
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: "50%",
                    background: m.color,
                    border: `3px solid ${COLORS.darkCard}`,
                    marginLeft: i > 0 ? -12 : 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 18,
                    fontWeight: 900,
                    color: COLORS.white,
                    transform: `scale(${avatarScale})`,
                    zIndex: members.length - i,
                  }}
                >
                  {m.avatar}
                </div>
              );
            })}
          </div>
        </div>

        {/* Shared habits */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 20,
          }}
        >
          {sharedHabits.map((sh, i) => {
            const progressAnim = interpolate(
              frame,
              [30 + i * 15, 80 + i * 15],
              [0, (sh.completions / sh.total) * 100],
              {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
                easing: Easing.out(Easing.quad),
              }
            );
            const rowOpacity = interpolate(
              frame,
              [20 + i * 12, 40 + i * 12],
              [0, 1],
              { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
            );

            return (
              <div key={i} style={{ opacity: rowOpacity }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: 10,
                  }}
                >
                  <span
                    style={{
                      fontSize: 18,
                      fontWeight: 700,
                      color: COLORS.white,
                    }}
                  >
                    {sh.name}
                  </span>
                  <span
                    style={{
                      fontSize: 16,
                      fontWeight: 700,
                      color: sh.color,
                    }}
                  >
                    {sh.completions}/{sh.total} complétés
                  </span>
                </div>
                <div
                  style={{
                    height: 12,
                    background: `${COLORS.white}10`,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${progressAnim}%`,
                      background: sh.color,
                      boxShadow: `0 0 12px ${sh.color}80`,
                    }}
                  />
                </div>

                {/* Member completions */}
                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    marginTop: 8,
                  }}
                >
                  {members.map((m, mi) => (
                    <div
                      key={mi}
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: "50%",
                        background: m.done
                          ? `${sh.color}30`
                          : `${COLORS.white}10`,
                        border: `2px solid ${m.done ? sh.color : COLORS.white + "20"}`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 12,
                        fontWeight: 700,
                        color: m.done ? sh.color : `${COLORS.white}40`,
                      }}
                    >
                      {m.done ? "✓" : m.avatar}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Notification bubbles */}
      {[
        { text: "🎉 Marie a complété Lire 20 pages !", x: 80, y: 240, delay: 80 },
        { text: "🔥 Alex a un streak de 7 jours !", x: 900, y: 255, delay: 100 },
      ].map((notif, i) => {
        const notifOpacity = interpolate(
          frame,
          [notif.delay, notif.delay + 15],
          [0, 1],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
        );
        const notifY = interpolate(
          frame,
          [notif.delay, notif.delay + 15],
          [20, 0],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
        );

        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: notif.x,
              top: notif.y,
              background: `${COLORS.green}20`,
              border: `2px solid ${COLORS.green}60`,
              padding: "10px 16px",
              fontSize: 14,
              fontWeight: 700,
              color: COLORS.white,
              opacity: notifOpacity,
              transform: `translateY(${notifY}px)`,
              boxShadow: `0 0 20px ${COLORS.green}30`,
            }}
          >
            {notif.text}
          </div>
        );
      })}
    </AbsoluteFill>
  );
};
