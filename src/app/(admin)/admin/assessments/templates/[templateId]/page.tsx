import React from "react";
import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TemplateSectionsManager } from "@/components/admin/TemplateSectionsManager";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ templateId: string }>;
}

export default async function TemplateBuilderPage({ params }: PageProps) {
  const { templateId } = await params;
  if (!templateId) notFound();

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase.from("profiles").select("role, organisation_id").eq("id", user.id).maybeSingle();
  if (profile?.role !== "admin" || !profile.organisation_id) redirect("/auth/login");

  const { data: template } = await supabase
    .from("assessment_templates")
    .select("id, title, framework_version, organisation_id")
    .eq("id", templateId)
    .maybeSingle();

  if (!template || template.organisation_id !== profile.organisation_id) {
    redirect("/admin/assessments");
  }

  const { data: sectionsData } = await supabase
    .from("assessment_sections")
    .select("id, title, order_index, weight_pct, questions(id)")
    .eq("template_id", templateId)
    .order("order_index", { ascending: true });

  const sections = (sectionsData || []).map((s: any) => ({
    id: s.id,
    title: s.title,
    order_index: s.order_index,
    weight_pct: Number(s.weight_pct) || 0,
    question_count: s.questions?.length || 0,
  }));

  return (
    <div className="space-y-6">
      <TemplateSectionsManager
        templateId={template.id}
        templateTitle={template.title}
        initialSections={sections}
      />
    </div>
  );
}
