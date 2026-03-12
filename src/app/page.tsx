import HabitTracker from "@/components/HabitTracker";
import TodoList from "@/components/TodoList";

export default function Home() {
  return (
    <main className="flex flex-col">
      <div className="w-full max-w-6xl mx-auto px-4 md:px-8 mt-6">
        <div className="w-full flex flex-col justify-start mb-8 border-b-8 border-foreground pb-4">
          <h1 className="text-3xl sm:text-5xl font-black uppercase tracking-tighter shadow-sm mb-2">Objectifs</h1>
          <p className="font-bold text-foreground/60 text-sm sm:text-base leading-snug">
            Gérez vos habitudes répétitives et planifiez vos tâches temporaires. Chaque jour est une nouvelle opportunité d&apos;avancer.
          </p>
        </div>
      </div>
      <HabitTracker />
      <TodoList />
    </main>
  );
}
