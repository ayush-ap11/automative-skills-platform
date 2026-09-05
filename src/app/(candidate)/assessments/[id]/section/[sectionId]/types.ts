export type NonVerbalQuestionType =
  | "multiple_choice"
  | "multiple_answer"
  | "true_false"
  | "scenario"
  | "short_answer"
  | "image_based";

export interface QuestionOption {
  id: string;
  option_text: string;
  order_index?: number | null;
}

export interface QuestionItem {
  id: string;
  section_id: string;
  question_text: string;
  question_type: NonVerbalQuestionType;
  mandatory: boolean;
  image_url?: string | null;
  time_limit_seconds?: number | null;
  options: QuestionOption[];
}

export interface AnswerDraft {
  selectedOptionIds: string[];
  answerText: string;
}

export interface ExistingAnswer {
  question_id: string;
  selected_option_ids: string[] | null;
  answer_text: string | null;
}

export interface VerbalQuestionItem {
  id: string;
  section_id: string;
  question_text: string;
  mandatory: boolean;
  time_limit_seconds?: number | null;
}

export interface ExistingVerbalAnswer {
  question_id: string;
  audio_storage_path: string;
  duration_seconds: number;
  transcript_text: string | null;
}
