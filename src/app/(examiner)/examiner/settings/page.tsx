import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ExaminerSettingsView } from "@/components/examiner/ExaminerSettingsView";

export const dynamic = "force-dynamic";

export default async function ExaminerSettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, email, email_notifications_enabled")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "examiner") redirect("/");

  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Examiner Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your credentials, notification preferences, and assessment alerts.
        </p>
      </div>

      <ExaminerSettingsView
        email={profile?.email || user.email || ""}
        emailNotificationsEnabled={profile?.email_notifications_enabled ?? true}
      />
    </div>
  );
}
