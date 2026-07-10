import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Download, FileText, CheckCircle2, Timer, TrendingUp, Percent } from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from "recharts";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAdminData } from "@/components/admin/AdminDataContext";
import { StatCard, SectionCard, EmptyState } from "@/components/admin/ui";
import { CategoryChart, StatusChart, MonthlyTrendChart, CHART_COLORS } from "@/components/admin/charts";
import { RESOLVED_STATES, exportToCsv } from "@/lib/admin";

export const Route = createFileRoute("/admin-dashboard/analytics")({
  component: Analytics,
});

const RANGES = { "7d": "This Week", "30d": "This Month", "90d": "Last 3 Months", "365d": "Last Year" };

function daysFor(range: keyof typeof RANGES) {
  return { "7d": 7, "30d": 30, "90d": 90, "365d": 365 }[range];
}

function Analytics() {
  const { issues, staff } = useAdminData();
  const [range, setRange] = useState<keyof typeof RANGES>("30d");

  const scoped = useMemo(() => {
    const cutoff = Date.now() - daysFor(range) * 86400000;
    return issues.filter((i) => new Date(i.created_at).getTime() >= cutoff);
  }, [issues, range]);

  const kpis = useMemo(() => {
    const total = scoped.length;
    const resolved = scoped.filter((i) => RESOLVED_STATES.includes(i.status));
    const rate = total ? Math.round((resolved.length / total) * 100) : 0;
    const times = resolved.map(
      (i) => (new Date(i.updated_at).getTime() - new Date(i.created_at).getTime()) / 86400000,
    );
    const avg = times.length ? (times.reduce((a, b) => a + b, 0) / times.length).toFixed(1) : "0";
    return { total, resolved: resolved.length, rate, avg };
  }, [scoped]);

  const officerPerf = useMemo(() => {
    return staff
      .map((s) => ({
        name: s.name.split(" ")[0],
        completed: s.completed,
        active: s.active,
      }))
      .filter((s) => s.completed + s.active > 0)
      .sort((a, b) => b.completed - a.completed)
      .slice(0, 8);
  }, [staff]);

  const exportCsv = () => {
    exportToCsv(
      `complaints-${range}.csv`,
      scoped.map((i) => ({
        ticket_id: i.ticket_id,
        title: i.title,
        category: i.category,
        status: i.status,
        priority: i.priority,
        citizen: i.is_anonymous ? "Anonymous" : i.citizenName,
        officer: i.officerName ?? "",
        location: i.location ?? "",
        created_at: i.created_at,
      })),
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold">Analytics</h2>
          <p className="text-sm text-muted-foreground">Performance insights across the city</p>
        </div>
        <div className="flex gap-2">
          <Select value={range} onValueChange={(v) => setRange(v as keyof typeof RANGES)}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(RANGES).map(([k, label]) => (
                <SelectItem key={k} value={k}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="hero" onClick={exportCsv} disabled={scoped.length === 0}>
            <Download className="h-4 w-4" /> Export CSV
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={FileText} label="Complaints" value={kpis.total} />
        <StatCard icon={CheckCircle2} label="Resolved" value={kpis.resolved} tone="text-success" delay={0.05} />
        <StatCard icon={Percent} label="Resolution Rate" value={`${kpis.rate}%`} tone="text-primary" delay={0.1} />
        <StatCard icon={Timer} label="Avg. Resolution" value={`${kpis.avg}d`} tone="text-accent" delay={0.15} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <SectionCard title="Citizen Reporting Trend" className="lg:col-span-2">
          <MonthlyTrendChart issues={issues} months={12} />
        </SectionCard>
        <SectionCard title="Complaints by Category">
          <CategoryChart issues={scoped} />
        </SectionCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard title="Complaints by Status">
          <StatusChart issues={scoped} />
        </SectionCard>
        <SectionCard title="Officer Performance">
          {officerPerf.length === 0 ? (
            <div className="grid h-64 place-items-center">
              <EmptyState icon={TrendingUp} title="No officer activity" hint="Assign complaints to see performance." />
            </div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={officerPerf} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 8%)" vertical={false} />
                  <XAxis dataKey="name" stroke="oklch(0.714 0.019 261)" fontSize={11} />
                  <YAxis stroke="oklch(0.714 0.019 261)" fontSize={11} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      background: "var(--popover)",
                      border: "1px solid var(--border)",
                      borderRadius: 12,
                      fontSize: 12,
                    }}
                    cursor={{ fill: "oklch(1 0 0 / 5%)" }}
                  />
                  <Bar dataKey="completed" name="Completed" radius={[6, 6, 0, 0]}>
                    {officerPerf.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </SectionCard>
      </div>
    </div>
  );
}
