import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button.tsx';
import { Compass, Home, ArrowLeft } from 'lucide-react';

export const NotFound: React.FC = () => {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-6">
      <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-5 shadow-sm">
        <Compass className="w-8 h-8" />
      </div>

      <span className="text-xs font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400 mb-2">
        Error 404
      </span>

      <h1 className="text-3xl sm:text-4xl font-extrabold font-heading text-slate-900 dark:text-[#E8EBF5]">
        Page Not Found
      </h1>

      <p className="mt-2 text-sm text-slate-500 dark:text-[#8B93AB] max-w-md">
        The application page or route you requested doesn't exist or may have been moved.
      </p>

      <div className="mt-6 flex items-center gap-3">
        <Link to="/">
          <Button variant="primary" leftIcon={<Home className="w-4 h-4" />}>
            Back to Dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
};
