import React, { useState } from 'react';
import { Modal, Button, Badge } from './ui/index.ts';
import { Database, Check, Copy, ExternalLink, ShieldCheck, HardDrive, Zap } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';

interface DatabaseSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DatabaseSetupModal: React.FC<DatabaseSetupModalProps> = ({ isOpen, onClose }) => {
  const { isConfigured } = useAuth();
  const [copied, setCopied] = useState(false);

  const sqlFilePath = '/supabase/schema.sql';

  const copySqlPath = () => {
    navigator.clipboard.writeText(sqlFilePath);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <Database className="w-5 h-5" />
          </div>
          <span>Supabase Database & Storage Setup</span>
        </div>
      }
      description="All StatusHired tables, RLS security policies, triggers, and storage buckets are defined in /supabase/schema.sql"
      maxWidth="xl"
    >
      <div className="space-y-5 text-sm">
        {/* Status indicator */}
        <div className="p-3.5 rounded-xl border border-[#E8EAF2] dark:border-[#1F2437] bg-slate-50 dark:bg-[#0B0E17]/60 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                isConfigured ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
              }`}
            />
            <span className="font-medium text-slate-800 dark:text-[#E8EBF5]">
              {isConfigured ? 'Connected to live Supabase project' : 'Supabase Not Configured (Keys Needed in .env)'}
            </span>
          </div>
          <Badge variant={isConfigured ? 'success' : 'warning'}>
            {isConfigured ? 'Live Supabase' : 'Configuration Required'}
          </Badge>
        </div>

        {/* Step 1: Finding keys */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-slate-900 dark:text-[#E8EBF5] flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-xs flex items-center justify-center font-bold">1</span>
              Get Supabase Project URL &amp; Anon Key
            </h4>
            <a
              href="https://supabase.com/dashboard"
              target="_blank"
              rel="noreferrer"
              className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 font-medium"
            >
              Open Supabase <ExternalLink className="w-3 h-3" />
            </a>
          </div>
          
          <div className="rounded-xl border border-indigo-100 dark:border-indigo-900/40 bg-indigo-50/50 dark:bg-indigo-950/20 p-3.5 space-y-2.5 text-xs text-slate-700 dark:text-slate-300">
            <p className="font-semibold text-indigo-900 dark:text-indigo-200">
              Where to find Project URL &amp; API Key in the new Supabase Dashboard:
            </p>
            <div className="space-y-2 pl-1 leading-relaxed">
              <div className="p-2.5 rounded-lg bg-white/70 dark:bg-black/30 border border-indigo-100/60 dark:border-indigo-900/40">
                <p className="font-medium text-indigo-950 dark:text-indigo-300 mb-1">
                  1. Finding Project URL (Fastest Method):
                </p>
                <p className="text-[11px] text-slate-600 dark:text-slate-300">
                  Look at your browser's address bar right now: <code className="bg-indigo-100 dark:bg-indigo-950 px-1 py-0.5 rounded font-mono">https://supabase.com/dashboard/project/<b>[your-project-id]</b>/...</code>
                </p>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1">
                  Your Project URL is: <code className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-mono px-1 py-0.5 rounded font-semibold">https://[your-project-id].supabase.co</code> (or click the green <strong>"Connect"</strong> button in the top navigation bar).
                </p>
              </div>

              <div className="p-2.5 rounded-lg bg-white/70 dark:bg-black/30 border border-indigo-100/60 dark:border-indigo-900/40">
                <p className="font-medium text-indigo-950 dark:text-indigo-300 mb-1">
                  2. Finding the API Key (Either one works):
                </p>
                <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-600 dark:text-slate-300">
                  <li><strong>New Publishable Key</strong>: Copy the key starting with <code className="font-mono bg-indigo-100 dark:bg-indigo-950 px-1 py-0.5 rounded">sb_publishable_...</code></li>
                  <li><strong>Legacy anon key</strong>: Click the tab <em>"Legacy anon, service_role API keys"</em> to copy the token starting with <code className="font-mono bg-indigo-100 dark:bg-indigo-950 px-1 py-0.5 rounded">eyJhbG...</code></li>
                </ul>
              </div>
            </div>
          </div>

          <p className="text-slate-600 dark:text-[#8B93AB] text-xs">
            Open your local <code className="px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-[#1f2437] text-indigo-600 dark:text-indigo-400 font-mono">.env</code> file in Notepad and paste them:
          </p>
          <pre className="p-3 rounded-xl bg-slate-900 text-slate-100 font-mono text-xs overflow-x-auto">
{`VITE_SUPABASE_URL=https://[your-project-id].supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_... (or eyJhbGciOi...)`}
          </pre>
        </div>

        {/* Step 2: Run SQL Schema */}
        <div className="space-y-3 pt-2">
          <h4 className="font-semibold text-slate-900 dark:text-[#E8EBF5] flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-xs flex items-center justify-center font-bold">2</span>
            Run SQL Schema in Supabase
          </h4>
          <p className="text-slate-600 dark:text-[#8B93AB] text-xs leading-relaxed">
            In your Supabase Dashboard &rarr; Click <strong>SQL Editor</strong> (left menu icon <code className="px-1 rounded bg-slate-100 dark:bg-slate-800">&gt;_</code>) &rarr; Click <strong>New Query</strong>, paste the content of{' '}
            <code className="px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-[#1f2437] text-indigo-600 dark:text-indigo-400 font-mono">
              /supabase/schema.sql
            </code>
            , and click <strong>Run</strong>.
          </p>

          <div className="flex items-center gap-2 pt-1">
            <div className="flex-1 bg-slate-100 dark:bg-[#0B0E17] border border-[#E8EAF2] dark:border-[#1F2437] rounded-xl px-3 py-2 font-mono text-xs text-slate-700 dark:text-slate-300 truncate">
              {sqlFilePath}
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={copySqlPath}
              leftIcon={copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            >
              {copied ? 'Copied Path' : 'Copy Path'}
            </Button>
          </div>
        </div>

        {/* Step 3: Restart Dev Server */}
        <div className="space-y-2 pt-2">
          <h4 className="font-semibold text-slate-900 dark:text-[#E8EBF5] flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-xs flex items-center justify-center font-bold">3</span>
            Restart the App
          </h4>
          <p className="text-slate-600 dark:text-[#8B93AB] text-xs">
            After updating <code className="px-1 py-0.5 rounded bg-slate-100 dark:bg-[#1f2437]">.env</code>, close your terminal window and double-click <strong>start-windows.bat</strong> (or run <code className="px-1 py-0.5 rounded bg-slate-100 dark:bg-[#1f2437]">npm run dev</code>). The badge will switch from <span className="text-amber-600 font-semibold">Demo</span> to <span className="text-emerald-600 font-semibold">Live Supabase</span>!
          </p>
        </div>

        {/* Strict cookies note */}
        <div className="p-3 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 text-xs text-indigo-900 dark:text-indigo-200">
          <strong>Strict Privacy &amp; Security Compliance:</strong> The client stores sessions via an HTTP Lax cookie storage adapter (30-day expiry). <code>localStorage</code> and <code>sessionStorage</code> are strictly disabled.
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        <Button variant="secondary" onClick={onClose}>
          Got it
        </Button>
      </div>
    </Modal>
  );
};
