import type { Tweet, Candidate } from "../db/schema";

interface AuthenticitySignalResult {
  score: number;
  signals: string[];
}

export function scoreAuthenticitySignals(candidate: Candidate, tweets: Tweet[]): AuthenticitySignalResult {
  const signals: string[] = [];
  let rawScore = 0;

  if (tweets.length === 0) return { score: 0, signals: ["No tweets to analyze"] };

  // Original content ratio (not retweets/replies)
  const originalTweets = tweets.filter((t) => !t.isRetweet && !t.isReply);
  const originalRatio = originalTweets.length / tweets.length;
  if (originalRatio > 0.6) {
    rawScore += 25;
    signals.push(`High original content (${Math.round(originalRatio * 100)}%)`);
  } else if (originalRatio > 0.3) {
    rawScore += 15;
    signals.push(`Moderate original content (${Math.round(originalRatio * 100)}%)`);
  } else {
    rawScore += 5;
    signals.push(`Low original content (${Math.round(originalRatio * 100)}%)`);
  }

  // Engagement quality — ratio of likes+replies to views
  const totalViews = tweets.reduce((sum, t) => sum + (t.views || 0), 0);
  const totalEngagement = tweets.reduce((sum, t) => sum + (t.likes || 0) + (t.replies || 0), 0);
  if (totalViews > 0) {
    const engagementRate = totalEngagement / totalViews;
    if (engagementRate > 0.03) {
      rawScore += 25;
      signals.push(`Strong engagement rate (${(engagementRate * 100).toFixed(1)}%)`);
    } else if (engagementRate > 0.01) {
      rawScore += 15;
      signals.push(`Good engagement rate (${(engagementRate * 100).toFixed(1)}%)`);
    } else {
      rawScore += 5;
      signals.push(`Low engagement rate (${(engagementRate * 100).toFixed(1)}%)`);
    }
  }

  // Follower-to-following ratio (healthy if > 1)
  const followers = candidate.followerCount || 0;
  const following = candidate.followingCount || 0;
  if (following > 0) {
    const ratio = followers / following;
    if (ratio > 2) {
      rawScore += 20;
      signals.push(`Strong follower ratio (${ratio.toFixed(1)}x)`);
    } else if (ratio > 0.8) {
      rawScore += 12;
      signals.push(`Healthy follower ratio (${ratio.toFixed(1)}x)`);
    } else {
      rawScore += 3;
      signals.push(`Low follower ratio (${ratio.toFixed(1)}x)`);
    }
  }

  // Account age — older is more trustworthy
  if (candidate.accountCreatedAt) {
    const accountAge = Date.now() - new Date(candidate.accountCreatedAt).getTime();
    const years = accountAge / (1000 * 60 * 60 * 24 * 365);
    if (years > 3) {
      rawScore += 20;
      signals.push(`Established account (${Math.round(years)}y)`);
    } else if (years > 1) {
      rawScore += 12;
      signals.push(`Maturing account (${Math.round(years)}y)`);
    } else {
      rawScore += 3;
      signals.push(`New account (${Math.round(years * 12)}mo)`);
    }
  }

  // Conversation participation — replies show engagement
  const replyTweets = tweets.filter((t) => t.isReply);
  if (replyTweets.length > 0 && originalTweets.length > 0) {
    rawScore += 10;
    signals.push("Active in conversations");
  }

  const score = Math.min(100, Math.round(rawScore));
  return { score, signals };
}
