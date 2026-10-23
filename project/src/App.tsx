import { useState, useEffect } from 'react';
import WelcomeScreen from '@/components/WelcomeScreen';
import PlannerForm from '@/components/PlannerForm';
import Dashboard from '@/components/Dashboard';
import LoadingScreen from '@/components/LoadingScreen';
import ErrorScreen from '@/components/ErrorScreen';
import { supabase } from '@/lib/supabase';
import type { StudyPlan, StudySession } from '@/lib/supabase';
import { generatePlan, sessionsToDbSessions, type PlanInput, type GeneratedPlan } from '@/lib/planGenerator';

type AppState = 'welcome' | 'form' | 'loading' | 'dashboard' | 'error';

export default function App() {
  const [state, setState] = useState<AppState>('welcome');
  const [plan, setPlan] = useState<StudyPlan | null>(null);
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [generatedPlan, setGeneratedPlan] = useState<GeneratedPlan | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('study_plans')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data) {
        const existingPlan = data as StudyPlan;
        setPlan(existingPlan);

        const { data: sessionData } = await supabase
          .from('study_sessions')
          .select('*')
          .eq('plan_id', existingPlan.id)
          .order('session_date', { ascending: true });

        if (sessionData) {
          setSessions(sessionData as StudySession[]);
        }

        const gen = generatePlan({
          examDate: existingPlan.exam_date,
          availableHoursPerWeek: existingPlan.available_hours_per_week,
          selectedTopics: existingPlan.selected_topics,
          proficiency: existingPlan.proficiency,
        });
        setGeneratedPlan(gen);
        setState('dashboard');
      }
    })();
  }, []);

  const handleGenerate = async (input: PlanInput) => {
    setState('loading');

    try {
      const gen = generatePlan(input);
      setGeneratedPlan(gen);

      const { data: planData, error: planError } = await supabase
        .from('study_plans')
        .insert({
          exam_date: input.examDate,
          available_hours_per_week: input.availableHoursPerWeek,
          selected_topics: input.selectedTopics,
          proficiency: input.proficiency,
          total_days: gen.totalDays,
        })
        .select()
        .single();

      if (planError || !planData) {
        throw new Error('Failed to save your study plan. Please check your connection and try again.');
      }

      const newPlan = planData as StudyPlan;
      setPlan(newPlan);

      const dbSessions = sessionsToDbSessions(newPlan.id, gen.sessions);
      if (dbSessions.length > 0) {
        const { data: sessionData, error: sessionError } = await supabase
          .from('study_sessions')
          .insert(dbSessions)
          .select('*');

        if (sessionError) {
          throw new Error('Your plan was created but sessions could not be saved. Please try again.');
        }

        if (sessionData) {
          setSessions(sessionData as StudySession[]);
        }
      }

      setState('dashboard');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'An unexpected error occurred.');
      setState('error');
    }
  };

  const handleReset = async () => {
    if (plan) {
      await supabase.from('study_plans').delete().eq('id', plan.id);
    }
    setPlan(null);
    setSessions([]);
    setGeneratedPlan(null);
    setState('form');
  };

  if (state === 'welcome') return <WelcomeScreen onStart={() => setState('form')} />;
  if (state === 'form') return <PlannerForm onGenerate={handleGenerate} onBack={() => setState('welcome')} />;
  if (state === 'loading') return <LoadingScreen />;
  if (state === 'error') return <ErrorScreen message={errorMsg} onRetry={() => setState('form')} />;
  if (state === 'dashboard' && plan && generatedPlan) {
    return (
      <Dashboard
        plan={plan}
        sessions={sessions}
        generatedPlan={generatedPlan}
        onBack={() => setState('welcome')}
        onReset={handleReset}
        onSessionsUpdate={setSessions}
      />
    );
  }

  return <WelcomeScreen onStart={() => setState('form')} />;
}
