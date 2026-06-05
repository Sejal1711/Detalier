import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { matches, profiles } from "@/lib/schema";
import { eq, isNotNull, desc } from "drizzle-orm";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sent = await db
    .select()
    .from(matches)
    .where(isNotNull(matches.sentAt))
    .orderBy(desc(matches.sentAt));

  const enriched = await Promise.all(
    sent.map(async (m) => {
      const [client]    = await db.select().from(profiles).where(eq(profiles.id, m.customerId)).limit(1);
      const [candidate] = await db.select().from(profiles).where(eq(profiles.id, m.poolProfileId)).limit(1);
      return { ...m, client, candidate };
    })
  );

  return NextResponse.json(enriched.filter((m) => m.client && m.candidate));
}
