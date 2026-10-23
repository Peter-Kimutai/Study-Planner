import { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar, Clock, Target, Check } from 'lucide-react';
import { AZ900_TOPICS, PROFICIENCY_OPTIONS } from '@/data/az900Topics';
import type { PlanInput } from '@/lib/planGenerator';

interface PlannerFormProps {
  onGenerate: (input: PlanInput) => void;
  onBack: () => void;
}

export default function PlannerForm({ onGenerate, onBack }: PlannerFormProps) {
  const [step, setStep] = useState(0);
  const [examDate, setExamDate] = useState('');
  const [hoursPerWeek, setHoursPerWeek] = useState(10);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [proficiency, setProficiency] = useState<Record<string, string>>({});

  const today = new Date().toISOString().split('T')[0];

  const toggleTopic = (topicName: string) => {
    setSelectedTopics((prev) =>
      prev.includes(topicName) ? prev.filter((t) => t !== topicName) : [...prev, topicName]
    );
  };

  const setProf = (topicName: string, level: string) => {
    setProficiency((prev) => ({ ...prev, [topicName]: level }));
  };

  const canProceed = () => {
    if (step === 0) return examDate !== '';
    if (step === 1) return hoursPerWeek > 0;
    if (step === 2) return selectedTopics.length > 0;
    if (step === 3) return selectedTopics.every((t) => proficiency[t]);
    return true;
  };

  const handleGenerate = () => {
    onGenerate({
      examDate,
      availableHoursPerWeek: hoursPerWeek,
      selectedTopics,
      proficiency,
    });
  };

  const steps = [
    { label: 'Exam Date', icon: Calendar },
    { label: 'Study Time', icon: Clock },
    { label: 'Topics', icon: Target },
    { label: 'Proficiency', icon: Check },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-sky-50">
      <div className="mx-auto max-w-3xl px-6 py-10">
        <button
          onClick={onBack}
          className="mb-8 inline-flex items-center gap-1 text-sm font-medium text-slate-500 transition-colors hover:text-slate-700"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Home
        </button>

        {/* Progress indicator */}
        <div className="mb-10 flex items-center justify-between">
          {steps.map((s, i) => (
            <div key={i} className="flex flex-1 items-center">
              <div className="flex flex-col items-center">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all duration-300 ${
                    i <= step
                      ? 'border-sky-600 bg-sky-600 text-white shadow-lg shadow-sky-600/30'
                      : 'border-slate-300 bg-white text-slate-400'
                  }`}
                >
                  {i < step ? <Check className="h-5 w-5" /> : <s.icon className="h-5 w-5" />}
                </div>
                <span className={`mt-2 text-xs font-medium ${i <= step ? 'text-sky-700' : 'text-slate-400'}`}>
                  {s.label}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div className={`mx-2 h-0.5 flex-1 rounded transition-all duration-300 ${i < step ? 'bg-sky-600' : 'bg-slate-200'}`} />
              )}
            </div>
          ))}
        </div>

        <div className="card p-8 animate-scale-in" key={step}>
          {step === 0 && (
            <div className="animate-fade-in">
              <h2 className="font-display text-2xl font-bold text-slate-900">When is your AZ-900 exam?</h2>
              <p className="mt-2 text-sm text-slate-600">
                We'll build your study plan backward from this date to make sure you're ready.
              </p>
              <div className="mt-8">
                <label className="block text-sm font-medium text-slate-700">Exam Date</label>
                <input
                  type="date"
                  min={today}
                  value={examDate}
                  onChange={(e) => setExamDate(e.target.value)}
                  className="input-field mt-2"
                />
                {examDate && (
                  <p className="mt-3 text-sm text-sky-600 font-medium">
                    That's {Math.ceil((new Date(examDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days from now — plenty of time with a good plan!
                  </p>
                )}
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="animate-fade-in">
              <h2 className="font-display text-2xl font-bold text-slate-900">How much time can you study each week?</h2>
              <p className="mt-2 text-sm text-slate-600">
                Be realistic — consistency beats cramming. You can always adjust later.
              </p>
              <div className="mt-8">
                <div className="flex items-baseline justify-between">
                  <label className="text-sm font-medium text-slate-700">Hours per week</label>
                  <span className="font-display text-3xl font-bold text-sky-600">{hoursPerWeek}h</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={40}
                  value={hoursPerWeek}
                  onChange={(e) => setHoursPerWeek(Number(e.target.value))}
                  className="mt-4 w-full accent-sky-600"
                />
                <div className="mt-2 flex justify-between text-xs text-slate-400">
                  <span>1h</span>
                  <span>10h</span>
                  <span>20h</span>
                  <span>30h</span>
                  <span>40h</span>
                </div>
                <div className="mt-6 grid grid-cols-3 gap-3">
                  {[5, 10, 15, 20, 25, 30].map((h) => (
                    <button
                      key={h}
                      onClick={() => setHoursPerWeek(h)}
                      className={`rounded-xl border px-4 py-2 text-sm font-semibold transition-all ${
                        hoursPerWeek === h
                          ? 'border-sky-600 bg-sky-50 text-sky-700'
                          : 'border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      {h}h/week
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="animate-fade-in">
              <h2 className="font-display text-2xl font-bold text-slate-900">Which topics do you want to focus on?</h2>
              <p className="mt-2 text-sm text-slate-600">
                Select the AZ-900 domains to include. We recommend all four for full exam coverage.
              </p>
              <div className="mt-6 space-y-3">
                {AZ900_TOPICS.map((t) => {
                  const isSelected = selectedTopics.includes(t.name);
                  return (
                    <button
                      key={t.name}
                      onClick={() => toggleTopic(t.name)}
                      className={`flex w-full items-start gap-4 rounded-xl border-2 p-4 text-left transition-all duration-200 ${
                        isSelected
                          ? 'border-sky-600 bg-sky-50 shadow-md'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div
                        className={`mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md border-2 transition-all ${
                          isSelected ? 'border-sky-600 bg-sky-600' : 'border-slate-300'
                        }`}
                      >
                        {isSelected && <Check className="h-4 w-4 text-white" />}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-slate-900">{t.name}</h3>
                          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                            {t.weight}% of exam
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-slate-500">{t.domain} · {t.subtopics.length} subtopics</p>
                      </div>
                    </button>
                  );
                })}
              </div>
              {selectedTopics.length > 0 && (
                <button
                  onClick={() => setSelectedTopics(AZ900_TOPICS.map((t) => t.name))}
                  className="mt-4 text-sm font-medium text-sky-600 hover:text-sky-700"
                >
                  Select all topics
                </button>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="animate-fade-in">
              <h2 className="font-display text-2xl font-bold text-slate-900">Rate your confidence in each topic</h2>
              <p className="mt-2 text-sm text-slate-600">
                We'll allocate more study time to areas where you feel less confident.
              </p>
              <div className="mt-6 space-y-5">
                {selectedTopics.map((topicName) => {
                  const topic = AZ900_TOPICS.find((t) => t.name === topicName)!;
                  return (
                    <div key={topicName} className="rounded-xl border border-slate-200 p-4">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-slate-900">{topic.name}</h3>
                        <span className="text-xs font-medium text-slate-500">{topic.weight}% of exam</span>
                      </div>
                      <div className="mt-3 grid grid-cols-3 gap-2">
                        {PROFICIENCY_OPTIONS.map((opt) => {
                          const isSelected = proficiency[topicName] === opt.value;
                          return (
                            <button
                              key={opt.value}
                              onClick={() => setProf(topicName, opt.value)}
                              className={`rounded-lg border-2 px-3 py-2.5 text-center transition-all ${
                                isSelected
                                  ? opt.value === 'beginner'
                                    ? 'border-red-400 bg-red-50'
                                    : opt.value === 'intermediate'
                                    ? 'border-amber-400 bg-amber-50'
                                    : 'border-emerald-400 bg-emerald-50'
                                  : 'border-slate-200 hover:border-slate-300'
                              }`}
                            >
                              <div className={`text-sm font-semibold ${
                                isSelected
                                  ? opt.value === 'beginner' ? 'text-red-700'
                                  : opt.value === 'intermediate' ? 'text-amber-700'
                                  : 'text-emerald-700'
                                  : 'text-slate-700'
                              }`}>
                                {opt.label}
                              </div>
                              <div className="mt-0.5 text-xs text-slate-500">{opt.description}</div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="mt-8 flex items-center justify-between">
          {step > 0 ? (
            <button onClick={() => setStep(step - 1)} className="btn-secondary">
              <ChevronLeft className="h-4 w-4" />
              Back
            </button>
          ) : (
            <div />
          )}
          {step < 3 ? (
            <button
              onClick={() => canProceed() && setStep(step + 1)}
              disabled={!canProceed()}
              className="btn-primary"
            >
              Continue
              <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={handleGenerate}
              disabled={!canProceed()}
              className="btn-primary"
            >
              Generate My Plan
              <Check className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
