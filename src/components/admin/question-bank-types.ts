export interface QuestionRecord {
  id: string;
  section_id: string;
  question_text: string;
  question_type: string;
  skill_category: string | null;
  difficulty: "easy" | "medium" | "hard";
  explanation?: string | null;
  competency_mapping: string[] | null;
  marks: number;
  time_limit_seconds: number | null;
  mandatory: boolean;
  ai_evaluation_enabled: boolean;
  ev_related: boolean;
  safety_critical: boolean;
  status: "draft" | "active" | "retired";
  created_at?: string;
  question_options?: Array<{ id?: string; option_text: string; is_correct: boolean }>;
}

export interface SectionOption {
  id: string;
  label: string;
}

export const CATEGORY_PRESETS = [
  "EV",
  "Hybrid",
  "Electrical",
  "Mechanical",
  "Diagnostics",
  "Safety",
  "Customer Service",
  "Workshop Practice",
  "Technical Knowledge",
];

export const QUESTION_TYPES = [
  "multiple_choice",
  "multiple_answer",
  "true_false",
  "scenario",
  "short_answer",
  "verbal",
  "image_based",
  "video_based",
  "practical_observation",
  "document_evidence",
];
