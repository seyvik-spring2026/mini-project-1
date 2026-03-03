import type { Tweet, Candidate } from "../db/schema";

interface RedFlagResult {
  score: number;
  signals: string[];
}

const RED_FLAG_PATTERNS = [
  { pattern: /\b(DM me|link in bio|free course|get rich|passive income|10x your)\b/i, weight: 15, label: "Engagement bait" },
  { pattern: /\b(grind|hustle culture|rise and grind|no days off|sigma)\b/i, weight: 10, label: "Hustle porn" },
  { pattern: /\b(thread|🧵|1\/\d+)\b/i, weight: 5, label: "Thread farming" },
  { pattern: /\b(motivational|inspirational|believe in yourself|never give up|you got this)\b/i, weight: 8, label: "Motivational fluff" },
  { pattern: /\b(follow me|retweet this|like if you|tag someone)\b/i, weight: 12, label: "Follower farming" },
  { pattern: /\b(crypto|NFT|web3|token|airdrop|mint)\b/i, weight: 8, label: "Crypto/NFT focus" },
  { pattern: /\b(affiliate|commission|referral link|use my code)\b/i, weight: 10, label: "Affiliate marketing" },
];

export function scoreRedFlags(candidate: Candidate, tweets: Tweet[]): RedFlagResult {
  const signals: string[] = [];
  let rawScore = 0;

  if (tweets.length === 0) return { score: 0, signals: [] };

  const allText = tweets.map((t) => t.text).join(" ");

  for (const { pattern, weight, label } of RED_FLAG_PATTERNS) {
    const matches = allText.match(new RegExp(pattern, "gi"));
    if (matches && matches.length > 0) {
      const count = Math.min(matches.length, 5);
      rawScore += weight * (1 + (count - 1) * 0.4);
      signals.push(`${label} (${count}x)`);
    }
  }

  // No product evidence — if they talk about AI but never mention shipping
  const hasProductEvidence = /\b(built|shipped|launched|released|demo|prototype|MVP|users|customers)\b/i.test(allText);
  const talksAboutAI = /\b(AI|ML|LLM|GPT|machine learning)\b/i.test(allText);
  if (talksAboutAI && !hasProductEvidence) {
    rawScore += 15;
    signals.push("Talks AI but no product evidence");
  }

  // Retweet heavy — mostly retweets, not original content
  const retweetRatio = tweets.filter((t) => t.isRetweet).length / tweets.length;
  if (retweetRatio > 0.7) {
    rawScore += 10;
    signals.push(`Mostly retweets (${Math.round(retweetRatio * 100)}%)`);
  }

  // Very low engagement despite many tweets
  const avgLikes = tweets.reduce((s, t) => s + (t.likes || 0), 0) / tweets.length;
  const followers = candidate.followerCount || 1;
  if (followers > 1000 && avgLikes < 2) {
    rawScore += 10;
    signals.push("Very low engagement for audience size");
  }

  const score = Math.min(100, Math.round(rawScore));
  return { score, signals };
}
