"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Heart, Mail, Lock, User, Loader2 } from "lucide-react";
import { C } from "@/lib/theme";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) setError(data.error ?? "Something went wrong.");
    else router.push("/?registered=1");
  }

  const inputStyle: React.CSSProperties = {
    width: "100%", height: 42, paddingLeft: 38, paddingRight: 14,
    border: `0.5px solid ${C.border}`, borderRadius: 8,
    fontSize: 14, color: C.textPrimary, background: C.bg,
    outline: "none", fontFamily: "Inter, sans-serif",
    boxSizing: "border-box", transition: "border-color 0.15s ease",
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: C.bg, fontFamily: "'Inter', sans-serif", padding: 24 }}>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        style={{ width: "100%", maxWidth: 380 }}
      >
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 52, height: 52, borderRadius: 14, background: C.blush, marginBottom: 16 }}>
            <Heart style={{ width: 24, height: 24, color: C.primary, fill: C.primary }} />
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 500, color: C.textPrimary, margin: "0 0 4px", letterSpacing: "-0.01em" }}>Datelier</h1>
          <p style={{ fontSize: 13, color: C.textSecondary, margin: 0 }}>Create your matchmaker account</p>
        </div>

        <div style={{ background: C.surface, borderRadius: 12, border: `0.5px solid ${C.border}`, padding: 28 }}>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 500, color: C.textPrimary, display: "block", marginBottom: 7 }}>Full Name</label>
              <div style={{ position: "relative" }}>
                <User style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", width: 15, height: 15, color: C.textSecondary }} />
                <input
                  type="text" value={name} required
                  placeholder="Priya Sharma"
                  onChange={(e) => setName(e.target.value)}
                  style={inputStyle}
                  onFocus={(e) => (e.target.style.borderColor = C.primary)}
                  onBlur={(e) => (e.target.style.borderColor = C.border)}
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 500, color: C.textPrimary, display: "block", marginBottom: 7 }}>Work Email</label>
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

            <div>
              <label style={{ fontSize: 12, fontWeight: 500, color: C.textPrimary, display: "block", marginBottom: 7 }}>Password</label>
              <div style={{ position: "relative" }}>
                <Lock style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", width: 15, height: 15, color: C.textSecondary }} />
                <input
                  type="password" value={password} required minLength={6}
                  placeholder="Min. 6 characters"
                  onChange={(e) => setPassword(e.target.value)}
                  style={inputStyle}
                  onFocus={(e) => (e.target.style.borderColor = C.primary)}
                  onBlur={(e) => (e.target.style.borderColor = C.border)}
                />
              </div>
            </div>

            {error && <p style={{ fontSize: 13, color: C.danger, margin: 0 }}>{error}</p>}

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
              {loading ? <Loader2 style={{ width: 15, height: 15 }} className="animate-spin" /> : "Create Account"}
            </button>
          </form>

          <p style={{ textAlign: "center", fontSize: 13, color: C.textSecondary, marginTop: 18, marginBottom: 0 }}>
            Already have an account?{" "}
            <Link href="/" style={{ color: C.primary, fontWeight: 500, textDecoration: "none" }}>Sign in</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
