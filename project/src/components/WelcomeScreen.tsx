import { Calendar, Clock, Target, ArrowRight, Sparkles } from 'lucide-react';

interface WelcomeScreenProps {
  onStart: () => void;
}

export default function WelcomeScreen({ onStart }: WelcomeScreenProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-sky-50">
      <div className="relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-sky-200/40 blur-3xl" />
          <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-cyan-200/30 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-5xl px-6 py-20 md:py-28">
          <div className="text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-4 py-1.5 text-sm font-medium text-sky-700 animate-fade-in">
              <Sparkles className="h-4 w-4" />
              Microsoft Azure Fundamentals AZ-900
            </div>

            <h1 className="font-display text-5xl font-bold tracking-tight text-slate-900 md:text-7xl animate-fade-in-up stagger-1">
              Personal Study Planner
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-600 animate-fade-in-up stagger-2">
              Stop guessing how to prepare. Tell us your exam date, how much time you have, and where
              you struggle — we'll build a day-by-day study plan that fits your schedule and targets
              your weak areas.
            </p>

            <div className="mt-10 animate-fade-in-up stagger-3">
              <button onClick={onStart} className="btn-primary text-base px-8 py-4">
                Create My Study Plan
                <ArrowRight className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="mt-20 grid gap-6 md:grid-cols-3">
            <FeatureCard
              icon={Calendar}
              title="Exam-Date Driven"
              description="Your plan is built backward from your actual exam date so every day counts."
              delay="stagger-4"
            />
            <FeatureCard
              icon={Clock}
              title="Fits Your Schedule"
              description="Tell us how many hours per week you can study — we distribute sessions accordingly."
              delay="stagger-5"
            />
            <FeatureCard
              icon={Target}
              title="Targets Weak Areas"
              description="Rate your confidence per topic. We allocate more time where you need it most."
              delay="stagger-6"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  description,
  delay,
}: {
  icon: typeof Calendar;
  title: string;
  description: string;
  delay: string;
}) {
  return (
    <div className={`card p-6 hover:shadow-lg hover:-translate-y-1 animate-fade-in-up ${delay}`}>
      <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="font-display text-lg font-semibold text-slate-900">{title}</h3>
      <p className="mt-2 text-sm text-slate-600">{description}</p>
    </div>
  );
}
