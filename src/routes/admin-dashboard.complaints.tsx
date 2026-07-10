import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, SlidersHorizontal, ChevronLeft, ChevronRight, Layers } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useAdminData } from "@/components/admin/AdminDataContext";
import {
  StatusBadge,
  PriorityBadge,
  AnonBadge,
  TableSkeleton,
  EmptyState,
  SectionCard,
  formatDate,
} from "@/components/admin/ui";
import { ComplaintDrawer } from "@/components/admin/ComplaintDrawer";
import { STATUS_OPTIONS, PRIORITY_OPTIONS, RESOLVED_STATES, type AdminIssue } from "@/lib/admin";
import { CATEGORIES } from "@/lib/demo-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin-dashboard/complaints")({
  component: Complaints,
});

const PAGE_SIZE = 10;
const DATE_RANGES = { all: "All time", today: "Today", "7d": "Last 7 days", "30d": "Last 30 days" };

function withinRange(date: string, range: keyof typeof DATE_RANGES) {
  if (range === "all") return true;
  const d = new Date(date).getTime();
  const now = Date.now();
  const day = 86400000;
  if (range === "today") return new Date(date).toDateString() === new Date().toDateString();
  if (range === "7d") return now - d <= 7 * day;
  if (range === "30d") return now - d <= 30 * day;
  return true;
}

function Complaints() {
  const { issues, staff, loading, reload } = useAdminData();
  const [selected, setSelected] = useState<AdminIssue | null>(null);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [category, setCategory] = useState("all");
  const [priority, setPriority] = useState("all");
  const [range, setRange] = useState<keyof typeof DATE_RANGES>("all");
  const [page, setPage] = useState(1);

  const categoryCards = useMemo(() => {
    return CATEGORIES.map((name) => {
      const mine = issues.filter((i) => i.category === name);
      return {
        name,
        total: mine.length,
        pending: mine.filter((i) => i.status === "Pending").length,
        resolved: mine.filter((i) => RESOLVED_STATES.includes(i.status)).length,
      };
    });
  }, [issues]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return issues.filter((i) => {
      if (status !== "all" && i.status !== status) return false;
      if (category !== "all" && i.category !== category) return false;
      if (priority !== "all" && i.priority !== priority) return false;
      if (!withinRange(i.created_at, range)) return false;
      if (q) {
        const hay = `${i.ticket_id} ${i.title} ${i.category} ${i.location ?? ""} ${
          i.is_anonymous ? "anonymous" : i.citizenName
        } ${i.officerName ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [issues, search, status, category, priority, range]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paged = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const resetToFirst = () => setPage(1);

  return (
    <div className="space-y-6">
      {/* Category cards */}
      <SectionCard
        title={
          <h2 className="flex items-center gap-2 text-base font-semibold">
            <Layers className="h-4 w-4 text-primary" /> Issues by Category
          </h2>
        }
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {categoryCards.map((c) => (
            <button
              key={c.name}
              onClick={() => {
                setCategory((prev) => (prev === c.name ? "all" : c.name));
                resetToFirst();
              }}
              className={cn(
                "rounded-xl border p-4 text-left transition-all hover:-translate-y-0.5",
                category === c.name
                  ? "border-primary/60 bg-primary/10 shadow-glow"
                  : "border-border bg-secondary/20 hover:border-primary/30",
              )}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">{c.name}</span>
                <span className="text-lg font-extrabold">{c.total}</span>
              </div>
              <div className="mt-2 flex gap-3 text-xs text-muted-foreground">
                <span className="text-warning">{c.pending} pending</span>
                <span className="text-success">{c.resolved} resolved</span>
              </div>
            </button>
          ))}
        </div>
      </SectionCard>

      {/* Filters + table */}
      <SectionCard
        title={
          <h2 className="flex items-center gap-2 text-base font-semibold">
            <SlidersHorizontal className="h-4 w-4 text-primary" /> All Complaints
            <span className="text-sm font-normal text-muted-foreground">({filtered.length})</span>
          </h2>
        }
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div className="relative sm:col-span-2 lg:col-span-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                resetToFirst();
              }}
              placeholder="Search complaints…"
              className="pl-9"
            />
          </div>
          <FilterSelect value={status} onChange={(v) => { setStatus(v); resetToFirst(); }} placeholder="All statuses" options={STATUS_OPTIONS} />
          <FilterSelect value={category} onChange={(v) => { setCategory(v); resetToFirst(); }} placeholder="All categories" options={CATEGORIES} />
          <FilterSelect value={priority} onChange={(v) => { setPriority(v); resetToFirst(); }} placeholder="All priorities" options={PRIORITY_OPTIONS} />
          <Select value={range} onValueChange={(v) => { setRange(v as keyof typeof DATE_RANGES); resetToFirst(); }}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(DATE_RANGES).map(([k, label]) => (
                <SelectItem key={k} value={k}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="mt-5">
          {loading ? (
            <TableSkeleton rows={8} cols={7} />
          ) : filtered.length === 0 ? (
            <EmptyState title="No complaints match your filters" hint="Try clearing search or filters." />
          ) : (
            <>
              <div className="scroll-slim -mx-2 overflow-x-auto px-2">
                <table className="w-full min-w-[960px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-border text-xs uppercase text-muted-foreground">
                      <th className="pb-3 pr-4 font-medium">ID</th>
                      <th className="pb-3 pr-4 font-medium">Citizen</th>
                      <th className="pb-3 pr-4 font-medium">Category</th>
                      <th className="pb-3 pr-4 font-medium">Location</th>
                      <th className="pb-3 pr-4 font-medium">Officer</th>
                      <th className="pb-3 pr-4 font-medium">Status</th>
                      <th className="pb-3 pr-4 font-medium">Priority</th>
                      <th className="pb-3 pr-4 font-medium">Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paged.map((issue) => (
                      <tr
                        key={issue.id}
                        onClick={() => setSelected(issue)}
                        className="cursor-pointer border-b border-border/50 transition-colors hover:bg-secondary/40"
                      >
                        <td className="py-3 pr-4 font-mono font-semibold text-primary">{issue.ticket_id}</td>
                        <td className="py-3 pr-4">{issue.is_anonymous ? <AnonBadge /> : issue.citizenName}</td>
                        <td className="py-3 pr-4">{issue.category}</td>
                        <td className="max-w-[160px] truncate py-3 pr-4 text-muted-foreground">{issue.location || "—"}</td>
                        <td className="py-3 pr-4 text-muted-foreground">{issue.officerName ?? "—"}</td>
                        <td className="py-3 pr-4"><StatusBadge status={issue.status} /></td>
                        <td className="py-3 pr-4"><PriorityBadge priority={issue.priority} /></td>
                        <td className="py-3 pr-4 text-muted-foreground">{formatDate(issue.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    Page {safePage} of {totalPages}
                  </span>
                  <div className="flex gap-2">
                    <Button variant="glass" size="sm" disabled={safePage <= 1} onClick={() => setPage((p) => p - 1)}>
                      <ChevronLeft className="h-4 w-4" /> Prev
                    </Button>
                    <Button variant="glass" size="sm" disabled={safePage >= totalPages} onClick={() => setPage((p) => p + 1)}>
                      Next <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </SectionCard>

      <ComplaintDrawer
        issue={selected}
        staff={staff}
        open={!!selected}
        onOpenChange={(v) => !v && setSelected(null)}
        onChanged={reload}
      />
    </div>
  );
}

function FilterSelect({
  value,
  onChange,
  placeholder,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  options: readonly string[];
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">{placeholder}</SelectItem>
        {options.map((o) => (
          <SelectItem key={o} value={o}>
            {o}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
