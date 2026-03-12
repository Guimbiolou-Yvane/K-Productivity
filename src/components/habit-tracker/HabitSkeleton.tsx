export default function HabitSkeleton() {
  return (
    <div className="w-full p-4 md:p-8 flex flex-col items-center max-w-6xl mx-auto font-sans">
      <div className="w-full">
        {/* SKELETON VUE DESKTOP */}
        <div className="hidden lg:block w-full overflow-x-auto pb-4 neo-card !p-0 border-gray-200">
          <div className="min-w-[900px] flex flex-col">
            <div className="w-full h-16 bg-gray-200 animate-pulse border-b-4 border-gray-200"></div>
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="w-full h-20 bg-gray-100 animate-pulse border-b-4 border-gray-200 last:border-b-0"></div>
            ))}
          </div>
        </div>

        {/* SKELETON VUE MOBILE */}
        <div className="lg:hidden flex flex-col w-full overflow-hidden">
          <div className="flex flex-col items-start mb-8 mt-2">
            <div className="w-32 h-8 bg-gray-200 animate-pulse mb-3 ml-2 border-l-8 border-gray-300"></div>
            <div className="w-24 h-10 bg-gray-200 animate-pulse self-end"></div>
          </div>
          <div className="flex justify-between items-center mb-6 gap-2">
            <div className="w-10 h-10 bg-gray-200 animate-pulse shrink-0"></div>
            <div className="flex-1 mx-1 h-24 sm:h-28 bg-gray-200 animate-pulse"></div>
            <div className="w-10 h-10 bg-gray-200 animate-pulse shrink-0"></div>
          </div>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="w-full h-24 bg-gray-100 animate-pulse border-4 border-gray-200 mb-4 p-4 shadow-neo"></div>
          ))}
        </div>
      </div>
    </div>
  );
}
