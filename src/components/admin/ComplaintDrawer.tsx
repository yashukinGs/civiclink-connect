import { useState } from "react";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Trash2, MapPin, Calendar, UserCircle, History, StickyNote, Send, Loader2 } from "lucide-react";
import { AttachmentGallery } from "@/components/site/AttachmentGallery";
import {
  StatusBadge,
  PriorityBadge,
  AnonBadge,
  InitialsAvatar,
  formatDateTime,
} from "@/components/admin/ui";
import {
  assignOfficer,
  setIssueStatus,
  setIssuePriority,
  deleteIssue,
  addIssueNote,
  deleteIssueNote,
  useIssueDetail,
  STATUS_OPTIONS,
  PRIORITY_OPTIONS,
  type AdminIssue,
  type StaffMember,
} from "@/lib/admin";
import type { IssuePriority, IssueStatus } from "@/lib/demo-data";

export function ComplaintDrawer({
  issue,
  staff,
  open,
  onOpenChange,
  onChanged,
}: {
  issue: AdminIssue | null;
  staff: StaffMember[];
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onChanged: () => void;
}) {
  const { assignments, notes, reload } = useIssueDetail(open && issue ? issue.id : null);
  const [note, setNote] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const [busy, setBusy] = useState(false);

  if (!issue) return null;

  const guard = async (fn: () => Promise<void>, ok: string) => {
    setBusy(true);
    try {
      await fn();
      toast.success(ok);
      onChanged();
    } catch {
      toast.error("Action failed. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const handleAssign = (staffId: string) => {
    const officer = staff.find((s) => s.id === staffId);
    guard(async () => {
      await assignOfficer(issue.id, staffId, `Assigned to ${officer?.name ?? "officer"}`);
      await reload();
    }, `Assigned to ${officer?.name ?? "officer"}`);
  };

  const handleStatus = (status: string) =>
    guard(() => setIssueStatus(issue.id, status as IssueStatus), `Status set to ${status}`);

  const handlePriority = (priority: string) =>
    guard(() => setIssuePriority(issue.id, priority as IssuePriority), `Priority set to ${priority}`);

  const handleAddNote = async () => {
    if (!note.trim()) return;
    setSavingNote(true);
    try {
      await addIssueNote(issue.id, note);
      setNote("");
      await reload();
      toast.success("Note added");
    } catch {
      toast.error("Could not add note.");
    } finally {
      setSavingNote(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader className="text-left">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-sm font-semibold text-primary">{issue.ticket_id}</span>
            <StatusBadge status={issue.status} />
            <PriorityBadge priority={issue.priority} />
            {issue.is_anonymous && <AnonBadge />}
          </div>
          <SheetTitle className="text-xl">{issue.title}</SheetTitle>
        </SheetHeader>

        <div className="mt-4 space-y-6">
          {/* Citizen + meta */}
          <div className="grid gap-3 rounded-xl border border-border bg-secondary/30 p-4 text-sm">
            <div className="flex items-center gap-2">
              <UserCircle className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Citizen:</span>
              <span className="font-medium">{issue.citizenName}</span>
              {issue.is_anonymous && (
                <span className="text-xs text-muted-foreground">(hidden from officers)</span>
              )}
            </div>
            {issue.citizenEmail && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <span className="pl-6">{issue.citizenEmail}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Location:</span>
              <span className="font-medium">{issue.location || "Not provided"}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Reported:</span>
              <span className="font-medium">{formatDateTime(issue.created_at)}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="rounded-md bg-secondary px-2 py-0.5 text-xs font-medium">
                {issue.category}
              </span>
            </div>
          </div>

          {/* Description */}
          <div>
            <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Description
            </h3>
            <p className="whitespace-pre-wrap text-sm leading-relaxed">{issue.description}</p>
          </div>

          {/* Attachments */}
          {issue.attachments.length > 0 && (
            <div>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Attachments
              </h3>
              <AttachmentGallery attachments={issue.attachments} />
            </div>
          )}

          {/* Controls */}
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Officer</label>
              <Select value={issue.assigned_officer_id ?? ""} onValueChange={handleAssign} disabled={busy}>
                <SelectTrigger>
                  <SelectValue placeholder="Assign officer" />
                </SelectTrigger>
                <SelectContent>
                  {staff.filter((s) => s.is_active).length === 0 ? (
                    <div className="px-2 py-1.5 text-xs text-muted-foreground">No active staff</div>
                  ) : (
                    staff
                      .filter((s) => s.is_active)
                      .map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name} — {s.department}
                        </SelectItem>
                      ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Status</label>
              <Select value={issue.status} onValueChange={handleStatus} disabled={busy}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Priority</label>
              <Select value={issue.priority} onValueChange={handlePriority} disabled={busy}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITY_OPTIONS.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Internal notes */}
          <div>
            <h3 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <StickyNote className="h-3.5 w-3.5" /> Internal notes
            </h3>
            <div className="flex gap-2">
              <Textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={2}
                placeholder="Add a private note (admins only)…"
                className="resize-none"
              />
              <Button onClick={handleAddNote} disabled={savingNote || !note.trim()} size="icon" variant="hero">
                {savingNote ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
            <div className="mt-3 space-y-2">
              {notes.map((n) => (
                <div key={n.id} className="group rounded-lg border border-border bg-secondary/20 p-3 text-sm">
                  <p className="whitespace-pre-wrap">{n.note}</p>
                  <div className="mt-1 flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">{formatDateTime(n.created_at)}</span>
                    <button
                      onClick={async () => {
                        await deleteIssueNote(n.id);
                        await reload();
                      }}
                      className="text-xs text-destructive opacity-0 transition-opacity hover:underline group-hover:opacity-100"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Assignment history */}
          <div>
            <h3 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <History className="h-3.5 w-3.5" /> Assignment history
            </h3>
            {assignments.length === 0 ? (
              <p className="text-sm text-muted-foreground">No assignments yet.</p>
            ) : (
              <div className="space-y-2">
                {assignments.map((a) => (
                  <div key={a.id} className="flex items-center gap-3 rounded-lg border border-border bg-secondary/20 p-2.5">
                    <InitialsAvatar name={a.staff?.name} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{a.staff?.name ?? "Unassigned"}</p>
                      <p className="text-xs text-muted-foreground">
                        {a.staff?.designation ? `${a.staff.designation} • ` : ""}
                        {formatDateTime(a.created_at)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Delete */}
          <div className="border-t border-border pt-4">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" className="text-destructive hover:bg-destructive/10 hover:text-destructive">
                  <Trash2 className="h-4 w-4" /> Delete complaint
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete this complaint?</AlertDialogTitle>
                  <AlertDialogDescription>
                    {issue.ticket_id} will be permanently removed along with its notes and assignment
                    history. This cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() =>
                      guard(async () => {
                        await deleteIssue(issue.id);
                        onOpenChange(false);
                      }, "Complaint deleted")
                    }
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
