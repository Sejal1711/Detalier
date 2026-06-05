"use client";
import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { User, Mail, Bell, Palette, LogOut, ChevronRight, Users, Heart, Shield, Moon, Sun } from "lucide-react";
import { C } from "@/lib/theme";
import AppShell from "@/components/AppShell";
import { useTheme } from "@/components/ThemeProvider";

/** Small flat toggle switch (local state — demo preference). */
function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!on)}
      style={{
        width: 38, height: 22, borderRadius: 20, border: "none", cursor: "pointer",
        background: on ? C.primary : C.toggleOff, position: "relative",
        transition: "background 0.18s ease", flexShrink: 0, padding: 0,
      }}
      aria-pressed={on}
    >
      <span style={{
        position: "absolute", top: 2, left: on ? 18 : 2,
        width: 18, height: 18, borderRadius: "50%", background: "#FFF",
        transition: "left 0.18s ease",
      }} />
    </button>
  );
}

/** A row with an icon tile, label, and trailing control. */
function Row({
  icon: Icon, label, sub, trailing, last,
}: {
  icon: React.ComponentType<{ style?: React.CSSProperties }>;
  label: string; sub?: string; trailing: React.ReactNode; last?: boolean;
}) {
  const [hover, setHover] = useState(false);
  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: "flex", alignItems: "center", gap: 13,
        padding: "13px 20px",
        borderBottom: last ? "none" : `0.5px solid ${C.divider}`,
        background: hover ? C.hover : "transparent",
        transition: "background 0.13s ease",
      }}
    >
      <span style={{ width: 30, height: 30, borderRadius: 8, background: C.blushBg, color: C.primary, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Icon style={{ width: 15, height: 15 }} />
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 13, fontWeight: 500, color: C.textPrimary, margin: 0 }}>{label}</p>
        {sub && <p style={{ fontSize: 11, color: C.textSecondary, margin: "2px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{sub}</p>}
      </div>
      <div style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 8 }}>{trailing}</div>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontSize: 10, fontWeight: 500, color: C.textSecondary, letterSpacing: "0.07em", textTransform: "uppercase", margin: "0 0 10px 4px" }}>
      {children}
    </p>
  );
}

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<{ clients: number; matches: number } | null>(null);
  const [notifications, setNotifications] = useState(true);
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    if (status === "unauthenticated") router.push("/");
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;
    Promise.all([
      fetch("/api/customers").then((r) => r.json()),
      fetch("/api/matches-made").then((r) => r.json()),
    ]).then(([clients, matches]) => {
      setStats({
        clients: Array.isArray(clients) ? clients.length : 0,
        matches: Array.isArray(matches) ? matches.length : 0,
      });
    });
  }, [status]);

  const name = (session?.user?.name ?? "Matchmaker").split(" ")[0];
  const initial = name[0];

  const card: React.CSSProperties = {
    background: C.surface, borderRadius: 14, border: `0.5px solid ${C.border}`, overflow: "hidden",
  };

  return (
    <AppShell>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 20, fontWeight: 500, color: C.textPrimary, margin: "0 0 3px" }}>Settings</h1>
        <p style={{ fontSize: 12, color: C.textSecondary, margin: 0 }}>Manage your account and preferences.</p>
      </div>

      <div style={{ maxWidth: 620, display: "flex", flexDirection: "column", gap: 22 }}>

        {/* ── Profile hero card ── */}
        <div style={card}>
          <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "24px 24px 20px" }}>
            <div style={{ width: 60, height: 60, borderRadius: "50%", background: C.blush, color: C.primary, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, fontWeight: 500, flexShrink: 0 }}>
              {initial}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <p style={{ fontSize: 17, fontWeight: 500, color: C.textPrimary, margin: 0 }}>{name}</p>
                <span style={{ fontSize: 11, fontWeight: 500, background: C.blushBg, color: C.primary, padding: "3px 10px", borderRadius: 20 }}>Matchmaker</span>
              </div>
              <p style={{ fontSize: 13, color: C.textSecondary, margin: "4px 0 0" }}>{session?.user?.email}</p>
            </div>
          </div>

          {/* Stats strip */}
          <div style={{ display: "flex", borderTop: `0.5px solid ${C.divider}` }}>
            {[
              { icon: Users, label: "Clients", value: stats?.clients },
              { icon: Heart, label: "Matches Made", value: stats?.matches },
            ].map(({ icon: Icon, label, value }, i) => (
              <div key={label} style={{
                flex: 1, display: "flex", alignItems: "center", gap: 11, padding: "16px 24px",
                borderLeft: i > 0 ? `0.5px solid ${C.divider}` : "none",
              }}>
                <span style={{ width: 34, height: 34, borderRadius: 9, background: C.blushBg, color: C.primary, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Icon style={{ width: 16, height: 16 }} />
                </span>
                <div>
                  <p style={{ fontSize: 20, fontWeight: 500, color: C.textPrimary, margin: 0, lineHeight: 1 }}>
                    {value ?? "—"}
                  </p>
                  <p style={{ fontSize: 11, color: C.textSecondary, margin: "3px 0 0" }}>{label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Account ── */}
        <div>
          <SectionLabel>Account</SectionLabel>
          <div style={card}>
            <Row
              icon={User}
              label="Profile Details"
              sub="Your name and matchmaker identity"
              trailing={<>
                <span style={{ fontSize: 12, color: C.textSecondary }}>{name}</span>
                <ChevronRight style={{ width: 14, height: 14, color: C.textSecondary }} />
              </>}
            />
            <Row
              icon={Mail}
              label="Email Address"
              sub="Used for sign-in and notifications"
              trailing={<>
                <span style={{ fontSize: 12, color: C.textSecondary }}>{session?.user?.email}</span>
                <ChevronRight style={{ width: 14, height: 14, color: C.textSecondary }} />
              </>}
              last
            />
          </div>
        </div>

        {/* ── Preferences ── */}
        <div>
          <SectionLabel>Preferences</SectionLabel>
          <div style={card}>
            <Row
              icon={Bell}
              label="Notifications"
              sub="Match activity and reminders"
              trailing={<Toggle on={notifications} onChange={setNotifications} />}
            />
            <Row
              icon={theme === "dark" ? Moon : Sun}
              label="Dark Mode"
              sub={theme === "dark" ? "Dark theme is on" : "Light theme is on"}
              trailing={<Toggle on={theme === "dark"} onChange={toggleTheme} />}
            />
            <Row
              icon={Palette}
              label="Appearance"
              sub="Dashboard accent theme"
              trailing={
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ width: 16, height: 16, borderRadius: "50%", background: C.primary, border: `2px solid ${C.surface}`, boxShadow: `0 0 0 1px ${C.border}` }} />
                  <span style={{ fontSize: 12, color: C.textSecondary }}>Dusty Rose</span>
                </div>
              }
              last
            />
          </div>
        </div>

        {/* ── Security ── */}
        <div>
          <SectionLabel>Security</SectionLabel>
          <div style={card}>
            <Row
              icon={Shield}
              label="Password"
              sub="Last updated recently"
              trailing={<ChevronRight style={{ width: 14, height: 14, color: C.textSecondary }} />}
            />
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              style={{
                width: "100%", background: "transparent", border: "none", cursor: "pointer",
                fontFamily: "Inter, sans-serif", textAlign: "left",
                display: "flex", alignItems: "center", gap: 13, padding: "13px 20px",
                borderTop: `0.5px solid ${C.divider}`,
                transition: "background 0.13s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = C.dangerBg)}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              <span style={{ width: 30, height: 30, borderRadius: 8, background: C.dangerBg, color: C.danger, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <LogOut style={{ width: 15, height: 15 }} />
              </span>
              <span style={{ fontSize: 13, fontWeight: 500, color: C.danger }}>Sign Out</span>
            </button>
          </div>
        </div>

        <p style={{ fontSize: 11, color: C.textSecondary, textAlign: "center", margin: "0 0 8px" }}>
          More preferences coming soon.
        </p>
      </div>
    </AppShell>
  );
}
