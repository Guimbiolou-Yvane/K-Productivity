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

export const IntroScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Background grid fade in
  const bgOpacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateRight: "clamp",
  });

  // Logo K animation
  const logoScale = spring({
    frame,
    fps,
    config: { damping: 12, stiffness: 180 },
    durationInFrames: 40,
  });

  // Title slide in from right
  const titleX = interpolate(frame, [20, 50], [120, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });
  const titleOpacity = interpolate(frame, [20, 45], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Subtitle
  const subtitleOpacity = interpolate(frame, [40, 65], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const subtitleY = interpolate(frame, [40, 65], [30, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Tag line
  const tagOpacity = interpolate(frame, [60, 85], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Yellow accent bar
  const barWidth = interpolate(frame, [30, 70], [0, 500], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.exp),
  });

  // Bottom badge
  const badgeOpacity = interpolate(frame, [80, 100], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Floating particles
  const p1Y = interpolate(frame, [0, 150], [0, -40], { extrapolateRight: "clamp" });
  const p2Y = interpolate(frame, [10, 150], [0, -60], { extrapolateRight: "clamp" });
  const p3Y = interpolate(frame, [20, 150], [0, -30], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(135deg, ${COLORS.darkBg} 0%, #0f0f1a 100%)`,
        fontFamily,
        overflow: "hidden",
      }}
    >
      {/* Background grid */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: bgOpacity * 0.15,
          backgroundImage: `
            linear-gradient(${COLORS.yellow} 1px, transparent 1px),
            linear-gradient(90deg, ${COLORS.yellow} 1px, transparent 1px)
          `,
          backgroundSize: "80px 80px",
        }}
      />

      {/* Floating particles */}
      {[
        { x: 150, y: 200 + p1Y, size: 12, color: COLORS.yellow, opacity: 0.6 },
        { x: 1700, y: 300 + p2Y, size: 20, color: COLORS.purple, opacity: 0.5 },
        { x: 100, y: 800 + p3Y, size: 16, color: COLORS.cyan, opacity: 0.4 },
        { x: 1800, y: 700, size: 10, color: COLORS.green, opacity: 0.5 },
        { x: 900, y: 50, size: 14, color: COLORS.orange, opacity: 0.4 },
      ].map((p, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: p.x,
            top: p.y,
            width: p.size,
            height: p.size,
            background: p.color,
            borderRadius: "50%",
            opacity: p.opacity * bgOpacity,
            boxShadow: `0 0 20px ${p.color}`,
          }}
        />
      ))}

      {/* Left accent stripe */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: 8,
          background: COLORS.yellow,
        }}
      />

      {/* Main content container */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          transform: "translate(-50%, -50%)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 0,
        }}
      >
        {/* Logo K */}
        <div
          style={{
            width: 160,
            height: 160,
            background: COLORS.yellow,
            border: `4px solid ${COLORS.black}`,
            boxShadow: "8px 8px 0px rgba(255,218,89,0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transform: `scale(${logoScale})`,
            marginBottom: 40,
          }}
        >
          <span
            style={{
              fontSize: 100,
              fontWeight: 900,
              color: COLORS.black,
              lineHeight: 1,
              letterSpacing: "-4px",
            }}
          >
            K
          </span>
        </div>

        {/* Yellow accent bar */}
        <div
          style={{
            width: barWidth,
            height: 6,
            background: COLORS.yellow,
            marginBottom: 32,
            boxShadow: `0 0 20px ${COLORS.yellow}80`,
          }}
        />

        {/* Title */}
        <div
          style={{
            opacity: titleOpacity,
            transform: `translateX(${titleX}px)`,
          }}
        >
          <div
            style={{
              fontSize: 96,
              fontWeight: 900,
              color: COLORS.white,
              textAlign: "center",
              letterSpacing: "-3px",
              lineHeight: 1,
            }}
          >
            KARISMA
          </div>
          <div
            style={{
              fontSize: 96,
              fontWeight: 900,
              color: COLORS.yellow,
              textAlign: "center",
              letterSpacing: "-3px",
              lineHeight: 1,
            }}
          >
            PRODUCTIVITY
          </div>
        </div>

        {/* Subtitle */}
        <div
          style={{
            marginTop: 32,
            opacity: subtitleOpacity,
            transform: `translateY(${subtitleY}px)`,
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontSize: 28,
              fontWeight: 400,
              color: `${COLORS.white}CC`,
              letterSpacing: "6px",
              textTransform: "uppercase",
            }}
          >
            Transforme tes objectifs en résultats
          </div>
        </div>

        {/* Tag badges */}
        <div
          style={{
            display: "flex",
            gap: 16,
            marginTop: 48,
            opacity: tagOpacity,
          }}
        >
          {["PWA", "Neo-Brutalist", "Next.js", "Supabase"].map((tag, i) => (
            <div
              key={i}
              style={{
                padding: "8px 20px",
                border: `2px solid ${i === 0 ? COLORS.yellow : COLORS.white + "40"}`,
                background: i === 0 ? COLORS.yellow + "20" : "transparent",
                color: i === 0 ? COLORS.yellow : COLORS.white + "80",
                fontSize: 16,
                fontWeight: 700,
                letterSpacing: "2px",
                textTransform: "uppercase",
              }}
            >
              {tag}
            </div>
          ))}
        </div>
      </div>

      {/* Bottom badge */}
      <div
        style={{
          position: "absolute",
          bottom: 48,
          right: 64,
          opacity: badgeOpacity,
        }}
      >
        <div
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: `${COLORS.white}50`,
            letterSpacing: "3px",
            textTransform: "uppercase",
            textAlign: "right",
          }}
        >
          Application de productivité
        </div>
        <div
          style={{
            fontSize: 14,
            fontWeight: 400,
            color: `${COLORS.white}30`,
            letterSpacing: "2px",
            textTransform: "uppercase",
            textAlign: "right",
          }}
        >
          2026
        </div>
      </div>
    </AbsoluteFill>
  );
};
