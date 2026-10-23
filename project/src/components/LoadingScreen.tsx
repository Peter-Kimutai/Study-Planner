import { Loader2 } from 'lucide-react';

export default function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-white to-sky-50">
      <div className="text-center">
        <div className="relative inline-flex">
          <div className="h-20 w-20 rounded-full border-4 border-sky-200" />
          <div className="absolute inset-0 h-20 w-20 animate-spin rounded-full border-4 border-transparent border-t-sky-600" />
        </div>
        <div className="mt-6 flex items-center justify-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin text-sky-600" />
          <span className="font-display text-lg font-semibold text-slate-700">Building your study plan...</span>
        </div>
        <p className="mt-2 text-sm text-slate-500">Analyzing topics, allocating time, and scheduling sessions</p>
      </div>
    </div>
  );
}
