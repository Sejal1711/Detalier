"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Search, Users, Briefcase, IndianRupee, UserCheck, Award, TrendingUp } from "lucide-react";
import type { Profile } from "@/lib/schema";
import { getAge, formatIncome } from "@/lib/utils";
import { C, STATUS_MAP, avatarStyle } from "@/lib/theme";
import AppShell from "@/components/AppShell";
import Dropdown from "@/components/Dropdown";

const FILTER_OPTIONS = [
  { value: "all",     label: "All Clients" },
  { value: "active",  label: "Active"      },
  { value: "paused",  label: "Pending"     },
  { value: "matched", label: "Matched"     },
  { value: "on_hold", label: "On Hold"     },
];

// Empty-state copy keyed by what caused the empty list, so the message actually
// speaks to the situation (e.g. an empty "On Hold" filter vs. a fruitless search).
const EMPTY_COPY: Record<string, { title: string; sub: string }> = {
  search:  { title: "No clients match your search", sub: "Try a different name, city, or company — the right one might be just a search away." },
  active:  { title: "No active searches",           sub: "None of your clients are actively searching right now." },
  paused:  { title: "No pending clients",           sub: "Nothing is waiting on you at the moment." },
  matched: { title: "No matches yet",               sub: "Once you introduce a client to someone special, they'll show here." },
  on_hold: { title: "Nothing on hold",              sub: "All your clients are actively in their journey — nothing paused for now." },
  none:    { title: "No clients yet",               sub: "Your client list is empty. New profiles will appear here." },
};

export default function DashboardPage() {
  const { status } = useSession();
  const router = useRouter();
  const [customers, setCustomers] = useState<Profile[]>([]);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/");
  }, [status, router]);

  // Pull the full client list once we're signed in. It's an internal tool with
  // a shared pool, so everyone sees every client.
  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/customers")
      .then((r) => r.json())
      .then((data) => {
        setCustomers(Array.isArray(data) ? data : []);
        setLoading(false);
      });
  }, [status]);

  // Client-side search + status filter. Search matches name, city, or company.
  const filtered = customers.filter((c) => {
    const q = search.toLowerCase();
    const ms = !q ||
      `${c.firstName} ${c.lastName}`.toLowerCase().includes(q) ||
      c.city.toLowerCase().includes(q) ||
      (c.currentCompany ?? "").toLowerCase().includes(q);
    const fs = filterStatus === "all" || c.statusTag === filterStatus;
    return ms && fs;
  });

  // Top-of-page summary cards. "Success Stories" reuses the matched count for now
  // until we track engagements/marriages as a separate milestone.
  const stats = [
    { label: "Total Clients",    value: customers.length,                                          icon: Users      },
    { label: "Active Searches",  value: customers.filter((c) => c.statusTag === "active").length,  icon: UserCheck  },
    { label: "Matches Sent",     value: customers.filter((c) => c.statusTag === "matched").length, icon: TrendingUp },
    { label: "Success Stories",  value: customers.filter((c) => c.statusTag === "matched").length, icon: Award      },
  ];

  if (status === "loading" || loading) {
    return (
      <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Inter, sans-serif" }}>
        <div style={{ textAlign: "center" }}>
          <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.4, ease: "linear" }} style={{ display: "inline-block", marginBottom: 14 }}>
            <Heart style={{ width: 26, height: 26, color: C.primary }} />
          </motion.div>
          <p style={{ fontSize: 13, color: C.textSecondary, margin: 0 }}>Loading your clients…</p>
        </div>
      </div>
    );
  }

  return (
    <AppShell>
      {/* Header + Search + Filter */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28, flexWrap: "wrap", gap: 14 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 500, color: C.textPrimary, margin: "0 0 3px" }}>Your Clients</h1>
          <p style={{ fontSize: 12, color: C.textSecondary, margin: 0 }}>Manage profiles, track journeys, assign matches.</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ position: "relative" }}>
            <Search style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", width: 13, height: 13, color: C.textSecondary }} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search clients…"
              style={{
                paddingLeft: 30, paddingRight: 14, height: 34,
                border: `0.5px solid ${C.border}`, borderRadius: 8,
                fontSize: 13, color: C.textPrimary, background: C.surface,
                outline: "none", width: 220, fontFamily: "Inter, sans-serif",
                transition: "border-color 0.15s ease",
              }}
              onFocus={(e) => (e.target.style.borderColor = C.primary)}
              onBlur={(e) => (e.target.style.borderColor = C.border)}
            />
          </div>
          <Dropdown value={filterStatus} options={FILTER_OPTIONS} onChange={setFilterStatus} width={150} />
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 36 }}>
        {stats.map(({ label, value }) => (
          <div key={label} style={{ background: C.bg, borderRadius: 12, padding: "20px 22px" }}>
            <p style={{ fontSize: 32, fontWeight: 500, color: C.primary, margin: "0 0 5px", lineHeight: 1 }}>{value}</p>
            <p style={{ fontSize: 12, color: C.textSecondary, margin: 0, lineHeight: 1.4 }}>{label}</p>
          </div>
        ))}
      </div>

      {/* Count line */}
      {filtered.length > 0 && (
        <p style={{ fontSize: 12, color: C.textSecondary, marginBottom: 14 }}>
          {filtered.length} client{filtered.length !== 1 ? "s" : ""}
        </p>
      )}

      {/* Grid */}
      <AnimatePresence mode="popLayout">
        {filtered.length === 0 ? (
          (() => {
            const copy = search ? EMPTY_COPY.search : EMPTY_COPY[filterStatus] ?? EMPTY_COPY.none;
            return (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", padding: "56px 0 80px" }}
              >
                {/* Illustration */}
                <Image
                  src="/image.png"
                  alt=""
                  width={560}
                  height={410}
                  style={{ width: "min(320px, 60%)", height: "auto", opacity: 0.5, mixBlendMode: "multiply", marginBottom: 24 }}
                />

                {/* Copy below */}
                <p style={{ fontSize: 16, fontWeight: 500, color: C.textPrimary, margin: "0 0 8px" }}>{copy.title}</p>
                <p style={{ fontSize: 13, color: C.textSecondary, maxWidth: 320, margin: 0, lineHeight: 1.7 }}>{copy.sub}</p>
              </motion.div>
            );
          })()
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(268px, 1fr))", gap: 14 }}>
            {filtered.map((customer, i) => (
              <ClientCard key={customer.id} customer={customer} index={i} />
            ))}
          </div>
        )}
      </AnimatePresence>
    </AppShell>
  );
}

