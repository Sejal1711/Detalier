import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { matches, notes, profiles } from "@/lib/schema";
import { eq, desc, isNotNull } from "drizzle-orm";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Recent sent matches
  const recentMatches = await db
    .select()
    .from(matches)
    .where(isNotNull(matches.sentAt))
    .orderBy(desc(matches.sentAt))
    .limit(6);

  // Recent notes
  const recentNotes = await db
    .select()
    .from(notes)
    .orderBy(desc(notes.createdAt))
    .limit(6);

  // Enrich matches with profile names
  const enrichedMatches = await Promise.all(
    recentMatches.map(async (m) => {
      const [client] = await db.select().from(profiles).where(eq(profiles.id, m.customerId)).limit(1);
      const [candidate] = await db.select().from(profiles).where(eq(profiles.id, m.poolProfileId)).limit(1);
      return {
        type: "match_sent" as const,
        id: `match-${m.id}`,
        text: `Match sent — ${client?.firstName ?? "?"} × ${candidate?.firstName ?? "?"}`,
        subtext: m.aiScore ?? "Match",
        time: m.sentAt,
        clientId: m.customerId,
      };
    })
  );

  const enrichedNotes = await Promise.all(
    recentNotes.map(async (n) => {
      const [client] = await db.select().from(profiles).where(eq(profiles.id, n.customerId)).limit(1);
      return {
        type: "note_added" as const,
        id: `note-${n.id}`,
        text: `Note added for ${client?.firstName ?? "?"} ${client?.lastName ?? ""}`,
        subtext: n.content.slice(0, 60) + (n.content.length > 60 ? "…" : ""),
        time: n.createdAt,
        clientId: n.customerId,
      };
    })
  );

  const activity = [...enrichedMatches, ...enrichedNotes]
    .sort((a, b) => new Date(b.time ?? 0).getTime() - new Date(a.time ?? 0).getTime())
    .slice(0, 8);

  return NextResponse.json(activity);
}
