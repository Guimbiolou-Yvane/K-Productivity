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

const goals = [
  {
    name: "🎓 Apprendre TypeScript",
    category: "Éducation",
    color: COLORS.purple,
    progress: 75,
    targetDate: "Juin 2026",
  },
  {
    name: "💪 Courir un marathon",
    category: "Sport",
    color: COLORS.green,
    progress: 45,
    targetDate: "Oct 2026",
  },
  {
    name: "📈 Lancer mon projet SaaS",
    category: "Travail",
    color: COLORS.yellow,
    progress: 30,
    targetDate: "Sep 2026",
  },
  {
    name: "🌍 Voyage au Japon",
    category: "Voyage",
    color: COLORS.red,
    progress: 60,
    targetDate: "Avr 2027",
  },
];

export const GoalsScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOpacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" });
  const titleY = interpolate(frame, [0, 20], [40, 0], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(140deg, #0d001a 0%, ${COLORS.darkBg} 60%, #001a0d 100%)`,
        fontFamily,
        overflow: "hidden",
      }}
    >
      {/* Decorative large circle */}
      <div
        style={{
          position: "absolute",
          right: -200,
          top: -200,
          width: 700,
          height: 700,
          borderRadius: "50%",
          border: `3px solid ${COLORS.purple}20`,
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          right: -100,
          top: -100,
          width: 500,
          height: 500,
          borderRadius: "50%",
          border: `2px solid ${COLORS.purple}30`,
          pointerEvents: "none",
        }}
      />

      {/* Left content */}
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
            background: `${COLORS.purple}30`,
            border: `2px solid ${COLORS.purple}`,
            marginBottom: 20,
          }}
        >
          <span
            style={{
              fontSize: 16,
              fontWeight: 900,
              color: COLORS.purple,
              letterSpacing: "4px",
              textTransform: "uppercase",
            }}
          >
            🏆 Objectifs Long Terme
          </span>
        </div>
        <div
          style={{
            fontSize: 68,
            fontWeight: 900,
            color: COLORS.white,
            letterSpacing: "-2px",
            lineHeight: 1.1,
          }}
        >
          VISE PLUS HAUT.
        </div>
        <div
          style={{
            fontSize: 68,
            fontWeight: 900,
            color: COLORS.purple,
            letterSpacing: "-2px",
            lineHeight: 1.1,
          }}
        >
          ATTEINS-LE.
        </div>
        <div
          style={{
            marginTop: 24,
            fontSize: 20,
            color: `${COLORS.white}70`,
            maxWidth: 420,
            lineHeight: 1.6,
            fontWeight: 400,
          }}
        >
          Définis tes ambitions avec des dates cibles et un suivi visuel de progression.
        </div>
      </div>

      {/* Goal cards */}
      <div
        style={{
          position: "absolute",
          top: 80,
          right: 100,
          width: 700,
          display: "flex",
          flexDirection: "column",
          gap: 20,
        }}
      >
        {goals.map((goal, i) => {
          const cardSpring = spring({
            frame: frame - i * 15,
            fps,
            config: { damping: 14, stiffness: 140 },
          });
          const cardOpacity = interpolate(frame, [i * 15, i * 15 + 20], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          const cardX = interpolate(cardSpring, [0, 1], [80, 0]);

          // Animated progress bar
          const progressAnim = interpolate(
            frame,
            [30 + i * 10, 80 + i * 10],
            [0, goal.progress],
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
                border: `3px solid ${goal.color}50`,
                boxShadow: `5px 5px 0px ${goal.color}40`,
                padding: "20px 28px",
                opacity: cardOpacity,
                transform: `translateX(${cardX}px)`,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: 14,
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: 20,
                      fontWeight: 800,
                      color: COLORS.white,
                      marginBottom: 4,
                    }}
                  >
                    {goal.name}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      gap: 8,
                      alignItems: "center",
                    }}
                  >
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: goal.color,
                        letterSpacing: "2px",
                        textTransform: "uppercase",
                      }}
                    >
                      {goal.category}
                    </span>
                    <span style={{ color: `${COLORS.white}30`, fontSize: 12 }}>•</span>
                    <span
                      style={{
                        fontSize: 12,
                        color: `${COLORS.white}50`,
                        fontWeight: 400,
                      }}
                    >
                      📅 {goal.targetDate}
                    </span>
                  </div>
                </div>
                <div
                  style={{
                    width: 56,
                    height: 56,
                    border: `3px solid ${goal.color}`,
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 15,
                    fontWeight: 900,
                    color: goal.color,
                    background: `${goal.color}15`,
                  }}
                >
                  {Math.round(progressAnim)}%
                </div>
              </div>

              {/* Progress bar */}
              <div
                style={{
                  height: 8,
                  background: `${COLORS.white}10`,
                  borderRadius: 0,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${progressAnim}%`,
                    background: goal.color,
                    boxShadow: `0 0 10px ${goal.color}80`,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
