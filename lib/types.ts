export type Role = "student" | "counselor" | "admin";
export type Grade = 9 | 10 | 11 | 12;

export interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
  grade_level: Grade | null;
  target_regions: string[];
  role: Role;
  assigned_counselor_id: string | null;
  sat_target: number | null;
  ielts_target: number | null;
  daily_goal: number;
  onboarded: boolean;
  school_name: string | null;
  intended_major: string | null;
  gpa: string | null;
  class_rank: string | null;
  rigor_notes: string | null;
  spike_statement: string | null;
}

export type TaskCategory = "essay" | "testing" | "ec" | "rec" | "general";
export type TaskStatus = "todo" | "in_progress" | "completed";

export interface RoadmapTask {
  id: string;
  grade_level: Grade;
  category: TaskCategory;
  title: string;
  description: string | null;
  priority: "high" | "medium" | "low";
  sort_order: number;
}

export interface SourceAttribution {
  platform: string;
  title?: string;
  author?: string;
  url?: string;
}

export type GuideCategory = "ps" | "study_plan" | "supplemental" | "sat" | "ielts" | "ec" | "rec";

export interface Guide {
  id: string;
  slug: string;
  category: GuideCategory;
  title: string;
  summary: string | null;
  content_markdown: string;
  source_attribution: SourceAttribution[];
  reading_time_mins: number;
  published: boolean;
}

export type EssayType = "personal_statement" | "study_plan" | "supplemental";
export type ReviewStatus = "draft" | "submitted" | "reviewed" | "meeting_scheduled" | "completed";

export interface Essay {
  id: string;
  user_id: string;
  counselor_id: string | null;
  essay_type: EssayType;
  title: string;
  prompt: string | null;
  word_limit: number | null;
  content: string;
  word_count: number;
  review_status: ReviewStatus;
  needs_in_person_meeting: boolean;
  meeting_notes: string | null;
  meeting_at: string | null;
  submitted_at: string | null;
  updated_at: string;
}

export interface EssaySubmission {
  id: string;
  essay_id: string;
  counselor_id: string;
  content: string;
  word_count: number;
  focus_areas: string[];
  student_note: string | null;
  created_at: string;
}

export interface Feedback {
  id: string;
  essay_id: string;
  submission_id: string | null;
  author_id: string;
  paragraph_index: number | null;
  excerpt_quote: string | null;
  comment: string;
  is_resolved: boolean;
  created_at: string;
  author?: { full_name: string | null; role: Role } | null;
}

export type ImpactCategory = "leadership" | "service" | "research" | "arts_athletics" | "work_family";

export interface Activity {
  id: string;
  user_id: string;
  position_order: number;
  activity_type: string;
  impact_category: ImpactCategory | null;
  role_title: string;
  organization: string;
  description: string;
  grades_participated: number[];
  hours_per_week: number;
  weeks_per_year: number;
}

export type TestType = "SAT" | "IELTS";

export interface TestScore {
  id: string;
  test_type: TestType;
  test_date: string;
  is_official: boolean;
  total_score: number;
  section_scores: Record<string, number>;
}

export interface StudyLog {
  id: string;
  test_type: TestType;
  logged_on: string;
  minutes: number;
  focus: string | null;
}

export type RecommenderStatus = "not_asked" | "requested" | "in_progress" | "submitted";

export interface Recommender {
  id: string;
  teacher_name: string;
  subject: string | null;
  relationship_context: string | null;
  brag_sheet_notes: string | null;
  status: RecommenderStatus;
  due_date: string | null;
  thank_you_sent: boolean;
  email: string | null;
  teacher_id: string | null;
  share_token: string;
  requested_at: string | null;
  viewed_at: string | null;
}

export interface Teacher {
  id: string;
  full_name: string;
  email: string;
  subject: string | null;
}

export interface CounselorTask {
  id: string;
  student_id: string;
  title: string;
  details: string | null;
  due_date: string | null;
  done_at: string | null;
  created_at: string;
}

export interface Deadline {
  round: string;
  date: string | null;
  window?: string;
  note?: string;
}

export interface University {
  id: string;
  name: string;
  country: string;
  city: string | null;
  region: string;
  world_rank: number | null;
  ranking_source: string;
  rank_confirmed: boolean;
  platform: string | null;
  deadlines: Deadline[];
  testing: string | null;
  english: string | null;
  app_fee: string | null;
  financial_aid: string | null;
  notes: string | null;
  website: string | null;
  deadline_status: "confirmed" | "estimated";
  cycle: string;
  last_reviewed: string;
  curated: boolean;
  state: string | null;
  ownership: "public" | "private" | null;
  acceptance_rate: number | null;
  sat_avg: number | null;
  sat_25: number | null;
  sat_75: number | null;
  act_mid: number | null;
  undergrad_size: number | null;
  tuition_out_of_state: number | null;
  cost_of_attendance: number | null;
  intl_share: number | null;
  grad_rate: number | null;
  median_earnings: number | null;
  ielts_min: number | null;
  toefl_min: number | null;
  stats_source: string | null;
}

export interface AdmissionResult {
  id: string;
  student_name: string;
  university_name: string;
  class_year: number | null;
  scholarship: string | null;
  note: string | null;
}

export type ApplicationStatus = "researching" | "applying" | "submitted" | "admitted" | "waitlisted" | "rejected";

export interface UserUniversity {
  id: string;
  university_id: string;
  round: string | null;
  status: ApplicationStatus;
  notes: string | null;
}

export type ActionResult = { error?: string } | void;
