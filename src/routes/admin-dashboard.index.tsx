import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { FileText, Clock, Activity, CheckCircle2, Users, UserCog } from "lucide-react";
import { useAdminData } from "@/components/admin/AdminDataContext";
import { StatCard, StatusBadge, PriorityBadge, AnonBadge, TableSkeleton, EmptyState, SectionCard, formatDate } from "@/components/admin/ui";
import { CategoryChart, StatusChart, MonthlyTrendChart } from "@/components/admin/charts";
import { ComplaintDrawer } from "@/components/admin/ComplaintDrawer";
import { IN_PROGRESS_STATES, RESOLVED_STATES, type AdminIssue } from "@/lib/admin";

export const Route = createFileRoute("/admin-dashboard/")({
  component: Overview,
});

function Overview() {
  const { issues, staff, users, loading, reload } = useAdminData();
  const [selected, setSelected] = useState<AdminIssue | null>(null);

  const stats = useMemo(() => {
    const pending = issues.filter((i) => i.status === "Pending").length;
    const inProgress = issues.filter((i) => IN_PROGRESS_STATES.includes(i.status)).length;
    const resolved = issues.filter((i) => RESOLVED_STATES.includes(i.status)).length;
    const officers = users.filter((u) => u.isOfficer).length + staff.length;
    return [
      { icon: FileText, label: "Total Complaints", value: issues.length, tone: "text-primary" },
      { icon: Clock, label: "Pending", value: pending, tone: "text-warning" },
      { icon: Activity, label: "In Progress", value: inProgress, tone: "text-accent" },
      { icon: CheckCircle2, label: "Resolved", value: resolved, tone: "text-success" },
      { icon: Users, label: "Total Users", value: users.length, tone: "text-chart-4" },
      { icon: UserCog, label: "Total Officers", value: officers, tone: "text-chart-5" },
    ];
  }, [issues, users, staff]);

  const recent = useMemo(() => issues.slice(0, 10), [issues]);

  return (
    <div className="space-y-8">
      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {stats.map((s, i) => (
          <StatCard key={s.label} {...s} delay={i * 0.05} />
        ))}
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-3">
        <SectionCard title="Monthly Complaints" className="lg:col-span-2">
          <MonthlyTrendChart issues={issues} />
        </SectionCard>
        <SectionCard title="By Category">
          <CategoryChart issues={issues} />
        </SectionCard>
      </div>
      <SectionCard title="Complaints by Status">
        <StatusChart issues={issues} />
      </SectionCard>

      {/* Recent complaints */}
      <SectionCard title="Recent Complaints">
        {loading ? (
          <TableSkeleton rows={6} cols={7} />
        ) : recent.length === 0 ? (
          <EmptyState title="No complaints yet" hint="New reports from citizens will appear here." />
        ) : (
          <div className="scroll-slim -mx-2 overflow-x-auto px-2">
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs uppercase text-muted-foreground">
                  <th className="pb-3 pr-4 font-medium">ID</th>
                  <th className="pb-3 pr-4 font-medium">Category</th>
                  <th className="pb-3 pr-4 font-medium">Citizen</th>
                  <th className="pb-3 pr-4 font-medium">Officer</th>
                  <th className="pb-3 pr-4 font-medium">Status</th>
                  <th className="pb-3 pr-4 font-medium">Priority</th>
                  <th className="pb-3 pr-4 font-medium">Created</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((issue) => (
                  <tr
                    key={issue.id}
                    onClick={() => setSelected(issue)}
                    className="cursor-pointer border-b border-border/50 transition-colors hover:bg-secondary/40"
                  >
                    <td className="py-3 pr-4 font-mono font-semibold text-primary">{issue.ticket_id}</td>
                    <td className="py-3 pr-4">{issue.category}</td>
                    <td className="py-3 pr-4">
                      <span className="flex items-center gap-1.5">
                        {issue.is_anonymous ? <AnonBadge /> : issue.citizenName}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-muted-foreground">{issue.officerName ?? "—"}</td>
                    <td className="py-3 pr-4"><StatusBadge status={issue.status} /></td>
                    <td className="py-3 pr-4"><PriorityBadge priority={issue.priority} /></td>
                    <td className="py-3 pr-4 text-muted-foreground">{formatDate(issue.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
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
