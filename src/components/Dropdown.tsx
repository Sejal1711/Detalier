"use client";
import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";
import { C } from "@/lib/theme";

export type DropdownOption = { value: string; label: string };

// Custom select. We rolled our own instead of a native <select> because the
// browser's option list can't be themed (that blue highlight clashes badly).
export default function Dropdown({
  value,
  options,
  onChange,
  width = 160,
}: {
  value: string;
  options: DropdownOption[];
  onChange: (value: string) => void;
  width?: number;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = options.find((o) => o.value === value) ?? options[0];

  // Close on outside-click or Escape — only wire these up while the menu is open.
  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} style={{ position: "relative", width }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={{
          width: "100%", height: 34, padding: "0 12px",
          border: `0.5px solid ${open ? C.primary : C.border}`, borderRadius: 8,
          fontSize: 13, color: C.textPrimary, background: C.surface,
          cursor: "pointer", outline: "none", fontFamily: "Inter, sans-serif",
          display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8,
          transition: "border-color 0.15s ease",
        }}
      >
        <span>{selected?.label}</span>
        <ChevronDown style={{ width: 14, height: 14, color: C.textSecondary, transform: open ? "rotate(180deg)" : "none", transition: "transform 0.15s ease", flexShrink: 0 }} />
      </button>

      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 60,
          background: C.surface, border: `0.5px solid ${C.border}`, borderRadius: 8,
          boxShadow: "0 4px 16px rgba(0,0,0,0.06)", overflow: "hidden", padding: 4,
        }}>
          {options.map((opt) => {
            const isSel = opt.value === value;
            return (
              <div
                key={opt.value}
                onClick={() => { onChange(opt.value); setOpen(false); }}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8,
                  padding: "8px 10px", borderRadius: 6, cursor: "pointer",
                  fontSize: 13, fontWeight: isSel ? 500 : 400,
                  color: isSel ? C.primary : C.textPrimary,
                  background: isSel ? C.blushBg : "transparent",
                  transition: "background 0.12s ease",
                }}
                onMouseEnter={(e) => { if (!isSel) e.currentTarget.style.background = C.hover; }}
                onMouseLeave={(e) => { if (!isSel) e.currentTarget.style.background = "transparent"; }}
              >
                {opt.label}
                {isSel && <Check style={{ width: 13, height: 13, flexShrink: 0 }} />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
