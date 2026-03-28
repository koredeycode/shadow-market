export function CardSkeleton() {
  return (
    <div className="bg-slate-900/40 border border-white/5 p-6 rounded-sm space-y-4 animate-pulse">
      <div className="flex justify-between">
        <div className="w-12 h-12 bg-white/5 rounded-sm" />
        <div className="w-16 h-4 bg-white/5 rounded-sm" />
      </div>
      <div className="space-y-2">
        <div className="w-24 h-3 bg-white/5 rounded-sm" />
        <div className="w-full h-8 bg-white/5 rounded-sm" />
      </div>
    </div>
  );
}

export function ListSkeleton() {
  return (
    <div className="space-y-4 w-full animate-pulse">
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className="flex items-center justify-between py-4 border-b border-white/5 px-4"
        >
          <div className="flex items-center gap-4 flex-1">
            <div className="w-10 h-10 bg-white/5 rounded-full" />
            <div className="space-y-2 flex-1">
              <div className="w-3/4 h-3 bg-white/5 rounded-sm" />
              <div className="w-1/2 h-2 bg-white/5 rounded-sm" />
            </div>
          </div>
          <div className="w-20 h-4 bg-white/5 rounded-sm" />
        </div>
      ))}
    </div>
  );
}

export function StatsSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
      {[...Array(4)].map((_, i) => (
        <div
          key={i}
          className="bg-slate-900/40 border border-white/5 p-6 rounded-sm space-y-3 animate-pulse"
        >
          <div className="w-8 h-8 bg-white/5 rounded-sm" />
          <div className="space-y-2">
            <div className="w-16 h-2 bg-white/5 rounded-sm" />
            <div className="w-24 h-6 bg-white/5 rounded-sm" />
          </div>
        </div>
      ))}
    </div>
  );
}
