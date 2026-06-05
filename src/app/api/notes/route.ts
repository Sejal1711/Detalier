import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { notes } from "@/lib/schema";
import { eq } from "drizzle-orm";

// GET /api/notes?customerId=123 — all notes logged against a single client.
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const customerId = searchParams.get("customerId");
  if (!customerId) return NextResponse.json({ error: "customerId required" }, { status: 400 });

  const customerNotes = await db
    .select()
    .from(notes)
    .where(eq(notes.customerId, parseInt(customerId)));

  return NextResponse.json(customerNotes);
}

// POST /api/notes — add a note. We stamp it with the signed-in matchmaker's id
// so we always know who recorded it.
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const matchmakerId = parseInt((session.user as { id: string }).id);
  const { customerId, content } = await req.json();

  const [note] = await db
    .insert(notes)
    .values({ customerId, matchmakerId, content })
    .returning();

  return NextResponse.json(note, { status: 201 });
}
