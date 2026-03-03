import type { Tweet, Candidate } from "../db/schema";

export interface GrowthSignalResult {
  score: number;
  signals: string[];
  engagementGrowthRatio: number | null;
  engagementTrend: "rising" | "stable" | "declining" | null;
  engagementDataPoints: number;
}

export function scoreGrowthSignals(candidate: Candidate, tweets: Tweet[]): GrowthSignalResult {
  const signals: string[] = [];
  let rawScore = 0;
  let engagementGrowthRatio: number | null = null;
  let engagementTrend: "rising" | "stable" | "declining" | null = null;
  const engagementDataPoints = tweets.length;

  // Follower sweet spot: tightened to 500-10K (recruiteable range)
  const followers = candidate.followerCount || 0;
  if (followers >= 500 && followers <= 10000) {
    rawScore += 30;
    signals.push(`Ideal follower range (${followers.toLocaleString()})`);
  } else if (followers >= 100 && followers < 500) {
    rawScore += 15;
    signals.push(`Growing audience (${followers.toLocaleString()})`);
  } else if (followers > 10000 && followers <= 50000) {
    rawScore += 20;
    signals.push(`Large audience (${followers.toLocaleString()})`);
  } else if (followers > 50000) {
    rawScore += 10;
    signals.push(`Very large audience — may be hard to recruit (${followers.toLocaleString()})`);
  } else {
    rawScore += 5;
    signals.push(`Small audience (${followers.toLocaleString()})`);
  }

  // Engagement trajectory — compare recent vs older tweet total engagement
  if (tweets.length >= 4) {
    const sorted = [...tweets].sort(
      (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    );
    const half = Math.floor(sorted.length / 2);

    const totalEngagement = (t: Tweet) =>
      (t.likes || 0) + (t.retweets || 0) + (t.replies || 0);

    const recentAvg =
      sorted.slice(0, half).reduce((s, t) => s + totalEngagement(t), 0) / half;
    const olderAvg =
      sorted.slice(half).reduce((s, t) => s + totalEngagement(t), 0) /
      (sorted.length - half);

    if (olderAvg > 0) {
      const growth = recentAvg / olderAvg;
      engagementGrowthRatio = Math.round(growth * 100) / 100;

      if (growth > 1.5) {
        rawScore += 30;
        engagementTrend = "rising";
        signals.push(`Engagement trending up (${growth.toFixed(1)}x)`);
      } else if (growth > 0.8) {
        rawScore += 15;
        engagementTrend = "stable";
        signals.push("Stable engagement");
      } else {
        rawScore += 5;
        engagementTrend = "declining";
        signals.push("Engagement declining");
      }
    } else if (recentAvg > 0) {
      engagementGrowthRatio = null;
      engagementTrend = "rising";
      rawScore += 20;
      signals.push("Growing from zero engagement baseline");
    } else {
      rawScore += 10;
      signals.push("Limited historical data");
    }
  }

  // Recency — are they actively posting?
  if (tweets.length > 0) {
    const latestTweet = tweets.reduce((latest, t) => {
      const d = new Date(t.createdAt || 0).getTime();
      return d > latest ? d : latest;
    }, 0);
    const daysSinceLast = (Date.now() - latestTweet) / (1000 * 60 * 60 * 24);

    if (daysSinceLast < 3) {
      rawScore += 25;
      signals.push("Very active (posted in last 3 days)");
    } else if (daysSinceLast < 14) {
      rawScore += 15;
      signals.push("Active (posted in last 2 weeks)");
    } else if (daysSinceLast < 30) {
      rawScore += 8;
      signals.push("Somewhat active (posted in last month)");
    } else {
      rawScore += 2;
      signals.push("Inactive (no posts in 30+ days)");
    }
  }

  // Tweet volume
  const tweetCount = candidate.tweetCount || 0;
  if (tweetCount > 1000) {
    rawScore += 15;
    signals.push("Consistent poster");
  } else if (tweetCount > 200) {
    rawScore += 10;
    signals.push("Regular poster");
  }

  const score = Math.min(100, Math.round(rawScore));
  return { score, signals, engagementGrowthRatio, engagementTrend, engagementDataPoints };
}
