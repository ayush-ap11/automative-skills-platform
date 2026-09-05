export interface CategoryDefinition {
  key: string;
  label: string;
  description: string;
  hasExpiry?: boolean;
  isSensitive?: boolean;
}

export interface DocumentRecord {
  id: string;
  candidate_profile_id: string;
  category: string;
  storage_path: string;
  file_name: string;
  status: 'uploaded' | 'ai_extracted' | 'pending_review' | 'verified' | 'rejected' | 'expired';
  expiry_date: string | null;
  is_sensitive: boolean;
  uploaded_at: string;
}

export interface ConsentRecord {
  id: string;
  candidate_profile_id: string;
  consent_type: string;
  granted: boolean;
  granted_at: string;
}

export interface ChecklistItem {
  category: CategoryDefinition;
  document: DocumentRecord | null;
  hasConsent: boolean;
}

export const DOCUMENT_CATEGORIES: CategoryDefinition[] = [
  {
    key: "resume",
    label: "Resume / CV",
    description: "Detailed curriculum vitae showing recent automotive experience",
  },
  {
    key: "job_card",
    label: "Job Card Evidence",
    description: "Workshop work orders, job cards, or service logs with diagnostics",
  },
  {
    key: "qualification_certificate",
    label: "Qualification Certificate",
    description: "Formal Certificate III/IV or Diploma trade certificates",
    hasExpiry: true,
  },
  {
    key: "training_certificate",
    label: "Training Certificate",
    description: "Accredited short courses, OEM training, or refresher credentials",
    hasExpiry: true,
  },
  {
    key: "ev_training_certificate",
    label: "EV Training Certificate",
    description: "High voltage safety, battery disconnect, or EV diagnostic credentials",
    hasExpiry: true,
  },
  {
    key: "safety_training",
    label: "Safety Training",
    description: "WHS white card, workshop safety induction, or first aid certificate",
    hasExpiry: true,
  },
  {
    key: "manufacturer_training",
    label: "Manufacturer Training",
    description: "Brand-specific dealership technical certifications and badges",
    hasExpiry: true,
  },
  {
    key: "drivers_licence",
    label: "Driver's Licence",
    description: "Valid Australian or international driver's licence copy",
    hasExpiry: true,
  },
  {
    key: "health_fitness",
    label: "Health & Fitness Assessment",
    description: "Occupational medical assessment or fit-for-work declaration",
    isSensitive: true,
  },
  {
    key: "eye_test",
    label: "Eye Test Record",
    description: "Recent optometric vision screening or colour vision certificate",
    isSensitive: true,
  },
  {
    key: "other",
    label: "Other Supporting Document",
    description: "Any other relevant trade licenses, references, or evidence",
  },
];
