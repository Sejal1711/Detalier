import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground",
        secondary: "border-transparent bg-secondary text-secondary-foreground",
        destructive: "border-transparent bg-destructive text-destructive-foreground",
        outline: "text-foreground",
        active: "border-transparent bg-emerald-100 text-emerald-700",
        paused: "border-transparent bg-amber-100 text-amber-700",
        matched: "border-transparent bg-blue-100 text-blue-700",
        on_hold: "border-transparent bg-slate-100 text-slate-600",
        high: "border-transparent bg-rose-100 text-rose-700",
        good: "border-transparent bg-orange-100 text-orange-700",
        moderate: "border-transparent bg-yellow-100 text-yellow-700",
        low: "border-transparent bg-slate-100 text-slate-600",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
