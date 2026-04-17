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

const problems = [
  { icon: "📋", text: "Des listes qui s'accumulent sans jamais se vider", color: COLORS.red },
  { icon: "🔔", text: "Des rappels qu'on finit par ignorer", color: COLORS.orange },
  { icon: "📉", text: "Une motivation qui s'érode avec le temps", color: COLORS.purple },
  { icon: "🔀", text: "Pas de système, pas de régularité", color: COLORS.blue },
];

export const ProblemScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOpacity = interpolate(frame, [0, 25], [0, 1], { extrapolateRight: "clamp" });
  const titleY = interpolate(frame, [0, 25], [50, 0], {
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });

  // Big question mark
  const questionScale = spring({ frame, fps, config: { damping: 10, stiffness: 120 } });

  // Arrow / solution hint at the end
  const solutionOpacity = interpolate(frame, [85, 105], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(ellipse at 80% 50%, #1a0510 0%, ${COLORS.darkBg} 60%)`,
        fontFamily,
        overflow: "hidden",
      }}
    >
      {/* Diagonal stripes decoration */}
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: -100 + i * 380,
            top: 0,
            bottom: 0,
            width: 2,
            background: `${COLORS.red}15`,
            transform: "rotate(15deg)",
            transformOrigin: "top",
          }}
        />
      ))}

      {/* Big punctuation — question mark */}
      <div
        style={{
          position: "absolute",
          right: 120,
          top: "50%",
          transform: `translateY(-50%) scale(${questionScale})`,
          fontSize: 360,
          fontWeight: 900,
          color: `${COLORS.red}12`,
          lineHeight: 1,
          userSelect: "none",
        }}
      >
        ?
      </div>

      {/* Left content */}
      <div
        style={{
          position: "absolute",
          top: 80,
          left: 100,
          opacity: titleOpacity,
          transform: `translateY(${titleY}px)`,
        }}
      >
        <div
          style={{
            fontSize: 18,
            fontWeight: 700,
            color: COLORS.red,
            letterSpacing: "5px",
            textTransform: "uppercase",
            marginBottom: 16,
          }}
        >
          Le problème
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
          FIXER DES
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
          OBJECTIFS,
        </div>
        <div
          style={{
            fontSize: 64,
            fontWeight: 900,
            color: COLORS.red,
            letterSpacing: "-2px",
            lineHeight: 1.1,
          }}
        >
          C'EST FACILE.
        </div>
        <div
          style={{
            marginTop: 16,
            fontSize: 24,
            color: `${COLORS.white}60`,
            fontWeight: 400,
          }}
        >
          Les tenir sur la durée… c'est une autre histoire.
        </div>
      </div>

      {/* Problem list */}
      <div
        style={{
          position: "absolute",
          top: 330,
          left: 100,
          display: "flex",
          flexDirection: "column",
          gap: 18,
        }}
      >
        {problems.map((p, i) => {
          const itemOpacity = interpolate(
            frame,
            [30 + i * 14, 50 + i * 14],
            [0, 1],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
          );
          const itemX = interpolate(
            frame,
            [30 + i * 14, 50 + i * 14],
            [-50, 0],
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
                display: "flex",
                alignItems: "center",
                gap: 20,
                opacity: itemOpacity,
                transform: `translateX(${itemX}px)`,
              }}
            >
              <div
                style={{
                  width: 52,
                  height: 52,
                  background: `${p.color}20`,
                  border: `2px solid ${p.color}50`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 24,
                  flexShrink: 0,
                }}
              >
                {p.icon}
              </div>
              <div
                style={{
                  fontSize: 20,
                  color: `${COLORS.white}85`,
                  fontWeight: 500,
                  maxWidth: 540,
                }}
              >
                {p.text}
              </div>
            </div>
          );
        })}
      </div>

      {/* Solution hint */}
      <div
        style={{
          position: "absolute",
          bottom: 60,
          left: 100,
          display: "flex",
          alignItems: "center",
          gap: 20,
          opacity: solutionOpacity,
        }}
      >
        <div
          style={{
            width: 60,
            height: 4,
            background: COLORS.yellow,
          }}
        />
        <div
          style={{
            fontSize: 22,
            fontWeight: 700,
            color: COLORS.yellow,
            letterSpacing: "1px",
          }}
        >
          Il manque un système. Une routine. Un compagnon de progression.
        </div>
      </div>
    </AbsoluteFill>
  );
};
