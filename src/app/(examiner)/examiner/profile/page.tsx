import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { User, Award, Building2, Users, CheckCircle } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export const dynamic = "force-dynamic";

export default async function ExaminerProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select(`
      id, full_name, preferred_name, email, role, created_at,
      organisations (name),
      examiner_profiles (specialisation_areas, max_active_candidates)
    `)
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "examiner") redirect("/");

  const exmProfile = Array.isArray(profile.examiner_profiles) ? profile.examiner_profiles[0] : profile.examiner_profiles;
  const orgName = (profile.organisations as any)?.name || "AutoSkills AU";

  const { count: assignedCount } = await supabase
    .from("assessments")
    .select("id", { count: "exact", head: true })
    .eq("assigned_examiner_id", user.id);

  const displayName = profile.preferred_name || profile.full_name || "Examiner";
  const initials = displayName.split(" ").map((n: string) => n[0]).filter(Boolean).slice(0, 2).join("").toUpperCase() || "EX";
  const specialisations: string[] = exmProfile?.specialisation_areas || ["Light Vehicle Mechanical", "General Automotive"];
  const maxCapacity = exmProfile?.max_active_candidates || 20;

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">My Profile</h1>
        <p className="text-xs text-muted-foreground mt-0.5">Manage your vocational assessor profile, credentials, and institutional affiliation.</p>
      </div>

      <div className="rounded-xl border border-border bg-card p-6 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <Avatar size="lg" className="size-16 bg-primary/10 text-primary font-bold text-xl">
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-bold text-foreground">{displayName}</h2>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                <CheckCircle className="size-3" /> Authorized Examiner
              </span>
            </div>
            <p className="text-xs text-muted-foreground">{profile.email}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-border pt-4">
          <div className="space-y-1 text-xs">
            <span className="text-muted-foreground font-medium flex items-center gap-1.5"><User className="size-3.5 text-primary" /> Full Legal Name</span>
            <p className="font-semibold text-foreground">{profile.full_name || "—"}</p>
          </div>
          <div className="space-y-1 text-xs">
            <span className="text-muted-foreground font-medium flex items-center gap-1.5"><Building2 className="size-3.5 text-primary" /> Registered Organisation</span>
            <p className="font-semibold text-foreground">{orgName}</p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground border-b border-border pb-2">
          <Award className="size-4 text-primary" />
          <span>Examiner Scope & Specialisations</span>
        </div>

        <div className="flex flex-wrap gap-2">
          {specialisations.map((spec) => (
            <span key={spec} className="px-2.5 py-1 rounded-lg text-xs font-medium bg-muted/60 text-foreground border border-border">
              {spec}
            </span>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-border/60">
          <div className="p-3 rounded-lg border border-border bg-muted/20 space-y-1">
            <span className="text-[11px] text-muted-foreground flex items-center gap-1.5"><Users className="size-3 text-primary" /> Active Assigned Candidates</span>
            <p className="text-lg font-bold text-foreground">{assignedCount || 0}</p>
          </div>
          <div className="p-3 rounded-lg border border-border bg-muted/20 space-y-1">
            <span className="text-[11px] text-muted-foreground">Maximum Workload Capacity</span>
            <p className="text-lg font-bold text-foreground">{maxCapacity} Candidates</p>
          </div>
        </div>
      </div>
    </div>
  );
}
