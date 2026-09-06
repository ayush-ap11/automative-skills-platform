import React from "react";
import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  TemplateBuilderView,
  SectionWithQuestions,
} from "@/components/admin/TemplateBuilderView";
import { QuestionRecord } from "@/components/admin/question-bank-types";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ templateId: string }>;
}

export default async function TemplateBuilderPage({ params }: PageProps) {
  const { templateId } = await params;
  if (!templateId) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, organisation_id")
    .eq("id", user.id)
    .maybeSingle();
  if (profile?.role !== "admin" || !profile.organisation_id)
    redirect("/auth/login");

  const { data: template } = await supabase
    .from("assessment_templates")
    .select("id, title, framework_version, organisation_id")
    .eq("id", templateId)
    .maybeSingle();

  if (!template || template.organisation_id !== profile.organisation_id) {
    redirect("/admin/assessments");
  }

  // Fetch sections belonging to this template
  const { data: sectionsData } = await supabase
    .from("assessment_sections")
    .select(`
      id, title, order_index, weight_pct,
      questions (
        id, section_id, question_text, question_type, skill_category, difficulty,
        explanation, competency_mapping, marks, time_limit_seconds, mandatory,
        ai_evaluation_enabled, ev_related, safety_critical, status, created_at,
        question_options (id, option_text, is_correct, order_index)
      )
    `)
    .eq("template_id", templateId)
    .order("order_index", { ascending: true });

  const sections: SectionWithQuestions[] = (sectionsData || []).map((s: any) => ({
    id: s.id,
    title: s.title,
    order_index: s.order_index,
    weight_pct: Number(s.weight_pct) || 0,
    questions: (s.questions || []).map((q: any) => ({
      ...q,
      marks: Number(q.marks) || 1,
      question_options: q.question_options || [],
    })),
  }));

  // Fetch all question bank questions across the organization's templates
  const { data: orgTemplates } = await supabase
    .from("assessment_templates")
    .select("id, assessment_sections(id)")
    .eq("organisation_id", profile.organisation_id);

  const allSectionIds = (orgTemplates || []).flatMap((t: any) =>
    (t.assessment_sections || []).map((s: any) => s.id)
  );

  let allBankQuestions: QuestionRecord[] = [];
  if (allSectionIds.length > 0) {
    const { data: bankData } = await supabase
      .from("questions")
      .select(`
        id, section_id, question_text, question_type, skill_category, difficulty,
        explanation, competency_mapping, marks, time_limit_seconds, mandatory,
        ai_evaluation_enabled, ev_related, safety_critical, status, created_at,
        question_options (id, option_text, is_correct, order_index)
      `)
      .in("section_id", allSectionIds)
      .order("created_at", { ascending: false });

    allBankQuestions = (bankData || []).map((q: any) => ({
      ...q,
      marks: Number(q.marks) || 1,
      question_options: q.question_options || [],
    }));
  }

  return (
    <TemplateBuilderView
      templateId={template.id}
      initialTitle={template.title}
      initialFrameworkVersion={template.framework_version || "AUR Release 9.0"}
      initialSections={sections}
      allBankQuestions={allBankQuestions}
    />
  );
}
