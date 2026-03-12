export default function StatsSkeleton() {
  return (
    <div className="min-h-screen p-4 md:p-8 flex flex-col items-center max-w-6xl mx-auto font-sans pb-32 overflow-x-hidden">
      {/* HEADER SKELETON */}
      <div className="w-full flex justify-between items-center mb-8 border-b-8 border-gray-200 pb-4">
        <div className="h-10 md:h-12 w-48 sm:w-64 bg-gray-200 animate-pulse"></div>
      </div>

      <div className="w-full flex flex-col gap-8">
        {/* STREAK SKELETON */}
        <section className="flex flex-col gap-4">
          <div className="h-6 sm:h-8 w-40 sm:w-48 bg-gray-200 animate-pulse ml-2 mb-1"></div>
          <div className="flex flex-col gap-4 w-full">
            <div className="h-20 sm:h-24 w-full bg-gray-100 animate-pulse border-4 border-gray-200"></div>
            <div className="h-20 sm:h-24 w-full bg-gray-100 animate-pulse border-4 border-gray-200"></div>
          </div>
        </section>
        
        {/* TAUX DE RÉUSSITE SKELETON */}
        <section className="flex flex-col gap-4 mt-6">
          <div className="h-6 sm:h-8 w-48 sm:w-56 bg-gray-200 animate-pulse ml-2 mb-1"></div>
          <div className="h-32 sm:h-40 w-full bg-gray-100 animate-pulse border-4 border-gray-200"></div>
        </section>

        {/* CALENDRIER SKELETON */}
        <section className="flex flex-col gap-4 mt-4">
          <div className="h-6 sm:h-8 w-40 sm:w-48 bg-gray-200 animate-pulse ml-2 mb-1"></div>
          <div className="h-[400px] w-full bg-gray-100 animate-pulse border-4 border-gray-200"></div>
        </section>
      </div>
    </div>
  );
}
