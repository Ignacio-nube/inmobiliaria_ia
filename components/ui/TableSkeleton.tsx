"use client";

export function TableSkeleton({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
    return (
        <div className="rounded-2xl bg-slate-900/50 overflow-hidden">
            {/* Header skeleton */}
            <div className="bg-slate-800/30 px-6 py-4 flex gap-8">
                {Array.from({ length: cols }).map((_, i) => (
                    <div key={i} className="h-3 bg-slate-700/50 rounded-full animate-pulse" style={{ width: `${60 + Math.random() * 40}px` }} />
                ))}
            </div>
            {/* Row skeletons */}
            <div className="divide-y divide-slate-800/50">
                {Array.from({ length: rows }).map((_, i) => (
                    <div key={i} className="px-6 py-4 flex items-center gap-4">
                        <div className="w-10 h-10 bg-slate-800/60 rounded-xl animate-pulse" />
                        <div className="flex-1 space-y-2">
                            <div className="h-3 bg-slate-800/50 rounded-full animate-pulse" style={{ width: `${40 + Math.random() * 30}%` }} />
                            <div className="h-2.5 bg-slate-800/30 rounded-full animate-pulse" style={{ width: `${20 + Math.random() * 20}%` }} />
                        </div>
                        {Array.from({ length: cols - 2 }).map((_, j) => (
                            <div key={j} className="h-3 bg-slate-800/40 rounded-full animate-pulse" style={{ width: `${40 + Math.random() * 30}px` }} />
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
}
