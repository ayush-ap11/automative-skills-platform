import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AuditLogViewer } from "@/components/admin/AuditLogViewer";
import { AuditLogEntry } from "@/components/admin/AuditLogDetailDialog";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{
    page?: string;
    action?: string;
    entityType?: string;
    actorId?: string;
    dateFrom?: string;
    dateTo?: string;
  }>;
}

export default async function AdminAuditLogsPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page || "1", 10) || 1);
  const pageSize = 25;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, organisation_id")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "admin" || !profile.organisation_id) redirect("/auth/login");
  const orgId = profile.organisation_id;

  const { data: actorsData } = await supabase
    .from("profiles")
    .select("id, full_name, preferred_name, email")
    .eq("organisation_id", orgId)
    .order("full_name");

  const { data: distinctRows } = await supabase
    .from("audit_logs")
    .select("action, entity_type, profiles!inner(organisation_id)")
    .eq("profiles.organisation_id", orgId)
    .limit(500);

  const actions = Array.from(new Set((distinctRows || []).map((r) => r.action).filter(Boolean))).sort();
  const entityTypes = Array.from(new Set((distinctRows || []).map((r) => r.entity_type).filter(Boolean))).sort();

  const actors = (actorsData || []).map((a) => ({
    id: a.id,
    name: a.preferred_name || a.full_name || a.email || "User",
  }));

  let query = supabase
    .from("audit_logs")
    .select(`
      id, actor_id, action, entity_type, entity_id, previous_value, new_value, ip_address, created_at,
      profiles!inner (id, full_name, preferred_name, organisation_id)
    `, { count: "exact" })
    .eq("profiles.organisation_id", orgId)
    .order("created_at", { ascending: false });

  if (sp.action) query = query.eq("action", sp.action);
  if (sp.entityType) query = query.eq("entity_type", sp.entityType);
  if (sp.actorId) query = query.eq("actor_id", sp.actorId);
  if (sp.dateFrom) query = query.gte("created_at", `${sp.dateFrom}T00:00:00.000Z`);
  if (sp.dateTo) query = query.lte("created_at", `${sp.dateTo}T23:59:59.999Z`);

  const { data: rows, count } = await query.range(from, to);

  const totalCount = count || 0;
  const totalPages = Math.ceil(totalCount / pageSize) || 1;

  const entries: AuditLogEntry[] = (rows || []).map((r: any) => {
    const p = Array.isArray(r.profiles) ? r.profiles[0] : r.profiles;
    return {
      id: r.id,
      actor_id: r.actor_id,
      actor_name: p?.preferred_name || p?.full_name || "System",
      action: r.action,
      entity_type: r.entity_type,
      entity_id: r.entity_id,
      previous_value: r.previous_value,
      new_value: r.new_value,
      ip_address: r.ip_address,
      created_at: r.created_at,
    };
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Audit Logs</h1>
        <p className="text-sm text-muted-foreground">
          Cryptographically traceable, immutable event ledger for organisation compliance and security governance.
        </p>
      </div>

      <AuditLogViewer
        entries={entries}
        actions={actions}
        entityTypes={entityTypes}
        actors={actors}
        currentPage={page}
        totalPages={totalPages}
        totalCount={totalCount}
        currentFilters={{
          action: sp.action,
          entityType: sp.entityType,
          actorId: sp.actorId,
          dateFrom: sp.dateFrom,
          dateTo: sp.dateTo,
        }}
      />
    </div>
  );
}
