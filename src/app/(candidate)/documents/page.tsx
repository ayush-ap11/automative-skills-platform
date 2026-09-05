import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DOCUMENT_CATEGORIES, ChecklistItem } from "@/app/(candidate)/documents/types";
import { DocumentChecklist } from "@/components/candidate/DocumentChecklist";

export const dynamic = "force-dynamic";

export default async function DocumentsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: candidateProfile } = await supabase
    .from("candidate_profiles")
    .select("id")
    .eq("profile_id", user.id)
    .single();

  if (!candidateProfile) {
    redirect("/candidate/dashboard");
  }

  const { data: documents } = await supabase
    .from("documents")
    .select("*")
    .eq("candidate_profile_id", candidateProfile.id)
    .order("uploaded_at", { ascending: false });

  const { data: consents } = await supabase
    .from("consents")
    .select("*")
    .eq("candidate_profile_id", candidateProfile.id);

  const checklistItems: ChecklistItem[] = DOCUMENT_CATEGORIES.map((category) => {
    const doc = (documents || []).find((d) => d.category === category.key) || null;
    const hasConsent = (consents || []).some(
      (c) => c.consent_type === category.key && c.granted
    );

    return {
      category,
      document: doc
        ? {
            id: doc.id,
            candidate_profile_id: doc.candidate_profile_id,
            category: doc.category,
            storage_path: doc.storage_path,
            file_name: doc.file_name,
            status: doc.status,
            expiry_date: doc.expiry_date,
            is_sensitive: doc.is_sensitive,
            uploaded_at: doc.uploaded_at,
          }
        : null,
      hasConsent,
    };
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">My Documents</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Upload and track your trade credentials, safety inductions, and workshop evidence.
        </p>
      </div>

      <DocumentChecklist items={checklistItems} />
    </div>
  );
}
