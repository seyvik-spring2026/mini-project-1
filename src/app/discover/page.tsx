"use client";

import { useState } from "react";
import { useCandidates } from "@/lib/hooks";
import { CandidateCard } from "@/components/candidate-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, SlidersHorizontal, ArrowUpDown, Users, Sparkles, TrendingUp, ChevronUp, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const SORT_OPTIONS = [
  { value: "score", label: "Score", icon: Sparkles },
  { value: "followers", label: "Followers", icon: Users },
  { value: "growth", label: "Growth", icon: TrendingUp },
  { value: "recent", label: "Recent", icon: ArrowUpDown },
];

export default function DiscoverPage() {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("score");
  const [order, setOrder] = useState<"asc" | "desc">("desc");
  const [minScore, setMinScore] = useState("");
  const [maxScore, setMaxScore] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [growthTrend, setGrowthTrend] = useState("");

  function handleSort(value: string) {
    if (sort === value) {
      setOrder(order === "desc" ? "asc" : "desc");
    } else {
      setSort(value);
      setOrder("desc");
    }
  }

  const params: Record<string, string> = { sort, order };
  if (search) params.search = search;
  if (minScore) params.minScore = minScore;
  if (maxScore) params.maxScore = maxScore;
  if (growthTrend) params.growthTrend = growthTrend;

  const { data: candidates, isLoading, mutate } = useCandidates(params);

  async function handleSeed() {
    await fetch("/api/seed", { method: "POST" });
    mutate();
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-1">Discover</h1>
        <p className="text-slate-400">
          Find and score AI builders with founder potential
        </p>
      </div>

      {/* Search & Controls */}
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex gap-3">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search by name, handle, or bio..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500"
            />
          </div>

          {/* Sort buttons */}
          <div className="flex bg-slate-900 border border-slate-700 rounded-lg overflow-hidden">
            {SORT_OPTIONS.map((option) => {
              const isActive = sort === option.value;
              const OrderIcon = order === "desc" ? ChevronDown : ChevronUp;
              return (
                <button
                  key={option.value}
                  onClick={() => handleSort(option.value)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-2 text-sm transition-colors",
                    isActive
                      ? "bg-indigo-600 text-white"
                      : "text-slate-400 hover:text-white"
                  )}
                >
                  <option.icon className="w-3.5 h-3.5" />
                  {option.label}
                  {isActive && <OrderIcon className="w-3 h-3" />}
                </button>
              );
            })}
          </div>

          {/* Filter toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm border transition-colors",
              showFilters
                ? "bg-indigo-600/20 border-indigo-500/50 text-indigo-400"
                : "bg-slate-900 border-slate-700 text-slate-400 hover:text-white"
            )}
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filters
          </button>
        </div>

        {/* Filter panel */}
        {showFilters && (
          <div className="flex gap-4 p-4 bg-slate-900 border border-slate-700 rounded-lg">
            <div className="flex items-center gap-2">
              <label className="text-sm text-slate-400">Score:</label>
              <input
                type="number"
                placeholder="Min"
                value={minScore}
                onChange={(e) => setMinScore(e.target.value)}
                className="w-20 px-2 py-1.5 bg-slate-800 border border-slate-600 rounded text-sm text-white"
              />
              <span className="text-slate-600">-</span>
              <input
                type="number"
                placeholder="Max"
                value={maxScore}
                onChange={(e) => setMaxScore(e.target.value)}
                className="w-20 px-2 py-1.5 bg-slate-800 border border-slate-600 rounded text-sm text-white"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-slate-400">Growth:</label>
              <select
                value={growthTrend}
                onChange={(e) => setGrowthTrend(e.target.value)}
                className="px-2 py-1.5 bg-slate-800 border border-slate-600 rounded text-sm text-white"
              >
                <option value="">All</option>
                <option value="rising">Rising</option>
                <option value="stable">Stable</option>
                <option value="declining">Declining</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Results count */}
      {candidates && (
        <p className="text-sm text-slate-500 mb-4">
          {candidates.length} candidate{candidates.length !== 1 && "s"} found
        </p>
      )}

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 9 }).map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      ) : candidates && candidates.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {candidates.map((c) => (
            <CandidateCard key={c.id} candidate={c} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Sparkles className="w-12 h-12 text-slate-600 mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">
            No candidates yet
          </h3>
          <p className="text-slate-400 mb-6 max-w-md">
            Seed the database with sample AI builders or run a search to discover new candidates.
          </p>
          <button
            onClick={handleSeed}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-semibold transition-colors"
          >
            Seed Sample Data
          </button>
        </div>
      )}
    </div>
  );
}
