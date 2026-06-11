"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Heart, Phone, Mail, MapPin, Briefcase, GraduationCap,
  IndianRupee, Users, Globe, Home, Leaf, Baby, Wine, Cigarette,
  Sparkles, Send, CheckCircle2, Loader2, Plus, X, Copy, RefreshCw,
} from "lucide-react";
import type { Profile, Match, Note } from "@/lib/schema";
import { getAge, formatHeight, formatIncome } from "@/lib/utils";
import { C } from "@/lib/theme";

// Pill colours for the AI compatibility label on each match card.
// These stay as fixed pastels in both themes — they're self-contained badges.
const AI_SCORE_STYLE: Record<string, { bg: string; text: string }> = {
  "High Potential": { bg: "#E8F5E0", text: "#2D5910" },
  "Good Match":     { bg: "#FEF3C7", text: "#92400E" },
  "Moderate":       { bg: "#F1F0EF", text: "#5A5550" },
  "Low":            { bg: "#F1F0EF", text: "#5A5550" },
};

// Client journey status -> badge colour + display label.
// Note: DB calls it "paused" but matchmakers think of it as "Pending".
const STATUS_MAP: Record<string, { bg: string; text: string; label: string }> = {
  active:  { bg: "#E8F5E0", text: "#2D5910", label: "Active"   },
  paused:  { bg: "#FEF3C7", text: "#92400E", label: "Pending"  },
  matched: { bg: "#F4C0D1", text: "#7A2040", label: "Matched"  },
  on_hold: { bg: "#F1F0EF", text: "#5A5550", label: "On Hold"  },
};

// Initials-avatar tint. We don't store photos, so colour-code by gender instead.
function av(gender?: string | null) {
  return gender === "female"
    ? { bg: "#F9E0E8", text: "#A83060" }
    : { bg: "#E0EAFA", text: "#2C4F8A" };
}

// A match row plus the full pool profile it points at (joined server-side).
type EnrichedMatch = Match & { profile: Profile };

