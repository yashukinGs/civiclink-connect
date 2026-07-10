import { useMemo } from "react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import type { AdminIssue } from "@/lib/admin";
import { RESOLVED_STATES } from "@/lib/admin";
import { EmptyState } from "@/components/admin/ui";
import { BarChart3 } from "lucide-react";

export const CHART_COLORS = [
  "oklch(0.769 0.165 70)",
  "oklch(0.68 0.19 48)",
  "oklch(0.72 0.17 158)",
  "oklch(0.62 0.18 240)",
  "oklch(0.62 0.2 285)",
  "oklch(0.8 0.16 75)",
  "oklch(0.62 0.22 18)",
  "oklch(0.7 0.05 255)",
];

const tooltipStyle = {
  background: "var(--popover)",
  border: "1px solid var(--border)",
  borderRadius: 12,
  color: "var(--foreground)",
  fontSize: 12,
};

const AXIS = "oklch(0.714 0.019 261)";

function ChartEmpty() {
  return (
    <div className="grid h-64 place-items-center">
      <EmptyState icon={BarChart3} title="No data yet" hint="Charts appear once complaints are filed." />
    </div>
  );
}

export function CategoryChart({ issues }: { issues: AdminIssue[] }) {
  const data = useMemo(() => {
    const map = new Map<string, number>();
    for (const i of issues) map.set(i.category, (map.get(i.category) ?? 0) + 1);
    return Array.from(map, ([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [issues]);

  if (data.length === 0) return <ChartEmpty />;

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius={48} outerRadius={82} paddingAngle={3}>
            {data.map((_, i) => (
              <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip contentStyle={tooltipStyle} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export function StatusChart({ issues }: { issues: AdminIssue[] }) {
  const data = useMemo(() => {
    const map = new Map<string, number>();
    for (const i of issues) map.set(i.status, (map.get(i.status) ?? 0) + 1);
    return Array.from(map, ([name, value]) => ({ name, value }));
  }, [issues]);

  if (data.length === 0) return <ChartEmpty />;

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 8%)" vertical={false} />
          <XAxis dataKey="name" stroke={AXIS} fontSize={10} interval={0} angle={-20} textAnchor="end" height={50} />
          <YAxis stroke={AXIS} fontSize={11} allowDecimals={false} />
          <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "oklch(1 0 0 / 5%)" }} />
          <Bar dataKey="value" radius={[6, 6, 0, 0]}>
            {data.map((_, i) => (
              <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function MonthlyTrendChart({ issues, months = 6 }: { issues: AdminIssue[]; months?: number }) {
  const data = useMemo(() => {
    const now = new Date();
    const buckets: { key: string; month: string; reported: number; resolved: number }[] = [];
    for (let m = months - 1; m >= 0; m--) {
      const d = new Date(now.getFullYear(), now.getMonth() - m, 1);
      buckets.push({
        key: `${d.getFullYear()}-${d.getMonth()}`,
        month: d.toLocaleDateString(undefined, { month: "short" }),
        reported: 0,
        resolved: 0,
      });
    }
    const idx = new Map(buckets.map((b, i) => [b.key, i]));
    for (const i of issues) {
      const c = new Date(i.created_at);
      const at = idx.get(`${c.getFullYear()}-${c.getMonth()}`);
      if (at !== undefined) {
        buckets[at].reported += 1;
        if (RESOLVED_STATES.includes(i.status)) buckets[at].resolved += 1;
      }
    }
    return buckets;
  }, [issues, months]);

  const hasData = data.some((d) => d.reported > 0);
  if (!hasData) return <ChartEmpty />;

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 8%)" vertical={false} />
          <XAxis dataKey="month" stroke={AXIS} fontSize={11} />
          <YAxis stroke={AXIS} fontSize={11} allowDecimals={false} />
          <Tooltip contentStyle={tooltipStyle} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Line type="monotone" dataKey="reported" name="Reported" stroke={CHART_COLORS[0]} strokeWidth={2.5} dot={false} />
          <Line type="monotone" dataKey="resolved" name="Resolved" stroke={CHART_COLORS[2]} strokeWidth={2.5} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
