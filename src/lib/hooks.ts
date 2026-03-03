import useSWR from "swr";
import type { Candidate, SearchQuery, ScoringWeights } from "./db/schema";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function useCandidates(params?: Record<string, string>) {
  const searchParams = new URLSearchParams(params);
  return useSWR<Candidate[]>(`/api/candidates?${searchParams}`, fetcher);
}

export function useCandidate(id: string) {
  return useSWR<Candidate & { tweets: import("./db/schema").Tweet[] }>(
    `/api/candidates/${id}`,
    fetcher
  );
}

export function useSearchQueries() {
  return useSWR<SearchQuery[]>("/api/search/queries", fetcher);
}

export function useScoringWeights() {
  return useSWR<ScoringWeights>("/api/scoring/weights", fetcher);
}
