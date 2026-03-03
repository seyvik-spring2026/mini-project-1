import type {
  TweetSearchResponse,
  UserInfoResponse,
  UserTweetsResponse,
} from "./types";

const BASE_URL = "https://api.twitterapi.io";

function getApiKey(): string {
  const key = process.env.TWITTER_API_KEY;
  if (!key) throw new Error("TWITTER_API_KEY is not set");
  return key;
}

async function apiFetch<T>(path: string, params: Record<string, string> = {}): Promise<T> {
  const url = new URL(path, BASE_URL);
  Object.entries(params).forEach(([k, v]) => {
    if (v) url.searchParams.set(k, v);
  });

  const res = await fetch(url.toString(), {
    headers: { "x-api-key": getApiKey() },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Twitter API error ${res.status}: ${text}`);
  }

  return res.json();
}

export async function searchTweets(
  query: string,
  queryType: "Latest" | "Top" = "Latest",
  cursor?: string,
  sinceDaysAgo: number = 7
): Promise<TweetSearchResponse> {
  let enrichedQuery = query;
  if (sinceDaysAgo > 0) {
    const sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - sinceDaysAgo);
    const yyyy = sinceDate.getFullYear();
    const mm = String(sinceDate.getMonth() + 1).padStart(2, "0");
    const dd = String(sinceDate.getDate()).padStart(2, "0");
    enrichedQuery = `${query} since:${yyyy}-${mm}-${dd}`;
  }

  return apiFetch<TweetSearchResponse>("/twitter/tweet/advanced_search", {
    query: enrichedQuery,
    queryType,
    ...(cursor ? { cursor } : {}),
  });
}

export async function getUserInfo(userName: string): Promise<UserInfoResponse> {
  return apiFetch<UserInfoResponse>("/twitter/user/info", { userName });
}

export async function getUserTweets(
  userName: string,
  cursor?: string
): Promise<UserTweetsResponse> {
  return apiFetch<UserTweetsResponse>("/twitter/user/last_tweets", {
    userName,
    ...(cursor ? { cursor } : {}),
  });
}
