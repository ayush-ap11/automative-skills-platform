import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DocumentVerificationQueue, DocumentQueueItem } from "@/components/examiner/DocumentVerificationQueue";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ candidateId?: string }>;
}

export default async function ExaminerDocumentsPage({ searchParams }: PageProps) {
  const { candidateId } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: assessments } = await supabase
    .from("assessments")
    .select("candidate_profile_id")
    .eq("assigned_examiner_id", user.id);

  const assignedProfileIds = Array.from(
    new Set((assessments || []).map((a) => a.candidate_profile_id).filter(Boolean))
  ) as string[];

  if (assignedProfileIds.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Document Verification</h1>
          <p className="text-sm text-muted-foreground">Verification queue for candidate compliance and credentials.</p>
        </div>
        <DocumentVerificationQueue initialDocuments={[]} />
      </div>
    );
  }

  const targetProfileIds = candidateId
    ? assignedProfileIds.filter((id) => id === candidateId)
    : assignedProfileIds;

  let candidateFilter: { id: string; name: string } | null = null;
  if (candidateId) {
    const { data: cp } = await supabase
      .from("candidate_profiles")
      .select("id, profiles(full_name, preferred_name)")
      .eq("id", candidateId)
      .maybeSingle();

    const p = cp?.profiles as any;
    candidateFilter = { id: candidateId, name: p?.preferred_name || p?.full_name || "Candidate" };
  }

  const { data: docs } = await supabase
    .from("documents")
    .select(`
      id, category, file_name, status, expiry_date, uploaded_at, candidate_profile_id,
      candidate_profiles (id, profiles (full_name, preferred_name))
    `)
    .in("candidate_profile_id", targetProfileIds)
    .in("status", ["uploaded", "ai_extracted", "pending_review"])
    .eq("is_sensitive", false)
    .order("uploaded_at", { ascending: true });

  const queueItems: DocumentQueueItem[] = (docs || []).map((d: any) => {
    const p = d.candidate_profiles?.profiles;
    return {
      id: d.id,
      candidateProfileId: d.candidate_profile_id,
      candidateName: p?.preferred_name || p?.full_name || "Candidate",
      category: d.category,
      fileName: d.file_name,
      status: d.status,
      expiryDate: d.expiry_date,
      uploadedAt: d.uploaded_at,
    };
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Document Verification</h1>
        <p className="text-sm text-muted-foreground">Verification queue for candidate compliance and credentials.</p>
      </div>
      <DocumentVerificationQueue initialDocuments={queueItems} candidateFilter={candidateFilter} />
    </div>
  );
}
