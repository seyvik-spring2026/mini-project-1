"use client";

import { cn } from "@/lib/utils";

export function ScoreBar({
  label,
  score,
  color = "bg-indigo-500",
}: {
  label: string;
  score: number;
  color?: string;
}) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="text-slate-400">{label}</span>
        <span className="text-slate-200 font-medium">{Math.round(score)}</span>
      </div>
      <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-500", color)}
          style={{ width: `${Math.min(100, score)}%` }}
        />
      </div>
    </div>
  );
}
