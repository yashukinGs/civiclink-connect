import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { UserPlus, Pencil, Power, Trash2, Mail, Phone, Loader2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { useAdminData } from "@/components/admin/AdminDataContext";
import { InitialsAvatar, CardSkeleton, EmptyState } from "@/components/admin/ui";
import {
  createStaff,
  updateStaff,
  deleteStaff,
  type StaffInput,
  type StaffMember,
} from "@/lib/admin";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin-dashboard/officers")({
  component: Officers,
});

const EMPTY: StaffInput = {
  name: "",
  email: "",
  phone: "",
  department: "",
  designation: "",
  available: true,
};

function Officers() {
  const { staff, loading, reload } = useAdminData();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<StaffMember | null>(null);
  const [form, setForm] = useState<StaffInput>(EMPTY);
  const [saving, setSaving] = useState(false);

  const openAdd = () => {
    setEditing(null);
    setForm(EMPTY);
    setDialogOpen(true);
  };
  const openEdit = (s: StaffMember) => {
    setEditing(s);
    setForm({
      name: s.name,
      email: s.email,
      phone: s.phone ?? "",
      department: s.department,
      designation: s.designation,
      available: s.available,
    });
    setDialogOpen(true);
  };

  const save = async () => {
    if (!form.name.trim() || !form.email.trim() || !form.department.trim() || !form.designation.trim()) {
      toast.error("Please fill name, email, department and designation.");
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await updateStaff(editing.id, form);
        toast.success("Staff member updated");
      } else {
        await createStaff(form);
        toast.success("Staff member added");
      }
      setDialogOpen(false);
      await reload();
    } catch {
      toast.error("Could not save staff member.");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (s: StaffMember) => {
    try {
      await updateStaff(s.id, { is_active: !s.is_active });
      toast.success(s.is_active ? "Staff deactivated" : "Staff activated");
      await reload();
    } catch {
      toast.error("Could not update status.");
    }
  };

  const remove = async (s: StaffMember) => {
    try {
      await deleteStaff(s.id);
      toast.success("Staff member removed");
      await reload();
    } catch {
      toast.error("Could not remove staff member.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold">Officers &amp; Staff</h2>
          <p className="text-sm text-muted-foreground">{staff.length} team members</p>
        </div>
        <Button variant="hero" onClick={openAdd}>
          <UserPlus className="h-4 w-4" /> Add Staff
        </Button>
      </div>

      {loading ? (
        <CardSkeleton count={6} />
      ) : staff.length === 0 ? (
        <div className="glass-card rounded-2xl">
          <EmptyState icon={Users} title="No staff yet" hint="Add officers to start assigning complaints." />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {staff.map((s) => (
            <div key={s.id} className="glass-card flex flex-col gap-4 rounded-2xl p-5">
              <div className="flex items-start gap-3">
                <InitialsAvatar name={s.name} size="lg" seed={s.id} src={s.avatar_url} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="truncate font-semibold">{s.name}</h3>
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[10px] font-medium",
                        s.is_active
                          ? s.available
                            ? "bg-success/15 text-success"
                            : "bg-warning/15 text-warning"
                          : "bg-muted text-muted-foreground",
                      )}
                    >
                      {!s.is_active ? "Inactive" : s.available ? "Available" : "Busy"}
                    </span>
                  </div>
                  <p className="truncate text-sm text-muted-foreground">{s.designation}</p>
                  <p className="truncate text-xs text-muted-foreground">{s.department}</p>
                </div>
              </div>

              <div className="space-y-1 text-sm">
                <p className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-3.5 w-3.5" /> <span className="truncate">{s.email}</span>
                </p>
                {s.phone && (
                  <p className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-3.5 w-3.5" /> {s.phone}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-3 gap-2 rounded-xl border border-border bg-secondary/20 p-3 text-center">
                <Stat label="Assigned" value={s.assigned} />
                <Stat label="Active" value={s.active} tone="text-warning" />
                <Stat label="Done" value={s.completed} tone="text-success" />
              </div>

              <div className="mt-auto flex gap-2">
                <Button variant="glass" size="sm" className="flex-1" onClick={() => openEdit(s)}>
                  <Pencil className="h-3.5 w-3.5" /> Edit
                </Button>
                <Button variant="glass" size="sm" onClick={() => toggleActive(s)} aria-label="Toggle active">
                  <Power className="h-3.5 w-3.5" />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="glass" size="sm" className="text-destructive" aria-label="Delete">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Remove {s.name}?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This removes the staff member. Complaints they handled stay, but become unassigned.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => remove(s)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Remove
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit staff member" : "Add staff member"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <Field label="Full name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
            <Field label="Email" type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} />
            <Field label="Phone" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
            <div className="grid grid-cols-2 gap-4">
              <Field label="Department" value={form.department} onChange={(v) => setForm({ ...form, department: v })} />
              <Field label="Designation" value={form.designation} onChange={(v) => setForm({ ...form, designation: v })} />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border bg-secondary/20 px-3 py-2.5">
              <Label htmlFor="avail" className="cursor-pointer">Available for assignment</Label>
              <Switch id="avail" checked={form.available} onCheckedChange={(v) => setForm({ ...form, available: v })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="glass" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button variant="hero" onClick={save} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {editing ? "Save changes" : "Add staff"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Stat({ label, value, tone = "text-foreground" }: { label: string; value: number; tone?: string }) {
  return (
    <div>
      <div className={cn("text-lg font-extrabold", tone)}>{value}</div>
      <div className="text-[10px] uppercase text-muted-foreground">{label}</div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Input type={type} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
