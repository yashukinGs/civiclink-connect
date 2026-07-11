import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Search, MapPin, CheckCircle2, Circle, Clock, Loader2, Mail } from "lucide-react";
import { SiteLayout, PageHeader } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AttachmentGallery } from "@/components/site/AttachmentGallery";
import { TRACK_STAGES, STATUS_STYLES, PRIORITY_STYLES, type IssueStatus, type IssuePriority } from "@/lib/demo-data";
import { getIssueByTicket, attachmentsForIssue, type Attachment } from "@/lib/issues";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/track")({
  validateSearch: (search: Record<string, unknown>) => ({
    id: typeof search.id === "string" ? search.id : "",
  }),
  component: TrackIssue,
});

interface TrackedIssue {
  ticket_id: string;
  title: string;
  category: string;
  priority: string;
  description: string;
  location: string | null;
  image_url: string | null;
  attachments?: Attachment[] | unknown;
  status: string;
  created_at: string;
  updated_at: string;
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function TrackIssue() {
  const { id } = Route.useSearch();
  const { isLoggedIn, loading } = useAuth();
  const navigate = useNavigate();

  const [query, setQuery] = useState(id);
  const [issue, setIssue] = useState<TrackedIssue | null>(null);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    if (!loading && !isLoggedIn) {
      navigate({ to: "/login" });
    }
  }, [loading, isLoggedIn, navigate]);

  const runSearch = async (ticket: string) => {
    if (!ticket.trim()) return;
    setSearching(true);
    setSearched(true);
    try {
      const found = await getIssueByTicket(ticket);
      setIssue((found as TrackedIssue) ?? null);
    } catch {
      setIssue(null);
    } finally {
      setSearching(false);
    }
  };

  useEffect(() => {
    if (id && isLoggedIn) {
      setQuery(id);
      runSearch(id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, isLoggedIn]);

  if (loading || !isLoggedIn) return null;

  const currentIndex = issue ? TRACK_STAGES.indexOf(issue.status as IssueStatus) : -1;

  return (
    <SiteLayout>
      <div className="py-8">
        <PageHeader
          eyebrow="Track"
          title="Track Your Complaint"
          subtitle="Enter your Complaint ID to see live status and timeline."
        />

        <div className="mx-auto mt-10 max-w-2xl px-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="e.g. CC-2026-0001"
                className="pl-9"
                onKeyDown={(e) => e.key === "Enter" && runSearch(query)}
              />
            </div>
            <Button variant="hero" onClick={() => runSearch(query)} disabled={searching}>
              {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : "Track"}
            </Button>
          </div>
        </div>

        {searched && !searching && !issue && (
          <div className="mx-auto mt-10 max-w-2xl px-4">
            <div className="glass-card rounded-2xl p-8 text-center text-muted-foreground">
              No complaint found with that ID. Please check the ID and try again.
            </div>
          </div>
        )}

        {issue && (
          <motion.div
            key={issue.ticket_id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-auto mt-10 grid max-w-5xl gap-6 px-4 lg:grid-cols-5"
          >
            {/* Details */}
            <div className="glass-card rounded-2xl p-6 lg:col-span-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-primary">{issue.ticket_id}</span>
                <span
                  className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                    STATUS_STYLES[issue.status as IssueStatus] ?? ""
                  }`}
                >
                  {issue.status}
                </span>
              </div>
              <h3 className="mt-3 text-lg font-semibold">{issue.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{issue.description}</p>

              <AttachmentGallery
                attachments={attachmentsForIssue(issue)}
                className="mt-4"
              />


              <dl className="mt-5 space-y-3 text-sm">
                <Row label="Category" value={issue.category} />
                <Row label="Priority">
                  <span
                    className={`rounded-full border px-2 py-0.5 text-xs font-medium ${
                      PRIORITY_STYLES[issue.priority as IssuePriority] ?? ""
                    }`}
                  >
                    {issue.priority}
                  </span>
                </Row>
                <Row label="Location">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 text-primary" /> {issue.location || "Not provided"}
                  </span>
                </Row>
                <Row label="Reported on" value={formatDate(issue.created_at)} />
              </dl>
            </div>

            {/* Progress + timeline */}
            <div className="glass-card rounded-2xl p-6 lg:col-span-3">
              <h4 className="text-sm font-semibold">Status Progress</h4>
              <div className="mt-5 flex items-center">
                {TRACK_STAGES.map((stage, i) => {
                  const done = i <= currentIndex;
                  return (
                    <div key={stage} className="flex flex-1 items-center last:flex-none">
                      <div className="flex flex-col items-center">
                        <div
                          className={`grid h-8 w-8 place-items-center rounded-full border text-xs ${
                            done
                              ? "border-primary bg-gradient-primary text-primary-foreground"
                              : "border-border bg-secondary text-muted-foreground"
                          }`}
                        >
                          {done ? <CheckCircle2 className="h-4 w-4" /> : <Circle className="h-4 w-4" />}
                        </div>
                        <span className="mt-1.5 w-16 text-center text-[10px] text-muted-foreground">
                          {stage}
                        </span>
                      </div>
                      {i < TRACK_STAGES.length - 1 && (
                        <div className={`h-0.5 flex-1 ${i < currentIndex ? "bg-primary" : "bg-border"}`} />
                      )}
                    </div>
                  );
                })}
              </div>

              <h4 className="mt-8 text-sm font-semibold">Activity Timeline</h4>
              <ol className="mt-4 space-y-4">
                <TimelineItem
                  label="Complaint submitted"
                  date={formatDate(issue.created_at)}
                  note="Your report was received and logged."
                />
                {issue.updated_at !== issue.created_at && (
                  <TimelineItem
                    label={`Status: ${issue.status}`}
                    date={formatDate(issue.updated_at)}
                    note="The latest update on your complaint."
                  />
                )}
              </ol>
            </div>
          </motion.div>
        )}
      </div>
    </SiteLayout>
  );
}

function TimelineItem({ label, date, note }: { label: string; date: string; note: string }) {
  return (
    <li className="flex gap-3">
      <div className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary/15 text-primary">
        <Clock className="h-3.5 w-3.5" />
      </div>
      <div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{label}</span>
          <span className="text-xs text-muted-foreground">{date}</span>
        </div>
        <p className="text-xs text-muted-foreground">{note}</p>
      </div>
    </li>
  );
}

function Row({
  label,
  value,
  children,
}: {
  label: string;
  value?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium">{children ?? value}</dd>
    </div>
  );
}
