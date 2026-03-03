import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { candidates } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function PATCH(req: NextRequest) {
  const { candidateId, stage } = await req.json();

  const validStages = [
    "discovered",
    "researching",
    "outreach_ready",
    "contacted",
    "in_conversation",
  ];

  if (!validStages.includes(stage)) {
    return NextResponse.json({ error: "Invalid stage" }, { status: 400 });
  }

  db.update(candidates)
    .set({ pipelineStage: stage, updatedAt: new Date().toISOString() })
    .where(eq(candidates.id, Number(candidateId)))
    .run();

  const updated = db
    .select()
    .from(candidates)
    .where(eq(candidates.id, Number(candidateId)))
    .get();

  return NextResponse.json(updated);
}
