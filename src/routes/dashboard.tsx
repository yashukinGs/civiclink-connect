import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  FileText,
  CheckCircle2,
  Clock,
  Eye,
  Bell,
  Plus,
  Award,
  TrendingUp,
  Inbox,
} from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { STATUS_STYLES, PRIORITY_STYLES, type IssueStatus, type IssuePriority } from "@/lib/demo-data";
import { useAuth } from "@/lib/auth";
import { useAllIssues, useMyIssues } from "@/lib/issues";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/dashboard")({
  component: Dashboard,
});

function timeAgo(value: string) {
  const diff = Date.now() - new Date(value).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function Dashboard() {
  const { isLoggedIn, loading } = useAuth();
  const navigate = useNavigate();
  const { issues, loading: issuesLoading } = useAllIssues(!loading && isLoggedIn);
  const [name, setName] = useState<string>("");

  useEffect(() => {
    if (!loading && !isLoggedIn) navigate({ to: "/login" });
  }, [loading, isLoggedIn, navigate]);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      const { data: profile } = await supabase
        .from("profiles")
        .select("name")
        .eq("id", data.user.id)
        .maybeSingle();
      setName(profile?.name?.split(" ")[0] || data.user.email?.split("@")[0] || "");
    });
  }, []);

  const stats = useMemo(() => {
    const resolved = issues.filter((i) => ["Resolved", "Closed"].includes(i.status)).length;
    const pending = issues.filter((i) => i.status === "Pending").length;
    const review = issues.filter((i) => ["Verified", "Assigned", "In Progress"].includes(i.status)).length;
    return [
      { icon: FileText, label: "Total Reported", value: issues.length, tone: "text-primary" },
      { icon: CheckCircle2, label: "Resolved", value: resolved, tone: "text-success" },
      { icon: Clock, label: "Pending", value: pending, tone: "text-warning" },
      { icon: Eye, label: "Under Review", value: review, tone: "text-accent" },
    ];
  }, [issues]);

  const points = issues.length * 50 + issues.filter((i) => ["Resolved", "Closed"].includes(i.status)).length * 100;
  const badge = points >= 1000 ? "City Hero" : points >= 400 ? "Gold Reporter" : points > 0 ? "Active Citizen" : "New Reporter";

  if (loading || !isLoggedIn) return null;

  return (
    <SiteLayout>
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-3xl font-bold">Welcome back, {name || "Citizen"} 👋</h1>
            <p className="mt-1 text-muted-foreground">Here's what's happening with your reports.</p>
          </div>
          <Button asChild variant="hero">
            <Link to="/report">
              <Plus className="h-4 w-4" /> Report New Issue
            </Link>
          </Button>
        </div>

        {/* Stats */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="glass-card rounded-2xl p-5"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{s.label}</span>
                <s.icon className={`h-5 w-5 ${s.tone}`} />
              </div>
              <div className="mt-2 text-3xl font-extrabold">{s.value}</div>
            </motion.div>
          ))}
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          {/* Recent issues */}
          <div className="glass-card rounded-2xl p-6 lg:col-span-2">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Recent Activity</h2>
              <Link to="/track" className="text-sm text-primary hover:underline">
                Track a complaint
              </Link>
            </div>
            <div className="mt-4 space-y-3">
              {issuesLoading ? (
                <p className="py-8 text-center text-sm text-muted-foreground">Loading your reports…</p>
              ) : issues.length === 0 ? (
                <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border bg-secondary/20 py-12 text-center">
                  <Inbox className="h-8 w-8 text-muted-foreground" />
                  <p className="text-sm font-medium">No reports yet.</p>
                  <p className="text-xs text-muted-foreground">
                    Your submitted complaints will appear here.
                  </p>
                  <Button asChild variant="glass" size="sm">
                    <Link to="/report">Report your first issue</Link>
                  </Button>
                </div>
              ) : (
                issues.slice(0, 6).map((issue) => (
                  <Link
                    key={issue.id}
                    to="/track"
                    search={{ id: issue.ticket_id }}
                    className="flex flex-col gap-2 rounded-xl border border-border/60 bg-secondary/30 p-4 transition-colors hover:border-primary/40 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-primary">{issue.ticket_id}</span>
                        <span
                          className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${
                            PRIORITY_STYLES[issue.priority as IssuePriority] ?? ""
                          }`}
                        >
                          {issue.priority}
                        </span>
                      </div>
                      <p className="mt-1 text-sm font-medium">{issue.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {issue.category}
                        {issue.location ? ` • ${issue.location}` : ""}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 self-start rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                        STATUS_STYLES[issue.status as IssueStatus] ?? ""
                      }`}
                    >
                      {issue.status}
                    </span>
                  </Link>
                ))
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="glass-card rounded-2xl p-6">
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold">Recent Updates</h2>
              </div>
              <div className="mt-4 space-y-3">
                {issues.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No recent activity.</p>
                ) : (
                  issues.slice(0, 4).map((issue) => (
                    <div key={issue.id} className="rounded-lg border border-border/60 bg-secondary/30 p-3">
                      <p className="text-sm">
                        {issue.ticket_id} is{" "}
                        <span className="font-medium">{issue.status}</span>.
                      </p>
                      <span className="text-xs text-muted-foreground">{timeAgo(issue.updated_at)}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="glass-card rounded-2xl p-6">
              <div className="flex items-center gap-2">
                <Award className="h-5 w-5 text-warning" />
                <h2 className="text-lg font-semibold">Your Rewards</h2>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <div>
                  <div className="text-2xl font-extrabold text-gradient">{points.toLocaleString()} pts</div>
                  <div className="text-xs text-muted-foreground">{badge} badge</div>
                </div>
                <TrendingUp className="h-8 w-8 text-success" />
              </div>
              <Link to="/community" className="mt-4 inline-block text-sm text-primary hover:underline">
                View leaderboard →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </SiteLayout>
  );
}
