import { createContext, useContext, type ReactNode } from "react";
import { useAdminDataSource, type AdminData } from "@/lib/admin";

const AdminDataContext = createContext<AdminData | null>(null);

export function AdminDataProvider({
  enabled,
  children,
}: {
  enabled: boolean;
  children: ReactNode;
}) {
  const data = useAdminDataSource(enabled);
  return <AdminDataContext.Provider value={data}>{children}</AdminDataContext.Provider>;
}

export function useAdminData(): AdminData {
  const ctx = useContext(AdminDataContext);
  if (!ctx) {
    throw new Error("useAdminData must be used within an AdminDataProvider");
  }
  return ctx;
}
