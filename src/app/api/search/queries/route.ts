import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { searchQueries } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  const queries = db.select().from(searchQueries).all();
  return NextResponse.json(queries);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const query = db
    .insert(searchQueries)
    .values({
      name: body.name,
      query: body.query,
      queryType: body.queryType || "Latest",
      isActive: body.isActive !== false,
    })
    .returning()
    .get();
  return NextResponse.json(query);
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json();
  db.delete(searchQueries).where(eq(searchQueries.id, id)).run();
  return NextResponse.json({ success: true });
}
