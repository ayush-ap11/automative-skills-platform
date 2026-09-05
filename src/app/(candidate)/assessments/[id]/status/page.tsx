import { redirect } from "next/navigation";
import Link from "next/navigation";
import { Clock, ArrowLeft, Layers, ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

interface StatusPageProps {
  params: Promise<{ id: string }>;
}

export default async function AssessmentStatusPage({ params }: StatusPageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: candidateProfile } = await supabase
    .from("candidate_profiles")
    .select("id")
    .eq("profile_id", user.id)
    .single();

  if (!candidateProfile) redirect("/assessments");

  const { data: assessment } = await supabase
    .from("assessments")
    .select("id, status, assigned_at, candidate_profile_id, assessment_templates(title, framework_version)")
    .eq("id", id)
    .single();

  if (!assessment || assessment.candidate_profile_id !== candidateProfile.id) {
    redirect("/assessments");
  }

  const title = (assessment.assessment_templates as any)?.title || "Automotive Competency Assessment";
  const framework = (assessment.assessment_templates as any)?.framework_version || "AUR Framework";

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <a
          href="/assessments"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground mb-3 cursor-pointer"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Assessments
        </a>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{title}</h1>
          <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
            <Layers className="h-3 w-3" />
            {framework}
          </span>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-6 shadow-xs space-y-5">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-amber-500/10 text-amber-600">
            <Clock className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h2 className="text-base font-semibold text-foreground">
              Submitted — your examiner is reviewing this assessment
            </h2>
            <p className="text-sm text-muted-foreground">
              Your responses have been securely logged and assigned to your certified examiner for marking and competency validation.
            </p>
          </div>
        </div>

        <div className="rounded-lg border border-border/80 bg-muted/20 p-4 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Review Status:</span>
            <span className="font-semibold text-amber-700 capitalize">{assessment.status.replace("_", " ")}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Submitted On:</span>
            <span className="font-medium text-foreground">
              {new Date(assessment.assigned_at).toLocaleDateString("en-AU")}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-lg bg-primary/5 p-3 text-xs text-primary">
          <ShieldCheck className="h-4 w-4 shrink-0" />
          <span>You&apos;ll be notified once review is complete.</span>
        </div>

        <div className="pt-2">
          <a
            href="/assessments"
            className="inline-flex items-center justify-center rounded-lg border border-border bg-card px-4 py-2 text-xs font-medium text-foreground hover:bg-muted/50 cursor-pointer"
          >
            Return to Assessment Overview
          </a>
        </div>
      </div>
    </div>
  );
}
