import { AZ900_TOPICS, PROFICIENCY_OPTIONS } from '@/data/az900Topics';
import type { StudySession } from '@/lib/supabase';

export interface PlanInput {
  examDate: string;
  availableHoursPerWeek: number;
  selectedTopics: string[];
  proficiency: Record<string, string>;
}

export interface GeneratedSession {
  session_date: string;
  topic: string;
  subtopics: string[];
  duration_minutes: number;
}

export interface GeneratedPlan {
  sessions: GeneratedSession[];
  totalDays: number;
  totalStudyHours: number;
  topicAllocations: { topic: string; hours: number; sessions: number }[];
  warnings: string[];
}

function dateDiffInDays(from: Date, to: Date): number {
  const ms = to.getTime() - from.getTime();
  return Math.max(1, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

function getProficiencyWeight(level: string): number {
  const opt = PROFICIENCY_OPTIONS.find((o) => o.value === level);
  return opt ? opt.weight : 2;
}

export function generatePlan(input: PlanInput): GeneratedPlan {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const examDate = new Date(input.examDate + 'T00:00:00');
  const totalDays = dateDiffInDays(today, examDate);
  const warnings: string[] = [];

  const studyDays = Math.max(1, totalDays - 2);

  const availableMinutesPerWeek = input.availableHoursPerWeek * 60;
  const availableMinutesTotal = Math.floor((availableMinutesPerWeek / 7) * studyDays);
  const totalStudyHours = Math.round((availableMinutesTotal / 60) * 10) / 10;

  if (totalDays < 7) {
    warnings.push('Your exam is less than a week away — this will be an intensive plan. Consider focusing only on your weakest areas.');
  }
  if (input.availableHoursPerWeek < 3) {
    warnings.push('Less than 3 hours per week may not be enough to fully prepare. Consider increasing your study time if possible.');
  }
  if (totalStudyHours < 10 && totalDays > 7) {
    warnings.push('The available study time is limited relative to the exam scope. Focus on high-weight domains first.');
  }

  const topicsToStudy = AZ900_TOPICS.filter((t) => input.selectedTopics.includes(t.name));

  if (topicsToStudy.length === 0) {
    return { sessions: [], totalDays, totalStudyHours: 0, topicAllocations: [], warnings: ['No topics selected. Please select at least one topic.'] };
  }

  const weightedTopics = topicsToStudy.map((t) => {
    const proficiencyWeight = getProficiencyWeight(input.proficiency[t.name] || 'intermediate');
    const score = t.weight * proficiencyWeight;
    return { topic: t, score };
  });

  const totalScore = weightedTopics.reduce((sum, wt) => sum + wt.score, 0);

  const topicAllocations = weightedTopics.map((wt) => {
    const proportion = wt.score / totalScore;
    const minutes = Math.round(proportion * availableMinutesTotal);
    return {
      topic: wt.topic.name,
      hours: Math.round((minutes / 60) * 10) / 10,
      sessions: 0,
    };
  });

  const sessions: GeneratedSession[] = [];
  const topicSubtopicQueues = new Map<string, { subtopic: { name: string; description: string }; minutesPerSub: number }[]>();

  topicsToStudy.forEach((t) => {
    const allocation = topicAllocations.find((a) => a.topic === t.name)!;
    const minutesForTopic = Math.round(allocation.hours * 60);
    const subtopics = [...t.subtopics].sort((a, b) => b.weight - a.weight);
    const minutesPerSub = Math.max(20, Math.round(minutesForTopic / Math.max(subtopics.length, 1)));
    topicSubtopicQueues.set(t.name, subtopics.map((s) => ({ subtopic: s, minutesPerSub })));
  });

  let dayOffset = 0;
  let studyDayCount = 0;
  let totalScheduledMinutes = 0;
  const maxSessionMinutes = 120;
  const minSessionMinutes = 25;

  const sortedTopicsByWeight = [...topicsToStudy].sort((a, b) => {
    const aWeight = getProficiencyWeight(input.proficiency[a.name] || 'intermediate') * a.weight;
    const bWeight = getProficiencyWeight(input.proficiency[b.name] || 'intermediate') * b.weight;
    return bWeight - aWeight;
  });

  while (dayOffset < studyDays) {
    const sessionDate = addDays(today, dayOffset);

    if (studyDayCount > 0 && studyDayCount % 6 === 0) {
      const reviewSession = createReviewSession(sessions, sessionDate);
      if (reviewSession) {
        sessions.push(reviewSession);
        totalScheduledMinutes += reviewSession.duration_minutes;
      }
    }

    const dailyMinutes = Math.min(
      Math.round(availableMinutesPerWeek / Math.min(6, studyDays)),
      maxSessionMinutes,
    );

    if (dailyMinutes < minSessionMinutes) {
      dayOffset++;
      studyDayCount++;
      continue;
    }

    let remainingMinutes = dailyMinutes;
    let sessionSubtopics: string[] = [];
    let sessionTopic = '';

    for (const topic of sortedTopicsByWeight) {
      const queue = topicSubtopicQueues.get(topic.name);
      if (!queue || queue.length === 0) continue;

      const next = queue[0];
      if (remainingMinutes >= minSessionMinutes) {
        if (!sessionTopic) sessionTopic = topic.name;
        if (sessionTopic === topic.name) {
          sessionSubtopics.push(next.subtopic.name);
          remainingMinutes -= next.minutesPerSub;
          queue.shift();
        }
      }

      if (remainingMinutes < minSessionMinutes) break;
    }

    if (sessionSubtopics.length > 0) {
      const duration = dailyMinutes - Math.max(0, remainingMinutes);
      sessions.push({
        session_date: formatDate(sessionDate),
        topic: sessionTopic,
        subtopics: sessionSubtopics,
        duration_minutes: Math.max(minSessionMinutes, duration),
      });
      totalScheduledMinutes += Math.max(minSessionMinutes, duration);
    }

    dayOffset++;
    studyDayCount++;
  }

  const practiceExamDate = addDays(today, Math.min(studyDays, totalDays - 2));
  if (practiceExamDate <= examDate) {
    sessions.push({
      session_date: formatDate(practiceExamDate),
      topic: 'Practice Exam',
      subtopics: ['Full-length practice exam', 'Review incorrect answers', 'Time management practice'],
      duration_minutes: 90,
    });
  }

  const finalReviewDate = addDays(today, Math.min(studyDays + 1, totalDays - 1));
  if (finalReviewDate <= examDate) {
    sessions.push({
      session_date: formatDate(finalReviewDate),
      topic: 'Final Review',
      subtopics: ['Key concepts cheat sheet review', 'Review all weak areas', 'Exam strategy and tips'],
      duration_minutes: 60,
    });
  }

  topicAllocations.forEach((a) => {
    a.sessions = sessions.filter((s) => s.topic === a.topic).length;
  });

  return {
    sessions,
    totalDays,
    totalStudyHours: Math.round((totalScheduledMinutes / 60) * 10) / 10,
    topicAllocations,
    warnings,
  };
}

function createReviewSession(pastSessions: GeneratedSession[], date: Date): GeneratedSession | null {
  const recentTopics = pastSessions
    .slice(-6)
    .map((s) => s.topic)
    .filter((t, i, arr) => arr.indexOf(t) === i && t !== 'Practice Exam' && t !== 'Final Review');

  if (recentTopics.length === 0) return null;

  return {
    session_date: formatDate(date),
    topic: 'Spaced Review',
    subtopics: ['Review notes from recent sessions', 'Self-quiz on key concepts', 'Revisit difficult subtopics'],
    duration_minutes: 30,
  };
}

export function sessionsToDbSessions(planId: string, sessions: GeneratedSession[]): Omit<StudySession, 'id' | 'created_at' | 'is_completed' | 'completed_at'>[] {
  return sessions.map((s) => ({
    plan_id: planId,
    session_date: s.session_date,
    topic: s.topic,
    subtopics: s.subtopics,
    duration_minutes: s.duration_minutes,
  }));
}
