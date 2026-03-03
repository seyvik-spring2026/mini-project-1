import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { candidates, tweets, searchQueries } from "@/lib/db/schema";
import { SEED_PROFILES } from "@/lib/seed-data";
import { DEFAULT_QUERIES } from "@/lib/twitter/queries";

export async function POST() {
  try {
    // Clear existing data
    db.delete(tweets).run();
    db.delete(candidates).run();
    db.delete(searchQueries).run();

    let totalCandidates = 0;
    let totalTweets = 0;

    for (const profile of SEED_PROFILES) {
      const inserted = db
        .insert(candidates)
        .values(profile.candidate)
        .returning()
        .get();

      totalCandidates++;

      for (const tweet of profile.tweets) {
        db.insert(tweets)
          .values({ ...tweet, candidateId: inserted.id })
          .run();
        totalTweets++;
      }
    }

    // Seed default search queries
    for (const q of DEFAULT_QUERIES) {
      db.insert(searchQueries).values(q).run();
    }

    return NextResponse.json({
      success: true,
      candidates: totalCandidates,
      tweets: totalTweets,
      queries: DEFAULT_QUERIES.length,
    });
  } catch (error) {
    console.error("Seed error:", error);
    return NextResponse.json(
      { error: "Failed to seed database" },
      { status: 500 }
    );
  }
}
