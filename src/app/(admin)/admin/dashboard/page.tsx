import { createClient } from "@/lib/supabase/server";
import { fetchAdminDashboardData } from "@/lib/admin-dashboard-queries";
import { KpiCard } from "@/components/shared/KpiCard";
import { AdminActionCenter } from "@/components/admin/AdminActionCenter";
import { PipelineFunnelChart } from "@/components/admin/PipelineFunnelChart";
import { SkillsDistributionChart } from "@/components/admin/SkillsDistributionChart";
import { EVReadinessChart } from "@/components/admin/EVReadinessChart";
import { PerformanceByStateChart } from "@/components/admin/PerformanceByStateChart";
import {
  Users,
  CheckSquare,
  Clock,
  TrendingUp,
  Zap,
  Award,
  FileText,
  Sparkles,
  ShieldAlert,
  Layers,
  PlayCircle,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const supabase = await createClient();
  const data = await fetchAdminDashboardData(supabase);
  const { kpis } = data;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Operational Dashboard
        </h1>
        <p className="text-sm text-muted-foreground">
          Organisation-wide candidate progression, compliance health, and
          assessment outcomes.
        </p>
      </div>

      <AdminActionCenter
        pendingReviews={kpis.pendingReviews}
        docsAwaitingVerification={kpis.docsAwaitingVerification}
        safetyFlags={kpis.safetyFlags}
        aiFlags={kpis.aiFlags}
      />

      {/* Section 1: Candidates & Assessments */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 border-b border-border/60 pb-2">
          <Users className="size-4 text-primary" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Candidates & Assessments
          </h2>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            label="Total Candidates"
            value={kpis.totalCandidates}
            icon={Users}
            href="/admin/candidates"
          />
          <KpiCard
            label="Active Assessments"
            value={kpis.activeAssessments}
            icon={PlayCircle}
            href="/admin/assessments?tab=assigned"
          />
          <KpiCard
            label="Completed"
            value={kpis.completedAssessments}
            icon={CheckSquare}
            href="/admin/assessments?tab=assigned&status=completed"
          />
          <KpiCard
            label="Pending Reviews"
            value={kpis.pendingReviews}
            icon={Clock}
            href="/admin/assessments?tab=assigned&status=submitted"
          />
        </div>
      </div>

      {/* Section 2: Safety & Compliance */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 border-b border-border/60 pb-2">
          <ShieldAlert className="size-4 text-[var(--safety,#dc2626)]" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Safety & Compliance
          </h2>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:grid-cols-3">
          <KpiCard
            label="Safety Flags"
            value={kpis.safetyFlags}
            icon={ShieldAlert}
            accentColor={
              kpis.safetyFlags > 0
                ? "var(--destructive, #ef4444)"
                : "var(--foreground)"
            }
            description={
              kpis.safetyFlags > 0 ? "Critical safety flags" : "No safety flags"
            }
            href="/admin/assessments?tab=assigned"
            tooltip="Assessments containing critical safety incidents or unverified high-voltage safety flags."
          />
          <KpiCard
            label="AI Flags"
            value={kpis.aiFlags}
            icon={Sparkles}
            accentColor={
              kpis.aiFlags > 0 ? "var(--warning, #f59e0b)" : "var(--foreground)"
            }
            description={
              kpis.aiFlags > 0
                ? "Unreviewed safety items"
                : "No unreviewed items"
            }
            href="/admin/ai-governance"
            tooltip="Candidate answers flagged for safety non-compliance by AI evaluation awaiting examiner verification."
          />
          <KpiCard
            label="Docs for Review"
            value={kpis.docsAwaitingVerification}
            icon={FileText}
            description="Awaiting verification"
            href="/admin/documents"
          />
        </div>
      </div>

      {/* Section 3: EV Readiness & Outcomes */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 border-b border-border/60 pb-2">
          <Zap className="size-4 text-amber-500" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            EV Readiness & Outcomes
          </h2>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:grid-cols-3">
          <KpiCard
            label="EV Ready %"
            value={kpis.evReadyPct}
            icon={Zap}
            href="/admin/ev-readiness"
            tooltip="Percentage of assessed candidates meeting high-voltage and EV safety competency standards."
          />
          <KpiCard
            label="Average Score"
            value={kpis.averageScore}
            icon={TrendingUp}
            href="/admin/analytics"
          />
          <KpiCard
            label="Competent / NYC"
            value={kpis.competentPct}
            icon={Award}
            description="Outcome ratio"
            href="/admin/reports"
            tooltip="Ratio of completed candidates evaluated as Competent vs Not Yet Competent (NYC)."
          />
        </div>
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
