import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { candidates, tweets, searchRuns, searchQueries } from "@/lib/db/schema";
import { searchTweets, getUserInfo, getUserTweets } from "@/lib/twitter/client";
import { scoreCandidate } from "@/lib/scoring/engine";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const queryId = body.queryId;

  // Get the query
  let queryText: string;
  let queryType: "Latest" | "Top" = "Latest";

  if (queryId) {
    const q = db.select().from(searchQueries).where(eq(searchQueries.id, queryId)).get();
    if (!q) return NextResponse.json({ error: "Query not found" }, { status: 404 });
    queryText = q.query;
    queryType = (q.queryType as "Latest" | "Top") || "Latest";
  } else {
    queryText = body.query || "";
    if (!queryText) return NextResponse.json({ error: "No query provided" }, { status: 400 });
  }

  // Create search run record
  const run = db
    .insert(searchRuns)
    .values({ queryId, queryText, status: "running" })
    .returning()
    .get();

  try {
    // Search tweets (automatically filtered to last 7 days)
    const searchResult = await searchTweets(queryText, queryType);
    let candidatesFound = 0;
    let newCandidates = 0;

    // Extract unique authors
    const authorMap = new Map<string, (typeof searchResult.tweets)[number][]>();
    for (const tweet of searchResult.tweets) {
      const username = tweet.author.userName;
      if (!authorMap.has(username)) {
        authorMap.set(username, []);
      }
      authorMap.get(username)!.push(tweet);
    }

    for (const [username, userTweets] of authorMap) {
      candidatesFound++;

      // Check if candidate already exists
      const existing = db
        .select()
        .from(candidates)
        .where(eq(candidates.username, username))
        .get();

      if (existing) continue;

      // Get user info
      let userInfo;
      try {
        const result = await getUserInfo(username);
        userInfo = result.data;
      } catch {
        // Use author info from tweet as fallback
        userInfo = userTweets[0].author;
      }

      // FOLLOWER FILTER: Hard-reject outside 500-10K range
      const followerCount = userInfo.followers || 0;
      if (followerCount < 500 || followerCount > 10000) {
        continue;
      }

      // Fetch additional tweets for growth analysis (~20 recent timeline tweets)
      let additionalTweets: (typeof searchResult.tweets)[number][] = [];
      try {
        const timelineResult = await getUserTweets(username);
        additionalTweets = timelineResult.tweets || [];
      } catch {
        // If timeline fetch fails, proceed with search tweets only
      }

      // Insert candidate
      const candidate = db
        .insert(candidates)
        .values({
          twitterId: userInfo.id,
          username: userInfo.userName,
          displayName: userInfo.name || userInfo.userName,
          bio: userInfo.description || "",
          avatarUrl: userInfo.profilePicture || "",
          followerCount: userInfo.followers || 0,
          followingCount: userInfo.following || 0,
          tweetCount: userInfo.statusesCount || 0,
          accountCreatedAt: userInfo.createdAt || null,
          pipelineStage: "discovered",
        })
        .returning()
        .get();

      // Deduplicate and combine search tweets + timeline tweets
      const allRawTweets = [...userTweets];
      const seenIds = new Set(userTweets.map((t) => t.id));
      for (const tweet of additionalTweets) {
        if (!seenIds.has(tweet.id)) {
          allRawTweets.push(tweet);
          seenIds.add(tweet.id);
        }
      }

      // Insert all tweets
      const insertedTweets = [];
      for (const tweet of allRawTweets) {
        const t = db
          .insert(tweets)
          .values({
            tweetId: tweet.id,
            candidateId: candidate.id,
            text: tweet.text,
            likes: tweet.likeCount || 0,
            retweets: tweet.retweetCount || 0,
            replies: tweet.replyCount || 0,
            views: tweet.viewCount || 0,
            isRetweet: !!tweet.retweeted_tweet,
            isReply: tweet.isReply || false,
            createdAt: tweet.createdAt || null,
          })
          .returning()
          .get();
        insertedTweets.push(t);
      }

      // Score candidate
      const scores = scoreCandidate(candidate, insertedTweets);

      db.update(candidates)
        .set({
          overallScore: scores.overall,
          builderScore: scores.builder.score,
          authenticityScore: scores.authenticity.score,
          growthScore: scores.growth.score,
          redFlagScore: scores.redFlags.score,
          engagementGrowthRatio: scores.growth.engagementGrowthRatio,
          engagementTrend: scores.growth.engagementTrend,
          engagementDataPoints: scores.growth.engagementDataPoints,
          lastScoredAt: new Date().toISOString(),
        })
        .where(eq(candidates.id, candidate.id))
        .run();

      newCandidates++;
    }

    // Update search run
    db.update(searchRuns)
      .set({
        candidatesFound,
        newCandidates,
        status: "completed",
        completedAt: new Date().toISOString(),
      })
      .where(eq(searchRuns.id, run.id))
      .run();

    return NextResponse.json({
      success: true,
      queryText,
      candidatesFound,
      newCandidates,
      skipped: candidatesFound - newCandidates,
      runId: run.id,
    });
  } catch (error) {
    db.update(searchRuns)
      .set({ status: "failed", completedAt: new Date().toISOString() })
      .where(eq(searchRuns.id, run.id))
      .run();

    console.error("Search run error:", error);
    return NextResponse.json(
      { error: "Search failed", details: String(error) },
      { status: 500 }
    );
  }
}
