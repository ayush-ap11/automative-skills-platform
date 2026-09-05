import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import {
  NewObservationForm,
  AssessmentOption,
} from "@/components/examiner/NewObservationForm";

export const dynamic = "force-dynamic";

export default async function NewPracticalObservationPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: rawAssessments } = await supabase
    .from("assessments")
    .select(`
      id,
      assigned_at,
      assessment_templates (title),
      candidate_profiles (
        profiles (
          full_name,
          preferred_name
        )
      )
    `)
    .eq("assigned_examiner_id", user.id)
    .order("assigned_at", { ascending: false });

  const options: AssessmentOption[] = (rawAssessments || []).map((a: any) => {
    const p = a.candidate_profiles?.profiles;
    const name = p?.preferred_name || p?.full_name || "Unknown Candidate";
    return {
      id: a.id,
      candidateName: name,
      templateTitle: a.assessment_templates?.title || "Vocational Assessment",
    };
  });

  return (
    <div className="space-y-6 max-w-4xl">
      <Link
        href="/examiner/practical"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground cursor-pointer transition"
      >
        <ArrowLeft className="size-3.5" /> Back to Practical Assessments
      </Link>

      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          New Practical Observation
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Record in-person workshop skill demonstration and safety procedure adherence.
        </p>
      </div>

      <NewObservationForm assessments={options} />
    </div>
  );
}
