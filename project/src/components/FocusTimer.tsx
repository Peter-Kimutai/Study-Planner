import { useState, useEffect, useCallback } from 'react';
import { Play, Pause, RotateCcw, X, Timer, Coffee } from 'lucide-react';

interface FocusTimerProps {
  defaultMinutes?: number;
  onClose: () => void;
  sessionTopic?: string;
  onComplete?: () => void;
}

export default function FocusTimer({ defaultMinutes = 25, onClose, sessionTopic, onComplete }: FocusTimerProps) {
  const [mode, setMode] = useState<'focus' | 'break'>('focus');
  const [focusMinutes, setFocusMinutes] = useState(defaultMinutes);
  const [breakMinutes, setBreakMinutes] = useState(5);
  const [secondsLeft, setSecondsLeft] = useState(defaultMinutes * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [completedSessions, setCompletedSessions] = useState(0);

  const totalSeconds = mode === 'focus' ? focusMinutes * 60 : breakMinutes * 60;

  useEffect(() => {
    if (mode === 'focus') {
      setSecondsLeft(focusMinutes * 60);
    } else {
      setSecondsLeft(breakMinutes * 60);
    }
  }, [focusMinutes, breakMinutes, mode]);

  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          if (mode === 'focus') {
            setCompletedSessions((c) => c + 1);
            setMode('break');
            setSecondsLeft(breakMinutes * 60);
            setIsRunning(false);
            onComplete?.();
          } else {
            setMode('focus');
            setSecondsLeft(focusMinutes * 60);
            setIsRunning(false);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, mode, focusMinutes, breakMinutes, onComplete]);

  const handleReset = useCallback(() => {
    setIsRunning(false);
    setSecondsLeft(totalSeconds);
  }, [totalSeconds]);

  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const progress = ((totalSeconds - secondsLeft) / totalSeconds) * 100;
  const circumference = 2 * Math.PI * 120;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-2xl animate-scale-in">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="text-center">
          <div className="mb-2 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-colors">
            {mode === 'focus' ? (
              <span className="flex items-center gap-1.5 rounded-full bg-sky-50 px-3 py-1 text-sky-700">
                <Timer className="h-3.5 w-3.5" /> Focus Session
              </span>
            ) : (
              <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-emerald-700">
                <Coffee className="h-3.5 w-3.5" /> Break Time
              </span>
            )}
          </div>

          {sessionTopic && (
            <p className="mb-4 text-sm font-medium text-slate-600">
              Studying: {sessionTopic}
            </p>
          )}

          {/* Circular timer */}
          <div className="relative mx-auto my-6 h-64 w-64">
            <svg className="h-full w-full -rotate-90" viewBox="0 0 260 260">
              <circle
                cx="130" cy="130" r="120"
                fill="none"
                strokeWidth="12"
                className="stroke-slate-100"
              />
              <circle
                cx="130" cy="130" r="120"
                fill="none"
                strokeWidth="12"
                strokeLinecap="round"
                className={mode === 'focus' ? 'stroke-sky-500' : 'stroke-emerald-500'}
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                style={{ transition: 'stroke-dashoffset 1s linear' }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-display text-6xl font-bold tabular-nums text-slate-900">
                {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
              </span>
              <span className="mt-1 text-sm text-slate-400">
                {isRunning ? 'Running...' : 'Paused'}
              </span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => setIsRunning(!isRunning)}
              className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-sky-600 text-white shadow-lg shadow-sky-600/30 transition-all hover:bg-sky-700 hover:scale-105 active:scale-95"
            >
              {isRunning ? <Pause className="h-7 w-7" /> : <Play className="h-7 w-7 translate-x-0.5" />}
            </button>
            <button
              onClick={handleReset}
              className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition-all hover:bg-slate-50 hover:text-slate-700 active:scale-95"
            >
              <RotateCcw className="h-5 w-5" />
            </button>
          </div>

          {/* Session counter */}
          <div className="mt-6 flex items-center justify-center gap-2">
            {Array.from({ length: Math.max(completedSessions, 1) }).map((_, i) => (
              <div
                key={i}
                className={`h-2.5 w-2.5 rounded-full transition-all ${
                  i < completedSessions ? 'bg-sky-500' : 'bg-slate-200'
                }`}
              />
            ))}
            <span className="ml-2 text-sm text-slate-500">
              {completedSessions} session{completedSessions !== 1 ? 's' : ''} completed
            </span>
          </div>

          {/* Duration settings */}
          <div className="mt-6 grid grid-cols-2 gap-3 border-t border-slate-100 pt-6">
            <div>
              <label className="text-xs font-medium text-slate-500">Focus (min)</label>
              <div className="mt-1 flex gap-1">
                {[15, 25, 45].map((m) => (
                  <button
                    key={m}
                    onClick={() => { setFocusMinutes(m); setMode('focus'); setIsRunning(false); }}
                    className={`flex-1 rounded-lg py-1.5 text-xs font-semibold transition-all ${
                      focusMinutes === m ? 'bg-sky-100 text-sky-700' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500">Break (min)</label>
              <div className="mt-1 flex gap-1">
                {[5, 10, 15].map((m) => (
                  <button
                    key={m}
                    onClick={() => { setBreakMinutes(m); setMode('break'); setIsRunning(false); }}
                    className={`flex-1 rounded-lg py-1.5 text-xs font-semibold transition-all ${
                      breakMinutes === m ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
