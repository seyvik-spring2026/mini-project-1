"use client";

import { cn, scoreBgColor } from "@/lib/utils";

export function ScoreBadge({
  score,
  size = "md",
}: {
  score: number;
  size?: "sm" | "md" | "lg";
}) {
  const sizeClasses = {
    sm: "text-xs px-1.5 py-0.5",
    md: "text-sm px-2 py-0.5 font-semibold",
    lg: "text-lg px-3 py-1 font-bold",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border",
        scoreBgColor(score),
        sizeClasses[size]
      )}
    >
      {Math.round(score)}
    </span>
  );
}
