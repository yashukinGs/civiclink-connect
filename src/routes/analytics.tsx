import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { SiteLayout, PageHeader } from "@/components/site/SiteLayout";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/analytics")({
  head: () => ({
    meta: [
      { title: "Analytics — CivicConnect" },
      { name: "description", content: "Interactive analytics on civic complaints and resolutions." },
      { property: "og:title", content: "CivicConnect Analytics" },
      { property: "og:description", content: "Trends, categories, and resolution insights." },
    ],
  }),
  component: Analytics,
});

const PIE_COLORS = [
  "oklch(0.7 0.16 215)",
  "oklch(0.62 0.2 285)",
  "oklch(0.72 0.17 158)",
  "oklch(0.8 0.16 75)",
  "oklch(0.62 0.22 18)",
  "oklch(0.68 0.03 255)",
];

const tooltipStyle = {
  background: "oklch(0.2 0.035 264)",
  border: "1px solid oklch(0.3 0.04 264)",
  borderRadius: 12,
  color: "#fff",
};

type Category = { name: string; value: number };
type Trend = { month: string; reported: number; resolved: number };
type Resolution = { month: string; days: number };

function Analytics() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [trend, setTrend] = useState<Trend[]>([]);
  const [resolution, setResolution] = useState<Resolution[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [cat, tr, res] = await Promise.all([
        supabase.rpc("get_category_counts"),
        supabase.rpc("get_monthly_trend"),
        supabase.rpc("get_resolution_trend"),
      ]);
      setCategories((cat.data as Category[]) ?? []);
      setTrend((tr.data as Trend[]) ?? []);
      setResolution(((res.data as { month: string; days: number }[]) ?? []).map((r) => ({ month: r.month, days: Number(r.days) })));
      setLoading(false);
    };
    load();

    const channel = supabase
      .channel("analytics")
      .on("postgres_changes", { event: "*", schema: "public", table: "issues" }, () => load())
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const hasData = categories.length > 0;

  return (
    <SiteLayout>
      <div className="py-8">
        <PageHeader
          eyebrow="Analytics"
          title="City insights & trends"
          subtitle="Understand complaint patterns and track resolution performance over time."
        />

        {!loading && !hasData ? (
          <div className="mx-auto mt-12 max-w-6xl px-4">
            <div className="glass-card rounded-2xl p-12 text-center">
              <p className="text-base font-medium">No data to analyze yet.</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Statistics will appear once reports are submitted.
              </p>
            </div>
          </div>
        ) : (
          <div className="mx-auto mt-12 grid max-w-6xl gap-6 px-4 lg:grid-cols-2">
            <div className="glass-card rounded-2xl p-6">
              <h2 className="text-sm font-semibold">Complaint Trends</h2>
              <div className="mt-4 h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.3 0.04 264 / 40%)" />
                    <XAxis dataKey="month" stroke="oklch(0.68 0.03 255)" fontSize={12} />
                    <YAxis stroke="oklch(0.68 0.03 255)" fontSize={12} allowDecimals={false} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Line type="monotone" dataKey="reported" stroke="oklch(0.7 0.16 215)" strokeWidth={2.5} dot={false} />
                    <Line type="monotone" dataKey="resolved" stroke="oklch(0.72 0.17 158)" strokeWidth={2.5} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="glass-card rounded-2xl p-6">
              <h2 className="text-sm font-semibold">Issues by Category</h2>
              <div className="mt-4 h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categories}>
                    <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.3 0.04 264 / 40%)" />
                    <XAxis dataKey="name" stroke="oklch(0.68 0.03 255)" fontSize={11} />
                    <YAxis stroke="oklch(0.68 0.03 255)" fontSize={12} allowDecimals={false} />
                    <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "oklch(0.3 0.04 264 / 30%)" }} />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                      {categories.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="glass-card rounded-2xl p-6">
              <h2 className="text-sm font-semibold">Avg. Resolution Time (days)</h2>
              <div className="mt-4 h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={resolution}>
                    <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.3 0.04 264 / 40%)" />
                    <XAxis dataKey="month" stroke="oklch(0.68 0.03 255)" fontSize={12} />
                    <YAxis stroke="oklch(0.68 0.03 255)" fontSize={12} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Line type="monotone" dataKey="days" stroke="oklch(0.62 0.2 285)" strokeWidth={2.5} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="glass-card rounded-2xl p-6">
              <h2 className="text-sm font-semibold">Category Share</h2>
              <div className="mt-4 h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={categories} dataKey="value" nameKey="name" innerRadius={45} outerRadius={80} paddingAngle={3}>
                      {categories.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}
      </div>
    </SiteLayout>
  );
}