export default function CustomerDetailPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [customer, setCustomer] = useState<Profile | null>(null);
  const [matches, setMatches] = useState<EnrichedMatch[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNote, setNewNote] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const [viewProfile, setViewProfile] = useState<Profile | null>(null);
  const [generating, setGenerating] = useState(false);
  const [toast, setToast] = useState(false);
  const [sendModal, setSendModal] = useState<{
    open: boolean; match: EnrichedMatch | null; loading: boolean; done: boolean; email: string;
  }>({ open: false, match: null, loading: false, done: false, email: "" });

  // Bounce anyone who isn't signed in back to the login screen.
  useEffect(() => {
    if (status === "unauthenticated") router.push("/");
  }, [status, router]);

  // Load everything we need for this client in one go once we're authed.
  // The matches call only returns whatever is already cached — it won't
  // trigger AI scoring (that happens on the explicit "Find Matches" button).
  useEffect(() => {
    if (status !== "authenticated") return;
    Promise.all([
      fetch(`/api/customers/${id}`).then((r) => r.json()),
      fetch(`/api/notes?customerId=${id}`).then((r) => r.json()),
      fetch(`/api/matches/${id}`).then((r) => r.json()),
    ]).then(([cust, noteData, matchData]) => {
      setCustomer(cust?.error ? null : cust);
      setNotes(Array.isArray(noteData) ? noteData : []);
      setMatches(Array.isArray(matchData) ? matchData : []);
    });
  }, [id, status]);

  // Generate (or regenerate) matches — the only action that spends AI tokens.
  async function generateMatches(regenerate = false) {
    setGenerating(true);
    try {
      const res = await fetch(`/api/matches/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ regenerate }),
      });
      const data = await res.json();
      setMatches(Array.isArray(data) ? data : []);
    } finally {
      setGenerating(false);
    }
  }

  // Open the send modal and ask the API for an AI-drafted intro email.
  // The matchmaker reviews/edits it before actually sending.
  async function handleSendMatch(match: EnrichedMatch) {
    setSendModal({ open: true, match, loading: true, done: false, email: "" });
    const res = await fetch("/api/matches/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ matchId: match.id }),
    });
    const data = await res.json();
    setSendModal((prev) => ({ ...prev, loading: false, email: data.introEmail ?? "" }));
  }

  // Confirm step is a mock "send" — flips the match to sent, shows a success
  // state, then auto-closes and fires the toast. The short delay just makes
  // the success state feel intentional rather than instant.
  async function confirmSend() {
    setSendModal((prev) => ({ ...prev, loading: true }));
    await new Promise((r) => setTimeout(r, 600));
    setSendModal((prev) => ({ ...prev, loading: false, done: true }));
    setMatches((prev) => prev.map((m) => m.id === sendModal.match?.id ? { ...m, status: "sent" } : m));
    setTimeout(() => {
      setSendModal({ open: false, match: null, loading: false, done: false, email: "" });
      setToast(true);
      setTimeout(() => setToast(false), 3200);
    }, 900);
  }

  // Save a meeting/call note. We prepend the new note so the latest is on top.
  async function addNote() {
    if (!newNote.trim()) return;
    setSavingNote(true);
    const res = await fetch("/api/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customerId: parseInt(id), content: newNote }),
    });
    const note = await res.json();
    setNotes((prev) => [note, ...prev]);
    setNewNote("");
    setSavingNote(false);
  }

  // customer is null until the fetch resolves (or if the id was bad) — show
  // a small heartbeat loader rather than a blank page.
  if (!customer) {
    return (
      <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Inter, sans-serif" }}>
        <div style={{ textAlign: "center" }}>
          <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.4, ease: "linear" }} style={{ display: "inline-block", marginBottom: 14 }}>
            <Heart style={{ width: 26, height: 26, color: C.primary }} />
          </motion.div>
          <p style={{ fontSize: 13, color: C.textSecondary, margin: 0 }}>Loading profile…</p>
        </div>
      </div>
    );
  }

  const age = getAge(customer.dateOfBirth);
  const statusStyle = STATUS_MAP[customer.statusTag ?? "active"] ?? STATUS_MAP.active;
  const clientAv = av(customer.gender);

  // Once the matches card is on screen, the left biodata can grow as tall as it
  // likes (the matches card fills the right). Until then, cap the left column to
  // the viewport and let it scroll internally so it doesn't leave a blank gap
  // beside the short right panel.
  const hasMatchesPanel = matches.length > 0 || generating;

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: "'Inter', sans-serif" }}>

      {/* Top bar */}
      <div style={{
        background: C.surface, borderBottom: `0.5px solid ${C.border}`,
        padding: "0 44px", height: 52,
        display: "flex", alignItems: "center", gap: 14,
        position: "sticky", top: 0, zIndex: 40,
      }}>
        <button
          onClick={() => router.push("/dashboard")}
          style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, color: C.textSecondary, fontSize: 13, fontFamily: "Inter, sans-serif", padding: 0 }}
        >
          <ArrowLeft style={{ width: 14, height: 14 }} />
          All Clients
        </button>
        <span style={{ color: C.divider, fontSize: 18 }}>·</span>
        <span style={{ fontSize: 13, fontWeight: 500, color: C.textPrimary }}>{customer.firstName} {customer.lastName}</span>
      </div>

      {/* Two-column body. Once the matches card is present we stretch both columns
          to equal height (matches card fills the right). Before that, let them
          flow naturally so nothing gets clipped or forced. */}
      <div style={{ maxWidth: 1180, margin: "0 auto", padding: "28px 44px", display: "flex", gap: 24, alignItems: hasMatchesPanel ? "stretch" : "flex-start" }}>

        {/* ── LEFT: Biodata ── */}
        <div style={{ flex: "0 0 58%", display: "flex", flexDirection: "column", gap: 10 }}>

          {/* Profile header */}
          <div style={{ background: C.surface, borderRadius: 12, border: `0.5px solid ${C.border}`, padding: "22px 26px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ width: 56, height: 56, borderRadius: "50%", background: clientAv.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 500, color: clientAv.text, flexShrink: 0 }}>
                {customer.firstName[0]}{customer.lastName[0]}
              </div>
              <div style={{ flex: 1 }}>
                <h1 style={{ fontSize: 19, fontWeight: 500, color: C.textPrimary, margin: "0 0 4px" }}>
                  {customer.firstName} {customer.lastName}
                </h1>
                <p style={{ fontSize: 12, color: C.textSecondary, margin: 0, lineHeight: 1.5 }}>
                  {age} yrs · {customer.gender === "male" ? "Male" : "Female"} · {customer.maritalStatus?.replace("_", " ")}
                </p>
              </div>
              <span style={{ background: statusStyle.bg, color: statusStyle.text, fontSize: 12, fontWeight: 500, padding: "5px 13px", borderRadius: 20 }}>
                {statusStyle.label}
              </span>
            </div>
          </div>

          {/* Personal */}
          <BioCard title="Personal" icon={<Users style={{ width: 13, height: 13 }} />}>
            <DataRow label="Date of Birth" value={customer.dateOfBirth} />
            <DataRow label="Age"           value={`${age} years`} />
            <DataRow label="Height"        value={customer.height ? formatHeight(customer.height) : "—"} />
            <DataRow label="Complexion"    value={customer.complexion ?? "—"} />
            <DataRow label="Star Sign"     value={customer.starSign ?? "—"} />
            <DataRow label="Mangalik"      value={customer.mangalik ? "Yes" : "No"} last />
          </BioCard>

          {/* Contact */}
          <BioCard title="Contact" icon={<Phone style={{ width: 13, height: 13 }} />}>
            {customer.phone && <DataRow label="Phone"  value={customer.phone} />}
            {customer.email && <DataRow label="Email"  value={customer.email} />}
            <DataRow label="City"          value={`${customer.city}, ${customer.country ?? "India"}`} />
            <DataRow label="Visa Status"   value={customer.visaStatus ?? "—"} />
            <DataRow label="Open to Relocate" value={customer.openToRelocate ?? "—"} last />
          </BioCard>

          {/* Education & Career */}
          <BioCard title="Education & Career" icon={<GraduationCap style={{ width: 13, height: 13 }} />}>
            <DataRow label="Degree"      value={customer.degree ?? "—"} />
            <DataRow label="College"     value={customer.undergradCollege ?? "—"} />
            <DataRow label="Company"     value={customer.currentCompany ?? "—"} />
            <DataRow label="Designation" value={customer.designation ?? "—"} />
            <DataRow label="Income"      value={customer.income ? formatIncome(customer.income) : "—"} last />
          </BioCard>

          {/* Family & Background */}
          <BioCard title="Family & Background" icon={<Home style={{ width: 13, height: 13 }} />}>
            <DataRow label="Religion"           value={customer.religion ?? "—"} />
            <DataRow label="Caste"              value={customer.caste ?? "—"} />
            <DataRow label="Gotra"              value={customer.gotra ?? "—"} />
            <DataRow label="Mother Tongue"      value={customer.motherTongue ?? "—"} />
            <DataRow label="Father's Job"       value={customer.fatherOccupation ?? "—"} />
            <DataRow label="Mother's Job"       value={customer.motherOccupation ?? "—"} />
            <DataRow label="Siblings"           value={String(customer.siblings ?? 0)} />
            <DataRow label="Family Type"        value={customer.familyType?.replace("_", " ") ?? "—"} last={!customer.languagesKnown?.length} />
            {customer.languagesKnown && customer.languagesKnown.length > 0 && (
              <div style={{ paddingTop: 12, borderTop: `0.5px solid ${C.divider}` }}>
                <p style={{ fontSize: 11, color: C.textSecondary, margin: "0 0 8px" }}>Languages Known</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {customer.languagesKnown.map((l) => (
                    <span key={l} style={{ fontSize: 11, background: C.muted, color: C.textSecondary, padding: "3px 10px", borderRadius: 20 }}>{l}</span>
                  ))}
                </div>
              </div>
            )}
          </BioCard>

          {/* Lifestyle Preferences */}
          <BioCard title="Lifestyle" icon={<Leaf style={{ width: 13, height: 13 }} />}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, paddingTop: 4 }}>
              {[
                { label: "Kids",      value: customer.wantKids },
                { label: "Relocate",  value: customer.openToRelocate },
                { label: "Pets",      value: customer.openToPets },
                { label: "Diet",      value: customer.diet?.replace("_", " ") },
                { label: "Drinking",  value: customer.drinking },
                { label: "Smoking",   value: customer.smoking },
              ].map(({ label, value }) => {
                const isPositive = value === "yes" || value === "maybe";
                const isNegative = value === "no" || value === "never";
                return (
                  <div key={label} style={{
                    background: isPositive ? C.blushBg : isNegative ? C.dangerBg : C.muted,
                    borderRadius: 8, padding: "8px 12px", minWidth: 80,
                  }}>
                    <p style={{ fontSize: 10, color: C.textSecondary, margin: "0 0 3px", textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</p>
                    <p style={{ fontSize: 13, fontWeight: 500, color: isPositive ? C.primary : isNegative ? C.danger : C.textPrimary, textTransform: "capitalize", margin: 0 }}>
                      {value ?? "—"}
                    </p>
                  </div>
                );
              })}
            </div>
          </BioCard>

          {/* About section */}
          {customer.profileSummary && (
            <div style={{
              background: C.surface, borderRadius: 12,
              border: `0.5px solid ${C.border}`,
              padding: "20px 24px",
              display: "flex", gap: 16,
            }}>
              <div style={{ width: 3, borderRadius: 2, background: C.primary, flexShrink: 0 }} />
              <div>
                <p style={{ fontSize: 10, fontWeight: 500, color: C.textSecondary, letterSpacing: "0.06em", textTransform: "uppercase", margin: "0 0 8px" }}>About</p>
                <p style={{ fontSize: 13, color: C.textSecondary, lineHeight: 1.75, fontStyle: "italic", margin: 0 }}>
                  {customer.profileSummary}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ── RIGHT: Matchmaking Panel ──
            With matches present: absolutely fill the wrapper so the panel matches
            the (taller) left column's height and the matches list scrolls inside.
            Without matches: just stack naturally so there's no forced blank gap. */}
        <div style={{ flex: 1, minWidth: 0, position: hasMatchesPanel ? "relative" : "static" }}>
          <div style={hasMatchesPanel
            ? { position: "absolute", inset: 0, display: "flex", flexDirection: "column", gap: 14 }
            : { display: "flex", flexDirection: "column", gap: 14 }
          }>

          {/* When there are no matches yet, skip the big card — just a compact
              prompt + button. The full card only appears once matches exist
              (or while the AI is generating them). */}
          {matches.length === 0 && !generating ? (
            <div style={{ flexShrink: 0, padding: "4px 2px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <Heart style={{ width: 14, height: 14, color: C.primary }} />
                <h2 style={{ fontSize: 13, fontWeight: 500, color: C.textPrimary, margin: 0 }}>Suggested Matches</h2>
              </div>
              <button
                onClick={() => generateMatches(false)}
                style={{
                  width: "100%", padding: "11px 0", background: C.primary, color: "#FFF",
                  border: "none", borderRadius: 8, fontSize: 13, fontWeight: 500,
                  cursor: "pointer", fontFamily: "Inter, sans-serif",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
                }}
              >
                <Sparkles style={{ width: 13, height: 13 }} />
                Find Matches
              </button>
              <p style={{ fontSize: 12, color: C.textSecondary, textAlign: "center", margin: "10px 0 0" }}>
                No matches yet — let&apos;s find someone special.
              </p>
            </div>
          ) : (
            <div style={{ background: C.surface, borderRadius: 12, border: `0.5px solid ${C.border}`, overflow: "hidden", flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
              <div style={{
                padding: "14px 18px", borderBottom: `0.5px solid ${C.divider}`,
                display: "flex", alignItems: "center", gap: 8, flexShrink: 0,
              }}>
                <Heart style={{ width: 14, height: 14, color: C.primary }} />
                <h2 style={{ fontSize: 13, fontWeight: 500, color: C.textPrimary, margin: 0 }}>Suggested Matches</h2>
                <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
                  {matches.length > 0 && (
                    <span style={{ fontSize: 11, background: C.blush, color: C.primary, padding: "2px 7px", borderRadius: 20 }}>
                      {matches.length}
                    </span>
                  )}
                  {matches.length > 0 && !generating && (
                    <button
                      onClick={() => generateMatches(true)}
                      title="Regenerate matches with AI"
                      style={{ background: "none", border: "none", cursor: "pointer", color: C.textSecondary, display: "flex", alignItems: "center", padding: 2 }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = C.primary)}
                      onMouseLeave={(e) => (e.currentTarget.style.color = C.textSecondary)}
                    >
                      <RefreshCw style={{ width: 13, height: 13 }} />
                    </button>
                  )}
                </div>
              </div>

              {generating ? (
                <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 18px", textAlign: "center" }}>
                  <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.4, ease: "linear" }} style={{ display: "inline-block", marginBottom: 12 }}>
                    <Sparkles style={{ width: 22, height: 22, color: C.primary }} />
                  </motion.div>
                  <p style={{ fontSize: 13, color: C.textSecondary, lineHeight: 1.6, margin: 0 }}>
                    Finding the best matches<br />and scoring them with AI…
                  </p>
                </div>
              ) : (
                <div className="hide-scrollbar" style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "10px", display: "flex", flexDirection: "column", gap: 8 }}>
                  {matches.map((match, i) => (
                    <MatchCard
                      key={match.id}
                      match={match}
                      index={i}
                      onSend={() => handleSendMatch(match)}
                      onView={() => setViewProfile(match.profile)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Generate Introduction */}
          {matches.length > 0 && !generating && (
            <button
              onClick={() => handleSendMatch(matches[0])}
              style={{
                width: "100%", padding: "11px 0", flexShrink: 0,
                border: `0.5px solid ${C.primary}`, borderRadius: 8,
                background: "transparent", color: C.primary,
                fontSize: 13, fontWeight: 500, cursor: "pointer",
                fontFamily: "Inter, sans-serif",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
                transition: "background 0.15s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = C.blushBg)}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              <Sparkles style={{ width: 13, height: 13 }} />
              Generate Introduction
            </button>
          )}

          {/* Matchmaker Notes */}
          <div style={{ background: C.surface, borderRadius: 12, border: `0.5px solid ${C.border}`, overflow: "hidden", flexShrink: 0 }}>
            <div style={{ padding: "14px 18px", borderBottom: `0.5px solid ${C.divider}` }}>
              <p style={{ fontSize: 10, fontWeight: 500, color: C.textSecondary, letterSpacing: "0.06em", textTransform: "uppercase", margin: 0 }}>
                Your Notes
              </p>
            </div>
            <div style={{ padding: "16px 18px" }}>
              <textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Add observations from your last call or meeting…"
                rows={4}
                style={{
                  width: "100%", resize: "none",
                  border: `0.5px solid ${C.border}`, borderRadius: 8,
                  padding: "11px 13px", fontSize: 13, color: C.textPrimary,
                  background: C.bg, outline: "none",
                  fontFamily: "Inter, sans-serif", lineHeight: 1.65,
                  boxSizing: "border-box", transition: "border-color 0.15s ease",
                }}
                onFocus={(e) => (e.target.style.borderColor = C.primary)}
                onBlur={(e) => (e.target.style.borderColor = C.border)}
              />
              <button
                onClick={addNote}
                disabled={savingNote || !newNote.trim()}
                style={{
                  marginTop: 8, width: "100%", padding: "9px 0",
                  background: newNote.trim() ? C.primary : C.muted,
                  color: newNote.trim() ? "#FFF" : C.textSecondary,
                  border: "none", borderRadius: 8,
                  fontSize: 13, fontWeight: 500, cursor: newNote.trim() ? "pointer" : "not-allowed",
                  fontFamily: "Inter, sans-serif", transition: "all 0.15s ease",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                }}
              >
                {savingNote ? <Loader2 style={{ width: 12, height: 12 }} /> : <Plus style={{ width: 12, height: 12 }} />}
                Save Note
              </button>

              {notes.length > 0 && (
                <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 8 }}>
                  {notes.map((note) => (
                    <div key={note.id} style={{
                      background: C.bg, borderRadius: 8,
                      border: `0.5px solid ${C.border}`, padding: "11px 13px",
                    }}>
                      <p style={{ fontSize: 12, color: C.textPrimary, lineHeight: 1.65, margin: "0 0 6px", whiteSpace: "pre-wrap" }}>
                        {note.content}
                      </p>
                      <p style={{ fontSize: 11, color: C.textSecondary, margin: 0 }}>
                        {note.createdAt
                          ? new Date(note.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
                          : ""}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          </div>
        </div>
      </div>

      {/* ── VIEW PROFILE MODAL ── */}
      {viewProfile && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.48)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 24 }}
          onClick={() => setViewProfile(null)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            style={{ background: C.surface, borderRadius: 16, maxWidth: 540, width: "100%", maxHeight: "82vh", overflow: "auto", padding: 28 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 46, height: 46, borderRadius: "50%", background: av(viewProfile.gender).bg, color: av(viewProfile.gender).text, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 500 }}>
                  {viewProfile.firstName[0]}{viewProfile.lastName[0]}
                </div>
                <div>
                  <h2 style={{ fontSize: 16, fontWeight: 500, color: C.textPrimary, margin: "0 0 3px" }}>{viewProfile.firstName} {viewProfile.lastName}</h2>
                  <p style={{ fontSize: 12, color: C.textSecondary, margin: 0 }}>
                    {getAge(viewProfile.dateOfBirth)} yrs · {viewProfile.city} · {viewProfile.gender === "male" ? "Male" : "Female"}
                  </p>
                </div>
              </div>
              <button onClick={() => setViewProfile(null)} style={{ background: "none", border: "none", cursor: "pointer", color: C.textSecondary, padding: 4 }}>
                <X style={{ width: 17, height: 17 }} />
              </button>
            </div>
            {/* Full biodata, grouped into sections so it reads like a profile, not a table. */}
            {[
              {
                title: "Personal",
                fields: [
                  { label: "Age",            value: `${getAge(viewProfile.dateOfBirth)} yrs` },
                  { label: "Date of Birth",  value: viewProfile.dateOfBirth },
                  { label: "Height",         value: viewProfile.height ? formatHeight(viewProfile.height) : "—" },
                  { label: "Marital Status", value: viewProfile.maritalStatus?.replace("_", " ") ?? "—" },
                  { label: "Complexion",     value: viewProfile.complexion ?? "—" },
                  { label: "Star Sign",      value: viewProfile.starSign ?? "—" },
                  { label: "Mangalik",       value: viewProfile.mangalik ? "Yes" : "No" },
                  { label: "Languages",      value: viewProfile.languagesKnown?.join(", ") ?? "—" },
                ],
              },
              {
                title: "Education & Career",
                fields: [
                  { label: "Education",   value: viewProfile.degree ?? "—" },
                  { label: "College",     value: viewProfile.undergradCollege ?? "—" },
                  { label: "Company",     value: viewProfile.currentCompany ?? "—" },
                  { label: "Designation", value: viewProfile.designation ?? "—" },
                  { label: "Income",      value: viewProfile.income ? formatIncome(viewProfile.income) : "—" },
                ],
              },
              {
                title: "Family & Background",
                fields: [
                  { label: "Religion",      value: viewProfile.religion ?? "—" },
                  { label: "Caste",         value: viewProfile.caste ?? "—" },
                  { label: "Gotra",         value: viewProfile.gotra ?? "—" },
                  { label: "Mother Tongue", value: viewProfile.motherTongue ?? "—" },
                  { label: "Father's Job",  value: viewProfile.fatherOccupation ?? "—" },
                  { label: "Mother's Job",  value: viewProfile.motherOccupation ?? "—" },
                  { label: "Siblings",      value: String(viewProfile.siblings ?? 0) },
                  { label: "Family Type",   value: viewProfile.familyType?.replace("_", " ") ?? "—" },
                ],
              },
              {
                title: "Lifestyle & Preferences",
                fields: [
                  { label: "Diet",         value: viewProfile.diet?.replace("_", " ") ?? "—" },
                  { label: "Drinking",     value: viewProfile.drinking ?? "—" },
                  { label: "Smoking",      value: viewProfile.smoking ?? "—" },
                  { label: "Wants Kids",   value: viewProfile.wantKids ?? "—" },
                  { label: "Relocate",     value: viewProfile.openToRelocate ?? "—" },
                  { label: "Open to Pets", value: viewProfile.openToPets ?? "—" },
                ],
              },
              {
                title: "Location & Contact",
                fields: [
                  { label: "City",        value: viewProfile.city },
                  { label: "Country",     value: viewProfile.country ?? "India" },
                  { label: "Visa Status", value: viewProfile.visaStatus ?? "—" },
                  { label: "Phone",       value: viewProfile.phone ?? "—" },
                  { label: "Email",       value: viewProfile.email ?? "—" },
                ],
              },
            ].map((section) => (
              <div key={section.title} style={{ marginBottom: 18 }}>
                <p style={{ fontSize: 10, fontWeight: 500, color: C.primary, letterSpacing: "0.07em", textTransform: "uppercase", margin: "0 0 8px" }}>
                  {section.title}
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  {section.fields.map(({ label, value }) => (
                    <div key={label} style={{ background: C.bg, borderRadius: 8, padding: "10px 13px" }}>
                      <p style={{ fontSize: 10, color: C.textSecondary, margin: "0 0 2px", textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</p>
                      <p style={{ fontSize: 13, fontWeight: 500, color: C.textPrimary, margin: 0, textTransform: label === "Email" ? "none" : "capitalize", wordBreak: "break-word" }}>{value}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      )}

      {/* ── SEND MATCH MODAL ── */}
      {sendModal.open && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.48)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 24 }}
          onClick={() => !sendModal.loading && setSendModal({ open: false, match: null, loading: false, done: false, email: "" })}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.15 }}
            style={{ background: C.surface, borderRadius: 16, maxWidth: 500, width: "100%", padding: 28 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
              <h2 style={{ fontSize: 16, fontWeight: 500, color: C.textPrimary, margin: 0 }}>
                Introduce {customer.firstName} to {sendModal.match?.profile.firstName}
              </h2>
              {!sendModal.loading && (
                <button onClick={() => setSendModal({ open: false, match: null, loading: false, done: false, email: "" })} style={{ background: "none", border: "none", cursor: "pointer", color: C.textSecondary, padding: 3 }}>
                  <X style={{ width: 17, height: 17 }} />
                </button>
              )}
            </div>

            {/* Profile pair */}
            {sendModal.match && (
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
                <div style={{ flex: 1, background: C.bg, borderRadius: 10, padding: "12px 14px", display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 34, height: 34, borderRadius: "50%", background: av(customer.gender).bg, color: av(customer.gender).text, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 500, flexShrink: 0 }}>
                    {customer.firstName[0]}{customer.lastName[0]}
                  </div>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 500, color: C.textPrimary, margin: 0 }}>{customer.firstName}</p>
                    <p style={{ fontSize: 11, color: C.textSecondary, margin: "1px 0 0" }}>Client · {customer.city}</p>
                  </div>
                </div>
                <Heart style={{ width: 20, height: 20, color: C.primary, fill: C.blush, flexShrink: 0 }} />
                <div style={{ flex: 1, background: C.bg, borderRadius: 10, padding: "12px 14px", display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 34, height: 34, borderRadius: "50%", background: av(sendModal.match.profile.gender).bg, color: av(sendModal.match.profile.gender).text, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 500, flexShrink: 0 }}>
                    {sendModal.match.profile.firstName[0]}{sendModal.match.profile.lastName[0]}
                  </div>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 500, color: C.textPrimary, margin: 0 }}>{sendModal.match.profile.firstName}</p>
                    <p style={{ fontSize: 11, color: C.textSecondary, margin: "1px 0 0" }}>Match · {sendModal.match.profile.city}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Loading */}
            {sendModal.loading && !sendModal.email && (
              <div style={{ textAlign: "center", padding: "24px 0" }}>
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }} style={{ display: "inline-block", marginBottom: 10 }}>
                  <Loader2 style={{ width: 22, height: 22, color: C.primary }} />
                </motion.div>
                <p style={{ fontSize: 13, color: C.textSecondary, margin: 0 }}>Crafting a personalised introduction…</p>
              </div>
            )}

            {/* Email */}
            {!sendModal.loading && !sendModal.done && sendModal.email && (
              <>
                <p style={{ fontSize: 10, fontWeight: 500, color: C.textSecondary, letterSpacing: "0.06em", textTransform: "uppercase", margin: "0 0 8px" }}>
                  Introduction Email
                </p>
                <textarea
                  value={sendModal.email}
                  onChange={(e) => setSendModal((prev) => ({ ...prev, email: e.target.value }))}
                  rows={8}
                  style={{
                    width: "100%", resize: "vertical",
                    border: `0.5px solid ${C.border}`, borderRadius: 8,
                    padding: "12px 13px", fontSize: 12, color: C.textPrimary,
                    background: C.bg, outline: "none",
                    fontFamily: "Inter, sans-serif", lineHeight: 1.72,
                    boxSizing: "border-box", marginBottom: 12, transition: "border-color 0.15s ease",
                  }}
                  onFocus={(e) => (e.target.style.borderColor = C.primary)}
                  onBlur={(e) => (e.target.style.borderColor = C.border)}
                />
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    onClick={() => navigator.clipboard.writeText(sendModal.email)}
                    style={{ flex: 1, padding: "9px 0", border: `0.5px solid ${C.border}`, borderRadius: 8, background: "transparent", color: C.textSecondary, fontSize: 13, cursor: "pointer", fontFamily: "Inter, sans-serif", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
                  >
                    <Copy style={{ width: 13, height: 13 }} />Copy
                  </button>
                  <button
                    onClick={confirmSend}
                    style={{ flex: 2, padding: "9px 0", background: C.primary, color: "#FFF", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "Inter, sans-serif" }}
                  >
                    Mark as Sent
                  </button>
                </div>
              </>
            )}

            {/* Done */}
            {sendModal.done && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: "center", padding: "20px 0" }}>
                <CheckCircle2 style={{ width: 34, height: 34, color: C.success, margin: "0 auto 10px" }} />
                <p style={{ fontSize: 14, fontWeight: 500, color: C.textPrimary, margin: 0 }}>Introduction sent!</p>
              </motion.div>
            )}
          </motion.div>
        </div>
      )}

      {/* ── TOAST ── */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            style={{
              position: "fixed", bottom: 28, left: "50%", transform: "translateX(-50%)",
              background: C.primary, color: "#FFF",
              padding: "10px 20px", borderRadius: 8,
              fontSize: 13, zIndex: 200,
            }}
          >
            Match introduced
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Helpers ── */

function BioCard({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div style={{ background: C.surface, borderRadius: 12, border: `0.5px solid ${C.border}`, overflow: "hidden" }}>
      <div style={{ padding: "13px 22px", borderBottom: `0.5px solid ${C.divider}`, display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ color: C.primary }}>{icon}</span>
        <p style={{ fontSize: 10, fontWeight: 500, color: C.textSecondary, letterSpacing: "0.06em", textTransform: "uppercase", margin: 0 }}>{title}</p>
      </div>
      <div style={{ padding: "6px 22px 14px" }}>{children}</div>
    </div>
  );
}

function DataRow({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <div style={{
      display: "flex", justifyContent: "space-between", alignItems: "baseline",
      padding: "9px 0",
      borderBottom: last ? "none" : `0.5px solid ${C.divider}`,
    }}>
      <span style={{ fontSize: 12, color: C.textSecondary, flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 500, color: C.textPrimary, textAlign: "right", textTransform: "capitalize", marginLeft: 16, wordBreak: "break-word" }}>{value}</span>
    </div>
  );
}

function MatchCard({ match, index, onSend, onView }: { match: EnrichedMatch; index: number; onSend: () => void; onView: () => void }) {
  const profile = match.profile;
  const age = getAge(profile.dateOfBirth);
  const score = match.aiScore ?? "Moderate";
  const scoreStyle = AI_SCORE_STYLE[score] ?? AI_SCORE_STYLE["Moderate"];
  const profileAv = av(profile.gender);
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: C.surface, borderRadius: 10,
        border: `0.5px solid ${hovered ? C.primary : C.border}`,
        padding: "13px",
        transition: "all 0.15s ease",
        transform: hovered ? "translateY(-1px)" : "translateY(0)",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 10 }}>
        <button onClick={onView} style={{ background: "none", border: "none", padding: 0, cursor: "pointer", flexShrink: 0 }}>
          <div style={{ width: 36, height: 36, borderRadius: "50%", background: profileAv.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 500, color: profileAv.text }}>
            {profile.firstName[0]}{profile.lastName[0]}
          </div>
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6, marginBottom: 2 }}>
            <button onClick={onView} style={{ background: "none", border: "none", padding: 0, cursor: "pointer", fontSize: 13, fontWeight: 500, color: C.textPrimary }}>
              {profile.firstName} {profile.lastName}
            </button>
            <span style={{ fontSize: 10, fontWeight: 500, background: scoreStyle.bg, color: scoreStyle.text, padding: "2px 7px", borderRadius: 20, flexShrink: 0 }}>
              {score}
            </span>
          </div>
          <p style={{ fontSize: 11, color: C.textSecondary, margin: 0 }}>
            {age} yrs · {profile.city}{profile.designation ? ` · ${profile.designation}` : ""}
          </p>
        </div>
      </div>

      {match.aiExplanation && (
        <p style={{ fontSize: 11, color: C.textSecondary, lineHeight: 1.55, margin: "0 0 10px", padding: "8px 10px", background: C.bg, borderRadius: 6, borderLeft: `2px solid ${C.blush}` }}>
          {match.aiExplanation.split(". ")[0]}.
        </p>
      )}

      <button
        onClick={onSend}
        disabled={match.status === "sent"}
        style={{
          width: "100%", padding: "8px 0",
          background: match.status === "sent" ? C.muted : C.primary,
          color: match.status === "sent" ? C.textSecondary : "#FFF",
          border: "none", borderRadius: 8,
          fontSize: 12, fontWeight: 500,
          cursor: match.status === "sent" ? "default" : "pointer",
          fontFamily: "Inter, sans-serif",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
        }}
      >
        {match.status === "sent"
          ? <><CheckCircle2 style={{ width: 12, height: 12 }} />Introduced</>
          : <><Send style={{ width: 12, height: 12 }} />Send Match</>}
      </button>
    </div>
  );
}
