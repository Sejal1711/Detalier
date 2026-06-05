"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Heart } from "lucide-react";
import type { Profile, Match } from "@/lib/schema";
import { getAge } from "@/lib/utils";
import { C, avatarStyle } from "@/lib/theme";
import AppShell from "@/components/AppShell";

type MadeMatch = Match & { client: Profile; candidate: Profile };

const AI_SCORE_STYLE: Record<string, { bg: string; text: string }> = {
  "High Potential": { bg: "#E8F5E0", text: "#2D5910" },
  "Good Match":     { bg: "#FEF3C7", text: "#92400E" },
  "Moderate":       { bg: "#F1F0EF", text: "#5A5550" },
  "Low":            { bg: "#F1F0EF", text: "#5A5550" },
};

function MiniAvatar({ profile }: { profile: Profile }) {
  const av = avatarStyle(profile.gender);
  return (
    <div style={{ width: 38, height: 38, borderRadius: "50%", background: av.bg, color: av.text, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 500, flexShrink: 0 }}>
      {profile.firstName[0]}{profile.lastName[0]}
    </div>
  );
}

export default function MatchesMadePage() {
  const { status } = useSession();
  const router = useRouter();
  const [made, setMade] = useState<MadeMatch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/");
  }, [status, router]);

  // Every introduction that's actually been sent, across all of this
  // matchmaker's clients — the running record of matches made.
  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/matches-made")
      .then((r) => r.json())
      .then((data) => {
        setMade(Array.isArray(data) ? data : []);
        setLoading(false);
      });
  }, [status]);

  return (
    <AppShell>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 20, fontWeight: 500, color: C.textPrimary, margin: "0 0 3px" }}>Matches Made</h1>
        <p style={{ fontSize: 12, color: C.textSecondary, margin: 0 }}>Introductions you&apos;ve sent across all your clients.</p>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "80px 0" }}>
          <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.4, ease: "linear" }} style={{ display: "inline-block", marginBottom: 12 }}>
            <Heart style={{ width: 24, height: 24, color: C.primary }} />
          </motion.div>
          <p style={{ fontSize: 13, color: C.textSecondary, margin: 0 }}>Loading matches…</p>
        </div>
      ) : made.length === 0 ? (
        <div style={{ textAlign: "center", padding: "80px 0" }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: C.blushBg, display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
            <Heart style={{ width: 22, height: 22, color: C.primary }} />
          </div>
          <p style={{ fontSize: 15, fontWeight: 500, color: C.textPrimary, marginBottom: 6 }}>No matches sent yet</p>
          <p style={{ fontSize: 13, color: C.textSecondary, maxWidth: 280, margin: "0 auto", lineHeight: 1.7 }}>
            When you introduce a client to a match, it&apos;ll appear here — a record of every connection you&apos;ve made.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10, maxWidth: 720 }}>
          {made.map((m, i) => {
            const scoreStyle = AI_SCORE_STYLE[m.aiScore ?? "Moderate"] ?? AI_SCORE_STYLE["Moderate"];
            return (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                style={{ background: C.surface, borderRadius: 12, border: `0.5px solid ${C.border}`, padding: "16px 20px" }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  {/* Client */}
                  <Link href={`/customer/${m.client.id}`} style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0 }}>
                    <MiniAvatar profile={m.client} />
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 500, color: C.textPrimary, margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {m.client.firstName} {m.client.lastName}
                      </p>
                      <p style={{ fontSize: 11, color: C.textSecondary, margin: "2px 0 0" }}>
                        {getAge(m.client.dateOfBirth)} · {m.client.city}
                      </p>
                    </div>
                  </Link>

                  {/* Heart connector */}
                  <Heart style={{ width: 16, height: 16, color: C.primary, fill: C.blush, flexShrink: 0 }} />

                  {/* Candidate */}
                  <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0, justifyContent: "flex-end", textAlign: "right" }}>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 500, color: C.textPrimary, margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {m.candidate.firstName} {m.candidate.lastName}
                      </p>
                      <p style={{ fontSize: 11, color: C.textSecondary, margin: "2px 0 0" }}>
                        {getAge(m.candidate.dateOfBirth)} · {m.candidate.city}
                      </p>
                    </div>
                    <MiniAvatar profile={m.candidate} />
                  </div>

                  {/* Score + date */}
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 5, flexShrink: 0, minWidth: 110, borderLeft: `0.5px solid ${C.divider}`, paddingLeft: 14 }}>
                    <span style={{ fontSize: 10, fontWeight: 500, background: scoreStyle.bg, color: scoreStyle.text, padding: "2px 8px", borderRadius: 20 }}>
                      {m.aiScore ?? "Match"}
                    </span>
                    <span style={{ fontSize: 11, color: C.textSecondary }}>
                      {m.sentAt ? new Date(m.sentAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : ""}
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}
