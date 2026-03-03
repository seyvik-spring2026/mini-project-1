import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { candidates, tweets } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const candidate = db
    .select()
    .from(candidates)
    .where(eq(candidates.id, Number(id)))
    .get();

  if (!candidate) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const candidateTweets = db
    .select()
    .from(tweets)
    .where(eq(tweets.candidateId, Number(id)))
    .all();

  return NextResponse.json({ ...candidate, tweets: candidateTweets });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();

  db.update(candidates)
    .set({ ...body, updatedAt: new Date().toISOString() })
    .where(eq(candidates.id, Number(id)))
    .run();

  const updated = db
    .select()
    .from(candidates)
    .where(eq(candidates.id, Number(id)))
    .get();

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  db.delete(candidates).where(eq(candidates.id, Number(id))).run();
  return NextResponse.json({ success: true });
}
