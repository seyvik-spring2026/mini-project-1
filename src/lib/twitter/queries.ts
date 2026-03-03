export const DEFAULT_QUERIES = [
  {
    name: "AI Builders - Shipped",
    query: '"I built" OR "just shipped" OR "launched my" (AI OR LLM OR GPT OR ML) -is:retweet lang:en',
    queryType: "Latest" as const,
  },
  {
    name: "AI Founders - Building",
    query: '"building a" OR "working on" (startup OR "side project" OR SaaS) (AI OR ML OR "machine learning") -is:retweet lang:en',
    queryType: "Latest" as const,
  },
  {
    name: "AI Open Source Contributors",
    query: '"open source" OR "open-source" OR github (AI OR LLM OR transformer OR "neural net") "released" OR "published" -is:retweet lang:en',
    queryType: "Latest" as const,
  },
  {
    name: "AI Demo Day / Show HN",
    query: '"demo" OR "Show HN" OR "launched on" (AI OR GPT OR LLM OR "machine learning") -is:retweet lang:en',
    queryType: "Latest" as const,
  },
  {
    name: "Technical AI Builders",
    query: '"fine-tuned" OR "trained a model" OR "RAG pipeline" OR "vector database" OR "inference" -is:retweet lang:en',
    queryType: "Latest" as const,
  },
];
