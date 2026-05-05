export type Job = {
  id: string;
  company_name: string;
  role_name: string;
  posting_details: string;
  posting_date: string;
  jd_text: string;
  jd_locked: boolean;
  created_at: string;
};

export type ResumeContent = {
  name: string;
  contact: { email: string; phone: string; location: string };
  summary: string;
  skills: string[];
  experience: Array<{
    title: string;
    company: string;
    duration: string;
    bullets: string[];
  }>;
  education: Array<{
    degree: string;
    institution: string;
    year: string;
  }>;
};

export type ResumeStatus =
  | "UPLOADED"
  | "PARSING"
  | "QUEUED"
  | "PROCESSING"
  | "OPTIMIZED"
  | "FAILED_PARSING"
  | "FAILED_OPTIMIZATION";

export type Resume = {
  id: string;
  job_id: string;
  original_filename: string;
  candidate_name: string;
  status: ResumeStatus;
  raw_text: string;
  optimized_content: ResumeContent | null;
  version: number;
  error_message: string;
  created_at: string;
};