/* ── Client Card ── */

function ClientCard({ customer, index }: { customer: Profile; index: number }) {
  const age = getAge(customer.dateOfBirth);
  const statusStyle = STATUS_MAP[customer.statusTag ?? "active"] ?? STATUS_MAP.active;
  const av = avatarStyle(customer.gender);
  const [hovered, setHovered] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ delay: index * 0.03 }}
    >
      <Link href={`/customer/${customer.id}`} style={{ textDecoration: "none", display: "block" }}>
        <div
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          style={{
            background: C.surface, borderRadius: 12,
            border: `0.5px solid ${hovered ? C.primary : C.border}`,
            padding: "18px 20px",
            transition: "all 0.15s ease",
            transform: hovered ? "translateY(-1px)" : "translateY(0)",
            cursor: "pointer",
          }}
        >
          {/* Avatar + name + status */}
          <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 14 }}>
            <div style={{
              width: 42, height: 42, borderRadius: "50%",
              background: av.bg, flexShrink: 0,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 14, fontWeight: 500, color: av.text, letterSpacing: "0.02em",
            }}>
              {customer.firstName[0]}{customer.lastName[0]}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
                <p style={{ fontSize: 14, fontWeight: 500, color: C.textPrimary, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
                  {customer.firstName} {customer.lastName}
                </p>
                <span style={{ fontSize: 11, fontWeight: 500, background: statusStyle.bg, color: statusStyle.text, padding: "3px 9px", borderRadius: 20, flexShrink: 0 }}>
                  {statusStyle.label}
                </span>
              </div>
              <p style={{ fontSize: 12, color: C.textSecondary, margin: "3px 0 0", lineHeight: 1.4 }}>
                {age} yrs · {customer.city} · {customer.maritalStatus?.replace("_", " ")}
              </p>
            </div>
          </div>

          {/* Details */}
          <div style={{ borderTop: `0.5px solid ${C.divider}`, paddingTop: 12, display: "flex", flexDirection: "column", gap: 5 }}>
            {customer.designation && (
              <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12, color: C.textSecondary }}>
                <Briefcase style={{ width: 11, height: 11, flexShrink: 0 }} />
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {customer.designation}{customer.currentCompany ? ` · ${customer.currentCompany}` : ""}
                </span>
              </div>
            )}
            {customer.income && (
              <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12, color: C.textSecondary }}>
                <IndianRupee style={{ width: 11, height: 11, flexShrink: 0 }} />
                {formatIncome(customer.income)}
              </div>
            )}
            {(customer.religion || customer.caste) && (
              <p style={{ fontSize: 12, color: C.textSecondary, margin: 0 }}>
                {[customer.religion, customer.caste].filter(Boolean).join(" · ")}
              </p>
            )}
          </div>

          {/* View Profile button */}
          <div style={{ marginTop: 14, paddingTop: 14, borderTop: `0.5px solid ${C.divider}` }}>
            <div style={{
              border: `0.5px solid ${C.primary}`, borderRadius: 8,
              padding: "7px 0", textAlign: "center",
              fontSize: 12, fontWeight: 500, color: C.primary,
              background: hovered ? C.blushBg : "transparent",
              transition: "background 0.15s ease",
            }}>
              View Profile
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
