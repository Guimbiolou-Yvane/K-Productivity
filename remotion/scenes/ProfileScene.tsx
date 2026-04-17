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

const features = [
  { icon: "📷", label: "Photo de profil", desc: "Upload et visionneuse plein écran", color: COLORS.blue },
  { icon: "✍️", label: "Bio & Username", desc: "Personnalise ton identité", color: COLORS.purple },
  { icon: "🌗", label: "Mode sombre", desc: "Thème adapté à tes préférences", color: COLORS.yellow },
  { icon: "🌍", label: "Fuseau horaire", desc: "Rappels toujours parfaitement synchronisés", color: COLORS.green },
  { icon: "📱", label: "PWA installable", desc: "Comme une vraie app sur ton téléphone", color: COLORS.cyan },
  { icon: "🔒", label: "Sécurisé", desc: "Authentification Supabase + OAuth Google", color: COLORS.orange },
];

export const ProfileScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOpacity = interpolate(frame, [0, 22], [0, 1], { extrapolateRight: "clamp" });
  const titleY = interpolate(frame, [0, 22], [40, 0], { extrapolateRight: "clamp" });

  // Avatar bobbing animation
  const avatarY = interpolate(
    frame,
    [0, 40, 80, 120],
    [0, -12, 0, -12],
    { extrapolateRight: "clamp" }
  );

  // Profile card slide in
  const profileSpring = spring({ frame, fps, config: { damping: 14, stiffness: 130 } });
  const profileX = interpolate(profileSpring, [0, 1], [-80, 0]);

  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(ellipse at 20% 40%, #0d0520 0%, ${COLORS.darkBg} 55%, #000d0d 100%)`,
        fontFamily,
        overflow: "hidden",
      }}
    >
      {/* Decorative rings bottom-right */}
      {[320, 240, 160, 80].map((size, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            right: -size / 2,
            bottom: -size / 2,
            width: size,
            height: size,
            borderRadius: "50%",
            border: `2px solid ${COLORS.cyan}${12 + i * 8}`,
            pointerEvents: "none",
          }}
        />
      ))}

      {/* Title */}
      <div
        style={{
          position: "absolute",
          top: 60,
          left: 100,
          opacity: titleOpacity,
          transform: `translateY(${titleY}px)`,
        }}
      >
        <div
          style={{
            display: "inline-block",
            padding: "6px 20px",
            background: `${COLORS.blue}20`,
            border: `2px solid ${COLORS.blue}`,
            marginBottom: 20,
          }}
        >
          <span
            style={{
              fontSize: 15,
              fontWeight: 900,
              color: COLORS.blue,
              letterSpacing: "4px",
              textTransform: "uppercase",
            }}
          >
            👤 Profil & Paramètres
          </span>
        </div>
        <div
          style={{
            fontSize: 62,
            fontWeight: 900,
            color: COLORS.white,
            letterSpacing: "-2px",
            lineHeight: 1.1,
          }}
        >
          L'APP S'ADAPTE
        </div>
        <div
          style={{
            fontSize: 62,
            fontWeight: 900,
            color: COLORS.cyan,
            letterSpacing: "-2px",
            lineHeight: 1.1,
          }}
        >
          À TOI.
        </div>
      </div>

      {/* Profile card mockup */}
      <div
        style={{
          position: "absolute",
          top: 240,
          left: 100,
          width: 380,
          background: COLORS.darkCard,
          border: `3px solid ${COLORS.blue}40`,
          boxShadow: `8px 8px 0px ${COLORS.blue}20`,
          padding: "32px 28px",
          transform: `translateX(${profileX}px)`,
          opacity: interpolate(profileSpring, [0, 0.3], [0, 1]),
        }}
      >
        {/* Avatar */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            marginBottom: 24,
            transform: `translateY(${avatarY}px)`,
          }}
        >
          <div
            style={{
              width: 96,
              height: 96,
              borderRadius: "50%",
              background: `linear-gradient(135deg, ${COLORS.purple}, ${COLORS.blue})`,
              border: `4px solid ${COLORS.yellow}`,
              boxShadow: `0 0 30px ${COLORS.purple}60`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 40,
              fontWeight: 900,
              color: COLORS.white,
              marginBottom: 14,
            }}
          >
            A
          </div>
          <div style={{ fontSize: 22, fontWeight: 900, color: COLORS.white }}>Alex Martin</div>
          <div style={{ fontSize: 14, color: `${COLORS.white}55`, marginTop: 4, letterSpacing: "1px" }}>
            @alex_m
          </div>
          <div
            style={{
              marginTop: 10,
              padding: "4px 14px",
              background: `${COLORS.yellow}20`,
              border: `1px solid ${COLORS.yellow}50`,
              fontSize: 13,
              color: COLORS.yellow,
              fontWeight: 600,
            }}
          >
            🔥 Streak record : 30 jours
          </div>
        </div>

        {/* Bio */}
        <div
          style={{
            padding: "14px 18px",
            background: `${COLORS.white}06`,
            border: `1px solid ${COLORS.white}12`,
            fontSize: 14,
            color: `${COLORS.white}65`,
            lineHeight: 1.6,
            fontStyle: "italic",
          }}
        >
          "Construire de meilleures habitudes, un jour à la fois."
        </div>

        {/* Stats row */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-around",
            marginTop: 20,
            paddingTop: 20,
            borderTop: `1px solid ${COLORS.white}10`,
          }}
        >
          {[
            { label: "Habitudes", val: "8" },
            { label: "Objectifs", val: "4" },
            { label: "Amis", val: "12" },
          ].map((s, i) => (
            <div key={i} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 26, fontWeight: 900, color: COLORS.white }}>{s.val}</div>
              <div style={{ fontSize: 12, color: `${COLORS.white}50`, marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Feature list */}
      <div
        style={{
          position: "absolute",
          top: 240,
          left: 540,
          right: 80,
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 18,
        }}
      >
        {features.map((f, i) => {
          const cardOpacity = interpolate(
            frame,
            [18 + i * 12, 36 + i * 12],
            [0, 1],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
          );
          const cardY = interpolate(
            frame,
            [18 + i * 12, 36 + i * 12],
            [30, 0],
            {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.out(Easing.quad),
            }
          );

          return (
            <div
              key={i}
              style={{
                background: COLORS.darkCard,
                border: `2px solid ${f.color}30`,
                boxShadow: `3px 3px 0px ${f.color}20`,
                padding: "20px 24px",
                display: "flex",
                alignItems: "flex-start",
                gap: 16,
                opacity: cardOpacity,
                transform: `translateY(${cardY}px)`,
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  background: `${f.color}20`,
                  border: `2px solid ${f.color}50`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 22,
                  flexShrink: 0,
                }}
              >
                {f.icon}
              </div>
              <div>
                <div
                  style={{
                    fontSize: 16,
                    fontWeight: 800,
                    color: COLORS.white,
                    marginBottom: 4,
                  }}
                >
                  {f.label}
                </div>
                <div style={{ fontSize: 13, color: `${COLORS.white}55`, fontWeight: 400 }}>
                  {f.desc}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
