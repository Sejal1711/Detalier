"use client";
import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Heart, LogOut, LayoutDashboard, Settings, Sun, Moon } from "lucide-react";
import { C } from "@/lib/theme";
import { useTheme } from "@/components/ThemeProvider";

// Sidebar items. `match` lists the path prefixes that should light this item up —
// e.g. Dashboard stays highlighted while you're deep in a /customer/123 profile.
const NAV = [
  { icon: LayoutDashboard, label: "Dashboard",    href: "/dashboard", match: ["/dashboard", "/customer"] },
  { icon: Heart,           label: "Matches Made", href: "/matches",   match: ["/matches"] },
  { icon: Settings,        label: "Settings",     href: "/settings",  match: ["/settings"] },
];

// Shared chrome for every signed-in page: top bar + left nav, with the page
// content slotted into the main area. Keeps the layout consistent everywhere.
export default function AppShell({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", fontFamily: "'Inter', sans-serif", background: C.bg }}>

      {/* ── NAVBAR ── */}
      <header style={{
        height: 60, background: C.surface,
        borderBottom: `0.5px solid ${C.border}`,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 32px", position: "sticky", top: 0, zIndex: 50, flexShrink: 0,
      }}>
        <Link href="/dashboard" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: C.blush, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Heart style={{ width: 14, height: 14, color: C.primary, fill: C.primary }} />
          </div>
          <span style={{ fontSize: 15, fontWeight: 500, color: C.textPrimary, letterSpacing: "-0.01em" }}>Datelier</span>
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          {/* Dark/light toggle — show the icon for the mode you'd switch TO */}
          <button
            onClick={toggleTheme}
            title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            style={{ background: "none", border: `0.5px solid ${C.border}`, borderRadius: 8, cursor: "pointer", color: C.textSecondary, padding: 7, display: "flex", alignItems: "center", justifyContent: "center", transition: "color 0.15s ease, border-color 0.15s ease" }}
            onMouseEnter={(e) => { e.currentTarget.style.color = C.primary; e.currentTarget.style.borderColor = C.primary; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = C.textSecondary; e.currentTarget.style.borderColor = C.border; }}
          >
            {theme === "dark"
              ? <Sun style={{ width: 14, height: 14 }} />
              : <Moon style={{ width: 14, height: 14 }} />}
          </button>
          <div style={{ width: 30, height: 30, borderRadius: "50%", background: C.blush, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 500, color: C.primary }}>
            {(session?.user?.name ?? "M")[0]}
          </div>
          <span style={{ fontSize: 13, color: C.textSecondary }}>{session?.user?.name?.split(" ")[0]}</span>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            style={{ background: "none", border: `0.5px solid ${C.border}`, borderRadius: 6, cursor: "pointer", color: C.textSecondary, fontSize: 12, padding: "5px 12px", display: "flex", alignItems: "center", gap: 5, fontFamily: "Inter, sans-serif" }}
          >
            <LogOut style={{ width: 12, height: 12 }} />Logout
          </button>
        </div>
      </header>

      <div style={{ display: "flex", flex: 1 }}>

        {/* ── SIDEBAR ── */}
        <aside style={{
          width: 232, background: C.surface,
          borderRight: `0.5px solid ${C.border}`,
          padding: "28px 12px",
          position: "sticky", top: 60,
          height: "calc(100vh - 60px)",
          alignSelf: "flex-start",
          flexShrink: 0,
        }}>
          <p style={{ fontSize: 10, fontWeight: 500, color: C.textSecondary, letterSpacing: "0.08em", textTransform: "uppercase", padding: "0 10px", marginBottom: 10, marginTop: 0 }}>
            Navigation
          </p>
          {NAV.map(({ icon: Icon, label, href, match }) => {
            // Active if the current path equals or sits under any of the item's prefixes.
            const active = match.some((m) => pathname === m || pathname.startsWith(m + "/"));
            return (
              <Link key={label} href={href} style={{ textDecoration: "none", display: "block" }}>
                <div
                  style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "9px 12px", borderRadius: 8,
                    background: active ? C.blushBg : "transparent",
                    color: active ? C.primary : C.textSecondary,
                    fontSize: 13, fontWeight: active ? 500 : 400,
                    marginBottom: 2, cursor: "pointer",
                    transition: "background 0.15s ease, color 0.15s ease",
                  }}
                  onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = C.hover; }}
                  onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = "transparent"; }}
                >
                  <Icon style={{ width: 15, height: 15 }} />
                  {label}
                </div>
              </Link>
            );
          })}
        </aside>

        {/* ── MAIN ── */}
        <main style={{ flex: 1, padding: "36px 44px", minWidth: 0 }}>
          {children}
        </main>
      </div>
    </div>
  );
}
