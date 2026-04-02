import { motion } from "motion/react";

export default function SectionSkeleton() {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="w-full max-w-6xl mx-auto px-4 md:px-8 mt-4 mb-0 flex flex-col items-center font-sans"
    >
      <div className="flex items-center gap-3 mb-4 w-full text-left">
        {/* Icône */}
        <div className="w-9 h-9 bg-foreground/10 border-[3px] border-foreground/5 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)] shrink-0 animate-pulse"></div>
        {/* Chevron rotatif */}
        <div className="w-5 h-5 bg-foreground/10 animate-pulse shrink-0 rounded"></div>
        {/* Titre */}
        <div className="h-6 sm:h-8 w-48 sm:w-64 bg-foreground/10 animate-pulse rounded"></div>
        {/* Badge compteur */}
        <div className="ml-auto w-16 h-6 bg-foreground/10 border-2 border-foreground/5 animate-pulse rounded"></div>
      </div>
    </motion.div>
  );
}
