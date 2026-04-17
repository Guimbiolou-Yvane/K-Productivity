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

export const OutroScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Logo spring entrance
  const logoSpring = spring({
    frame,
    fps,
    config: { damping: 10, stiffness: 150 },
    durationInFrames: 45,
  });

  // Title pulse
  const titleOpacity = interpolate(frame, [20, 50], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const titleY = interpolate(frame, [20, 50], [60, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });

  // CTA appearance
  const ctaScale = spring({
    frame: frame - 60,
    fps,
    config: { damping: 8, stiffness: 200 },
  });
  const ctaOpacity = interpolate(frame, [60, 80], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Feature pills
  const pillsOpacity = interpolate(frame, [80, 105], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Animated ring around logo
  const ringScale = spring({
    frame: frame - 5,
    fps,
    config: { damping: 15, stiffness: 100 },
    durationInFrames: 50,
  });

  // Glowing background pulse
  const glowOpacity = interpolate(
    frame,
    [0, 30, 90, 120, 150],
    [0, 0.3, 0.2, 0.35, 0.3],
    { extrapolateRight: "clamp" }
  );

  const pills = [
    { text: "✅ Gratuit", color: COLORS.green },
    { text: "📱 PWA", color: COLORS.blue },
    { text: "🔒 Sécurisé", color: COLORS.purple },
    { text: "🌗 Dark Mode", color: COLORS.yellow },
    { text: "🌍 Multi-timezone", color: COLORS.orange },
    { text: "🔔 Push Notifs", color: COLORS.red },
  ];

  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(ellipse at center, #1a1200 0%, ${COLORS.darkBg} 60%, #000 100%)`,
        fontFamily,
        overflow: "hidden",
      }}
    >
      {/* Background grid */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.08,
          backgroundImage: `
            linear-gradient(${COLORS.yellow} 1px, transparent 1px),
            linear-gradient(90deg, ${COLORS.yellow} 1px, transparent 1px)
          `,
          backgroundSize: "80px 80px",
        }}
      />

      {/* Glow effect */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "40%",
          transform: "translate(-50%, -50%)",
          width: 600,
          height: 600,
          borderRadius: "50%",
          background: COLORS.yellow,
          opacity: glowOpacity,
          filter: "blur(120px)",
          pointerEvents: "none",
        }}
      />

      {/* Border stripes */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 8,
          background: COLORS.yellow,
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: 8,
          background: COLORS.yellow,
        }}
      />

      {/* Main centered content */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "42%",
          transform: "translate(-50%, -50%)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 0,
        }}
      >
        {/* Logo with ring */}
        <div
          style={{
            position: "relative",
            marginBottom: 40,
          }}
        >
          {/* Outer ring */}
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              transform: `translate(-50%, -50%) scale(${ringScale})`,
              width: 220,
              height: 220,
              borderRadius: "50%",
              border: `3px solid ${COLORS.yellow}40`,
            }}
          />
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              transform: `translate(-50%, -50%) scale(${Math.max(0, ringScale - 0.1)})`,
              width: 180,
              height: 180,
              borderRadius: "50%",
              border: `2px solid ${COLORS.yellow}25`,
            }}
          />

          {/* Logo box */}
          <div
            style={{
              width: 140,
              height: 140,
              background: COLORS.yellow,
              border: `4px solid ${COLORS.black}`,
              boxShadow: `0 0 40px ${COLORS.yellow}60, 10px 10px 0px rgba(255,218,89,0.3)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transform: `scale(${logoSpring})`,
            }}
          >
            <span
              style={{
                fontSize: 88,
                fontWeight: 900,
                color: COLORS.black,
                lineHeight: 1,
                letterSpacing: "-4px",
              }}
            >
              K
            </span>
          </div>
        </div>

        {/* Text */}
        <div
          style={{
            opacity: titleOpacity,
            transform: `translateY(${titleY}px)`,
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontSize: 80,
              fontWeight: 900,
              color: COLORS.white,
              letterSpacing: "-3px",
              lineHeight: 1,
            }}
          >
            KARISMA
          </div>
          <div
            style={{
              fontSize: 80,
              fontWeight: 900,
              color: COLORS.yellow,
              letterSpacing: "-3px",
              lineHeight: 1,
            }}
          >
            PRODUCTIVITY
          </div>
          <div
            style={{
              fontSize: 22,
              fontWeight: 400,
              color: `${COLORS.white}80`,
              letterSpacing: "6px",
              textTransform: "uppercase",
              marginTop: 16,
            }}
          >
            Commence ton parcours dès aujourd'hui
          </div>
        </div>

        {/* CTA Button */}
        <div
          style={{
            marginTop: 40,
            opacity: ctaOpacity,
            transform: `scale(${ctaScale})`,
          }}
        >
          <div
            style={{
              padding: "18px 56px",
              background: COLORS.yellow,
              border: `4px solid ${COLORS.black}`,
              boxShadow: "6px 6px 0px rgba(0,0,0,0.8)",
              fontSize: 24,
              fontWeight: 900,
              color: COLORS.black,
              letterSpacing: "2px",
              textTransform: "uppercase",
            }}
          >
            🚀 Commence maintenant
          </div>
        </div>
      </div>

      {/* Feature pills */}
      <div
        style={{
          position: "absolute",
          bottom: 48,
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          gap: 12,
          opacity: pillsOpacity,
        }}
      >
        {pills.map((pill, i) => (
          <div
            key={i}
            style={{
              padding: "8px 18px",
              border: `2px solid ${pill.color}60`,
              background: `${pill.color}15`,
              fontSize: 14,
              fontWeight: 700,
              color: pill.color,
              letterSpacing: "1px",
            }}
          >
            {pill.text}
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};
