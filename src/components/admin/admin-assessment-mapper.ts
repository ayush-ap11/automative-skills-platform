import { AdminQuestionItem } from "./AdminAssessmentDetailCard";

export function buildAdminQuestionItem(
  q: any,
  index: number,
  ans: any
): AdminQuestionItem {
  const verbal = Array.isArray(ans?.verbal_answers) ? ans.verbal_answers[0] : ans?.verbal_answers;
  const transcript = Array.isArray(verbal?.transcripts) ? verbal.transcripts[0] : verbal?.transcripts;
  const ai = Array.isArray(ans?.ai_analyses) ? ans.ai_analyses[0] : ans?.ai_analyses;
  const rev = Array.isArray(ans?.examiner_reviews) ? ans.examiner_reviews[0] : ans?.examiner_reviews;

  const rawOptions = q.question_options || q.options || [];
  const options = rawOptions.map((o: any) => ({
    id: o.id,
    text: o.option_text,
    isCorrect: Boolean(o.is_correct),
  }));

  return {
    id: q.id,
    num: index,
    text: q.question_text,
    type: q.question_type,
    marks: Number(q.marks || 0),
    safetyCritical: Boolean(q.safety_critical || q.is_safety_critical),
    options,
    answer: ans
      ? {
          selectedOptionIds: ans.selected_option_ids,
          answerText: ans.answer_text,
          transcriptText: transcript?.transcript_text || null,
          audioUrl: verbal?.audio_url || null,
        }
      : null,
    aiAnalysis: ai
      ? {
          provisionalScore: ai.provisional_score,
          technicalScore: ai.technical_score,
          safetyScore: ai.safety_score,
          diagnosticScore: ai.diagnostic_reasoning_score ?? ai.diagnostic_score,
          communicationScore: ai.communication_score,
          completenessScore: ai.completeness_score,
          criticalSafetyFlag: Boolean(ai.critical_safety_flag),
          flagReason: ai.flag_reason,
        }
      : null,
    review: rev
      ? {
          decision: rev.decision,
          finalScore: rev.final_score,
          comment: rev.comment,
        }
      : null,
  };
}
