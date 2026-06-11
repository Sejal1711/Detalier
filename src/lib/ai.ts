import Anthropic from "@anthropic-ai/sdk";
import type { Profile } from "./schema";
import { getAiScoreLabel } from "./matching";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

function profileSummaryForAI(p: Profile) {
  return {
    name: `${p.firstName} ${p.lastName}`,
    age: (() => {
      const birth = new Date(p.dateOfBirth);
      const today = new Date();
      return today.getFullYear() - birth.getFullYear();
    })(),
    city: p.city,
    education: p.degree ?? "Not specified",
    college: p.undergradCollege ?? "Not specified",
    company: p.currentCompany ?? "Not specified",
    designation: p.designation ?? "Not specified",
    income: p.income ? `${p.income} LPA` : "Not specified",
    religion: p.religion ?? "Not specified",
    caste: p.caste ?? "Not specified",
    diet: p.diet ?? "Not specified",
    maritalStatus: p.maritalStatus,
    wantKids: p.wantKids,
    openToRelocate: p.openToRelocate,
    familyType: p.familyType,
    languages: p.languagesKnown?.join(", ") ?? "Not specified",
    height: p.height ? `${p.height} cm` : "Not specified",
  };
}

/**
 * Score MANY candidates against a client in a SINGLE AI call.
 *
 * This replaces the old one-call-per-candidate approach. Scoring the top 10
 * candidates used to mean 10 separate API round-trips (~256 tokens each);
 * batching them into one request cuts that to a single call and is the main
 * token-cost saving. Results are returned in the SAME order as `candidates`.
 *
 * If the model errors or returns malformed output, each candidate falls back
 * to its deterministic algorithm label so the UI always has a sensible value.
 */
export async function scoreMatchesBatch(
  client: Profile,
  candidates: { profile: Profile; algoScore: number }[]
): Promise<{ aiScore: string; explanation: string }[]> {
  // Per-candidate fallback derived from the deterministic algorithm score.
  const fallback = (i: number) => ({
    aiScore: getAiScoreLabel(candidates[i].algoScore),
    explanation: "Compatibility assessed based on profile alignment.",
  });

  if (candidates.length === 0) return [];

  const clientData = profileSummaryForAI(client);
  const candidateList = candidates.map((c, i) => ({
    index: i,
    algorithmScore: c.algoScore,
    suggestedLabel: getAiScoreLabel(c.algoScore),
    ...profileSummaryForAI(c.profile),
  }));

  const prompt = `You are an expert Indian matrimonial matchmaker. Evaluate the compatibility between the CLIENT and EACH of the candidates below.

CLIENT PROFILE:
${JSON.stringify(clientData, null, 2)}

CANDIDATES (${candidates.length} total, each pre-scored by an algorithm):
${JSON.stringify(candidateList, null, 2)}

For EVERY candidate, provide:
1. "index": the candidate's index (integer, matching the input)
2. "score": exactly one of "High Potential", "Good Match", "Moderate", or "Low"
3. "explanation": a 2-sentence assessment highlighting the strongest compatibility point and any notable concern

Respond with ONLY a JSON array — one object per candidate, no prose, no markdown fences:
[{"index": 0, "score": "<label>", "explanation": "<2 sentences>"}, ...]`;

  let message;
  try {
    message = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 2048,
      messages: [{ role: "user", content: prompt }],
    });
  } catch {
    return candidates.map((_, i) => fallback(i));
  }

  try {
    const text = (message.content[0] as { type: string; text: string }).text;
    // Be tolerant of stray prose / markdown fences around the array.
    const start = text.indexOf("[");
    const end = text.lastIndexOf("]");
    const parsed: { index: number; score: string; explanation: string }[] =
      JSON.parse(text.slice(start, end + 1));

    return candidates.map((_, i) => {
      const found = parsed.find((p) => p.index === i);
      if (found?.score && found?.explanation) {
        return { aiScore: found.score, explanation: found.explanation };
      }
      return fallback(i);
    });
  } catch {
    return candidates.map((_, i) => fallback(i));
  }
}

export async function generateIntroEmail(
  client: Profile,
  candidate: Profile
): Promise<string> {
  const clientData = profileSummaryForAI(client);
  const candidateData = profileSummaryForAI(candidate);

  const prompt = `You are a warm, professional Indian matrimonial matchmaker writing a personalized introduction email to share a match suggestion with a client.

CLIENT (the person receiving this email): ${JSON.stringify(clientData)}
SUGGESTED MATCH: ${JSON.stringify(candidateData)}

Write a warm, personalized 3-sentence introduction email.
- Address the client by first name
- Highlight 2-3 specific compatibility points
- End with an encouraging note about taking the next step
- Keep it professional yet warm, like a trusted matchmaker would write
- Do NOT include a subject line, just the email body`;

  const message = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 300,
    messages: [{ role: "user", content: prompt }],
  });

  return (message.content[0] as { type: string; text: string }).text;
}
