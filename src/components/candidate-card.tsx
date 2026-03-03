"use client";

import Link from "next/link";
import { ScoreBadge } from "@/components/ui/score-badge";
import { formatNumber, stageBgColor, stageLabel, cn } from "@/lib/utils";
import { Users, MessageCircle, Heart, TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { Candidate } from "@/lib/db/schema";

export function CandidateCard({ candidate }: { candidate: Candidate }) {
  return (
    <Link href={`/candidates/${candidate.id}`}>
      <div className="group bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-indigo-500/50 hover:bg-slate-900/80 transition-all cursor-pointer">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <img
              src={candidate.avatarUrl || `https://api.dicebear.com/7.x/notionists/svg?seed=${candidate.username}`}
              alt={candidate.displayName}
              className="w-11 h-11 rounded-full bg-slate-700"
            />
            <div>
              <h3 className="font-semibold text-white group-hover:text-indigo-400 transition-colors">
                {candidate.displayName}
              </h3>
              <p className="text-sm text-slate-500">@{candidate.username}</p>
            </div>
          </div>
          <ScoreBadge score={candidate.overallScore || 0} />
        </div>

        {/* Bio */}
        {candidate.bio && (
          <p className="text-sm text-slate-400 mb-3 line-clamp-2">
            {candidate.bio}
          </p>
        )}

        {/* Stats */}
        <div className="flex items-center gap-4 text-xs text-slate-500 mb-3">
          <span className="flex items-center gap-1">
            <Users className="w-3.5 h-3.5" />
            {formatNumber(candidate.followerCount || 0)} followers
          </span>
          <span className="flex items-center gap-1">
            <MessageCircle className="w-3.5 h-3.5" />
            {formatNumber(candidate.tweetCount || 0)} tweets
          </span>
        </div>

        {/* Growth Indicator */}
        {candidate.engagementTrend && (
          <div className="flex items-center gap-2 mb-3">
            {candidate.engagementTrend === "rising" ? (
              <span className="flex items-center gap-1 text-xs text-emerald-400">
                <TrendingUp className="w-3.5 h-3.5" />
                Growing
                {candidate.engagementGrowthRatio != null && (
                  <span className="text-emerald-500/70">
                    ({candidate.engagementGrowthRatio.toFixed(1)}x)
                  </span>
                )}
              </span>
            ) : candidate.engagementTrend === "declining" ? (
              <span className="flex items-center gap-1 text-xs text-red-400">
                <TrendingDown className="w-3.5 h-3.5" />
                Declining
              </span>
            ) : (
              <span className="flex items-center gap-1 text-xs text-slate-400">
                <Minus className="w-3.5 h-3.5" />
                Stable
              </span>
            )}
          </div>
        )}

        {/* Stage badge */}
        <div className="flex items-center justify-between">
          <span
            className={cn(
              "text-xs px-2 py-0.5 rounded-full border",
              stageBgColor(candidate.pipelineStage || "discovered")
            )}
          >
            {stageLabel(candidate.pipelineStage || "discovered")}
          </span>
          <div className="flex items-center gap-1 text-xs text-slate-600">
            <Heart className="w-3 h-3" />
            <span>
              Builder: {Math.round(candidate.builderScore || 0)}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
