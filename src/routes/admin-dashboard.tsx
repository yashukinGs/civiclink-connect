import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  FileText,
  UserCog,
  BarChart3,
  Users,
  LogOut,
  Menu,
  Bell,
  Loader2,
  X,
} from "lucide-react";
import { useAdminAuth, adminLogout } from "@/lib/auth";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/site/ThemeToggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AdminDataProvider, useAdminData } from "@/components/admin/AdminDataContext";
import { formatDateTime } from "@/components/admin/ui";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin-dashboard")({
  component: AdminLayout,
});

const NAV = [
  { icon: LayoutDashboard, label: "Overview", to: "/admin-dashboard" },
  { icon: FileText, label: "Complaints", to: "/admin-dashboard/complaints" },
  { icon: UserCog, label: "Officers", to: "/admin-dashboard/officers" },
  { icon: BarChart3, label: "Analytics", to: "/admin-dashboard/analytics" },
  { icon: Users, label: "Users", to: "/admin-dashboard/users" },
] as const;

function AdminLayout() {
  const navigate = useNavigate();
  const { isAdmin, loading } = useAdminAuth();

  useEffect(() => {
    if (!loading && !isAdmin) navigate({ to: "/admin" });
  }, [loading, isAdmin, navigate]);

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  if (!isAdmin) return null;

  return (
    <AdminDataProvider enabled={isAdmin}>
      <Shell />
    </AdminDataProvider>
  );
}

function Shell() {
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const currentPath = useRouterState({ select: (r) => r.location.pathname });

  const handleSignOut = async () => {
    await adminLogout();
    toast.success("Signed out of admin");
    navigate({ to: "/admin" });
  };

  const isActive = (to: string) =>
    to === "/admin-dashboard" ? currentPath === to : currentPath.startsWith(to);

  const navList = (
    <nav className="mt-6 flex-1 space-y-1">
      {NAV.map((item) => (
        <Link
          key={item.label}
          to={item.to}
          onClick={() => setMobileOpen(false)}
          className={cn(
            "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
            isActive(item.to)
              ? "bg-gradient-primary text-primary-foreground shadow-glow"
              : "text-muted-foreground hover:bg-secondary hover:text-foreground",
          )}
        >
          <item.icon className="h-4 w-4" />
          {item.label}
        </Link>
      ))}
    </nav>
  );

  return (
    <div className="flex min-h-screen w-full bg-background">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-border bg-sidebar p-4 lg:flex">
        <div className="px-2 py-2">
          <Logo to="/admin-dashboard" />
        </div>
        {navList}
        <Button variant="ghost" className="justify-start text-muted-foreground" onClick={handleSignOut}>
          <LogOut className="h-4 w-4" /> Sign out
        </Button>
      </aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 z-40 bg-background/70 backdrop-blur-sm lg:hidden"
            />
            <motion.aside
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: "spring", damping: 26, stiffness: 240 }}
              className="fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-border bg-sidebar p-4 lg:hidden"
            >
              <div className="flex items-center justify-between px-2 py-2">
                <Logo to="/admin-dashboard" />
                <button onClick={() => setMobileOpen(false)} aria-label="Close menu">
                  <X className="h-5 w-5 text-muted-foreground" />
                </button>
              </div>
              {navList}
              <Button
                variant="ghost"
                className="justify-start text-muted-foreground"
                onClick={handleSignOut}
              >
                <LogOut className="h-4 w-4" /> Sign out
              </Button>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="glass sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-border px-4 py-3 lg:px-8">
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-base font-bold leading-tight">Admin Dashboard</h1>
              <p className="hidden text-xs text-muted-foreground sm:block">
                City Operations Control Center
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <NotificationsBell />
            <ThemeToggle />
            <span className="ml-1 grid h-9 w-9 place-items-center rounded-full bg-gradient-primary text-sm font-bold text-primary-foreground">
              A
            </span>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function NotificationsBell() {
  const { issues } = useAdminData();
  const pending = useMemo(
    () => issues.filter((i) => i.status === "Pending").slice(0, 6),
    [issues],
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="relative grid h-9 w-9 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          aria-label="Notifications"
        >
          <Bell className="h-4.5 w-4.5" />
          {pending.length > 0 && (
            <span className="absolute right-1.5 top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[9px] font-bold text-primary-foreground">
              {pending.length}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel>Pending complaints</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {pending.length === 0 ? (
          <p className="px-2 py-6 text-center text-sm text-muted-foreground">You're all caught up.</p>
        ) : (
          <div className="max-h-80 overflow-y-auto">
            {pending.map((i) => (
              <Link
                key={i.id}
                to="/admin-dashboard/complaints"
                className="flex flex-col gap-0.5 rounded-lg px-2 py-2 transition-colors hover:bg-secondary"
              >
                <span className="text-sm font-medium">{i.title}</span>
                <span className="text-xs text-muted-foreground">
                  {i.ticket_id} • {formatDateTime(i.created_at)}
                </span>
              </Link>
            ))}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
