import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  normalizeAttachments,
  type Attachment,
} from "@/lib/issues";
import type { IssuePriority, IssueStatus } from "@/lib/demo-data";
import { notifyIssueStatusChanged } from "@/lib/sns.functions";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface StaffRow {
  id: string;
  user_id: string | null;
  name: string;
  email: string;
  phone: string | null;
  department: string;
  designation: string;
  avatar_url: string | null;
  is_active: boolean;
  available: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProfileRow {
  id: string;
  name: string | null;
  email: string | null;
  mobile: string | null;
  created_at: string;
}

export interface AdminIssue {
  id: string;
  ticket_id: string;
  user_id: string;
  title: string;
  category: string;
  priority: IssuePriority;
  description: string;
  location: string | null;
  image_url: string | null;
  attachments: Attachment[];
  status: IssueStatus;
  assigned_officer_id: string | null;
  is_anonymous: boolean;
  created_at: string;
  updated_at: string;
  // enriched (admin view — real identity is visible to admins)
  citizenName: string;
  citizenEmail: string | null;
  officerName: string | null;
}

export interface StaffMember extends StaffRow {
  assigned: number;
  completed: number;
  active: number;
}

export interface AdminUser {
  id: string;
  name: string | null;
  email: string | null;
  mobile: string | null;
  created_at: string;
  isOfficer: boolean;
  isAdmin: boolean;
  reports: number;
  resolved: number;
  points: number;
}

export interface AssignmentRecord {
  id: string;
  issue_id: string;
  staff_id: string | null;
  assigned_by: string | null;
  note: string | null;
  created_at: string;
  staff: { name: string; designation: string } | null;
}

export interface IssueNote {
  id: string;
  issue_id: string;
  author_id: string | null;
  note: string;
  created_at: string;
}

export const RESOLVED_STATES: IssueStatus[] = ["Resolved", "Closed"];
export const IN_PROGRESS_STATES: IssueStatus[] = ["Verified", "Assigned", "In Progress"];

export const STATUS_OPTIONS: IssueStatus[] = [
  "Pending",
  "Verified",
  "Assigned",
  "In Progress",
  "Resolved",
  "Rejected",
  "Closed",
];

export const PRIORITY_OPTIONS: IssuePriority[] = ["Low", "Medium", "High"];

export function points(reports: number, resolved: number) {
  return reports * 50 + resolved * 100;
}

// ---------------------------------------------------------------------------
// Combined admin data (issues + staff + users), shared via context provider.
// ---------------------------------------------------------------------------

export interface AdminData {
  issues: AdminIssue[];
  staff: StaffMember[];
  users: AdminUser[];
  loading: boolean;
  reload: () => Promise<void>;
}

async function loadAdminData(): Promise<Omit<AdminData, "loading" | "reload">> {
  const [issuesRes, profilesRes, staffRes, rolesRes] = await Promise.all([
    supabase.from("issues").select("*").order("created_at", { ascending: false }),
    supabase.from("profiles").select("id, name, email, mobile, created_at"),
    supabase.from("staff").select("*").order("created_at", { ascending: false }),
    supabase.from("user_roles").select("user_id, role"),
  ]);

  const profiles = (profilesRes.data ?? []) as ProfileRow[];
  const staffRows = (staffRes.data ?? []) as StaffRow[];
  const rawIssues = (issuesRes.data ?? []) as Record<string, unknown>[];
  const roles = (rolesRes.data ?? []) as { user_id: string; role: string }[];

  const profileById = new Map(profiles.map((p) => [p.id, p]));
  const staffById = new Map(staffRows.map((s) => [s.id, s]));

  const issues: AdminIssue[] = rawIssues.map((r) => {
    const officerId = (r.assigned_officer_id as string | null) ?? null;
    const prof = profileById.get(r.user_id as string);
    return {
      ...(r as unknown as AdminIssue),
      attachments: normalizeAttachments(r.attachments),
      citizenName: prof?.name?.trim() || "Citizen",
      citizenEmail: prof?.email ?? null,
      officerName: officerId ? staffById.get(officerId)?.name ?? null : null,
    };
  });

  // Per-staff complaint counters
  const staff: StaffMember[] = staffRows.map((s) => {
    const mine = issues.filter((i) => i.assigned_officer_id === s.id);
    const completed = mine.filter((i) => RESOLVED_STATES.includes(i.status)).length;
    return {
      ...s,
      assigned: mine.length,
      completed,
      active: mine.length - completed,
    };
  });

  // Per-user counters
  const adminIds = new Set(roles.filter((r) => r.role === "admin").map((r) => r.user_id));
  const officerIds = new Set(roles.filter((r) => r.role === "officer").map((r) => r.user_id));

  const users: AdminUser[] = profiles.map((p) => {
    const mine = issues.filter((i) => i.user_id === p.id);
    const resolved = mine.filter((i) => RESOLVED_STATES.includes(i.status)).length;
    return {
      id: p.id,
      name: p.name,
      email: p.email,
      mobile: p.mobile,
      created_at: p.created_at,
      isOfficer: officerIds.has(p.id),
      isAdmin: adminIds.has(p.id),
      reports: mine.length,
      resolved,
      points: points(mine.length, resolved),
    };
  });

  return { issues, staff, users };
}

export function useAdminDataSource(enabled: boolean): AdminData {
  const [state, setState] = useState<{ issues: AdminIssue[]; staff: StaffMember[]; users: AdminUser[] }>({
    issues: [],
    staff: [],
    users: [],
  });
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    if (!enabled) return;
    const data = await loadAdminData();
    setState(data);
    setLoading(false);
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    reload();
    const channel = supabase
      .channel("admin-data")
      .on("postgres_changes", { event: "*", schema: "public", table: "issues" }, () => reload())
      .on("postgres_changes", { event: "*", schema: "public", table: "staff" }, () => reload())
      .on("postgres_changes", { event: "*", schema: "public", table: "issue_assignments" }, () =>
        reload(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [enabled, reload]);

  return { ...state, loading, reload };
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

async function currentUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

export async function assignOfficer(issueId: string, staffId: string, note?: string) {
  const uid = await currentUserId();
  const { error } = await supabase
    .from("issues")
    .update({ assigned_officer_id: staffId, status: "Assigned" })
    .eq("id", issueId);
  if (error) throw error;
  await supabase.from("issue_assignments").insert({
    issue_id: issueId,
    staff_id: staffId,
    assigned_by: uid,
    note: note?.trim() || null,
  });
}

export async function setIssueStatus(issueId: string, status: IssueStatus) {
  const { error } = await supabase.from("issues").update({ status }).eq("id", issueId);
  if (error) throw error;
  try {
    const { notifyIssueStatusChanged } = await import("@/lib/sns.functions");
    await notifyIssueStatusChanged({ data: { issueId, status } });
  } catch (err) {
    console.error("SNS notification failed:", err);
  }
}

export async function setIssuePriority(issueId: string, priority: IssuePriority) {
  const { error } = await supabase.from("issues").update({ priority }).eq("id", issueId);
  if (error) throw error;
}

export async function deleteIssue(issueId: string) {
  const { error } = await supabase.from("issues").delete().eq("id", issueId);
  if (error) throw error;
}

export async function addIssueNote(issueId: string, note: string) {
  const uid = await currentUserId();
  const { error } = await supabase
    .from("issue_notes")
    .insert({ issue_id: issueId, author_id: uid, note: note.trim() });
  if (error) throw error;
}

export async function deleteIssueNote(noteId: string) {
  const { error } = await supabase.from("issue_notes").delete().eq("id", noteId);
  if (error) throw error;
}

export interface StaffInput {
  name: string;
  email: string;
  phone: string;
  department: string;
  designation: string;
  available: boolean;
}

export async function createStaff(input: StaffInput) {
  const { error } = await supabase.from("staff").insert({
    name: input.name.trim(),
    email: input.email.trim(),
    phone: input.phone.trim() || null,
    department: input.department.trim(),
    designation: input.designation.trim(),
    available: input.available,
  });
  if (error) throw error;
}

export async function updateStaff(id: string, patch: Partial<StaffInput> & { is_active?: boolean }) {
  const { error } = await supabase.from("staff").update(patch).eq("id", id);
  if (error) throw error;
}

export async function deleteStaff(id: string) {
  const { error } = await supabase.from("staff").delete().eq("id", id);
  if (error) throw error;
}

// ---------------------------------------------------------------------------
// Per-issue detail hooks (assignments + notes)
// ---------------------------------------------------------------------------

export function useIssueDetail(issueId: string | null) {
  const [assignments, setAssignments] = useState<AssignmentRecord[]>([]);
  const [notes, setNotes] = useState<IssueNote[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!issueId) return;
    setLoading(true);
    const [aRes, nRes] = await Promise.all([
      supabase
        .from("issue_assignments")
        .select("*, staff(name, designation)")
        .eq("issue_id", issueId)
        .order("created_at", { ascending: false }),
      supabase
        .from("issue_notes")
        .select("*")
        .eq("issue_id", issueId)
        .order("created_at", { ascending: false }),
    ]);
    setAssignments((aRes.data ?? []) as unknown as AssignmentRecord[]);
    setNotes((nRes.data ?? []) as IssueNote[]);
    setLoading(false);
  }, [issueId]);

  useEffect(() => {
    if (!issueId) {
      setAssignments([]);
      setNotes([]);
      return;
    }
    load();
  }, [issueId, load]);

  return { assignments, notes, loading, reload: load };
}

// ---------------------------------------------------------------------------
// CSV export helper
// ---------------------------------------------------------------------------

export function exportToCsv(filename: string, rows: Record<string, unknown>[]) {
  if (rows.length === 0) return;
  const headers = Object.keys(rows[0]);
  const escape = (v: unknown) => {
    const s = v == null ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = [
    headers.join(","),
    ...rows.map((r) => headers.map((h) => escape(r[h])).join(",")),
  ].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
