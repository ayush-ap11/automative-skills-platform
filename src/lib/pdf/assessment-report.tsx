import "server-only";
import React from "react";
import { Document, Page, View, Text, StyleSheet, renderToBuffer } from "@react-pdf/renderer";

export interface ReportData {
  organisationName: string;
  frameworkVersion: string;
  candidate: { fullName: string; role: string; yearsExperience: number | null; state: string | null; };
  qualifications: Array<{ name: string; issuingBody: string | null; issueDate: string | null; }>;
  assessment: { templateTitle: string; completedAt: string; overallScore: number | null; outcome: string; };
  categoryScores: Array<{ category: string; score: number; questionCount: number; }>;
  aiAnalysis: { provisionalScore: number | null; safetyFlagged: boolean; technicalScore: number | null; safetyScore: number | null; } | null;
  examinerReview: { examinerName: string; reviewDate: string; comments: string[]; finalOutcome: string; };
  evReadiness: {
    evKnowledge: number | null; hvSafetyAwareness: number | null; diagnostics: number | null;
    practicalEvidence: number | null; trainingEvidence: number | null; verbalReasoning: number | null;
    overallScore: number | null; status: string;
  } | null;
}

const s = StyleSheet.create({
  page: { padding: 28, fontSize: 8.5, fontFamily: "Helvetica", color: "#1e293b", lineHeight: 1.3 },
  hdr: { borderBottomWidth: 1, borderColor: "#cbd5e1", paddingBottom: 6, marginBottom: 8, flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" },
  title: { fontSize: 16, fontFamily: "Helvetica-Bold", color: "#0f172a" },
  sub: { fontSize: 8, color: "#64748b" },
  sec: { marginBottom: 8 },
  secT: { fontSize: 9.5, fontFamily: "Helvetica-Bold", color: "#0f172a", marginBottom: 3, borderBottomWidth: 0.5, borderColor: "#e2e8f0", paddingBottom: 1 },
  grid: { flexDirection: "row", flexWrap: "wrap" },
  col: { width: "25%", marginBottom: 3 },
  lbl: { fontSize: 7, color: "#64748b", textTransform: "uppercase" },
  val: { fontFamily: "Helvetica-Bold", color: "#0f172a" },
  tblH: { flexDirection: "row", backgroundColor: "#f8fafc", padding: 3, borderBottomWidth: 1, borderColor: "#cbd5e1", fontFamily: "Helvetica-Bold" },
  tblR: { flexDirection: "row", padding: 3, borderBottomWidth: 0.5, borderColor: "#f1f5f9" },
  c1: { width: "60%" }, c2: { width: "20%", textAlign: "right" }, c3: { width: "20%", textAlign: "right" },
  aiBox: { backgroundColor: "#f8fafc", borderWidth: 0.5, borderColor: "#e2e8f0", padding: 6, borderRadius: 3, marginBottom: 8 },
  humBox: { backgroundColor: "#f0fdf4", borderWidth: 0.5, borderColor: "#bbf7d0", padding: 6, borderRadius: 3, marginBottom: 8 },
  evBox: { backgroundColor: "#eff6ff", borderWidth: 0.5, borderColor: "#bfdbfe", padding: 6, borderRadius: 3, marginBottom: 8 },
  disclaimer: { fontSize: 6.8, color: "#92400e", marginTop: 4, lineHeight: 1.2 },
});

export function AssessmentReportDocument({ d }: { d: ReportData }) {
  return (
    <Document>
      <Page size="A4" style={s.page}>
        <View style={s.hdr}>
          <View><Text style={s.title}>{d.organisationName}</Text><Text style={s.sub}>Vocational Assessment Determination Report</Text></View>
          <View style={{ alignItems: "flex-end" }}><Text style={s.sub}>Framework: {d.frameworkVersion}</Text><Text style={s.sub}>Issued: {d.assessment.completedAt}</Text></View>
        </View>

        <View style={s.sec}>
          <Text style={s.secT}>Candidate &amp; Assessment Information</Text>
          <View style={s.grid}>
            <View style={s.col}><Text style={s.lbl}>Candidate</Text><Text style={s.val}>{d.candidate.fullName}</Text></View>
            <View style={s.col}><Text style={s.lbl}>Role &amp; Exp</Text><Text style={s.val}>{d.candidate.role} ({d.candidate.yearsExperience ?? "—"} yrs)</Text></View>
            <View style={s.col}><Text style={s.lbl}>State/Territory</Text><Text style={s.val}>{d.candidate.state || "National"}</Text></View>
            <View style={s.col}><Text style={s.lbl}>Assessment Outcome</Text><Text style={[s.val, { color: d.assessment.outcome === "competent" ? "#16a34a" : "#ca8a04" }]}>{d.assessment.outcome.toUpperCase()}</Text></View>
          </View>
        </View>

        {d.qualifications.length > 0 && (
          <View style={s.sec}>
            <Text style={s.secT}>Verified Qualifications &amp; Accreditations</Text>
            {d.qualifications.map((q, i) => (
              <Text key={i} style={{ fontSize: 7.5, color: "#334155" }}>• {q.name} ({q.issuingBody || "Registered Body"}, {q.issueDate || "Date N/A"})</Text>
            ))}
          </View>
        )}

        <View style={s.sec}>
          <Text style={s.secT}>Competency Skill Category Scores</Text>
          <View style={s.tblH}><Text style={s.c1}>Category</Text><Text style={s.c2}>Questions</Text><Text style={s.c3}>Score</Text></View>
          {d.categoryScores.map((c, i) => (
            <View key={i} style={s.tblR}><Text style={s.c1}>{c.category}</Text><Text style={s.c2}>{c.questionCount}</Text><Text style={s.c3}>{c.score}%</Text></View>
          ))}
          <View style={[s.tblR, { fontFamily: "Helvetica-Bold", backgroundColor: "#f8fafc" }]}>
            <Text style={s.c1}>Overall Verified Assessment Score</Text><Text style={s.c2}>—</Text><Text style={s.c3}>{d.assessment.overallScore ?? "—"}%</Text>
          </View>
        </View>

        <View style={s.aiBox}>
          <Text style={[s.secT, { borderColor: "#cbd5e1" }]}>AI-Assisted Analysis (Provisional)</Text>
          <Text style={{ fontSize: 7.5, color: "#475569", marginBottom: 3 }}>
            Automated multi-dimensional analysis informed assessment workflow but did NOT determine candidate outcome. Human examiner verification required.
          </Text>
          <View style={s.grid}>
            <View style={s.col}><Text style={s.lbl}>AI Provisional Score</Text><Text style={s.val}>{d.aiAnalysis?.provisionalScore != null ? `${d.aiAnalysis.provisionalScore}%` : "N/A"}</Text></View>
            <View style={s.col}><Text style={s.lbl}>Technical Score</Text><Text style={s.val}>{d.aiAnalysis?.technicalScore != null ? `${d.aiAnalysis.technicalScore}%` : "N/A"}</Text></View>
            <View style={s.col}><Text style={s.lbl}>Safety Score</Text><Text style={s.val}>{d.aiAnalysis?.safetyScore != null ? `${d.aiAnalysis.safetyScore}%` : "N/A"}</Text></View>
            <View style={s.col}><Text style={s.lbl}>Critical Safety Flag</Text><Text style={[s.val, { color: d.aiAnalysis?.safetyFlagged ? "#dc2626" : "#16a34a" }]}>{d.aiAnalysis?.safetyFlagged ? "FLAGGED" : "CLEARED"}</Text></View>
          </View>
        </View>

        <View style={s.humBox}>
          <Text style={[s.secT, { borderColor: "#86efac", color: "#14532d" }]}>Human Examiner Determination (Official Decision)</Text>
          <View style={s.grid}>
            <View style={s.col}><Text style={s.lbl}>Examiner</Text><Text style={s.val}>{d.examinerReview.examinerName}</Text></View>
            <View style={s.col}><Text style={s.lbl}>Review Date</Text><Text style={s.val}>{d.examinerReview.reviewDate}</Text></View>
            <View style={s.col}><Text style={s.lbl}>Final Status</Text><Text style={[s.val, { color: d.examinerReview.finalOutcome === "competent" ? "#16a34a" : "#ca8a04" }]}>{d.examinerReview.finalOutcome.toUpperCase()}</Text></View>
          </View>
          {d.examinerReview.comments.length > 0 && (
            <Text style={{ fontSize: 7.5, color: "#166534", marginTop: 3 }}>Examiner Notes: {d.examinerReview.comments.slice(0, 2).join(" • ")}</Text>
          )}
        </View>

        {d.evReadiness && (
          <View style={s.evBox}>
            <Text style={[s.secT, { borderColor: "#93c5fd", color: "#1e3a8a" }]}>EV &amp; High-Voltage Technical Readiness Breakdown</Text>
            <View style={s.grid}>
              <View style={s.col}><Text style={s.lbl}>EV Knowledge</Text><Text style={s.val}>{d.evReadiness.evKnowledge ?? "—"}%</Text></View>
              <View style={s.col}><Text style={s.lbl}>HV Safety Awareness</Text><Text style={s.val}>{d.evReadiness.hvSafetyAwareness ?? "—"}%</Text></View>
              <View style={s.col}><Text style={s.lbl}>Diagnostics</Text><Text style={s.val}>{d.evReadiness.diagnostics ?? "—"}%</Text></View>
              <View style={s.col}><Text style={s.lbl}>Practical Evidence</Text><Text style={s.val}>{d.evReadiness.practicalEvidence ?? "—"}%</Text></View>
              <View style={s.col}><Text style={s.lbl}>Training Evidence</Text><Text style={s.val}>{d.evReadiness.trainingEvidence ?? "—"}%</Text></View>
              <View style={s.col}><Text style={s.lbl}>Verbal Reasoning</Text><Text style={s.val}>{d.evReadiness.verbalReasoning ?? "—"}%</Text></View>
              <View style={s.col}><Text style={s.lbl}>Overall EV Score</Text><Text style={s.val}>{d.evReadiness.overallScore ?? "—"}%</Text></View>
              <View style={s.col}><Text style={s.lbl}>EV Readiness Status</Text><Text style={[s.val, { color: d.evReadiness.status === "strong" ? "#16a34a" : "#2563eb" }]}>{d.evReadiness.status.toUpperCase()}</Text></View>
            </View>
            <Text style={s.disclaimer}>
              SAFETY-CRITICAL ASSESSMENT — This assessment evaluates knowledge relating to high-voltage electric vehicle systems. Assessment results do not themselves authorise a person to perform high-voltage work. Actual workplace activities must comply with applicable workplace procedures, manufacturer instructions, training/competency requirements and applicable Australian standards and regulations.
            </Text>
          </View>
        )}
      </Page>
    </Document>
  );
}

export async function renderAssessmentReportPdf(data: ReportData): Promise<Buffer> {
  const buf = await renderToBuffer(<AssessmentReportDocument d={data} />);
  return Buffer.from(buf);
}
