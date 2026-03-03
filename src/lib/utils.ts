import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function scoreColor(score: number): string {
  if (score >= 80) return "text-emerald-400";
  if (score >= 60) return "text-amber-400";
  if (score >= 40) return "text-orange-400";
  return "text-red-400";
}

export function scoreBgColor(score: number): string {
  if (score >= 80) return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
  if (score >= 60) return "bg-amber-500/20 text-amber-400 border-amber-500/30";
  if (score >= 40) return "bg-orange-500/20 text-orange-400 border-orange-500/30";
  return "bg-red-500/20 text-red-400 border-red-500/30";
}

export function stageLabel(stage: string): string {
  const labels: Record<string, string> = {
    discovered: "Discovered",
    researching: "Researching",
    outreach_ready: "Outreach Ready",
    contacted: "Contacted",
    in_conversation: "In Conversation",
  };
  return labels[stage] || stage;
}

export function stageBgColor(stage: string): string {
  const colors: Record<string, string> = {
    discovered: "bg-slate-500/20 text-slate-300 border-slate-500/30",
    researching: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    outreach_ready: "bg-violet-500/20 text-violet-400 border-violet-500/30",
    contacted: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    in_conversation: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  };
  return colors[stage] || "bg-slate-500/20 text-slate-300";
}

export function formatNumber(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return n.toString();
}
