import HabitTracker from "@/components/HabitTracker";
import GoalList from "@/components/GoalList";
import TodoList from "@/components/TodoList";
import SectionDivider from "@/components/SectionDivider";
import { Target } from "lucide-react";

export default function Home() {
  return (
    <main className="flex flex-col">
      <div className="sticky top-0 z-30 bg-surface border-b-4 border-foreground">
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 flex items-center justify-center bg-primary border-[3px] border-foreground shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] shrink-0">
              <Target size={18} strokeWidth={3} />
            </div>
            <div>
              <h1 className="text-xl font-black uppercase tracking-tight leading-none">Objectifs</h1>
              <p className="font-bold text-foreground/50 text-xs mt-0.5 leading-snug hidden sm:block">
                Habitudes répétitives, projets long terme et tâches temporaires.
              </p>
            </div>
          </div>
        </div>
      </div>
      <GoalList />
      <SectionDivider />
      <HabitTracker />
      <SectionDivider />
      <TodoList />
    </main>
  );
}
