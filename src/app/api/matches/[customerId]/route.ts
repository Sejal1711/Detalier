import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { profiles, matches } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { scoreMatches, getAiScoreLabel } from "@/lib/matching";
import { scoreMatchesBatch } from "@/lib/ai";

// How many top candidates to surface + AI-score per client.
const MATCH_COUNT = 10;

/** Enrich raw match rows with their pool-profile data for the frontend. */
async function enrich(rows: (typeof matches.$inferSelect)[]) {
  const out = await Promise.all(
    rows.map(async (m) => {
      const [profile] = await db
        .select()
        .from(profiles)
        .where(eq(profiles.id, m.poolProfileId))
        .limit(1);
      return { ...m, profile };
    })
  );
  return out.filter((m) => m.profile);
}

// ---------------------------------------------------------------------------
// GET — return ONLY cached matches. Never computes, never calls AI.
// Visiting a client profile any number of times costs zero tokens.
// ---------------------------------------------------------------------------
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ customerId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { customerId } = await params;
  const cid = parseInt(customerId);

  const existing = await db.select().from(matches).where(eq(matches.customerId, cid));
  return NextResponse.json(await enrich(existing));
}

// ---------------------------------------------------------------------------
// POST — generate matches (the only path that spends AI tokens).
//   • Default: if matches already exist, returns them untouched (idempotent).
//   • { regenerate: true }: deletes existing matches and recomputes fresh.
// Runs the deterministic algorithm over the whole pool, then AI-scores the
// top MATCH_COUNT candidates in a SINGLE batched call.
// ---------------------------------------------------------------------------
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ customerId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { customerId } = await params;
  const cid = parseInt(customerId);
  const body = await req.json().catch(() => ({}));
  const regenerate = body?.regenerate === true;

  const [client] = await db.select().from(profiles).where(eq(profiles.id, cid)).limit(1);
  if (!client) return NextResponse.json({ error: "Customer not found" }, { status: 404 });

  if (regenerate) {
    // Fresh start — drop the cached matches so we recompute.
    await db.delete(matches).where(eq(matches.customerId, cid));
  } else {
    // Idempotent: don't burn tokens if matches are already cached.
    const existing = await db.select().from(matches).where(eq(matches.customerId, cid));
    if (existing.length > 0) return NextResponse.json(await enrich(existing));
  }

  // 1. Deterministic scoring across the entire opposite-gender pool (free).
  const pool = await db.select().from(profiles).where(eq(profiles.isPoolProfile, true));
  const top = scoreMatches(client, pool).slice(0, MATCH_COUNT);

  if (top.length === 0) return NextResponse.json([]);

  // 2. AI-score the shortlist in ONE batched call.
  const aiResults = await scoreMatchesBatch(
    client,
    top.map((t) => ({ profile: t.profile, algoScore: t.score }))
  );

  // 3. Persist and return enriched.
  const inserts = top.map((t, i) => ({
    customerId: cid,
    poolProfileId: t.profile.id,
    algorithmScore: t.score,
    aiScore: aiResults[i]?.aiScore ?? getAiScoreLabel(t.score),
    aiExplanation: aiResults[i]?.explanation ?? "Compatibility based on profile criteria.",
    status: "suggested" as const,
  }));

  const saved = await db.insert(matches).values(inserts).returning();
  return NextResponse.json(saved.map((m, i) => ({ ...m, profile: top[i].profile })));
}
