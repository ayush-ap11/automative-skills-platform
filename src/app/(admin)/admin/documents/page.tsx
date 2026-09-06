import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AdminDocumentQueue, AdminDocumentItem } from "@/components/admin/AdminDocumentQueue";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ candidateId?: string }>;
}

export default async function AdminDocumentsPage({ searchParams }: PageProps) {
  const { candidateId } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase.from("profiles").select("role, organisation_id").eq("id", user.id).maybeSingle();
  if (profile?.role !== "admin" || !profile.organisation_id) redirect("/auth/login");
  const orgId = profile.organisation_id;

  let query = supabase
    .from("documents")
    .select(`
      id, candidate_profile_id, category, file_name, status, is_sensitive, uploaded_at, expiry_date,
      candidate_profiles!inner(id, profiles!inner(full_name, organisation_id))
    `)
    .eq("candidate_profiles.profiles.organisation_id", orgId)
    .order("uploaded_at", { ascending: false });

  if (candidateId) {
    query = query.eq("candidate_profile_id", candidateId);
  }

  const { data: docsData } = await query;

  let filteredCandidateName: string | null = null;
  if (candidateId) {
    const { data: cand } = await supabase
      .from("candidate_profiles")
      .select("profiles(full_name)")
      .eq("id", candidateId)
      .maybeSingle();
    filteredCandidateName = (cand as any)?.profiles?.full_name || null;
  }

  const documents: AdminDocumentItem[] = (docsData || []).map((d: any) => ({
    id: d.id,
    candidate_name: d.candidate_profiles?.profiles?.full_name || "Unknown Candidate",
    candidate_id: d.candidate_profile_id,
    category: d.category,
    file_name: d.file_name,
    status: d.status,
    is_sensitive: Boolean(d.is_sensitive),
    uploaded_at: d.uploaded_at,
    expiry_date: d.expiry_date,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Document Oversight</h1>
        <p className="text-sm text-muted-foreground">
          Organisation-wide document compliance, evidence vaults, and verification tracking including sensitive records.
        </p>
      </div>

      <AdminDocumentQueue
        initialDocuments={documents}
        filteredCandidateName={filteredCandidateName}
      />
    </div>
  );
}
