"use client";

import { Award, Briefcase, CheckCircle2 } from "lucide-react";

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

interface Props {
  qualifications: QualificationItem[];
  employmentHistory: EmploymentHistoryItem[];
}

export function AdminCandidateExperience({ qualifications, employmentHistory }: Props) {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* Qualifications */}
      <div className="rounded-xl border border-border bg-card p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-border pb-2">
          <div className="flex items-center gap-2">
            <Award className="size-4 text-primary" />
            <h3 className="text-sm font-bold text-foreground">Qualifications & Accreditations</h3>
          </div>
          <span className="text-xs text-muted-foreground">{qualifications.length}</span>
        </div>

        {qualifications.length === 0 ? (
          <p className="text-xs text-muted-foreground italic py-2">No formal qualifications listed.</p>
        ) : (
          <div className="divide-y divide-border/60">
            {qualifications.map((q) => (
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
          <span className="text-xs text-muted-foreground">{employmentHistory.length}</span>
        </div>

        {employmentHistory.length === 0 ? (
          <p className="text-xs text-muted-foreground italic py-2">No employment history entered.</p>
        ) : (
          <div className="divide-y divide-border/60">
            {employmentHistory.map((emp) => (
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
  );
}
