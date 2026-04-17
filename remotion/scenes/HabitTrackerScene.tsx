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

const DAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

const habits = [
  {
    name: "🏃 Sport",
    color: COLORS.green,
    completed: [true, true, true, false, true, true, false],
  },
  {
    name: "📚 Lecture",
    color: COLORS.blue,
    completed: [true, false, true, true, true, false, true],
  },
  {
    name: "🧘 Méditation",
    color: COLORS.purple,
    completed: [true, true, false, true, true, true, true],
  },
  {
    name: "💧 Hydratation",
    color: COLORS.cyan,
    completed: [false, true, true, true, false, true, true],
  },
];

export const HabitTrackerScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOpacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" });
  const titleX = interpolate(frame, [0, 25], [-80, 0], {
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });

  // Streak counter animation
  const streakCount = Math.floor(
    interpolate(frame, [40, 90], [0, 12], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    })
  );
  const streakOpacity = interpolate(frame, [35, 55], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Grid check marks animate in
  const progressWidth = interpolate(frame, [30, 100], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(150deg, ${COLORS.darkBg} 0%, #120f08 100%)`,
        fontFamily,
        overflow: "hidden",
      }}
    >
      {/* Yellow top bar */}
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

      {/* Section badge */}
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
            background: COLORS.yellow,
            border: `3px solid ${COLORS.black}`,
            boxShadow: "4px 4px 0px rgba(0,0,0,0.8)",
            marginBottom: 16,
          }}
        >
          <span
            style={{
              fontSize: 16,
              fontWeight: 900,
              color: COLORS.black,
              letterSpacing: "4px",
              textTransform: "uppercase",
            }}
          >
            🔄 Habitudes Répétitives
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
          CONSTRUIS TES
        </div>
        <div
          style={{
            fontSize: 64,
            fontWeight: 900,
            color: COLORS.yellow,
            letterSpacing: "-2px",
            lineHeight: 1.1,
          }}
        >
          ROUTINES GAGNANTES
        </div>
      </div>

      {/* Habit Tracker mockup */}
      <div
        style={{
          position: "absolute",
          top: 280,
          left: 80,
          right: 80,
          background: COLORS.darkCard,
          border: `3px solid ${COLORS.yellow}50`,
          boxShadow: `8px 8px 0px ${COLORS.yellow}30`,
          padding: 40,
        }}
      >
        {/* Table header */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "240px repeat(7, 1fr)",
            gap: 8,
            marginBottom: 20,
          }}
        >
          <div
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: `${COLORS.white}60`,
              letterSpacing: "2px",
              textTransform: "uppercase",
            }}
          >
            OBJECTIF
          </div>
          {DAYS.map((day, i) => (
            <div
              key={i}
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: i === 4 ? COLORS.yellow : `${COLORS.white}60`,
                letterSpacing: "1px",
                textAlign: "center",
                textTransform: "uppercase",
              }}
            >
              {day}
            </div>
          ))}
        </div>

        {/* Habit rows */}
        {habits.map((habit, hi) => {
          const rowOpacity = interpolate(
            frame,
            [20 + hi * 12, 40 + hi * 12],
            [0, 1],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
          );
          const rowX = interpolate(
            frame,
            [20 + hi * 12, 40 + hi * 12],
            [-40, 0],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
          );

          return (
            <div
              key={hi}
              style={{
                display: "grid",
                gridTemplateColumns: "240px repeat(7, 1fr)",
                gap: 8,
                marginBottom: 16,
                opacity: rowOpacity,
                transform: `translateX(${rowX}px)`,
              }}
            >
              {/* Habit name */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <div
                  style={{
                    width: 6,
                    height: 32,
                    background: habit.color,
                  }}
                />
                <span
                  style={{
                    fontSize: 16,
                    fontWeight: 700,
                    color: COLORS.white,
                  }}
                >
                  {habit.name}
                </span>
              </div>

              {/* Day checkboxes */}
              {habit.completed.map((done, di) => {
                const checkReveal = interpolate(
                  frame,
                  [50 + di * 6, 65 + di * 6],
                  [0, 1],
                  { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
                );

                return (
                  <div
                    key={di}
                    style={{
                      width: "100%",
                      height: 40,
                      background: done
                        ? `${habit.color}${Math.floor(checkReveal * 255)
                            .toString(16)
                            .padStart(2, "0")}`
                        : `${COLORS.white}10`,
                      border: `2px solid ${done ? habit.color : COLORS.white + "20"}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 18,
                    }}
                  >
                    {done && checkReveal > 0.5 ? "✓" : ""}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Streak badge */}
      <div
        style={{
          position: "absolute",
          top: 48,
          right: 80,
          opacity: streakOpacity,
          background: COLORS.darkCard,
          border: `3px solid ${COLORS.orange}`,
          boxShadow: `6px 6px 0px ${COLORS.orange}60`,
          padding: "20px 32px",
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: 20, marginBottom: 4 }}>🔥</div>
        <div
          style={{
            fontSize: 64,
            fontWeight: 900,
            color: COLORS.orange,
            lineHeight: 1,
          }}
        >
          {streakCount}
        </div>
        <div
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: `${COLORS.white}80`,
            letterSpacing: "2px",
            textTransform: "uppercase",
            marginTop: 4,
          }}
        >
          Jours de suite
        </div>
      </div>
    </AbsoluteFill>
  );
};
