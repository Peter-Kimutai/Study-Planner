import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface StudyPlan {
  id: string;
  exam_date: string;
  available_hours_per_week: number;
  selected_topics: string[];
  proficiency: Record<string, string>;
  total_days: number;
  created_at: string;
}

export interface StudySession {
  id: string;
  plan_id: string;
  session_date: string;
  topic: string;
  subtopics: string[];
  duration_minutes: number;
  is_completed: boolean;
  completed_at: string | null;
  created_at: string;
}

export type ProficiencyLevel = 'beginner' | 'intermediate' | 'advanced';
