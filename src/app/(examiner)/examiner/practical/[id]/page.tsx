import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, User, Calendar, ClipboardCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

function getRatingBadge(rating: string) {
  switch (rating) {
    case "not_demonstrated":
      return <span className="inline-flex rounded-full border border-destructive/30 bg-destructive/10 px-2.5 py-0.5 text-xs font-semibold text-destructive">Not Demonstrated</span>;
    case "developing":
      return <span className="inline-flex rounded-full border border-[var(--warning)]/30 bg-[var(--warning)]/10 px-2.5 py-0.5 text-xs font-semibold text-[var(--warning)]">Developing</span>;
    case "competent":
      return <span className="inline-flex rounded-full border border-[var(--success)]/30 bg-[var(--success)]/10 px-2.5 py-0.5 text-xs font-semibold text-[var(--success)]">Competent</span>;
    case "highly_competent":
      return <span className="inline-flex rounded-full bg-[var(--success)] px-2.5 py-0.5 text-xs font-bold text-[var(--success-foreground)] shadow-2xs">Highly Competent</span>;
    default:
      return <span className="inline-flex rounded-full border border-border bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground capitalize">{rating.replace(/_/g, " ")}</span>;
  }
}

export default async function PracticalObservationDetailPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: obs } = await supabase
    .from("practical_observations")
    .select(`
      id,
      task_title,
      checklist,
      overall_rating,
      observed_at,
      examiner_id,
      assessments!inner (
        candidate_profile_id,
        assigned_examiner_id,
        candidate_profiles (
          id,
          profiles (
            full_name,
            preferred_name,
            organisation_id
          )
        )
      )
    `)
    .eq("id", id)
    .maybeSingle();

  if (!obs) redirect("/examiner/practical");

  const isOwner = obs.examiner_id === user.id;
  const isAssigned = (obs.assessments as any)?.assigned_examiner_id === user.id;
  if (!isOwner && !isAssigned) {
    const { data: profile } = await supabase.from("profiles").select("role, organisation_id").eq("id", user.id).maybeSingle();
    const candOrgId = (obs.assessments as any)?.candidate_profiles?.profiles?.organisation_id;
    if (profile?.role !== "admin" || profile?.organisation_id !== candOrgId) {
      redirect("/examiner/practical");
    }
  }

  const cp = (obs.assessments as any)?.candidate_profiles;
  const candidateName = cp?.profiles?.preferred_name || cp?.profiles?.full_name || "Unknown Candidate";
  const checklist = Array.isArray(obs.checklist) ? obs.checklist : [];

  return (
    <div className="space-y-6 max-w-4xl">
      <Link href="/examiner/practical" className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground cursor-pointer transition">
        <ArrowLeft className="size-3.5" /> Back to Practical Assessments
      </Link>

      <div className="rounded-xl border border-border bg-card p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border pb-4">
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <ClipboardCheck className="size-4 text-primary" /> Practical Observation Record
            </span>
            <h1 className="text-xl font-bold text-foreground">{obs.task_title}</h1>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Overall Outcome:</span>
            {getRatingBadge(obs.overall_rating || "not_demonstrated")}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="flex items-center gap-2 text-muted-foreground">
            <User className="size-4 text-primary" />
            <span>Candidate: </span>
            <Link href={`/examiner/candidates/${cp?.id}`} className="font-semibold text-foreground hover:underline cursor-pointer">
              {candidateName}
            </Link>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground sm:justify-end">
            <Calendar className="size-4 text-muted-foreground/70" />
            <span>Observed: {new Date(obs.observed_at).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <h2 className="text-base font-bold text-foreground">Evaluated Criteria &amp; Evidence</h2>
          <span className="text-xs text-muted-foreground">{checklist.length} evaluated criteria</span>
        </div>

        {checklist.length === 0 ? (
          <p className="text-xs text-muted-foreground italic py-4 text-center">
            No specific criteria were recorded for this observation.
          </p>
        ) : (
          <div className="divide-y divide-border">
            {checklist.map((rawItem: any, idx: number) => {
              const label =
                rawItem.label || rawItem.item || rawItem.task || rawItem.criterion || `Criterion ${idx + 1}`;
              const rating =
                rawItem.rating ||
                (rawItem.passed === true
                  ? obs.overall_rating || "competent"
                  : rawItem.passed === false
                  ? "not_demonstrated"
                  : "competent");
              const comment =
                rawItem.comment || rawItem.evidence || rawItem.observation || rawItem.notes || null;

              return (
                <div key={rawItem.id || idx} className="py-4 first:pt-0 last:pb-0 space-y-2">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="flex size-5 shrink-0 items-center justify-center rounded bg-muted text-[11px] font-bold text-muted-foreground">
                        {idx + 1}
                      </span>
                      <p className="text-sm font-semibold text-foreground">{label}</p>
                    </div>
                    {getRatingBadge(rating)}
                  </div>
                  {comment && (
                    <div className="pl-7">
                      <p className="text-xs text-muted-foreground bg-muted/25 p-2.5 rounded-lg border border-border/60 leading-relaxed">
                        <span className="font-semibold text-foreground">Evidence / Observation Note: </span>
                        {comment}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
