"use client";

import { useState } from "react";
import { useSearchQueries, useScoringWeights } from "@/lib/hooks";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Plus, Trash2, Save, Search, SlidersHorizontal } from "lucide-react";

const TABS = [
  { id: "queries", label: "Search Queries", icon: Search },
  { id: "scoring", label: "Scoring Weights", icon: SlidersHorizontal },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("queries");

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-1">Settings</h1>
        <p className="text-slate-400">
          Configure search queries and scoring parameters
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-slate-900 border border-slate-800 rounded-lg p-1 w-fit">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors",
              activeTab === tab.id
                ? "bg-indigo-600 text-white"
                : "text-slate-400 hover:text-white"
            )}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "queries" && <QueriesTab />}
      {activeTab === "scoring" && <ScoringTab />}
    </div>
  );
}

function QueriesTab() {
  const { data: queries, isLoading, mutate } = useSearchQueries();
  const [newName, setNewName] = useState("");
  const [newQuery, setNewQuery] = useState("");

  async function addQuery() {
    if (!newName.trim() || !newQuery.trim()) return;
    await fetch("/api/search/queries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName, query: newQuery }),
    });
    setNewName("");
    setNewQuery("");
    mutate();
  }

  async function deleteQuery(id: number) {
    await fetch("/api/search/queries", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    mutate();
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-20" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Existing queries */}
      <div className="space-y-3">
        {queries && queries.length > 0 ? (
          queries.map((q) => (
            <div
              key={q.id}
              className="flex items-start justify-between gap-4 p-4 bg-slate-900 border border-slate-800 rounded-lg"
            >
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-white mb-1">
                  {q.name}
                </h3>
                <p className="text-xs text-slate-400 font-mono break-all">
                  {q.query}
                </p>
              </div>
              <button
                onClick={() => deleteQuery(q.id)}
                className="p-2 text-slate-500 hover:text-red-400 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))
        ) : (
          <p className="text-sm text-slate-500">
            No search queries configured. Add one below.
          </p>
        )}
      </div>

      {/* Add new query */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-3">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add New Query
        </h3>
        <input
          type="text"
          placeholder="Query name (e.g., 'AI Builders')"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
        />
        <textarea
          placeholder='Twitter search query (e.g., "I built" OR "just shipped" AI -is:retweet lang:en)'
          value={newQuery}
          onChange={(e) => setNewQuery(e.target.value)}
          className="w-full h-24 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none font-mono"
        />
        <button
          onClick={addQuery}
          disabled={!newName.trim() || !newQuery.trim()}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus className="w-4 h-4" />
          Add Query
        </button>
      </div>
    </div>
  );
}

function ScoringTab() {
  const { data: weights, isLoading, mutate } = useScoringWeights();
  const [builder, setBuilder] = useState<number | null>(null);
  const [authenticity, setAuthenticity] = useState<number | null>(null);
  const [growth, setGrowth] = useState<number | null>(null);
  const [redFlag, setRedFlag] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  // Initialize from server data
  if (weights && builder === null) {
    setBuilder(Math.round((weights.builderWeight || 0.4) * 100));
    setAuthenticity(Math.round((weights.authenticityWeight || 0.3) * 100));
    setGrowth(Math.round((weights.growthWeight || 0.2) * 100));
    setRedFlag(Math.round((weights.redFlagWeight || 0.1) * 100));
  }

  const total = (builder || 0) + (authenticity || 0) + (growth || 0) + (redFlag || 0);

  async function saveWeights() {
    setSaving(true);
    await fetch("/api/scoring/weights", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        builderWeight: (builder || 40) / 100,
        authenticityWeight: (authenticity || 30) / 100,
        growthWeight: (growth || 20) / 100,
        redFlagWeight: (redFlag || 10) / 100,
      }),
    });
    setSaving(false);
    mutate();
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-16" />
        ))}
      </div>
    );
  }

  const sliders = [
    { label: "Builder Signals", value: builder || 40, setter: setBuilder, color: "accent-indigo-500" },
    { label: "Authenticity", value: authenticity || 30, setter: setAuthenticity, color: "accent-emerald-500" },
    { label: "Growth", value: growth || 20, setter: setGrowth, color: "accent-amber-500" },
    { label: "Red Flag Penalty", value: redFlag || 10, setter: setRedFlag, color: "accent-red-500" },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">
            Category Weights
          </h3>
          <span
            className={cn(
              "text-xs px-2 py-0.5 rounded-full",
              total === 100
                ? "bg-emerald-500/20 text-emerald-400"
                : "bg-amber-500/20 text-amber-400"
            )}
          >
            Total: {total}%
          </span>
        </div>

        {sliders.map((slider) => (
          <div key={slider.label} className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">{slider.label}</span>
              <span className="text-white font-medium">{slider.value}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={slider.value}
              onChange={(e) => slider.setter(Number(e.target.value))}
              className={cn("w-full h-2 bg-slate-700 rounded-full appearance-none cursor-pointer", slider.color)}
            />
          </div>
        ))}

        <button
          onClick={saveWeights}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {saving ? "Saving..." : "Save Weights"}
        </button>
      </div>

      <div className="p-4 bg-slate-800/50 border border-slate-700 rounded-lg">
        <p className="text-xs text-slate-400">
          Weights are automatically normalized to 100% when saved. Builder
          Signals measures evidence of building products, Authenticity evaluates
          content quality, Growth tracks audience trajectory, and Red Flag
          Penalty reduces scores for spammy behavior.
        </p>
      </div>
    </div>
  );
}
