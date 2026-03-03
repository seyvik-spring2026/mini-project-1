import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { scoringWeights } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  const weights = db.select().from(scoringWeights).get();
  return NextResponse.json(weights);
}

export async function PUT(req: NextRequest) {
  const body = await req.json();

  // Normalize weights to sum to 1
  const total =
    body.builderWeight + body.authenticityWeight + body.growthWeight + body.redFlagWeight;
  const normalized = {
    builderWeight: body.builderWeight / total,
    authenticityWeight: body.authenticityWeight / total,
    growthWeight: body.growthWeight / total,
    redFlagWeight: body.redFlagWeight / total,
    updatedAt: new Date().toISOString(),
  };

  const existing = db.select().from(scoringWeights).get();
  if (existing) {
    db.update(scoringWeights)
      .set(normalized)
      .where(eq(scoringWeights.id, existing.id))
      .run();
  } else {
    db.insert(scoringWeights).values(normalized).run();
  }

  const updated = db.select().from(scoringWeights).get();
  return NextResponse.json(updated);
}
