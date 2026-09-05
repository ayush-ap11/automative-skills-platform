"use client";

import Link from "next/link";
import { ArrowLeft, Award, Briefcase, Zap, Shield, CheckCircle2, User } from "lucide-react";
import { AdminCandidateDocuments, DocumentItem } from "@/components/admin/AdminCandidateDocuments";
import { AdminCandidateAssessments, CandidateAssessmentItem } from "@/components/admin/AdminCandidateAssessments";
import { getStateFullName } from "@/app/(auth)/signup/schema";

export interface QualificationItem {
  id: string;
  qualification_name: string;
  issuing_body: string | null;
  issue_date: string | null;
  verified: boolean;
}

export interface EmploymentHistoryItem {
  id: string;
  employer_name: string | null;
  role_title: string | null;
  start_date: string | null;
  end_date: string | null;
  description: string | null;
  source: string;
}

export interface AdminCandidateDetailData {
  id: string;
  fullName: string;
  email: string;
  state: string | null;
  currentRole: string | null;
  yearsExperience: number | null;
  evExperience: boolean;
  hybridExperience: boolean;
  heavyVehicleExperience: boolean;
  lightVehicleExperience: boolean;
  autoElectricalExperience: boolean;
  qualifications: QualificationItem[];
  employmentHistory: EmploymentHistoryItem[];
  documents: DocumentItem[];
  assessments: CandidateAssessmentItem[];
}

interface Props {
  candidate: AdminCandidateDetailData;
  examiners: Array<{ id: string; name: string }>;
}

export function AdminCandidateDetail({ candidate, examiners }: Props) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/candidates" className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground cursor-pointer">
          <ArrowLeft className="size-4" /> Back to Candidates
        </Link>
      </div>

      {/* Header */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold text-lg">
              <User className="size-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-foreground">{candidate.fullName}</h1>
              <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap mt-0.5">
                <span>{candidate.email}</span>
                {candidate.currentRole && <span>&bull; {candidate.currentRole}</span>}
                {candidate.yearsExperience !== null && <span>&bull; {candidate.yearsExperience} yrs experience</span>}
                {candidate.state && <span>&bull; Location: {getStateFullName(candidate.state)}</span>}
              </div>
            </div>
          </div>
        </div>

        {/* Technical Domain Badges */}
        <div className="flex items-center gap-2 flex-wrap pt-1 border-t border-border/50">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mr-1">Domains:</span>
          {candidate.evExperience && <span className="inline-flex items-center gap-1 rounded bg-[var(--success)]/10 text-[var(--success)] px-2 py-0.5 text-[11px] font-medium"><Zap className="size-3" /> EV Certified</span>}
          {candidate.hybridExperience && <span className="inline-flex items-center gap-1 rounded bg-primary/10 text-primary px-2 py-0.5 text-[11px] font-medium">Hybrid</span>}
          {candidate.heavyVehicleExperience && <span className="inline-flex items-center gap-1 rounded bg-muted text-foreground px-2 py-0.5 text-[11px] font-medium">Heavy Vehicle</span>}
          {candidate.lightVehicleExperience && <span className="inline-flex items-center gap-1 rounded bg-muted text-foreground px-2 py-0.5 text-[11px] font-medium">Light Vehicle</span>}
          {candidate.autoElectricalExperience && <span className="inline-flex items-center gap-1 rounded bg-muted text-foreground px-2 py-0.5 text-[11px] font-medium">Auto Electrical</span>}
          {!candidate.evExperience && !candidate.hybridExperience && !candidate.heavyVehicleExperience && !candidate.lightVehicleExperience && !candidate.autoElectricalExperience && (
            <span className="text-xs text-muted-foreground italic">Standard Automotive</span>
          )}
        </div>
      </div>

      {/* Qualifications & Employment Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Qualifications */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-border pb-2">
            <div className="flex items-center gap-2">
              <Award className="size-4 text-primary" />
              <h3 className="text-sm font-bold text-foreground">Qualifications & Accreditations</h3>
            </div>
            <span className="text-xs text-muted-foreground">{candidate.qualifications.length}</span>
          </div>

          {candidate.qualifications.length === 0 ? (
            <p className="text-xs text-muted-foreground italic py-2">No formal qualifications listed.</p>
          ) : (
            <div className="divide-y divide-border/60">
              {candidate.qualifications.map((q) => (
                <div key={q.id} className="py-2 flex items-center justify-between gap-2">
                  <div>
                    <div className="text-xs font-semibold text-foreground">{q.qualification_name}</div>
                    <div className="text-[11px] text-muted-foreground">{q.issuing_body || "Registered Body"} {q.issue_date && `(${q.issue_date})`}</div>
                  </div>
                  {q.verified ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[var(--success)]"><CheckCircle2 className="size-3" /> Verified</span>
                  ) : (
                    <span className="text-[11px] text-muted-foreground">Unverified</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Employment History */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-border pb-2">
            <div className="flex items-center gap-2">
              <Briefcase className="size-4 text-primary" />
              <h3 className="text-sm font-bold text-foreground">Employment History</h3>
            </div>
            <span className="text-xs text-muted-foreground">{candidate.employmentHistory.length}</span>
          </div>

          {candidate.employmentHistory.length === 0 ? (
            <p className="text-xs text-muted-foreground italic py-2">No employment history entered.</p>
          ) : (
            <div className="divide-y divide-border/60">
              {candidate.employmentHistory.map((emp) => (
                <div key={emp.id} className="py-2 space-y-0.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-foreground">{emp.role_title || "Technician"}</span>
                    <span className="text-[11px] text-muted-foreground">{emp.start_date || "Past"} - {emp.end_date || "Present"}</span>
                  </div>
                  <div className="text-[11px] text-muted-foreground font-medium">{emp.employer_name || "Workshop"}</div>
                  {emp.description && <p className="text-[11px] text-muted-foreground line-clamp-2">{emp.description}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Documents */}
      <AdminCandidateDocuments documents={candidate.documents} />

      {/* Assessments */}
      <AdminCandidateAssessments assessments={candidate.assessments} examiners={examiners} />
    </div>
  );
}
