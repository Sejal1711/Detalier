import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { profiles } from "@/lib/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // All matchmakers see all clients (internal tool — shared pool)
  const customers = await db
    .select()
    .from(profiles)
    .where(eq(profiles.isPoolProfile, false));

  return NextResponse.json(customers);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const [created] = await db
    .insert(profiles)
    .values({ ...body, isPoolProfile: false })
    .returning();

  return NextResponse.json(created, { status: 201 });
}
