import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, Award, FileText, CheckCircle2, Users as UsersIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useAdminData } from "@/components/admin/AdminDataContext";
import {
  InitialsAvatar,
  TableSkeleton,
  EmptyState,
  SectionCard,
  formatDate,
} from "@/components/admin/ui";
import { RESOLVED_STATES, type AdminUser } from "@/lib/admin";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin-dashboard/users")({
  component: UsersPage,
});

function UsersPage() {
  const { users, issues, loading } = useAdminData();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<AdminUser | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) =>
      `${u.name ?? ""} ${u.email ?? ""} ${u.mobile ?? ""}`.toLowerCase().includes(q),
    );
  }, [users, search]);

  return (
    <div className="space-y-6">
      <SectionCard
        title={
          <h2 className="flex items-center gap-2 text-base font-semibold">
            <UsersIcon className="h-4 w-4 text-primary" /> Registered Users
            <span className="text-sm font-normal text-muted-foreground">({users.length})</span>
          </h2>
        }
        action={
          <div className="relative w-56 max-w-full">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search users…"
              className="pl-9"
            />
          </div>
        }
      >
        {loading ? (
          <TableSkeleton rows={8} cols={6} />
        ) : filtered.length === 0 ? (
          <EmptyState title="No users found" hint="Registered citizens will appear here." />
        ) : (
          <div className="scroll-slim -mx-2 overflow-x-auto px-2">
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs uppercase text-muted-foreground">
                  <th className="pb-3 pr-4 font-medium">User</th>
                  <th className="pb-3 pr-4 font-medium">Email</th>
                  <th className="pb-3 pr-4 font-medium">Phone</th>
                  <th className="pb-3 pr-4 font-medium">Reports</th>
                  <th className="pb-3 pr-4 font-medium">Joined</th>
                  <th className="pb-3 pr-4 font-medium">Role</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => (
                  <tr
                    key={u.id}
                    onClick={() => setSelected(u)}
                    className="cursor-pointer border-b border-border/50 transition-colors hover:bg-secondary/40"
                  >
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-2.5">
                        <InitialsAvatar name={u.name} size="sm" seed={u.id} />
                        <span className="font-medium">{u.name ?? "Citizen"}</span>
                      </div>
                    </td>
                    <td className="py-3 pr-4 text-muted-foreground">{u.email ?? "—"}</td>
                    <td className="py-3 pr-4 text-muted-foreground">{u.mobile ?? "—"}</td>
                    <td className="py-3 pr-4">{u.reports}</td>
                    <td className="py-3 pr-4 text-muted-foreground">{formatDate(u.created_at)}</td>
                    <td className="py-3 pr-4">
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[10px] font-medium",
                          u.isAdmin
                            ? "bg-primary/15 text-primary"
                            : u.isOfficer
                              ? "bg-accent/15 text-accent"
                              : "bg-secondary text-muted-foreground",
                        )}
                      >
                        {u.isAdmin ? "Admin" : u.isOfficer ? "Officer" : "Citizen"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      <Sheet open={!!selected} onOpenChange={(v) => !v && setSelected(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-md">
          {selected && (
            <>
              <SheetHeader className="text-left">
                <SheetTitle>User profile</SheetTitle>
              </SheetHeader>
              <div className="mt-4 flex items-center gap-3">
                <InitialsAvatar name={selected.name} size="lg" seed={selected.id} />
                <div>
                  <p className="font-semibold">{selected.name ?? "Citizen"}</p>
                  <p className="text-sm text-muted-foreground">{selected.email ?? "—"}</p>
                  <p className="text-xs text-muted-foreground">Joined {formatDate(selected.created_at)}</p>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-3 gap-3">
                <ProfileStat icon={FileText} label="Reports" value={selected.reports} />
                <ProfileStat icon={CheckCircle2} label="Resolved" value={selected.resolved} tone="text-success" />
                <ProfileStat icon={Award} label="Points" value={selected.points} tone="text-primary" />
              </div>

              <h3 className="mt-6 mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Reported complaints
              </h3>
              <div className="space-y-2">
                {issues.filter((i) => i.user_id === selected.id).length === 0 ? (
                  <p className="text-sm text-muted-foreground">No complaints filed yet.</p>
                ) : (
                  issues
                    .filter((i) => i.user_id === selected.id)
                    .map((i) => (
                      <div key={i.id} className="rounded-lg border border-border bg-secondary/20 p-3">
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-xs font-semibold text-primary">{i.ticket_id}</span>
                          <span className="text-xs text-muted-foreground">{formatDate(i.created_at)}</span>
                        </div>
                        <p className="mt-1 truncate text-sm font-medium">{i.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {i.category} • {i.status}
                          {RESOLVED_STATES.includes(i.status) ? " ✓" : ""}
                        </p>
                      </div>
                    ))
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function ProfileStat({
  icon: Icon,
  label,
  value,
  tone = "text-foreground",
}: {
  icon: typeof Award;
  label: string;
  value: number;
  tone?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-secondary/20 p-3 text-center">
      <Icon className={cn("mx-auto h-4 w-4", tone)} />
      <div className={cn("mt-1 text-lg font-extrabold", tone)}>{value}</div>
      <div className="text-[10px] uppercase text-muted-foreground">{label}</div>
    </div>
  );
}
