import { useState } from 'react';
import { X, Check, ChevronRight, Award, RotateCcw, Brain } from 'lucide-react';
import { QUIZ_QUESTIONS, type QuizQuestion } from '@/data/quizQuestions';

interface MockExamProps {
  onClose: () => void;
}

type Phase = 'intro' | 'quiz' | 'results';

export default function MockExam({ onClose }: MockExamProps) {
  const [phase, setPhase] = useState<Phase>('intro');
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [showFeedback, setShowFeedback] = useState(false);

  // Shuffle and pick 10 questions
  const [questions] = useState<QuizQuestion[]>(() => {
    const shuffled = [...QUIZ_QUESTIONS].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 10);
  });

  const question = questions[currentQ];
  const selectedAnswer = answers[question?.id];

  const handleSelect = (idx: number) => {
    if (showFeedback) return;
    setAnswers((prev) => ({ ...prev, [question.id]: idx }));
    setShowFeedback(true);
  };

  const handleNext = () => {
    if (currentQ < questions.length - 1) {
      setCurrentQ(currentQ + 1);
      setShowFeedback(false);
    } else {
      setPhase('results');
    }
  };

  const score = questions.filter((q) => answers[q.id] === q.correctIndex).length;
  const percentage = Math.round((score / questions.length) * 100);
  const passed = percentage >= 70;

  const topicStats = questions.reduce((acc, q) => {
    if (!acc[q.topic]) acc[q.topic] = { correct: 0, total: 0 };
    acc[q.topic].total++;
    if (answers[q.id] === q.correctIndex) acc[q.topic].correct++;
    return acc;
  }, {} as Record<string, { correct: number; total: number }>);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-fade-in p-4">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-slate-200 bg-white shadow-2xl animate-scale-in">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-10 rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
        >
          <X className="h-5 w-5" />
        </button>

        {phase === 'intro' && (
          <div className="p-8 text-center">
            <div className="mx-auto mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-sky-50">
              <Brain className="h-8 w-8 text-sky-600" />
            </div>
            <h2 className="font-display text-2xl font-bold text-slate-900">Mock Practice Exam</h2>
            <p className="mx-auto mt-3 max-w-md text-sm text-slate-600">
              Test your AZ-900 knowledge with 10 randomly selected questions covering all four exam domains.
              You'll get instant feedback and a final score with per-topic breakdown.
            </p>
            <div className="mt-6 grid grid-cols-3 gap-3">
              <div className="rounded-xl bg-slate-50 p-3">
                <div className="font-display text-2xl font-bold text-slate-900">10</div>
                <div className="text-xs text-slate-500">Questions</div>
              </div>
              <div className="rounded-xl bg-slate-50 p-3">
                <div className="font-display text-2xl font-bold text-slate-900">70%</div>
                <div className="text-xs text-slate-500">Pass Mark</div>
              </div>
              <div className="rounded-xl bg-slate-50 p-3">
                <div className="font-display text-2xl font-bold text-slate-900">~15</div>
                <div className="text-xs text-slate-500">Minutes</div>
              </div>
            </div>
            <button onClick={() => setPhase('quiz')} className="btn-primary mt-8">
              Start Mock Exam
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}

        {phase === 'quiz' && question && (
          <div className="p-8">
            {/* Progress */}
            <div className="mb-6 flex items-center justify-between">
              <span className="text-sm font-medium text-slate-500">
                Question {currentQ + 1} of {questions.length}
              </span>
              <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
                {question.topic}
              </span>
            </div>
            <div className="mb-8 h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-sky-500 transition-all duration-500"
                style={{ width: `${((currentQ + 1) / questions.length) * 100}%` }}
              />
            </div>

            {/* Question */}
            <h3 className="font-display text-xl font-semibold text-slate-900">{question.question}</h3>

            {/* Options */}
            <div className="mt-6 space-y-3">
              {question.options.map((opt, idx) => {
                const isSelected = selectedAnswer === idx;
                const isCorrect = idx === question.correctIndex;
                const showCorrect = showFeedback && isCorrect;
                const showWrong = showFeedback && isSelected && !isCorrect;

                return (
                  <button
                    key={idx}
                    onClick={() => handleSelect(idx)}
                    disabled={showFeedback}
                    className={`flex w-full items-center gap-3 rounded-xl border-2 p-4 text-left transition-all ${
                      showCorrect
                        ? 'border-emerald-400 bg-emerald-50'
                        : showWrong
                        ? 'border-red-400 bg-red-50'
                        : isSelected
                        ? 'border-sky-500 bg-sky-50'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    } ${showFeedback ? 'cursor-default' : 'cursor-pointer'}`}
                  >
                    <div className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border-2 text-sm font-semibold ${
                      showCorrect
                        ? 'border-emerald-500 bg-emerald-500 text-white'
                        : showWrong
                        ? 'border-red-500 bg-red-500 text-white'
                        : 'border-slate-300 text-slate-500'
                    }`}>
                      {showCorrect ? <Check className="h-4 w-4" /> : showWrong ? <X className="h-4 w-4" /> : String.fromCharCode(65 + idx)}
                    </div>
                    <span className={`text-sm font-medium ${showCorrect ? 'text-emerald-900' : showWrong ? 'text-red-900' : 'text-slate-700'}`}>
                      {opt}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Feedback */}
            {showFeedback && (
              <div className="mt-5 animate-fade-in rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-start gap-2">
                  {selectedAnswer === question.correctIndex ? (
                    <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-600" />
                  ) : (
                    <X className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-500" />
                  )}
                  <div>
                    <p className={`text-sm font-semibold ${selectedAnswer === question.correctIndex ? 'text-emerald-700' : 'text-red-600'}`}>
                      {selectedAnswer === question.correctIndex ? 'Correct!' : 'Not quite right'}
                    </p>
                    <p className="mt-1 text-sm text-slate-600">{question.explanation}</p>
                  </div>
                </div>
                <button onClick={handleNext} className="btn-primary mt-4 w-full">
                  {currentQ < questions.length - 1 ? 'Next Question' : 'See Results'}
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        )}

        {phase === 'results' && (
          <div className="p-8 text-center">
            <div className={`mx-auto mb-4 inline-flex h-20 w-20 items-center justify-center rounded-full ${
              passed ? 'bg-emerald-50' : 'bg-amber-50'
            }`}>
              <Award className={`h-10 w-10 ${passed ? 'text-emerald-500' : 'text-amber-500'}`} />
            </div>
            <h2 className="font-display text-2xl font-bold text-slate-900">
              {passed ? 'You passed!' : 'Keep studying!'}
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              You scored <span className="font-bold text-slate-900">{score}/{questions.length}</span> ({percentage}%)
            </p>

            {/* Score ring */}
            <div className="relative mx-auto my-6 h-40 w-40">
              <svg className="h-full w-full -rotate-90" viewBox="0 0 160 160">
                <circle cx="80" cy="80" r="70" fill="none" strokeWidth="10" className="stroke-slate-100" />
                <circle
                  cx="80" cy="80" r="70" fill="none" strokeWidth="10" strokeLinecap="round"
                  className={passed ? 'stroke-emerald-500' : 'stroke-amber-500'}
                  strokeDasharray={2 * Math.PI * 70}
                  strokeDashoffset={2 * Math.PI * 70 * (1 - percentage / 100)}
                  style={{ transition: 'stroke-dashoffset 1s ease-out' }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-display text-4xl font-bold text-slate-900">{percentage}%</span>
                <span className="text-xs text-slate-400">{passed ? 'PASS' : 'FAIL'}</span>
              </div>
            </div>

            {/* Topic breakdown */}
            <div className="mt-6 space-y-2 text-left">
              <h3 className="text-sm font-semibold text-slate-700">Results by Topic</h3>
              {Object.entries(topicStats).map(([topic, stats]) => {
                const pct = Math.round((stats.correct / stats.total) * 100);
                return (
                  <div key={topic} className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-2">
                    <span className="text-sm font-medium text-slate-600">{topic}</span>
                    <span className={`text-sm font-bold ${pct >= 70 ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {stats.correct}/{stats.total} ({pct}%)
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="mt-8 flex gap-3">
              <button
                onClick={() => { setPhase('intro'); setCurrentQ(0); setAnswers({}); setShowFeedback(false); }}
                className="btn-secondary flex-1"
              >
                <RotateCcw className="h-4 w-4" />
                Retake
              </button>
              <button onClick={onClose} className="btn-primary flex-1">
                Back to Plan
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
