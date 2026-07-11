import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  MapPin,
  Upload,
  Send,
  Crosshair,
  X,
  Loader2,
  FileText,
  RotateCw,
  CheckCircle2,
  ShieldOff,
} from "lucide-react";
import { toast } from "sonner";
import { SiteLayout, PageHeader } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CATEGORIES, type IssuePriority } from "@/lib/demo-data";
import { useAuth } from "@/lib/auth";
import {
  createIssue,
  uploadIssueFile,
  removeIssueFile,
  validateFile,
  isImageType,
  MAX_FILES,
  type Attachment,
} from "@/lib/issues";

export const Route = createFileRoute("/report")({
  component: ReportIssue,
});

type FileStatus = "pending" | "uploading" | "done" | "error";

interface SelectedFile {
  id: string;
  fileKey: string;
  file: File;
  previewUrl: string | null; // for images
  status: FileStatus;
  progress: number;
  attachment: Attachment | null;
}


const PRIORITIES: IssuePriority[] = ["Low", "Medium", "High"];

function ReportIssue() {
  const [priority, setPriority] = useState<IssuePriority>("Medium");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);

  const [files, setFiles] = useState<SelectedFile[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const selectedFileKeysRef = useRef(new Set<string>());
  const uploadingFileIdsRef = useRef(new Set<string>());

  const { isLoggedIn, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !isLoggedIn) {
      navigate({ to: "/login", search: { redirect: "/report" } });
    }
  }, [loading, isLoggedIn, navigate]);

  useEffect(() => {
    return () => {
      files.forEach((f) => f.previewUrl && URL.revokeObjectURL(f.previewUrl));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading || !isLoggedIn) return null;

  const updateFile = (id: string, patch: Partial<SelectedFile>) => {
    setFiles((prev) => prev.map((f) => (f.id === id ? { ...f, ...patch } : f)));
  };

  const uploadOne = async (item: SelectedFile) => {
    if (uploadingFileIdsRef.current.has(item.id)) return;
    uploadingFileIdsRef.current.add(item.id);
    updateFile(item.id, { status: "uploading", progress: 0 });
    try {
      const attachment = await uploadIssueFile(item.file, (p) =>
        updateFile(item.id, { progress: p }),
      );
      updateFile(item.id, { status: "done", progress: 100, attachment });
    } catch (err) {
      updateFile(item.id, { status: "error" });
      console.error("Issue attachment upload failed:", err);
      toast.error(
        err instanceof Error
          ? `Could not upload "${item.file.name}": ${err.message}`
          : `Could not upload "${item.file.name}". You can retry.`,
      );
    } finally {
      uploadingFileIdsRef.current.delete(item.id);
    }
  };

  const addFiles = (incoming: FileList | File[] | null) => {
    if (!incoming) return;
    const list = Array.from(incoming);
    if (list.length === 0) return;

    const accepted: SelectedFile[] = [];
    for (const file of list) {
      if (files.length + accepted.length >= MAX_FILES) {
        toast.error("Maximum 4 files are allowed.");
        break;
      }
      const err = validateFile(file);
      if (err) {
        toast.error(err);
        continue;
      }
      const fileKey = `${file.name}:${file.size}:${file.lastModified}:${file.type}`;
      if (selectedFileKeysRef.current.has(fileKey)) continue;
      selectedFileKeysRef.current.add(fileKey);
      accepted.push({
        id: crypto.randomUUID(),
        fileKey,
        file,
        previewUrl: isImageType(file.type) ? URL.createObjectURL(file) : null,
        status: "pending",
        progress: 0,
        attachment: null,
      });
    }

    if (accepted.length > 0) {
      setFiles((prev) => [...prev, ...accepted]);
      accepted.forEach((item) => void uploadOne(item));
    }

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeFile = (id: string) => {
    setFiles((prev) => {
      const target = prev.find((f) => f.id === id);
      if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl);
      if (target?.attachment) void removeIssueFile(target.attachment.path).catch(() => {});
      if (target) selectedFileKeysRef.current.delete(target.fileKey);
      return prev.filter((f) => f.id !== id);
    });
  };

  const detectLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported on this device.");
      return;
    }
    toast.loading("Detecting your location…", { id: "geo" });
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setLocation(`${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);
        toast.success("Location detected.", { id: "geo" });
      },
      () => toast.error("Could not detect location. Please enter it manually.", { id: "geo" }),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const resetForm = () => {
    files.forEach((f) => f.previewUrl && URL.revokeObjectURL(f.previewUrl));
    setTitle("");
    setCategory("");
    setPriority("Medium");
    setDescription("");
    setLocation("");
    setIsAnonymous(false);
    selectedFileKeysRef.current.clear();
    uploadingFileIdsRef.current.clear();
    setFiles([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return toast.error("Please enter an issue title.");
    if (!category) return toast.error("Please select a category.");
    if (!description.trim()) return toast.error("Please add a description.");

    if (files.some((f) => f.status === "uploading")) {
      return toast.error("Please wait for files to finish uploading.");
    }
    if (files.some((f) => f.status === "error")) {
      return toast.error("Some files failed to upload. Retry or remove them.");
    }

    const attachments = files
      .map((f) => f.attachment)
      .filter((a): a is Attachment => a !== null);

    setSubmitting(true);
    try {
      const issue = await createIssue(
        { title, category, priority, description, location, isAnonymous },
        attachments,
      );

      toast.success(`Complaint submitted! Your ID is ${issue.ticket_id}.`);
      toast.info(
        "Check your inbox — AWS will send a one-time \"Confirm subscription\" email. Click it once so we can notify you about future status updates.",
        { duration: 10000 },
      );
      resetForm();
      navigate({ to: "/track", search: { id: issue.ticket_id } });
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Something went wrong. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const anyUploading = files.some((f) => f.status === "uploading");
  const busy = submitting || anyUploading;
  const canAddMore = files.length < MAX_FILES;



  return (
    <SiteLayout>
      <div className="py-8">
        <PageHeader
          eyebrow="Report"
          title="Report a Civic Issue"
          subtitle="Provide a few details and we'll route it to the right authority."
        />

        <motion.form
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleSubmit}
          className="glass-card mx-auto mt-12 max-w-3xl space-y-6 rounded-3xl p-6 sm:p-8"
        >
          <div className="space-y-1.5">
            <Label htmlFor="title">Issue Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Large pothole near Market Junction"
              required
            />
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select value={category} onValueChange={setCategory} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Priority</Label>
              <div className="flex gap-2">
                {PRIORITIES.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                      priority === p
                        ? "border-primary bg-primary/15 text-primary"
                        : "border-border text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="desc">Description</Label>
            <Textarea
              id="desc"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the issue, when you noticed it, and how it affects the area."
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label>Location</Label>
            <LocationPicker value={location} onChange={(addr) => setLocation(addr)} />
          </div>

          <div className="space-y-1.5">
            <Label>Attachments <span className="text-muted-foreground">(optional, up to {MAX_FILES})</span></Label>

            {canAddMore && (
              <label
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragActive(true);
                }}
                onDragLeave={() => setDragActive(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragActive(false);
                  addFiles(e.dataTransfer.files);
                }}
                className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed bg-secondary/30 px-4 py-8 text-center transition-colors ${
                  dragActive ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
                }`}
              >
                <Upload className="h-6 w-6 text-primary" />
                <span className="text-sm font-medium">Drag & drop or click to upload</span>
                <span className="text-xs text-muted-foreground">
                  JPG, JPEG, PNG, WEBP or PDF • up to 10 MB each • max {MAX_FILES} files
                </span>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/jpeg,image/jpg,image/png,image/webp,application/pdf"
                  className="hidden"
                  onChange={(e) => addFiles(e.target.files)}
                />
              </label>
            )}

            {files.length > 0 && (
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {files.map((f) => (
                  <div
                    key={f.id}
                    className="relative flex gap-3 rounded-xl border border-border bg-secondary/30 p-2.5"
                  >
                    <div className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-lg border border-border bg-background">
                      {f.previewUrl ? (
                        <img src={f.previewUrl} alt={`Photo attached to civic issue report: ${f.file.name}`} className="h-full w-full object-cover" />
                      ) : (
                        <FileText className="h-6 w-6 text-primary" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate text-sm font-medium">{f.file.name}</span>
                        {f.status === "done" && (
                          <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-primary" />
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {(f.file.size / (1024 * 1024)).toFixed(2)} MB
                      </div>

                      {f.status === "uploading" && (
                        <div className="mt-1.5 flex items-center gap-2">
                          <Progress value={f.progress} className="h-1.5 flex-1" />
                          <span className="text-[10px] tabular-nums text-muted-foreground">
                            {f.progress}%
                          </span>
                        </div>
                      )}
                      {f.status === "error" && (
                        <button
                          type="button"
                          onClick={() => uploadOne(f)}
                          className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-destructive hover:underline"
                        >
                          <RotateCw className="h-3 w-3" /> Upload failed — retry
                        </button>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => removeFile(f.id)}
                      className="grid h-7 w-7 shrink-0 place-items-center self-start rounded-full bg-background/80 text-foreground shadow transition-colors hover:bg-destructive hover:text-destructive-foreground"
                      aria-label={`Remove ${f.file.name}`}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-start justify-between gap-4 rounded-xl border border-border bg-secondary/30 p-4">
            <div className="flex gap-3">
              <ShieldOff className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
              <div>
                <Label htmlFor="anon" className="cursor-pointer text-sm font-semibold">
                  Report Anonymously
                </Label>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Your name stays hidden from officers and the public. Only the city administrator
                  can see who filed the report.
                </p>
              </div>
            </div>
            <Switch id="anon" checked={isAnonymous} onCheckedChange={setIsAnonymous} />
          </div>

          <Button type="submit" variant="hero" size="lg" className="w-full" disabled={busy}>
            {busy ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Submitting…
              </>
            ) : (
              <>
                Submit Complaint <Send className="h-4 w-4" />
              </>
            )}
          </Button>
        </motion.form>
      </div>
    </SiteLayout>
  );
}
