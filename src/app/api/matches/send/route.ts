import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { matches, profiles } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { generateIntroEmail } from "@/lib/ai";

// Marks a suggested match as "sent" and drafts the intro email for it.
// Look up both sides of the match, have the AI write a personalised intro,
// then stamp the match as sent. The email goes back to the UI for review.
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { matchId } = await req.json();

  const [match] = await db
    .select()
    .from(matches)
    .where(eq(matches.id, matchId))
    .limit(1);

  if (!match) return NextResponse.json({ error: "Match not found" }, { status: 404 });

  // Need both profiles to give the AI enough context for the intro.

  const [client] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.id, match.customerId))
    .limit(1);

  const [candidate] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.id, match.poolProfileId))
    .limit(1);

  if (!client || !candidate)
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });

  const introEmail = await generateIntroEmail(client, candidate);

  // Persist the sent state + the generated email so it shows on revisits.
  const [updated] = await db
    .update(matches)
    .set({ status: "sent", sentAt: new Date(), introEmail })
    .where(eq(matches.id, matchId))
    .returning();

  return NextResponse.json({ match: updated, introEmail, client, candidate });
}
