export interface RolePerformanceData {
  role: string;
  averageScore: number;
  completedCount: number;
}

export interface QualificationPerformanceData {
  qualification: string;
  averageScore: number;
  completedCount: number;
}

export interface AssessmentPerformanceData {
  templateTitle: string;
  averageScore: number;
  completedCount: number;
}

export interface ExaminerPerformanceData {
  examinerId: string;
  examinerName: string;
  assessmentsReviewed: number;
  averageScore: number;
  averageTurnaroundDays: number;
}
