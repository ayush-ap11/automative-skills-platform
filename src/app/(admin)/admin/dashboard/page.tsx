import { createClient } from "@/lib/supabase/server";
import { fetchAdminDashboardData } from "@/lib/admin-dashboard-queries";
import { KpiCard } from "@/components/shared/KpiCard";
import { AdminActionCenter } from "@/components/admin/AdminActionCenter";
import { PipelineFunnelChart } from "@/components/admin/PipelineFunnelChart";
import { SkillsDistributionChart } from "@/components/admin/SkillsDistributionChart";
import { EVReadinessChart } from "@/components/admin/EVReadinessChart";
import { PerformanceByStateChart } from "@/components/admin/PerformanceByStateChart";
import {
  Users, CheckSquare, Clock, TrendingUp, Zap, Award, FileText,
  Sparkles, ShieldAlert, Layers, PlayCircle,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const supabase = await createClient();
  const data = await fetchAdminDashboardData(supabase);
  const { kpis } = data;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Operational Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Organisation-wide candidate progression, compliance health, and assessment outcomes.
        </p>
      </div>

      <AdminActionCenter
        pendingReviews={kpis.pendingReviews}
        docsAwaitingVerification={kpis.docsAwaitingVerification}
        safetyFlags={kpis.safetyFlags}
        aiFlags={kpis.aiFlags}
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
        <KpiCard label="Total Candidates" value={kpis.totalCandidates} icon={Users} href="/admin/candidates" />
        <KpiCard label="Active Assessments" value={kpis.activeAssessments} icon={PlayCircle} href="/admin/assessments?tab=assigned" />
        <KpiCard label="Completed" value={kpis.completedAssessments} icon={CheckSquare} href="/admin/assessments?tab=assigned&status=completed" />
        <KpiCard label="Pending Reviews" value={kpis.pendingReviews} icon={Clock} href="/admin/assessments?tab=assigned&status=submitted" />
        <KpiCard label="Average Score" value={kpis.averageScore} icon={TrendingUp} href="/admin/analytics" />
        <KpiCard label="EV Ready %" value={kpis.evReadyPct} icon={Zap} href="/admin/ev-readiness" />
        <KpiCard label="Competent / NYC" value={kpis.competentPct} icon={Award} description="Outcome ratio" href="/admin/reports" />
        <KpiCard label="Docs for Review" value={kpis.docsAwaitingVerification} icon={FileText} href="/admin/documents" />
        <KpiCard
          label="AI Flags"
          value={kpis.aiFlags}
          icon={Sparkles}
          accentColor={kpis.aiFlags > 0 ? "var(--warning)" : "var(--foreground)"}
          description="Unreviewed safety items"
          href="/admin/ai-governance"
        />
        <KpiCard
          label="Safety Flags"
          value={kpis.safetyFlags}
          icon={ShieldAlert}
          accentColor={kpis.safetyFlags > 0 ? "var(--destructive)" : "var(--foreground)"}
          description="Impacted assessments"
          href="/admin/assessments?tab=assigned"
        />
        <KpiCard
          label="Pipeline Stages"
          value={data.pipelineFunnel.filter((p) => p.count > 0).length}
          icon={Layers}
          description="Active stages"
          href="/admin/candidates"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <PipelineFunnelChart data={data.pipelineFunnel} />
        <SkillsDistributionChart data={data.skillsDistribution} />
        <EVReadinessChart data={data.evReadinessDistribution} />
        <PerformanceByStateChart data={data.performanceByState} />
      </div>
    </div>
  );
}
