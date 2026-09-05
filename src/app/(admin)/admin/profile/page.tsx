import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ShieldCheck, Building2, Users, Award, Settings, ArrowRight, CheckCircle2 } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export const dynamic = "force-dynamic";

export default async function AdminProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, preferred_name, email, role, created_at, organisation_id, organisations (id, name, invite_code)")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "admin") redirect("/admin/dashboard");

  const org = profile.organisations as any;
  const orgName = org?.name || "AutoSkills AU";
  const orgId = profile.organisation_id;
  const adminSupabase = createAdminClient();

  const [candidatesRes, assessmentsRes, examinersRes] = await Promise.all([
    adminSupabase.from("profiles").select("id", { count: "exact", head: true }).eq("organisation_id", orgId).eq("role", "candidate"),
    adminSupabase.from("assessments").select("id", { count: "exact", head: true }),
    adminSupabase.from("profiles").select("id", { count: "exact", head: true }).eq("organisation_id", orgId).eq("role", "examiner"),
  ]);

  const displayName = profile.preferred_name || profile.full_name || "Administrator";
  const initials = displayName.split(" ").map((n: string) => n[0]).filter(Boolean).slice(0, 2).join("").toUpperCase() || "AD";

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Admin Profile</h1>
        <p className="text-xs text-muted-foreground mt-0.5">Your administrative credentials, institutional tenancy, and security authority.</p>
      </div>

      <div className="rounded-xl border border-border bg-card p-6 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
          <div className="flex items-center gap-4">
            <Avatar size="lg" className="size-16 bg-primary/10 text-primary font-bold text-xl">
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-bold text-foreground">{displayName}</h2>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary border border-primary/20">
                  <ShieldCheck className="size-3" /> System Administrator
                </span>
              </div>
              <p className="text-xs text-muted-foreground">{profile.email}</p>
              <p className="text-[11px] text-muted-foreground font-medium flex items-center gap-1 mt-0.5">
                <Building2 className="size-3 text-primary" /> {orgName}
              </p>
            </div>
          </div>
          <Link href="/admin/settings" className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-muted/40 px-3.5 py-2 text-xs font-semibold text-foreground hover:bg-muted transition cursor-pointer">
            <Settings className="size-3.5" /> Platform Settings
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-lg border border-border bg-muted/20 p-4 space-y-1">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Candidates</span>
              <Users className="size-4 text-primary" />
            </div>
            <p className="text-2xl font-black text-foreground">{candidatesRes.count ?? 0}</p>
            <p className="text-[10px] text-muted-foreground">Registered in organization</p>
          </div>
          <div className="rounded-lg border border-border bg-muted/20 p-4 space-y-1">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Examiners</span>
              <Award className="size-4 text-primary" />
            </div>
            <p className="text-2xl font-black text-foreground">{examinersRes.count ?? 0}</p>
            <p className="text-[10px] text-muted-foreground">Authorized vocational assessors</p>
          </div>
          <div className="rounded-lg border border-border bg-muted/20 p-4 space-y-1">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Assessments</span>
              <ShieldCheck className="size-4 text-primary" />
            </div>
            <p className="text-2xl font-black text-foreground">{assessmentsRes.count ?? 0}</p>
            <p className="text-[10px] text-muted-foreground">Active in assessment cycle</p>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-4 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Tenancy & Security Details</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="flex justify-between py-1.5 border-b border-border/50">
              <span className="text-muted-foreground">Organization Code</span>
              <span className="font-mono font-bold text-foreground">{org?.invite_code || "AUTOSKILLS-AU"}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-border/50">
              <span className="text-muted-foreground">Access Scope</span>
              <span className="font-semibold text-emerald-600 flex items-center gap-1"><CheckCircle2 className="size-3" /> Full Multi-Tenant</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-border/50">
              <span className="text-muted-foreground">Audit Traceability</span>
              <span className="font-semibold text-foreground">Strict SOC2 / Australian Standards</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-border/50">
              <span className="text-muted-foreground">Account Created</span>
              <span className="font-medium text-foreground">{new Date(profile.created_at).toLocaleDateString("en-AU", { month: "short", day: "numeric", year: "numeric" })}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 pt-2">
          <Link href="/admin/candidates" className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline pr-4">
            Manage Candidates <ArrowRight className="size-3" />
          </Link>
          <Link href="/admin/examiners" className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline pr-4">
            Manage Examiners <ArrowRight className="size-3" />
          </Link>
          <Link href="/admin/question-bank" className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
            Question Bank <ArrowRight className="size-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}
