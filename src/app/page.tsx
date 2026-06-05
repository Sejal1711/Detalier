"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Heart, Mail, Lock, Loader2 } from "lucide-react";
import { C } from "@/lib/theme";
import { useTheme } from "@/components/ThemeProvider";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { theme } = useTheme();
  const router = useRouter();
  const searchParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
  const justRegistered = searchParams?.get("registered") === "1";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const result = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);
    if (result?.error) setError("Invalid email or password.");
    else router.push("/dashboard");
  }

  const inputStyle: React.CSSProperties = {
    width: "100%", height: 42, paddingLeft: 38, paddingRight: 14,
    border: `0.5px solid ${C.border}`, borderRadius: 8,
    fontSize: 14, color: C.textPrimary, background: C.bg,
    outline: "none", fontFamily: "Inter, sans-serif",
    boxSizing: "border-box", transition: "border-color 0.15s ease",
  };

  return (
    <div style={{ minHeight: "100vh", position: "relative", display: "flex", alignItems: "center", justifyContent: "center", background: C.bg, fontFamily: "'Inter', sans-serif", padding: 24, overflow: "hidden" }}>
      {/* Background illustration — light mode only (looks washed out on dark) */}
      {theme !== "dark" && (
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
          <Image
            src="/image.png"
            alt=""
            width={900}
            height={660}
            priority
            style={{ width: "82vw", maxWidth: 760, height: "auto", opacity: 0.22, mixBlendMode: "multiply" }}
          />
        </div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        style={{ width: "100%", maxWidth: 380, position: "relative", zIndex: 10 }}
      >
        {/* Logo + heading */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 52, height: 52, borderRadius: 14, background: C.blush, marginBottom: 16 }}>
            <Heart style={{ width: 24, height: 24, color: C.primary, fill: C.primary }} />
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 500, color: C.textPrimary, margin: "0 0 4px", letterSpacing: "-0.01em" }}>Datelier</h1>
          <p style={{ fontSize: 13, color: C.textSecondary, margin: 0 }}>Welcome back — sign in to continue</p>
        </div>

        {/* Card */}
        <div style={{ background: C.surface, borderRadius: 12, border: `0.5px solid ${C.border}`, padding: 28 }}>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Email */}
            <div>
              <label style={{ fontSize: 12, fontWeight: 500, color: C.textPrimary, display: "block", marginBottom: 7 }}>Email</label>
              <div style={{ position: "relative" }}>
                <Mail style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", width: 15, height: 15, color: C.textSecondary }} />
                <input
                  type="email" value={email} required
                  placeholder="you@tdc.com"
                  onChange={(e) => setEmail(e.target.value)}
                  style={inputStyle}
                  onFocus={(e) => (e.target.style.borderColor = C.primary)}
                  onBlur={(e) => (e.target.style.borderColor = C.border)}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label style={{ fontSize: 12, fontWeight: 500, color: C.textPrimary, display: "block", marginBottom: 7 }}>Password</label>
              <div style={{ position: "relative" }}>
                <Lock style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", width: 15, height: 15, color: C.textSecondary }} />
                <input
                  type="password" value={password} required
                  placeholder="••••••••"
                  onChange={(e) => setPassword(e.target.value)}
                  style={inputStyle}
                  onFocus={(e) => (e.target.style.borderColor = C.primary)}
                  onBlur={(e) => (e.target.style.borderColor = C.border)}
                />
              </div>
            </div>

            {justRegistered && (
              <p style={{ fontSize: 13, color: C.success, background: C.blushBg, padding: "9px 12px", borderRadius: 8, margin: 0 }}>
                Account created — sign in below.
              </p>
            )}
            {error && (
              <p style={{ fontSize: 13, color: C.danger, margin: 0 }}>{error}</p>
            )}

            <button
              type="submit" disabled={loading}
              style={{
                width: "100%", height: 42, marginTop: 4,
                background: C.primary, color: "#FFF", border: "none", borderRadius: 8,
                fontSize: 14, fontWeight: 500, cursor: loading ? "default" : "pointer",
                fontFamily: "Inter, sans-serif", opacity: loading ? 0.7 : 1,
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              }}
            >
              {loading ? <Loader2 style={{ width: 15, height: 15 }} className="animate-spin" /> : "Sign In"}
            </button>
          </form>

          {/* Demo */}
          <button
            type="button"
            onClick={() => { setEmail("priya@tdc.com"); setPassword("password123"); }}
            style={{
              width: "100%", marginTop: 12, padding: "9px 0",
              background: "transparent", color: C.textSecondary,
              border: `0.5px dashed ${C.blush}`, borderRadius: 8,
              fontSize: 12, cursor: "pointer", fontFamily: "Inter, sans-serif",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = C.primary; e.currentTarget.style.borderColor = C.primary; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = C.textSecondary; e.currentTarget.style.borderColor = C.blush; }}
          >
            Try demo account
          </button>

          <p style={{ textAlign: "center", fontSize: 13, color: C.textSecondary, marginTop: 18, marginBottom: 0 }}>
            New to Datelier?{" "}
            <Link href="/signup" style={{ color: C.primary, fontWeight: 500, textDecoration: "none" }}>Create an account</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
