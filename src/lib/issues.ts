import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { IssuePriority, IssueStatus } from "@/lib/demo-data";
import { uploadS3File, getS3DownloadUrl, deleteS3Object } from "@/backend/s3.functions";
import { mirrorIssueToDynamo } from "@/backend/dynamodb.functions";

export const BUCKET = "issue-images";
export const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
export const ACCEPTED_DOC_TYPES = ["application/pdf"];
export const ACCEPTED_TYPES = [...ACCEPTED_IMAGE_TYPES, ...ACCEPTED_DOC_TYPES];
export const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB
export const MAX_FILES = 4;

// Backwards-compatible aliases
export const MAX_IMAGE_BYTES = MAX_FILE_BYTES;

export interface Attachment {
  path: string;
  name: string;
  type: string;
}

export function isImageType(type: string): boolean {
  return ACCEPTED_IMAGE_TYPES.includes(type.toLowerCase());
}

export interface IssueRow {
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
}

export interface IssueStats {
  total: number;
  pending: number;
  in_progress: number;
  resolved: number;
  today: number;
}

export interface NewIssueInput {
  title: string;
  category: string;
  priority: IssuePriority;
  description: string;
  location: string;
  isAnonymous?: boolean;
}

// Normalize a DB row (attachments comes back as Json) into a typed IssueRow.
export function normalizeAttachments(value: unknown): Attachment[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((a): a is Record<string, unknown> => !!a && typeof a === "object")
    .map((a) => ({
      path: String(a.path ?? ""),
      name: String(a.name ?? "Attachment"),
      type: String(a.type ?? ""),
    }))
    .filter((a) => a.path);
}

function rowToIssue(row: Record<string, unknown>): IssueRow {
  return {
    ...(row as unknown as IssueRow),
    attachments: normalizeAttachments(row.attachments),
  };
}

// Build a display attachment list, falling back to the legacy single image_url.
export function attachmentsForIssue(issue: {
  attachments?: Attachment[] | unknown;
  image_url?: string | null;
}): Attachment[] {
  const list = normalizeAttachments(issue.attachments);
  if (list.length > 0) return list;
  if (issue.image_url) {
    return [{ path: issue.image_url, name: "Photo", type: "image/*" }];
  }
  return [];
}

export function validateFile(file: File): string | null {
  const type = file.type.toLowerCase();
  if (!ACCEPTED_TYPES.includes(type)) {
    return "Only JPG, JPEG, PNG, WEBP and PDF files are supported.";
  }
  if (file.size > MAX_FILE_BYTES) {
    return "Each file must be smaller than 10 MB.";
  }
  return null;
}

// Backwards-compatible alias.
export const validateImageFile = validateFile;

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Could not read the selected file."));
    reader.readAsDataURL(file);
  });
}

// Upload one file to AWS S3 through the backend; returns an Attachment where `path` is the S3 object key.
export async function uploadIssueFile(
  file: File,
  onProgress?: (percent: number) => void,
): Promise<Attachment> {
  console.info("[S3 upload] starting", {
    fileName: file.name,
    size: file.size,
    type: file.type,
  });

  onProgress?.(5);
  const base64Data = await readFileAsDataUrl(file);
  onProgress?.(35);

  const { key } = await uploadS3File({
    data: {
      fileName: file.name,
      contentType: file.type || "application/octet-stream",
      base64Data,
    },
  });

  console.info("[S3 upload] success", { key });
  onProgress?.(100);

  return { path: key, name: file.name, type: file.type };
}

export async function removeIssueFile(path: string): Promise<void> {
  try {
    await deleteS3Object({ data: { key: path } });
  } catch (err) {
    console.error("Failed to delete S3 object:", err);
  }
}

// Backwards-compatible alias.
export const removeIssueImage = removeIssueFile;

// Generate a signed URL for a stored S3 object key.
export async function getSignedFileUrl(path: string): Promise<string | null> {
  try {
    const { url } = await getS3DownloadUrl({ data: { key: path } });
    return url;
  } catch (err) {
    console.error("Failed to sign S3 URL:", err);
    return null;
  }
}

// Backwards-compatible alias.
export const getSignedImageUrl = getSignedFileUrl;

export async function createIssue(
  input: NewIssueInput,
  attachments: Attachment[],
): Promise<IssueRow> {
  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userData.user) throw new Error("You must be signed in to report an issue.");

  const firstImage = attachments.find((a) => isImageType(a.type));

  const { data, error } = await supabase
    .from("issues")
    .insert({
      ticket_id: "", // generated by DB trigger
      user_id: userData.user.id,
      title: input.title.trim(),
      category: input.category,
      priority: input.priority,
      description: input.description.trim(),
      location: input.location.trim() || null,
      image_url: firstImage?.path ?? null,
      attachments: attachments as unknown as never,
      is_anonymous: input.isAnonymous ?? false,
    })
    .select()
    .single();

  if (error) throw error;
  const issue = rowToIssue(data as Record<string, unknown>);

  // Fire-and-forget mirror to DynamoDB — must never break the UX
  void mirrorIssueToDynamo({
    data: {
      ticket_id: issue.ticket_id,
      title: issue.title,
      category: issue.category,
      priority: issue.priority,
      description: issue.description,
      location: issue.location,
      status: issue.status,
      is_anonymous: issue.is_anonymous,
      image_url: issue.image_url,
      attachments: issue.attachments,
      created_at: issue.created_at,
    },
  }).catch((err) => console.warn("[DynamoDB mirror] skipped:", err?.message));

  return issue;
}


export async function getIssueByTicket(ticket: string) {
  const { data, error } = await supabase.rpc("get_issue_by_ticket", {
    _ticket: ticket,
  });
  if (error) throw error;
  return (data && data[0]) || null;
}


// ---- Hooks ----

export function useIssueStats() {
  const [stats, setStats] = useState<IssueStats | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data, error } = await supabase.rpc("get_issue_stats");
    if (!error && data) {
      setStats(data as unknown as IssueStats);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    const channel = supabase
      .channel("issue-stats")
      .on("postgres_changes", { event: "*", schema: "public", table: "issues" }, () => load())
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [load]);

  return { stats, loading };
}

export function useMyIssues() {
  const [issues, setIssues] = useState<IssueRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      setIssues([]);
      setLoading(false);
      return;
    }
    const { data, error } = await supabase
      .from("issues")
      .select("*")
      .eq("user_id", userData.user.id)
      .order("created_at", { ascending: false });
    if (error) {
      setError(error.message);
    } else {
      setIssues((data ?? []).map((r) => rowToIssue(r as Record<string, unknown>)));
      setError(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    const channel = supabase
      .channel("my-issues")
      .on("postgres_changes", { event: "*", schema: "public", table: "issues" }, () => load())
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [load]);

  return { issues, loading, error, reload: load };
}

export function useAllIssues(enabled: boolean) {
  const [issues, setIssues] = useState<IssueRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!enabled) return;
    const { data, error } = await supabase
      .from("issues")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error) setIssues((data ?? []).map((r) => rowToIssue(r as Record<string, unknown>)));
    setLoading(false);
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    load();
    const channel = supabase
      .channel("all-issues")
      .on("postgres_changes", { event: "*", schema: "public", table: "issues" }, () => load())
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [enabled, load]);

  return { issues, loading, reload: load };
}
