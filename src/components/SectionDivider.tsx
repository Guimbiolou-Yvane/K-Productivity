"use client";

import { motion } from "motion/react";

const COLORS = [
  "#ef4444", "#f97316", "#eab308", "#22c55e",
  "#3b82f6", "#8b5cf6", "#ec4899", "#06b6d4",
];

function Target({ delay, colorIndex }: { delay: number; colorIndex: number }) {
  // Cycle à travers 3 couleurs différentes par cible
  const c1 = COLORS[colorIndex % COLORS.length];
  const c2 = COLORS[(colorIndex + 3) % COLORS.length];
  const c3 = COLORS[(colorIndex + 5) % COLORS.length];

  return (
    <div className="relative w-8 h-8 shrink-0">
      {/* Cercle extérieur — pulse de couleur */}
      <motion.svg
        viewBox="0 0 48 48"
        className="w-full h-full"
        animate={{ rotate: [0, 360] }}
        transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
      >
        <motion.circle
          cx="24" cy="24" r="22"
          fill="none"
          strokeWidth="2.5"
          animate={{ stroke: [c1, c2, c3, c1] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay }}
        />
        <motion.circle
          cx="24" cy="24" r="15"
          fill="none"
          strokeWidth="2.5"
          animate={{ stroke: [c2, c3, c1, c2] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: delay + 0.5 }}
        />
        <motion.circle
          cx="24" cy="24" r="8"
          fill="none"
          strokeWidth="2.5"
          animate={{ stroke: [c3, c1, c2, c3] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: delay + 1 }}
        />
        {/* Centre */}
        <motion.circle
          cx="24" cy="24" r="3"
          animate={{ fill: [c1, c3, c2, c1] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay }}
        />
      </motion.svg>

      {/* Flash de pulse */}
      <motion.div
        animate={{
          scale: [1, 1.6, 1],
          opacity: [0, 0.3, 0],
        }}
        transition={{
          duration: 2.5,
          repeat: Infinity,
          ease: "easeInOut",
          delay: delay + 1.5,
        }}
        className="absolute inset-0 rounded-full"
        style={{ backgroundColor: c1 }}
      />
    </div>
  );
}

export default function SectionDivider() {
  const targets = [0, 3, 6, 1, 4, 7, 2, 5, 0, 3, 6, 1];

  return (
    <div className="w-full py-3 overflow-hidden relative">
      {/* Ligne horizontale */}
      <div className="absolute top-1/2 left-0 w-full h-[2px] bg-foreground/10 -translate-y-1/2" />

      {/* Défilement de cibles */}
      <motion.div
        animate={{ x: ["0%", "-50%"] }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: "linear",
        }}
        className="flex items-center gap-8 w-max"
      >
        {[...targets, ...targets].map((colorIdx, i) => (
          <Target key={i} colorIndex={colorIdx} delay={i * 0.25} />
        ))}
      </motion.div>
    </div>
  );
}
