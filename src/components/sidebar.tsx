"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Compass,
  KanbanSquare,
  Settings,
  Search,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
  UserPlus,
  SkipForward,
} from "lucide-react";
import { useState } from "react";

const navItems = [
  { href: "/discover", label: "Discover", icon: Compass },
  { href: "/pipeline", label: "Pipeline", icon: KanbanSquare },
  { href: "/settings", label: "Settings", icon: Settings },
];

interface SearchLog {
  type: "info" | "success" | "error" | "searching";
  message: string;
}

interface SearchResult {
  queryName: string;
  newCandidates: number;
  skipped: number;
  error?: string;
}

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isRunning, setIsRunning] = useState(false);
  const [showPanel, setShowPanel] = useState(false);
  const [logs, setLogs] = useState<SearchLog[]>([]);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [totalNew, setTotalNew] = useState(0);

  function addLog(log: SearchLog) {
    setLogs((prev) => [...prev, log]);
  }

  async function handleRunSearch() {
    setIsRunning(true);
    setShowPanel(true);
    setLogs([]);
    setResults([]);
    setTotalNew(0);

    addLog({ type: "info", message: "Fetching search queries..." });

    try {
      const res = await fetch("/api/search/queries");
      const queries = await res.json();
      const activeQueries = queries.filter((q: { isActive: boolean }) => q.isActive);

      if (activeQueries.length === 0) {
        addLog({ type: "error", message: "No active search queries found. Add some in Settings." });
        setIsRunning(false);
        return;
      }

      addLog({
        type: "info",
        message: `Found ${activeQueries.length} active ${activeQueries.length === 1 ? "query" : "queries"}`,
      });

      let runningTotalNew = 0;

      for (const query of activeQueries) {
        addLog({ type: "searching", message: `Searching: "${query.name}"...` });

        try {
          const searchRes = await fetch("/api/search/run", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ queryId: query.id }),
          });

          const data = await searchRes.json();

          if (!searchRes.ok) {
            addLog({ type: "error", message: `"${query.name}" failed: ${data.error || "Unknown error"}` });
            setResults((prev) => [...prev, { queryName: query.name, newCandidates: 0, skipped: 0, error: data.error }]);
            continue;
          }

          runningTotalNew += data.newCandidates;
          setTotalNew(runningTotalNew);

          if (data.newCandidates > 0) {
            addLog({
              type: "success",
              message: `"${query.name}" — ${data.newCandidates} new candidate${data.newCandidates !== 1 ? "s" : ""} found${data.skipped > 0 ? `, ${data.skipped} already known` : ""}`,
            });
          } else {
            addLog({
              type: "info",
              message: `"${query.name}" — no new candidates (${data.skipped} already known)`,
            });
          }

          setResults((prev) => [
            ...prev,
            { queryName: query.name, newCandidates: data.newCandidates, skipped: data.skipped },
          ]);
        } catch (err) {
          addLog({ type: "error", message: `"${query.name}" failed: ${String(err)}` });
          setResults((prev) => [...prev, { queryName: query.name, newCandidates: 0, skipped: 0, error: String(err) }]);
        }
      }

      // Final summary
      if (runningTotalNew > 0) {
        addLog({
          type: "success",
          message: `Done! ${runningTotalNew} new candidate${runningTotalNew !== 1 ? "s" : ""} added to Discover.`,
        });
      } else {
        addLog({ type: "info", message: "Done. No new candidates found this run." });
      }
    } catch (err) {
      addLog({ type: "error", message: `Search failed: ${String(err)}` });
    } finally {
      setIsRunning(false);
    }
  }

  return (
    <>
      <aside className="fixed left-0 top-0 z-40 h-screen w-64 bg-slate-900 border-r border-slate-800 flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-slate-800">
          <Link href="/discover" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center">
              <span className="text-white font-bold text-lg">M</span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-white tracking-tight">
                Mudita
              </h1>
              <p className="text-xs text-slate-500 -mt-0.5">Talent Scout</p>
            </div>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-indigo-600/20 text-indigo-400"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                )}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Run Search Button */}
        <div className="p-4 border-t border-slate-800">
          <button
            onClick={handleRunSearch}
            disabled={isRunning}
            className={cn(
              "w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all",
              isRunning
                ? "bg-slate-700 text-slate-400 cursor-not-allowed"
                : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/25"
            )}
          >
            {isRunning ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Search className="w-4 h-4" />
            )}
            {isRunning ? "Searching..." : "Run Search"}
          </button>
        </div>
      </aside>

      {/* Search Progress Panel */}
      {showPanel && (
        <div className="fixed left-64 bottom-0 z-50 w-96 max-h-[70vh] bg-slate-900 border border-slate-700 rounded-tr-xl rounded-tl-xl shadow-2xl shadow-black/50 flex flex-col">
          {/* Panel header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              {isRunning ? (
                <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />
              ) : totalNew > 0 ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-slate-400" />
              )}
              <span className="text-sm font-semibold text-white">
                {isRunning
                  ? "Search in progress..."
                  : `Search complete`}
              </span>
              {!isRunning && totalNew > 0 && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">
                  +{totalNew} new
                </span>
              )}
            </div>
            <button
              onClick={() => {
                setShowPanel(false);
                if (totalNew > 0) router.refresh();
              }}
              className="p-1 text-slate-500 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Log entries */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {logs.map((log, i) => (
              <div key={i} className="flex items-start gap-2 text-xs">
                {log.type === "searching" && (
                  <Loader2 className="w-3.5 h-3.5 text-indigo-400 animate-spin mt-0.5 shrink-0" />
                )}
                {log.type === "success" && (
                  <UserPlus className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                )}
                {log.type === "error" && (
                  <AlertCircle className="w-3.5 h-3.5 text-red-400 mt-0.5 shrink-0" />
                )}
                {log.type === "info" && (
                  <SkipForward className="w-3.5 h-3.5 text-slate-500 mt-0.5 shrink-0" />
                )}
                <span
                  className={cn(
                    "leading-relaxed",
                    log.type === "success" && "text-emerald-300",
                    log.type === "error" && "text-red-300",
                    log.type === "searching" && "text-indigo-300",
                    log.type === "info" && "text-slate-400"
                  )}
                >
                  {log.message}
                </span>
              </div>
            ))}
          </div>

          {/* View results button */}
          {!isRunning && totalNew > 0 && (
            <div className="p-3 border-t border-slate-800">
              <Link
                href="/discover"
                onClick={() => {
                  setShowPanel(false);
                  router.refresh();
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-semibold transition-colors"
              >
                <Compass className="w-4 h-4" />
                View in Discover
              </Link>
            </div>
          )}
        </div>
      )}
    </>
  );
}
