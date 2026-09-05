import React from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { QuestionBankTable } from "@/components/admin/QuestionBankTable";
import { SectionOption } from "@/components/admin/question-bank-types";

export const dynamic = "force-dynamic";

export default async function AdminQuestionBankPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, organisation_id")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "admin" || !profile.organisation_id) {
    redirect("/auth/login");
  }

  const { data: templates } = await supabase
    .from("assessment_templates")
    .select("id, title, assessment_sections(id, title)")
    .eq("organisation_id", profile.organisation_id);

  const sections: SectionOption[] = [];
  const sectionIds: string[] = [];

  (templates || []).forEach((t: any) => {
    (t.assessment_sections || []).forEach((s: any) => {
      sections.push({
        id: s.id,
        label: `${t.title} → ${s.title}`,
      });
      sectionIds.push(s.id);
    });
  });

  let questions: any[] = [];
  if (sectionIds.length > 0) {
    const { data: qData } = await supabase
      .from("questions")
      .select("*, question_options(*)")
      .in("section_id", sectionIds)
      .order("created_at", { ascending: false });
    questions = qData || [];
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Question Bank</h1>
        <p className="text-sm text-muted-foreground">
          Curate, duplicate, and maintain vocational assessment questions across all organizational templates.
        </p>
      </div>

      <QuestionBankTable initialQuestions={questions} sections={sections} />
    </div>
  );
}
