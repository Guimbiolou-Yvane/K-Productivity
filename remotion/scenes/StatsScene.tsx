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

// Mock data for the bar chart (success rates by week)
const weeklyData = [
  { label: "S1", value: 60 },
  { label: "S2", value: 72 },
  { label: "S3", value: 55 },
  { label: "S4", value: 85 },
  { label: "S5", value: 78 },
  { label: "S6", value: 92 },
  { label: "S7", value: 88 },
];

// Calendar days (April 2026)
const calendarDays = Array.from({ length: 30 }, (_, i) => i + 1);
const completedDays = new Set([1, 2, 3, 5, 6, 7, 8, 10, 12, 14, 15, 16, 17, 19, 20, 22, 24, 26, 27, 28]);

export const StatsScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOpacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" });
  const titleX = interpolate(frame, [0, 20], [-60, 0], {
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });

  // Streak number animation
  const streakNum = Math.floor(
    interpolate(frame, [20, 70], [0, 22], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    })
  );
  const rateNum = Math.floor(
    interpolate(frame, [30, 80], [0, 87], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    })
  );

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(130deg, ${COLORS.darkBg} 0%, #000a14 100%)`,
        fontFamily,
        overflow: "hidden",
      }}
    >
      {/* Top stripe */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 8,
          background: `linear-gradient(90deg, ${COLORS.green}, ${COLORS.blue}, ${COLORS.purple})`,
        }}
      />

      {/* Title */}
      <div
        style={{
          position: "absolute",
          top: 48,
          left: 100,
          opacity: titleOpacity,
          transform: `translateX(${titleX}px)`,
        }}
      >
        <div
          style={{
            display: "inline-block",
            padding: "6px 20px",
            background: `${COLORS.green}20`,
            border: `2px solid ${COLORS.green}`,
            marginBottom: 16,
          }}
        >
          <span
            style={{
              fontSize: 16,
              fontWeight: 900,
              color: COLORS.green,
              letterSpacing: "4px",
              textTransform: "uppercase",
            }}
          >
            📊 Statistics
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
          MESURE TON
        </div>
        <div
          style={{
            fontSize: 64,
            fontWeight: 900,
            color: COLORS.green,
            letterSpacing: "-2px",
            lineHeight: 1.1,
          }}
        >
          ÉVOLUTION.
        </div>
      </div>

      {/* KPI cards row */}
      <div
        style={{
          position: "absolute",
          top: 280,
          left: 100,
          display: "flex",
          gap: 24,
        }}
      >
        {[
          {
            label: "🔥 Streak actuel",
            value: `${streakNum}j`,
            color: COLORS.orange,
            delay: 10,
            sub: "Meilleur: 30j",
          },
          {
            label: "✅ Taux de réussite",
            value: `${rateNum}%`,
            color: COLORS.green,
            delay: 25,
            sub: "Ce mois-ci",
          },
          {
            label: "📋 Habitudes actives",
            value: "8",
            color: COLORS.blue,
            delay: 40,
            sub: "5 catégories",
          },
        ].map((kpi, i) => {
          const kpiSpring = spring({
            frame: frame - kpi.delay,
            fps,
            config: { damping: 14, stiffness: 160 },
          });
          const kpiOpacity = interpolate(
            frame,
            [kpi.delay, kpi.delay + 15],
            [0, 1],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
          );
          const kpiY = interpolate(kpiSpring, [0, 1], [40, 0]);

          return (
            <div
              key={i}
              style={{
                width: 220,
                background: COLORS.darkCard,
                border: `3px solid ${kpi.color}50`,
                boxShadow: `5px 5px 0px ${kpi.color}30`,
                padding: "24px 28px",
                opacity: kpiOpacity,
                transform: `translateY(${kpiY}px)`,
              }}
            >
              <div
                style={{
                  fontSize: 14,
                  color: `${COLORS.white}60`,
                  marginBottom: 8,
                  fontWeight: 600,
                  letterSpacing: "1px",
                }}
              >
                {kpi.label}
              </div>
              <div
                style={{
                  fontSize: 52,
                  fontWeight: 900,
                  color: kpi.color,
                  lineHeight: 1,
                  marginBottom: 8,
                }}
              >
                {kpi.value}
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: `${COLORS.white}40`,
                  fontWeight: 400,
                }}
              >
                {kpi.sub}
              </div>
            </div>
          );
        })}
      </div>

      {/* Bar chart */}
      <div
        style={{
          position: "absolute",
          top: 280,
          right: 100,
          width: 740,
          background: COLORS.darkCard,
          border: `3px solid ${COLORS.blue}30`,
          padding: "28px 32px",
        }}
      >
        <div
          style={{
            fontSize: 16,
            fontWeight: 800,
            color: COLORS.white,
            marginBottom: 24,
            letterSpacing: "-0.5px",
          }}
        >
          Taux de réussite par semaine
        </div>

        {/* Bars */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            gap: 16,
            height: 200,
          }}
        >
          {weeklyData.map((d, i) => {
            const barHeight = interpolate(
              frame,
              [40 + i * 8, 80 + i * 8],
              [0, (d.value / 100) * 180],
              {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
                easing: Easing.out(Easing.quad),
              }
            );

            const isHighest = d.value === Math.max(...weeklyData.map((x) => x.value));
            const barColor = isHighest ? COLORS.green : COLORS.blue;

            return (
              <div
                key={i}
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: isHighest ? COLORS.green : `${COLORS.white}80`,
                  }}
                >
                  {d.value}%
                </div>
                <div
                  style={{
                    width: "100%",
                    height: barHeight,
                    background: `linear-gradient(to top, ${barColor}, ${barColor}80)`,
                    boxShadow: isHighest ? `0 0 16px ${COLORS.green}60` : "none",
                    transition: "none",
                  }}
                />
                <div
                  style={{
                    fontSize: 13,
                    color: `${COLORS.white}50`,
                    fontWeight: 600,
                  }}
                >
                  {d.label}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Calendar mini */}
      <div
        style={{
          position: "absolute",
          bottom: 48,
          left: 100,
          right: 100,
          background: COLORS.darkCard,
          border: `3px solid ${COLORS.white}10`,
          padding: "20px 28px",
        }}
      >
        <div
          style={{
            fontSize: 14,
            fontWeight: 800,
            color: `${COLORS.white}80`,
            marginBottom: 12,
            letterSpacing: "2px",
            textTransform: "uppercase",
          }}
        >
          Calendrier  — Avril 2026
        </div>
        <div
          style={{
            display: "flex",
            gap: 6,
            flexWrap: "wrap",
          }}
        >
          {calendarDays.map((day) => {
            const done = completedDays.has(day);
            const dayReveal = interpolate(
              frame,
              [60 + day * 1.5, 70 + day * 1.5],
              [0, 1],
              { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
            );

            return (
              <div
                key={day}
                style={{
                  width: 36,
                  height: 36,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: done ? `${COLORS.green}${Math.floor(dayReveal * 180).toString(16).padStart(2, "0")}` : `${COLORS.white}08`,
                  border: `1px solid ${done ? COLORS.green + "60" : COLORS.white + "10"}`,
                  fontSize: 13,
                  fontWeight: done ? 700 : 400,
                  color: done ? COLORS.white : `${COLORS.white}40`,
                }}
              >
                {day}
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};
