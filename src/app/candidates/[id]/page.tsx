"use client";

import { useParams, useRouter } from "next/navigation";
import { useCandidate } from "@/lib/hooks";
import { ScoreBadge } from "@/components/ui/score-badge";
import { ScoreBar } from "@/components/ui/score-bar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  formatNumber,
  stageLabel,
  stageBgColor,
  cn,
} from "@/lib/utils";
import {
  ArrowLeft,
  ExternalLink,
  Users,
  UserPlus,
  MessageCircle,
  Heart,
  Repeat2,
  Eye,
  Calendar,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";
import { useState } from "react";
import { formatDistanceToNow } from "date-fns";

const STAGES = [
  "discovered",
  "researching",
  "outreach_ready",
  "contacted",
  "in_conversation",
] as const;

export default function CandidateDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { data: candidate, isLoading, mutate } = useCandidate(id as string);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  async function updateStage(stage: string) {
    await fetch(`/api/candidates/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pipelineStage: stage }),
    });
    mutate();
  }

  async function saveNotes() {
    setSaving(true);
    await fetch(`/api/candidates/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notes }),
    });
    setSaving(false);
    mutate();
  }

  if (isLoading) {
    return (
      <div className="p-8 space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-48" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!candidate) {
    return (
      <div className="p-8">
        <p className="text-slate-400">Candidate not found.</p>
      </div>
    );
  }

  // Initialize notes from candidate data
  if (notes === "" && candidate.notes) {
    setNotes(candidate.notes);
  }

  return (
    <div className="p-8 max-w-5xl">
      {/* Back button */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-slate-400 hover:text-white mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      {/* Profile Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 mb-6">
        <div className="flex items-start gap-5">
          <img
            src={candidate.avatarUrl || `https://api.dicebear.com/7.x/notionists/svg?seed=${candidate.username}`}
            alt={candidate.displayName}
            className="w-20 h-20 rounded-full bg-slate-700"
          />
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold text-white">
                {candidate.displayName}
              </h1>
              <ScoreBadge score={candidate.overallScore || 0} size="lg" />
            </div>
            <p className="text-slate-500 mb-2">@{candidate.username}</p>
            {candidate.bio && (
              <p className="text-slate-300 mb-4">{candidate.bio}</p>
            )}

            {/* Stats grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="flex items-center gap-2 text-sm">
                <Users className="w-4 h-4 text-slate-500" />
                <span className="text-white font-semibold">
                  {formatNumber(candidate.followerCount || 0)}
                </span>
                <span className="text-slate-500">followers</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <UserPlus className="w-4 h-4 text-slate-500" />
                <span className="text-white font-semibold">
                  {formatNumber(candidate.followingCount || 0)}
                </span>
                <span className="text-slate-500">following</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <MessageCircle className="w-4 h-4 text-slate-500" />
                <span className="text-white font-semibold">
                  {formatNumber(candidate.tweetCount || 0)}
                </span>
                <span className="text-slate-500">tweets</span>
              </div>
              {candidate.accountCreatedAt && (
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-slate-500" />
                  <span className="text-slate-400">
                    Joined{" "}
                    {new Date(candidate.accountCreatedAt).toLocaleDateString(
                      "en-US",
                      { month: "short", year: "numeric" }
                    )}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Score Breakdown */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <h2 className="text-lg font-semibold text-white mb-4">
              Founder Signal Score
            </h2>

            {/* Overall score circle */}
            <div className="flex justify-center mb-6">
              <div className="relative w-28 h-28">
                <svg className="w-28 h-28 -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50" cy="50" r="42"
                    fill="none" stroke="#1e293b" strokeWidth="8"
                  />
                  <circle
                    cx="50" cy="50" r="42"
                    fill="none"
                    stroke={
                      (candidate.overallScore || 0) >= 80
                        ? "#10b981"
                        : (candidate.overallScore || 0) >= 60
                        ? "#f59e0b"
                        : "#ef4444"
                    }
                    strokeWidth="8"
                    strokeDasharray={`${((candidate.overallScore || 0) / 100) * 264} 264`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-3xl font-bold text-white">
                    {Math.round(candidate.overallScore || 0)}
                  </span>
                </div>
              </div>
            </div>

            {/* Category bars */}
            <div className="space-y-3">
              <ScoreBar
                label="Builder Signals"
                score={candidate.builderScore || 0}
                color="bg-indigo-500"
              />
              <ScoreBar
                label="Authenticity"
                score={candidate.authenticityScore || 0}
                color="bg-emerald-500"
              />
              <ScoreBar
                label="Growth"
                score={candidate.growthScore || 0}
                color="bg-amber-500"
              />
              {candidate.engagementTrend && (
                <div className="flex items-center justify-between text-xs mt-1 px-1">
                  <span className="text-slate-500">Engagement trend</span>
                  <span
                    className={cn(
                      "flex items-center gap-1 font-medium",
                      candidate.engagementTrend === "rising"
                        ? "text-emerald-400"
                        : candidate.engagementTrend === "declining"
                        ? "text-red-400"
                        : "text-slate-400"
                    )}
                  >
                    {candidate.engagementTrend === "rising" && (
                      <TrendingUp className="w-3 h-3" />
                    )}
                    {candidate.engagementTrend === "declining" && (
                      <TrendingDown className="w-3 h-3" />
                    )}
                    {candidate.engagementTrend === "stable" && (
                      <Minus className="w-3 h-3" />
                    )}
                    {candidate.engagementGrowthRatio != null
                      ? `${candidate.engagementGrowthRatio.toFixed(1)}x`
                      : candidate.engagementTrend}
                  </span>
                </div>
              )}
              <ScoreBar
                label="Red Flags"
                score={candidate.redFlagScore || 0}
                color="bg-red-500"
              />
            </div>
          </div>

          {/* Pipeline Stage */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <h2 className="text-lg font-semibold text-white mb-3">
              Pipeline Stage
            </h2>
            <div className="space-y-2">
              {STAGES.map((stage) => (
                <button
                  key={stage}
                  onClick={() => updateStage(stage)}
                  className={cn(
                    "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors",
                    candidate.pipelineStage === stage
                      ? stageBgColor(stage) + " border"
                      : "text-slate-400 hover:bg-slate-800"
                  )}
                >
                  {stageLabel(stage)}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <h2 className="text-lg font-semibold text-white mb-3">Notes</h2>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add notes about this candidate..."
              className="w-full h-28 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none"
            />
            <button
              onClick={saveNotes}
              disabled={saving}
              className="mt-2 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Notes"}
            </button>
          </div>

          {/* View on X */}
          <a
            href={`https://x.com/${candidate.username}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-300 hover:text-white hover:border-slate-600 transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            View on X
          </a>
        </div>

        {/* Tweets */}
        <div className="lg:col-span-2">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <h2 className="text-lg font-semibold text-white mb-4">
              Recent Tweets ({candidate.tweets?.length || 0})
            </h2>
            <div className="space-y-4">
              {candidate.tweets && candidate.tweets.length > 0 ? (
                candidate.tweets.map((tweet) => (
                  <div
                    key={tweet.id}
                    className="p-4 bg-slate-800/50 border border-slate-700/50 rounded-lg"
                  >
                    <p className="text-sm text-slate-200 whitespace-pre-wrap mb-3">
                      {tweet.text}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Heart className="w-3.5 h-3.5" />
                        {formatNumber(tweet.likes || 0)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Repeat2 className="w-3.5 h-3.5" />
                        {formatNumber(tweet.retweets || 0)}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageCircle className="w-3.5 h-3.5" />
                        {formatNumber(tweet.replies || 0)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye className="w-3.5 h-3.5" />
                        {formatNumber(tweet.views || 0)}
                      </span>
                      {tweet.createdAt && (
                        <span className="ml-auto">
                          {formatDistanceToNow(new Date(tweet.createdAt), {
                            addSuffix: true,
                          })}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500">No tweets cached yet.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
