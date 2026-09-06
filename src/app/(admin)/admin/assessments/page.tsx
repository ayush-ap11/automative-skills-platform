import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AssessmentsAdminView } from "@/components/admin/AssessmentsAdminView";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams?: Promise<{ tab?: string; status?: string; action?: string }>;
}

export default async function AdminAssessmentsPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const initialTab = sp?.tab === "assigned" ? "assigned" : "templates";
  const initialStatus = sp?.status || "all";
  const initialAction = sp?.action;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase.from("profiles").select("role, organisation_id").eq("id", user.id).maybeSingle();
  if (profile?.role !== "admin" || !profile.organisation_id) redirect("/auth/login");
  const orgId = profile.organisation_id;

  const { data: settings } = await supabase.from("system_settings").select("framework_version").eq("organisation_id", orgId).maybeSingle();
  const frameworkVersion = settings?.framework_version || "AUR Release 9.0";

  const { data: tmplData } = await supabase
    .from("assessment_templates")
    .select("id, title, framework_version, created_at, assessment_sections(id)")
    .eq("organisation_id", orgId)
    .order("created_at", { ascending: false });

  const templates = (tmplData || []).map((t: any) => ({
    id: t.id,
    title: t.title,
    framework_version: t.framework_version || frameworkVersion,
    section_count: t.assessment_sections?.length || 0,
    created_at: t.created_at,
  }));

  const { data: assData } = await supabase
    .from("assessments")
    .select("id, status, assigned_at, assessment_templates(title, organisation_id), candidate_profiles!inner(id, profiles!inner(full_name, email, organisation_id)), assigned_examiner:profiles!assigned_examiner_id(full_name)")
    .order("assigned_at", { ascending: false });

  const assignedAssessments = (assData || [])
    .filter((a: any) => a.candidate_profiles?.profiles?.organisation_id === orgId || a.assessment_templates?.organisation_id === orgId)
    .map((a: any) => ({
      id: a.id,
      candidate_id: a.candidate_profiles?.id,
      candidate_name: a.candidate_profiles?.profiles?.full_name || "Unknown Candidate",
      template_title: a.assessment_templates?.title || "Standard Template",
      examiner_name: a.assigned_examiner?.full_name || "Unassigned",
      status: a.status,
      assigned_at: a.assigned_at,
    }));

  const { data: candData } = await supabase
    .from("candidate_profiles")
    .select("id, profiles!inner(full_name, email, organisation_id)")
    .eq("profiles.organisation_id", orgId);

  const candidates = (candData || []).map((c: any) => ({
    id: c.id,
    name: c.profiles?.full_name || "Unknown Candidate",
    email: c.profiles?.email || "",
  }));

  const { data: exmData } = await supabase
    .from("profiles")
    .select("id, full_name, email")
    .eq("organisation_id", orgId)
    .in("role", ["examiner", "admin"]);

  const examiners = (exmData || []).map((e: any) => ({
    id: e.id,
    name: e.full_name || "Unknown Examiner",
    email: e.email || "",
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Assessments</h1>
        <p className="text-sm text-muted-foreground">Manage templates, section weights, and candidate assessment assignments.</p>
      </div>
      <AssessmentsAdminView
        templates={templates}
        assignedAssessments={assignedAssessments}
        candidates={candidates}
        examiners={examiners}
        frameworkVersion={frameworkVersion}
        initialTab={initialTab}
        initialStatus={initialStatus}
        initialAction={initialAction}
      />
    </div>
  );
}
