"use client";

import { motion } from "motion/react";

interface SectionDividerProps {
  color?: string;
}

export default function SectionDivider({ color = "bg-foreground" }: SectionDividerProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="w-full py-6 md:py-8 flex justify-center px-4 md:px-8 max-w-6xl mx-auto"
    >
      <div className={`w-full h-[3px] md:h-[4px] border-[2px] border-foreground dark:border-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(100,100,100,0.3)] ${color}`} />
    </motion.div>
  );
}
