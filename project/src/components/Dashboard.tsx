import { useMemo, useState, useEffect } from 'react';
import {
  Calendar, Clock, Target, TrendingUp, CheckCircle2, Circle,
  AlertTriangle, RotateCcw, ChevronLeft, BookOpen, Award, Flame,
  Timer, Brain, Zap, BarChart3
} from 'lucide-react';
import type { StudyPlan, StudySession } from '@/lib/supabase';
import { supabase } from '@/lib/supabase';
import type { GeneratedPlan } from '@/lib/planGenerator';
import { AZ900_TOPICS } from '@/data/az900Topics';
import FocusTimer from '@/components/FocusTimer';
import MockExam from '@/components/MockExam';

interface DashboardProps {
  plan: StudyPlan;
  sessions: StudySession[];
  generatedPlan: GeneratedPlan;
  onBack: () => void;
  onReset: () => void;
  onSessionsUpdate: (sessions: StudySession[]) => void;
}

const TOPIC_COLORS: Record<string, { bg: string; text: string; border: string; dot: string; bar: string }> = {
  'Cloud Concepts': { bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200', dot: 'bg-sky-500', bar: 'bg-sky-500' },
  'Azure Architecture & Services': { bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200', dot: 'bg-cyan-500', bar: 'bg-cyan-500' },
  'Azure Management & Governance': { bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200', dot: 'bg-teal-500', bar: 'bg-teal-500' },
  'Security, Privacy & Compliance': { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200', dot: 'bg-indigo-500', bar: 'bg-indigo-500' },
  'Spaced Review': { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', dot: 'bg-amber-500', bar: 'bg-amber-500' },
  'Practice Exam': { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', dot: 'bg-red-500', bar: 'bg-red-500' },
  'Final Review': { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500', bar: 'bg-emerald-500' },
};

function getColor(topic: string) {
  return TOPIC_COLORS[topic] || { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200', dot: 'bg-slate-500', bar: 'bg-slate-500' };
}

const PROFICIENCY_LABELS: Record<string, { label: string; color: string }> = {
  beginner: { label: 'Beginner', color: 'text-red-600 bg-red-50' },
  intermediate: { label: 'Intermediate', color: 'text-amber-600 bg-amber-50' },
  advanced: { label: 'Advanced', color: 'text-emerald-600 bg-emerald-50' },
};

interface Countdown {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function calcCountdown(examDate: string): Countdown {
  const diff = new Date(examDate + 'T00:00:00').getTime() - Date.now();
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
    minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
    seconds: Math.floor((diff % (1000 * 60)) / 1000),
  };
}

export default function Dashboard({ plan, sessions, generatedPlan, onBack, onReset, onSessionsUpdate }: DashboardProps) {
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'completed'>('all');
  const [countdown, setCountdown] = useState<Countdown>(() => calcCountdown(plan.exam_date));
  const [showFocusTimer, setShowFocusTimer] = useState(false);
  const [showMockExam, setShowMockExam] = useState(false);
  const [focusTopic, setFocusTopic] = useState<string>('');

  useEffect(() => {
    const loadSessions = async () => {
      const { data, error } = await supabase
        .from('study_sessions')
        .select('*')
        .eq('plan_id', plan.id)
        .order('session_date', { ascending: true });

      if (!error && data) {
        onSessionsUpdate(data as StudySession[]);
      }
    };
    if (sessions.length === 0) loadSessions();
  }, [plan.id]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown(calcCountdown(plan.exam_date));
    }, 1000);
    return () => clearInterval(interval);
  }, [plan.exam_date]);

  const sortedSessions = useMemo(() => [...sessions].sort((a, b) => a.session_date.localeCompare(b.session_date)), [sessions]);

  const completedCount = sortedSessions.filter((s) => s.is_completed).length;
  const progress = sortedSessions.length > 0 ? Math.round((completedCount / sortedSessions.length) * 100) : 0;

  const today = new Date().toISOString().split('T')[0];
  const nextSession = sortedSessions.find((s) => !s.is_completed && s.session_date >= today);

  const filteredSessions = useMemo(() => {
    if (filter === 'completed') return sortedSessions.filter((s) => s.is_completed);
    if (filter === 'upcoming') return sortedSessions.filter((s) => !s.is_completed);
    return sortedSessions;
  }, [sortedSessions, filter]);

  const toggleComplete = async (sessionId: string, isCompleted: boolean) => {
    const updates = isCompleted
      ? { is_completed: false, completed_at: null }
      : { is_completed: true, completed_at: new Date().toISOString() };

    const newSessions = sortedSessions.map((s) =>
      s.id === sessionId ? { ...s, ...updates } as StudySession : s
    );
    onSessionsUpdate(newSessions);

    const { error } = await supabase
      .from('study_sessions')
      .update(updates)
      .eq('id', sessionId);

    if (error) {
      const reverted = sortedSessions.map((s) =>
        s.id === sessionId ? { ...s, is_completed: !isCompleted, completed_at: isCompleted ? null : s.completed_at } as StudySession : s
      );
      onSessionsUpdate(reverted);
    }
  };

  // Domain readiness: per-topic completion percentage
  const domainReadiness = useMemo(() => {
    const studyTopics = AZ900_TOPICS.filter((t) => plan.selected_topics.includes(t.name));
    return studyTopics.map((topic) => {
      const topicSessions = sortedSessions.filter((s) => s.topic === topic.name);
      const done = topicSessions.filter((s) => s.is_completed).length;
      const total = topicSessions.length;
      const pct = total > 0 ? Math.round((done / total) * 100) : 0;
      const proficiency = plan.proficiency[topic.name] || 'intermediate';
      const alloc = generatedPlan.topicAllocations.find((a) => a.topic === topic.name);
      return { topic: topic.name, weight: topic.weight, pct, done, total, proficiency, hours: alloc?.hours || 0, sessions: alloc?.sessions || 0 };
    });
  }, [sortedSessions, plan, generatedPlan]);

  const spacedReviews = sortedSessions.filter((s) => s.topic === 'Spaced Review');
  const overallReadiness = domainReadiness.length > 0
    ? Math.round(domainReadiness.reduce((sum, d) => sum + d.pct * (d.weight / domainReadiness.reduce((s2, d2) => s2 + d2.weight, 0)), 0))
    : 0;

  const startFocusTimer = (topic: string) => {
    setFocusTopic(topic);
    setShowFocusTimer(true);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-slate-200 bg-white/80 backdrop-blur-lg">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <button onClick={onBack} className="inline-flex items-center gap-1 text-sm font-medium text-slate-500 transition-colors hover:text-slate-700">
            <ChevronLeft className="h-4 w-4" />
            Home
          </button>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowMockExam(true)}
              className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1.5 text-sm font-semibold text-indigo-700 transition-all hover:bg-indigo-100"
            >
              <Brain className="h-4 w-4" />
              Mock Exam
            </button>
            <div className="flex items-center gap-1.5 rounded-full bg-sky-50 px-3 py-1 text-sm font-semibold text-sky-700">
              <Flame className="h-4 w-4" />
              {completedCount} done
            </div>
            <button onClick={onReset} className="inline-flex items-center gap-1 text-sm font-medium text-slate-500 transition-colors hover:text-red-600">
              <RotateCcw className="h-4 w-4" />
              New Plan
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 py-8">
        {/* Exam Countdown Banner */}
        <div className="mb-8 overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-sky-900 p-8 text-white shadow-xl animate-fade-in-up">
          <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
            <div>
              <p className="text-sm font-medium text-sky-300">Exam Countdown</p>
              <h2 className="mt-1 font-display text-2xl font-bold">
                {new Date(plan.exam_date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
              </h2>
              <p className="mt-1 text-sm text-slate-400">
                {nextSession ? `Next session today: ${nextSession.topic}` : 'No more sessions scheduled'}
              </p>
            </div>
            <div className="flex gap-4">
              <CountdownUnit value={countdown.days} label="Days" />
              <CountdownUnit value={countdown.hours} label="Hours" />
              <CountdownUnit value={countdown.minutes} label="Minutes" />
              <CountdownUnit value={countdown.seconds} label="Seconds" highlight />
            </div>
          </div>
        </div>

        {/* Stats grid */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard icon={Target} label="Overall Readiness" value={`${overallReadiness}%`} color="sky" delay="stagger-1" />
          <StatCard icon={Clock} label="Total Study Hours" value={`${generatedPlan.totalStudyHours}h`} color="cyan" delay="stagger-2" />
          <StatCard icon={BookOpen} label="Sessions Done" value={`${completedCount}/${sortedSessions.length}`} color="teal" delay="stagger-3" />
          <StatCard icon={TrendingUp} label="Progress" value={`${progress}%`} color="emerald" delay="stagger-4" />
        </div>

        {/* Action buttons */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 animate-fade-in-up stagger-5">
          <button
            onClick={() => startFocusTimer(nextSession?.topic || 'Study Session')}
            className="card group flex items-center gap-4 p-5 text-left transition-all hover:shadow-md hover:-translate-y-0.5"
          >
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-sky-50 text-sky-600 transition-colors group-hover:bg-sky-100">
              <Timer className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-display font-semibold text-slate-900">Focus Timer</h3>
              <p className="text-sm text-slate-500">Pomodoro-style timer to stay focused</p>
            </div>
          </button>
          <button
            onClick={() => setShowMockExam(true)}
            className="card group flex items-center gap-4 p-5 text-left transition-all hover:shadow-md hover:-translate-y-0.5"
          >
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 transition-colors group-hover:bg-indigo-100">
              <Brain className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-display font-semibold text-slate-900">Mock Practice Exam</h3>
              <p className="text-sm text-slate-500">10 questions with instant feedback</p>
            </div>
          </button>
        </div>

        {/* Domain Readiness Bars */}
        <div className="card mb-8 p-6 animate-fade-in-up stagger-6">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-sky-600" />
            <h2 className="font-display text-lg font-bold text-slate-900">Domain Readiness</h2>
          </div>
          <p className="mt-1 text-sm text-slate-500">Progress per exam domain, weighted by exam importance and your confidence level</p>

          <div className="mt-5 space-y-5">
            {domainReadiness.map((d) => {
              const color = getColor(d.topic);
              const prof = PROFICIENCY_LABELS[d.proficiency] || PROFICIENCY_LABELS.intermediate;
              return (
                <div key={d.topic}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className={`h-3 w-3 rounded-full ${color.dot}`} />
                      <span className="text-sm font-medium text-slate-700">{d.topic}</span>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${prof.color}`}>
                        {prof.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-slate-500">
                      <span>{d.done}/{d.total} sessions</span>
                      <span className="font-semibold text-slate-700">{d.pct}%</span>
                    </div>
                  </div>
                  <div className="mt-2 h-3 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={`h-full rounded-full ${color.bar} transition-all duration-700`}
                      style={{ width: `${d.pct}%` }}
                    />
                  </div>
                  <div className="mt-1 flex items-center justify-between text-xs text-slate-400">
                    <span>Exam weight: {d.weight}%</span>
                    <span>{d.hours}h allocated · {d.sessions} sessions</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Warnings */}
        {generatedPlan.warnings.length > 0 && (
          <div className="mb-8 space-y-2">
            {generatedPlan.warnings.map((w, i) => (
              <div key={i} className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 animate-fade-in" style={{ animationDelay: `${i * 0.1}s` }}>
                <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600" />
                <p className="text-sm text-amber-800">{w}</p>
              </div>
            ))}
          </div>
        )}

        {/* Spaced review fillers indicator */}
        {spacedReviews.length > 0 && (
          <div className="card mb-8 p-5 border-amber-200 bg-amber-50/50 animate-fade-in-up">
            <div className="flex items-center gap-3">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
                <Zap className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-display font-semibold text-slate-900">Spaced Review Fillers</h3>
                <p className="text-sm text-slate-600">
                  {spacedReviews.filter((s) => s.is_completed).length} of {spacedReviews.length} review sessions completed.
                  These reinforce what you've learned every few days.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Sessions */}
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-xl font-bold text-slate-900">Study Schedule</h2>
            <div className="flex gap-1 rounded-lg bg-slate-100 p-1">
              {(['all', 'upcoming', 'completed'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`rounded-md px-3 py-1.5 text-sm font-medium capitalize transition-all ${
                    filter === f ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {filteredSessions.length === 0 ? (
            <div className="card p-12 text-center">
              <p className="text-slate-500">No sessions in this filter.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredSessions.map((session, i) => {
                const color = getColor(session.topic);
                const sessionDate = new Date(session.session_date + 'T00:00:00');
                const isPast = session.session_date < today;
                const isToday = session.session_date === today;
                const isReview = session.topic === 'Spaced Review';
                const isMock = session.topic === 'Practice Exam';
                return (
                  <div
                    key={session.id}
                    className={`card p-5 transition-all duration-200 hover:shadow-md ${session.is_completed ? 'opacity-70' : ''} animate-fade-in-up`}
                    style={{ animationDelay: `${Math.min(i, 8) * 0.05}s` }}
                  >
                    <div className="flex items-start gap-4">
                      {/* Date block */}
                      <div className={`flex h-14 w-14 flex-shrink-0 flex-col items-center justify-center rounded-xl ${color.bg} ${color.text}`}>
                        <span className="text-xs font-medium uppercase">{sessionDate.toLocaleDateString('en-US', { month: 'short' })}</span>
                        <span className="font-display text-xl font-bold">{sessionDate.getDate()}</span>
                      </div>

                      {/* Content */}
                      <div className="flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-slate-900">{session.topic}</h3>
                              {isToday && <span className="rounded-full bg-sky-600 px-2 py-0.5 text-xs font-semibold text-white animate-pulse-ring">Today</span>}
                              {isPast && !session.is_completed && !isToday && (
                                <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-medium text-slate-600">Past due</span>
                              )}
                              {isReview && (
                                <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                                  <Zap className="h-3 w-3" /> Filler
                                </span>
                              )}
                            </div>
                            <div className="mt-1 flex items-center gap-3 text-sm text-slate-500">
                              <span className="inline-flex items-center gap-1">
                                <Clock className="h-3.5 w-3.5" />
                                {session.duration_minutes} min
                              </span>
                              <span>·</span>
                              <span>{sessionDate.toLocaleDateString('en-US', { weekday: 'long' })}</span>
                            </div>
                          </div>
                          <div className="flex flex-shrink-0 items-center gap-2">
                            {!session.is_completed && (
                              <button
                                onClick={() => startFocusTimer(session.topic)}
                                className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-sky-50 hover:text-sky-600"
                                title="Start focus timer"
                              >
                                <Timer className="h-4 w-4" />
                              </button>
                            )}
                            {isMock && (
                              <button
                                onClick={() => setShowMockExam(true)}
                                className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-indigo-50 hover:text-indigo-600"
                                title="Take mock exam"
                              >
                                <Brain className="h-4 w-4" />
                              </button>
                            )}
                            <button
                              onClick={() => toggleComplete(session.id, session.is_completed)}
                              className="flex-shrink-0 transition-transform hover:scale-110 active:scale-95"
                              aria-label={session.is_completed ? 'Mark as not done' : 'Mark as done'}
                            >
                              {session.is_completed ? (
                                <CheckCircle2 className="h-7 w-7 text-emerald-500" />
                              ) : (
                                <Circle className="h-7 w-7 text-slate-300 hover:text-sky-400" />
                              )}
                            </button>
                          </div>
                        </div>

                        {/* Subtopics */}
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {session.subtopics.map((sub, j) => (
                            <span
                              key={j}
                              className={`rounded-md ${color.bg} ${color.text} border ${color.border} px-2 py-0.5 text-xs font-medium`}
                            >
                              {sub}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Exam readiness footer */}
        <div className="mt-8 card p-6 bg-gradient-to-br from-sky-50 to-cyan-50 border-sky-200 animate-fade-in-up">
          <div className="flex items-center gap-3">
            <Award className="h-8 w-8 text-sky-600" />
            <div>
              <h3 className="font-display font-bold text-slate-900">Stay on track and you'll be ready!</h3>
              <p className="mt-0.5 text-sm text-slate-600">
                Complete your sessions on time, use the focus timer to stay productive, and take mock exams to test your readiness.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showFocusTimer && (
        <FocusTimer
          defaultMinutes={nextSession?.duration_minutes ? Math.max(15, Math.min(45, Math.ceil(nextSession.duration_minutes / 25) * 25)) : 25}
          sessionTopic={focusTopic}
          onClose={() => setShowFocusTimer(false)}
        />
      )}
      {showMockExam && <MockExam onClose={() => setShowMockExam(false)} />}
    </div>
  );
}

function CountdownUnit({ value, label, highlight }: { value: number; label: string; highlight?: boolean }) {
  return (
    <div className="text-center">
      <div className={`font-display text-4xl font-bold tabular-nums ${highlight ? 'text-sky-400' : 'text-white'}`}>
        {String(value).padStart(2, '0')}
      </div>
      <div className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
  delay,
}: {
  icon: typeof Calendar;
  label: string;
  value: string;
  color: 'sky' | 'cyan' | 'teal' | 'emerald';
  delay: string;
}) {
  const colors = {
    sky: 'bg-sky-50 text-sky-600',
    cyan: 'bg-cyan-50 text-cyan-600',
    teal: 'bg-teal-50 text-teal-600',
    emerald: 'bg-emerald-50 text-emerald-600',
  };
  return (
    <div className={`card p-5 hover:shadow-md animate-fade-in-up ${delay}`}>
      <div className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl ${colors[color]}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="font-display text-2xl font-bold text-slate-900">{value}</div>
      <div className="mt-0.5 text-sm text-slate-500">{label}</div>
    </div>
  );
}
