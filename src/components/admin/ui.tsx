import { type ReactNode } from "react";
import { motion } from "framer-motion";
import { EyeOff, Inbox, type LucideIcon } from "lucide-react";
import { STATUS_STYLES, PRIORITY_STYLES, type IssueStatus, type IssuePriority } from "@/lib/demo-data";
import { cn } from "@/lib/utils";

// ---- Stat card -------------------------------------------------------------
export function StatCard({
  icon: Icon,
  label,
  value,
  tone = "text-primary",
  delay = 0,
}: {
  icon: LucideIcon;
  label: string;
  value: ReactNode;
  tone?: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.35 }}
      className="glass-card rounded-2xl p-5"
    >
      <div className={cn("grid h-10 w-10 place-items-center rounded-xl bg-secondary/60", tone)}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="mt-4 text-3xl font-extrabold tracking-tight">{value}</div>
      <div className="mt-0.5 text-xs font-medium text-muted-foreground">{label}</div>
    </motion.div>
  );
}

// ---- Badges ----------------------------------------------------------------
export function StatusBadge({ status }: { status: IssueStatus | string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        STATUS_STYLES[status as IssueStatus] ?? "bg-muted text-muted-foreground border-border",
      )}
    >
      {status}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: IssuePriority | string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        PRIORITY_STYLES[priority as IssuePriority] ?? "bg-muted text-muted-foreground border-border",
      )}
    >
      {priority}
    </span>
  );
}

export function AnonBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-accent/30 bg-accent/15 px-2 py-0.5 text-[10px] font-medium text-accent">
      <EyeOff className="h-3 w-3" /> Anonymous
    </span>
  );
}

// ---- Avatar (initials) -----------------------------------------------------
const AVATAR_COLORS = [
  "bg-chart-1/20 text-chart-1",
  "bg-chart-2/20 text-chart-2",
  "bg-chart-3/20 text-chart-3",
  "bg-chart-4/20 text-chart-4",
  "bg-chart-5/20 text-chart-5",
];

export function initials(name?: string | null) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "?";
}

export function InitialsAvatar({
  name,
  size = "md",
  seed,
  src,
}: {
  name?: string | null;
  size?: "sm" | "md" | "lg";
  seed?: string;
  src?: string | null;
}) {
  const key = (seed ?? name ?? "?").split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const color = AVATAR_COLORS[key % AVATAR_COLORS.length];
  const dim = size === "lg" ? "h-16 w-16 text-xl" : size === "sm" ? "h-8 w-8 text-xs" : "h-10 w-10 text-sm";
  if (src) {
    return (
      <img
        src={src}
        alt={name ?? "Avatar"}
        className={cn("shrink-0 rounded-full object-cover", dim)}
      />
    );
  }
  return (
    <span
      className={cn(
        "grid shrink-0 place-items-center rounded-full font-bold",
        dim,
        color,
      )}
    >
      {initials(name)}
    </span>
  );
}


// ---- Empty state -----------------------------------------------------------
export function EmptyState({
  icon: Icon = Inbox,
  title,
  hint,
}: {
  icon?: LucideIcon;
  title: string;
  hint?: string;
}) {
  return (
    <div className="grid place-items-center gap-3 px-4 py-16 text-center">
      <div className="grid h-14 w-14 place-items-center rounded-2xl bg-secondary/60 text-muted-foreground">
        <Icon className="h-7 w-7" />
      </div>
      <div>
        <p className="font-semibold">{title}</p>
        {hint && <p className="mt-1 text-sm text-muted-foreground">{hint}</p>}
      </div>
    </div>
  );
}

// ---- Skeletons -------------------------------------------------------------
export function TableSkeleton({ rows = 6, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-3">
          {Array.from({ length: cols }).map((_, c) => (
            <div
              key={c}
              className="h-9 flex-1 animate-pulse rounded-lg bg-secondary/50"
              style={{ animationDelay: `${(r + c) * 40}ms` }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export function CardSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="h-48 animate-pulse rounded-2xl bg-secondary/40" />
      ))}
    </div>
  );
}

// ---- Section card ----------------------------------------------------------
export function SectionCard({
  title,
  action,
  children,
  className,
}: {
  title?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("glass-card rounded-2xl p-5 sm:p-6", className)}>
      {(title || action) && (
        <div className="mb-4 flex items-center justify-between gap-3">
          {typeof title === "string" ? <h2 className="text-base font-semibold">{title}</h2> : title}
          {action}
        </div>
      )}
      {children}
    </div>
  );
}

// ---- Helpers ---------------------------------------------------------------
export function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(value: string) {
  return new Date(value).toLocaleString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
