import type { Tweet, Candidate } from "../db/schema";

interface BuilderSignalResult {
  score: number;
  signals: string[];
}

const BUILDER_PATTERNS = [
  { pattern: /\b(i built|i made|i created|just built|just made)\b/i, weight: 15, label: "Claims building" },
  { pattern: /\b(shipped|launched|released|deployed|published)\b/i, weight: 12, label: "Shipped product" },
  { pattern: /\b(demo|prototype|MVP|beta|alpha)\b/i, weight: 10, label: "Product stage mention" },
  { pattern: /\b(open.?source|github|repo|pull request|PR merged)\b/i, weight: 10, label: "Open source activity" },
  { pattern: /\b(API|SDK|framework|library|package|npm|pip|crate)\b/i, weight: 8, label: "Technical tooling" },
  { pattern: /\b(fine.?tun|train|model|inference|embedding|vector|RAG|LLM|GPT|transformer|neural)\b/i, weight: 10, label: "AI/ML technical" },
  { pattern: /\b(startup|founder|co-?founder|bootstrapped|YC|venture)\b/i, weight: 8, label: "Founder identity" },
  { pattern: /\b(users|customers|revenue|ARR|MRR|paying|growth)\b/i, weight: 8, label: "Traction signals" },
  { pattern: /\b(iteration|v2|update|improved|refactored|redesigned)\b/i, weight: 7, label: "Iteration evidence" },
  { pattern: /\b(learned|lesson|mistake|failed|pivot)\b/i, weight: 5, label: "Learning mindset" },
];

export function scoreBuilderSignals(candidate: Candidate, tweets: Tweet[]): BuilderSignalResult {
  const signals: string[] = [];
  let rawScore = 0;

  const allText = tweets.map((t) => t.text).join(" ");

  for (const { pattern, weight, label } of BUILDER_PATTERNS) {
    const matches = allText.match(new RegExp(pattern, "gi"));
    if (matches && matches.length > 0) {
      const count = Math.min(matches.length, 5);
      rawScore += weight * (1 + (count - 1) * 0.3);
      signals.push(`${label} (${count}x)`);
    }
  }

  // Bio bonus
  if (candidate.bio) {
    const bio = candidate.bio;
    if (/\b(founder|builder|maker|engineer|developer|CTO|CEO)\b/i.test(bio)) {
      rawScore += 10;
      signals.push("Builder identity in bio");
    }
    if (/\b(AI|ML|LLM|GPT|machine learning|deep learning)\b/i.test(bio)) {
      rawScore += 5;
      signals.push("AI focus in bio");
    }
  }

  const score = Math.min(100, Math.round(rawScore));
  return { score, signals };
}
