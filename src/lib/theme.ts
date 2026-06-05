// Shared V2 theme tokens (dusty rose + cream, flat design).
// Values reference CSS variables defined in globals.css so the whole app
// flips between light and dark when the `.dark` class is toggled on <html>.
export const C = {
  primary:       "var(--c-primary)",
  bg:            "var(--c-bg)",
  surface:       "var(--c-surface)",
  blush:         "var(--c-blush)",
  blushBg:       "var(--c-blush-bg)",
  textPrimary:   "var(--c-text)",
  textSecondary: "var(--c-text-sec)",
  border:        "var(--c-border)",
  divider:       "var(--c-divider)",
  success:       "var(--c-success)",
  danger:        "var(--c-danger)",
  hover:         "var(--c-hover)",
  muted:         "var(--c-muted)",
  dangerBg:      "var(--c-danger-bg)",
  toggleOff:     "var(--c-toggle-off)",
} as const;

export const STATUS_MAP: Record<string, { bg: string; text: string; label: string }> = {
  active:  { bg: "#E8F5E0", text: "#2D5910", label: "Active"   },
  paused:  { bg: "#FEF3C7", text: "#92400E", label: "Pending"  },
  matched: { bg: "#F4C0D1", text: "#7A2040", label: "Matched"  },
  on_hold: { bg: "#F1F0EF", text: "#5A5550", label: "On Hold"  },
};

export function avatarStyle(gender?: string | null) {
  return gender === "female"
    ? { bg: "#F9E0E8", text: "#A83060" }
    : { bg: "#E0EAFA", text: "#2C4F8A" };
}
