import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { candidates } from "@/lib/db/schema";
import { desc, asc, gte, lte, sql } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const sort = searchParams.get("sort") || "score";
  const order = searchParams.get("order") || "desc";
  const minScore = searchParams.get("minScore");
  const maxScore = searchParams.get("maxScore");
  const minFollowers = searchParams.get("minFollowers");
  const maxFollowers = searchParams.get("maxFollowers");
  const stage = searchParams.get("stage");
  const search = searchParams.get("search");

  let query = db.select().from(candidates).$dynamic();

  const conditions: ReturnType<typeof gte>[] = [];

  if (minScore) conditions.push(gte(candidates.overallScore, Number(minScore)));
  if (maxScore) conditions.push(lte(candidates.overallScore, Number(maxScore)));
  if (minFollowers) conditions.push(gte(candidates.followerCount, Number(minFollowers)));
  if (maxFollowers) conditions.push(lte(candidates.followerCount, Number(maxFollowers)));
  if (stage) conditions.push(sql`${candidates.pipelineStage} = ${stage}`);
  if (search) {
    conditions.push(
      sql`(${candidates.username} LIKE ${'%' + search + '%'} OR ${candidates.displayName} LIKE ${'%' + search + '%'} OR ${candidates.bio} LIKE ${'%' + search + '%'})`
    );
  }

  const growthTrend = searchParams.get("growthTrend");
  if (growthTrend) conditions.push(sql`${candidates.engagementTrend} = ${growthTrend}`);

  if (conditions.length > 0) {
    query = query.where(sql`${sql.join(conditions, sql` AND `)}`);
  }

  const sortColumn =
    sort === "followers" ? candidates.followerCount :
    sort === "recent" ? candidates.accountCreatedAt :
    sort === "growth" ? candidates.growthScore :
    candidates.overallScore;

  const orderFn = order === "asc" ? asc : desc;
  query = query.orderBy(orderFn(sortColumn));

  const results = await query;
  return NextResponse.json(results);
}
