"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Zap, User, KeyRound, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AdminCandidateDocuments, DocumentItem } from "@/components/admin/AdminCandidateDocuments";
import { AdminCandidateAssessments, CandidateAssessmentItem } from "@/components/admin/AdminCandidateAssessments";
import { AdminCandidateExperience, QualificationItem, EmploymentHistoryItem } from "@/components/admin/AdminCandidateExperience";
import { OneTimePasswordPanel } from "@/components/admin/OneTimePasswordPanel";
import { resetCandidatePassword } from "@/app/(admin)/admin/candidates/actions";
import { getStateFullName } from "@/app/(auth)/signup/schema";

export type { QualificationItem, EmploymentHistoryItem };

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
  const [resetting, setResetting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState<string | null>(null);

  const handleResetPassword = async () => {
    setResetting(true);
    setErrorMsg(null);
    const res = await resetCandidatePassword(candidate.id);
    setResetting(false);
    if (res.error) {
      setErrorMsg(res.error);
    } else if (res.newPassword) {
      setNewPassword(res.newPassword);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/candidates" className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground cursor-pointer">
          <ArrowLeft className="size-4" /> Back to Candidates
        </Link>
      </div>

      {errorMsg && (
        <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-xs text-destructive">
          <AlertCircle className="size-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

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

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleResetPassword}
            disabled={resetting}
            className="cursor-pointer text-amber-600 border-amber-500/30 hover:bg-amber-500/10 text-xs self-start sm:self-auto"
          >
            {resetting ? <Loader2 className="size-3.5 animate-spin mr-1.5" /> : <KeyRound className="size-3.5 mr-1.5" />}
            Reset Password
          </Button>
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
      <AdminCandidateExperience
        qualifications={candidate.qualifications}
        employmentHistory={candidate.employmentHistory}
      />

      {/* Documents */}
      <AdminCandidateDocuments documents={candidate.documents} />

      {/* Assessments */}
      <AdminCandidateAssessments assessments={candidate.assessments} examiners={examiners} />

      {/* One-Time Password Reveal Dialog */}
      <Dialog open={!!newPassword} onOpenChange={(open) => !open && setNewPassword(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Temporary Password Generated</DialogTitle>
          </DialogHeader>
          {newPassword && (
            <OneTimePasswordPanel
              email={candidate.email}
              password={newPassword}
              roleLabel="candidate"
              onDone={() => setNewPassword(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
