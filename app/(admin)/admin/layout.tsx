import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { isAdmin } from "@/lib/auth/roles";
import { AdminShell } from "@/components/admin/AdminShell";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user || !isAdmin(user.role)) {
    redirect("/auth/login");
  }

  return <AdminShell>{children}</AdminShell>;
}
