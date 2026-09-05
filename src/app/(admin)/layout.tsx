import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/admin/Sidebar";
import { TopBar } from "@/components/admin/TopBar";
import { MobileNav } from "@/components/admin/MobileNav";
import { NotificationItem } from "@/components/shared/NotificationBell";

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select(`
      full_name,
      preferred_name,
      email,
      role,
      organisation_id,
      organisations (
        name
      )
    `)
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "admin") {
    redirect("/");
  }

  const { data: rawNotifications } = await supabase
    .from("notifications")
    .select("id, type, title, message, is_read, created_at")
    .eq("recipient_id", user.id)
    .order("created_at", { ascending: false })
    .limit(10);

  const notifications: NotificationItem[] = rawNotifications || [];
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const displayName =
    profile?.preferred_name || profile?.full_name || user.email || "Administrator";
  const orgName = (profile?.organisations as any)?.name || "AutoSkills AU";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Sidebar />

      <div className="flex flex-col md:pl-64">
        <TopBar
          fullName={displayName}
          email={profile?.email || user.email}
          organisationName={orgName}
          notifications={notifications}
          unreadCount={unreadCount}
        />

        <main className="flex-1 p-4 pb-24 sm:p-6 md:p-8 md:pb-8">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>

        <MobileNav />
      </div>
    </div>
  );
}
