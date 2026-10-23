import { AlertTriangle } from 'lucide-react';

interface ErrorScreenProps {
  message: string;
  onRetry: () => void;
}

export default function ErrorScreen({ message, onRetry }: ErrorScreenProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-white to-red-50">
      <div className="text-center">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
          <AlertTriangle className="h-8 w-8 text-red-500" />
        </div>
        <h2 className="mt-6 font-display text-xl font-bold text-slate-900">Something went wrong</h2>
        <p className="mx-auto mt-2 max-w-sm text-sm text-slate-600">{message}</p>
        <button onClick={onRetry} className="btn-primary mt-6">
          Try Again
        </button>
      </div>
    </div>
  );
}
