import Link from "next/link";
import { Award, FileText, ArrowRight, ChevronRight, Zap, Shield } from "lucide-react";
import { getStateFullName } from "@/app/(auth)/signup/schema";

export interface CandidateData {
  id: string;
  fullName: string;
  currentRole: string | null;
  yearsExperience: number | null;
  state: string | null;
  evExperience: boolean; hybridExperience: boolean;
  heavyVehicleExperience: boolean; lightVehicleExperience: boolean;
  autoElectricalExperience: boolean;
}

export interface QualificationItem {
  id: string; qualification_name: string; issuing_body: string | null;
  issue_date: string | null; verified: boolean;
}

export interface CandidateAssessmentItem {
  id: string; title: string; status: string;
  overall_score: number | null; ev_readiness_score: number | null; submitted_at: string | null;
}

const STATUS_CLASSES: Record<string, { label: string; className: string }> = {
  submitted: { label: "Submitted", className: "bg-warning/10 text-warning border-warning/30" },
  completed: { label: "Completed", className: "bg-success/10 text-success border-success/30" },
  under_review: { label: "Under Review", className: "bg-primary/10 text-primary border-primary/30" },
  in_progress: { label: "In Progress", className: "bg-primary/10 text-primary border-primary/30" },
  not_started: { label: "Not Started", className: "bg-muted text-muted-foreground border-border" },
};

export interface CandidateOverviewProps {
  candidate: CandidateData;
  qualifications: QualificationItem[];
  evidenceCompleteness: { verifiedCount: number; totalCount: number };
  assessments: CandidateAssessmentItem[];
  blindMode?: boolean;
}

export function CandidateOverview({
  candidate, qualifications, evidenceCompleteness, assessments, blindMode,
}: CandidateOverviewProps) {
  const expBadges = [
    { show: candidate.evExperience, label: "EV", icon: Zap, cls: "bg-secondary/10 text-secondary" },
    { show: candidate.hybridExperience, label: "Hybrid", cls: "bg-primary/10 text-primary" },
    { show: candidate.heavyVehicleExperience, label: "Heavy Vehicle", cls: "bg-muted text-foreground" },
    { show: candidate.lightVehicleExperience, label: "Light Vehicle", cls: "bg-muted text-foreground" },
    { show: candidate.autoElectricalExperience, label: "Auto Electrical", cls: "bg-muted text-foreground" },
  ].filter((b) => b.show);

  const displayName = blindMode ? `Candidate #${candidate.id.slice(0, 8)}` : candidate.fullName;

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">{displayName}</h2>
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground mt-1">
            <span>{candidate.currentRole || "Automotive Technician"}</span>
            <span>•</span>
            <span>{candidate.yearsExperience !== null ? `${candidate.yearsExperience} Yrs Exp` : "Exp not set"}</span>
            {candidate.state && <span>• {getStateFullName(candidate.state)}</span>}
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {expBadges.map((b) => (
            <span key={b.label} className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium ${b.cls}`}>
              {b.icon && <b.icon className="size-3" />} {b.label}
            </span>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-4">
        <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
          <Award className="size-4 text-primary" /> Qualifications & Accreditations
        </h3>
        {qualifications.length === 0 ? (
          <p className="text-xs text-muted-foreground">No qualifications recorded for this candidate.</p>
        ) : (
          <div className="divide-y divide-border">
            {qualifications.map((q) => (
              <div key={q.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                <div>
                  <p className="text-sm font-medium text-foreground">{q.qualification_name}</p>
                  <p className="text-xs text-muted-foreground">{q.issuing_body || "Unknown"} • {q.issue_date ? new Date(q.issue_date).toLocaleDateString("en-AU") : "Date not set"}</p>
                </div>
                <span
                  className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium"
                  style={{
                    color: q.verified ? "var(--success)" : "var(--muted-foreground)",
                    borderColor: q.verified ? "var(--success)" : "var(--border)",
                  }}
                >
                  {q.verified ? "Verified" : "Unverified"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-xl border border-border bg-card p-6 shadow-sm flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
            <FileText className="size-4 text-primary" /> Evidence Completeness
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            {evidenceCompleteness.verifiedCount} of {evidenceCompleteness.totalCount} document categories verified
          </p>
        </div>
        <Link href={`/examiner/documents?candidateId=${candidate.id}`} className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline cursor-pointer">
          View Documents <ArrowRight className="size-4" />
        </Link>
      </div>

      <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-4">
        <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
          <Shield className="size-4 text-primary" /> Assigned Assessments
        </h3>
        <div className="divide-y divide-border">
          {assessments.map((a) => {
            const sc = STATUS_CLASSES[a.status] || { label: a.status, className: "bg-muted text-muted-foreground border-border" };
            return (
              <Link key={a.id} href={`/examiner/assessments/${a.id}/review`} className="flex items-center justify-between py-3 first:pt-0 last:pb-0 hover:bg-muted/40 px-2 rounded-lg transition cursor-pointer">
                <div>
                  <p className="text-sm font-medium text-foreground">{a.title}</p>
                  <p className="text-xs text-muted-foreground">
                    Submitted: {a.submitted_at ? new Date(a.submitted_at).toLocaleDateString("en-AU") : "Pending submission"}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {a.ev_readiness_score !== null && <span className="text-xs font-semibold text-secondary">EV: {a.ev_readiness_score}%</span>}
                  <span className="text-xs font-medium text-foreground">{a.overall_score !== null ? `${a.overall_score}%` : "—"}</span>
                  <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${sc.className}`}>{sc.label}</span>
                  <ChevronRight className="size-4 text-muted-foreground" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
