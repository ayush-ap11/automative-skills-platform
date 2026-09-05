import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SettingsView, ConsentItem } from "@/components/candidate/SettingsView";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("email, email_notifications_enabled")
    .eq("id", user.id)
    .maybeSingle();

  const { data: cp } = await supabase
    .from("candidate_profiles")
    .select("id")
    .eq("profile_id", user.id)
    .maybeSingle();

  let consents: ConsentItem[] = [];
  if (cp) {
    const { data: rawConsents } = await supabase
      .from("consents")
      .select("id, consent_type, granted, granted_at")
      .eq("candidate_profile_id", cp.id)
      .order("granted_at", { ascending: false });

    consents = (rawConsents || []).map((c) => ({
      id: c.id,
      consent_type: c.consent_type,
      granted: c.granted,
      granted_at: c.granted_at,
    }));
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Account Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your credentials, notification delivery preferences, and statutory document consents.
        </p>
      </div>

      <SettingsView
        email={profile?.email || user.email || ""}
        emailNotificationsEnabled={profile?.email_notifications_enabled ?? true}
        consents={consents}
      />
    </div>
  );
}
