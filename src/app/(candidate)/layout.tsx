import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/candidate/Sidebar";
import { TopBar } from "@/components/candidate/TopBar";
import { MobileNav } from "@/components/candidate/MobileNav";
import { NotificationItem } from "@/components/shared/NotificationBell";

export default async function CandidateLayout({
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
    .select("full_name, preferred_name, email, role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role === "admin") {
    redirect("/admin");
  } else if (profile?.role === "examiner") {
    redirect("/examiner/dashboard");
  }

  // Fetch 10 most recent notifications and calculate unread count
  const { data: rawNotifications } = await supabase
    .from("notifications")
    .select("id, type, title, message, is_read, created_at")
    .eq("recipient_id", user.id)
    .order("created_at", { ascending: false })
    .limit(10);

  const notifications: NotificationItem[] = rawNotifications || [];
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const displayName =
    profile?.preferred_name || profile?.full_name || user.email || "Candidate";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Sidebar />

      <div className="flex flex-col md:pl-64">
        <TopBar
          fullName={displayName}
          email={profile?.email || user.email}
          notifications={notifications}
          unreadCount={unreadCount}
        />

        <main className="flex-1 p-4 pb-24 sm:p-6 md:p-8 md:pb-8">
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>

        <MobileNav />
      </div>
    </div>
  );
}
