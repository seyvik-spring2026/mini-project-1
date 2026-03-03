import type { Candidate, Tweet, ScoringWeights } from "../db/schema";
import { scoreBuilderSignals } from "./builder-signals";
import { scoreAuthenticitySignals } from "./authenticity-signals";
import { scoreGrowthSignals } from "./growth-signals";
import { scoreRedFlags } from "./red-flags";

export interface ScoreBreakdown {
  overall: number;
  builder: { score: number; signals: string[] };
  authenticity: { score: number; signals: string[] };
  growth: {
    score: number;
    signals: string[];
    engagementGrowthRatio: number | null;
    engagementTrend: "rising" | "stable" | "declining" | null;
    engagementDataPoints: number;
  };
  redFlags: { score: number; signals: string[] };
}

const DEFAULT_WEIGHTS = {
  builderWeight: 0.4,
  authenticityWeight: 0.3,
  growthWeight: 0.2,
  redFlagWeight: 0.1,
};

export function scoreCandidate(
  candidate: Candidate,
  tweets: Tweet[],
  weights?: Partial<ScoringWeights>
): ScoreBreakdown {
  const bw = weights?.builderWeight ?? DEFAULT_WEIGHTS.builderWeight;
  const aw = weights?.authenticityWeight ?? DEFAULT_WEIGHTS.authenticityWeight;
  const gw = weights?.growthWeight ?? DEFAULT_WEIGHTS.growthWeight;
  const rw = weights?.redFlagWeight ?? DEFAULT_WEIGHTS.redFlagWeight;

  const builder = scoreBuilderSignals(candidate, tweets);
  const authenticity = scoreAuthenticitySignals(candidate, tweets);
  const growth = scoreGrowthSignals(candidate, tweets);
  const redFlags = scoreRedFlags(candidate, tweets);

  // Weighted combination, red flags subtract
  const overall = Math.max(
    0,
    Math.min(
      100,
      Math.round(
        builder.score * bw +
          authenticity.score * aw +
          growth.score * gw -
          redFlags.score * rw
      )
    )
  );

  return {
    overall,
    builder,
    authenticity,
    growth,
    redFlags,
  };
}
