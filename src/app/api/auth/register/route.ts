import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { matchmakers } from "@/lib/schema";
import { eq } from "drizzle-orm";

// Registers a new matchmaker account. Validates input, guards against duplicate
// emails, then stores a bcrypt hash (never the raw password).
export async function POST(req: NextRequest) {
  const { name, email, password } = await req.json();

  if (!name || !email || !password) {
    return NextResponse.json({ error: "Name, email and password are required." }, { status: 400 });
  }

  if (password.length < 6) {
    return NextResponse.json({ error: "Password must be at least 6 characters." }, { status: 400 });
  }

  // Email is unique — bail early with a friendly message if it's taken.
  const [existing] = await db
    .select()
    .from(matchmakers)
    .where(eq(matchmakers.email, email))
    .limit(1);

  if (existing) {
    return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const [created] = await db
    .insert(matchmakers)
    .values({ name, email, passwordHash })
    .returning();

  return NextResponse.json({ id: created.id, name: created.name, email: created.email }, { status: 201 });
}
