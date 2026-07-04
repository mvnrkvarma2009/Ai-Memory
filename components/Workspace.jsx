'use client';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Sparkles, Loader2, ClipboardPaste, ArrowRight } from 'lucide-react';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import api from '@/lib/api';

const AI_OPTIONS = ['Claude', 'ChatGPT', 'Gemini', 'Cursor', 'Grok', 'Perplexity', 'Other'];
const SAMPLE = "User: I'm building a task manager called FlowBoard with React + FastAPI + Postgres...\nAssistant: Great, we set up the auth with JWT and created the /tasks endpoints...\n(User: paste your full conversation transcript here)";

export default function Workspace({ onGenerated }) {
  const [transcript, setTranscript] = useState('');
  const [title, setTitle] = useState('');
  const [sourceAi, setSourceAi] = useState('Claude');
  const [targetAi, setTargetAi] = useState('ChatGPT');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const t = typeof window !== 'undefined' ? window.localStorage.getItem('aiMemoryPrefill') : null;
    if (t && t.trim()) {
      setTranscript(t);
      window.localStorage.removeItem('aiMemoryPrefill');
      toast.success('Captured conversation loaded from the browser extension');
    }
  }, []);

  const chars = transcript.length;
  const disabled = loading || transcript.trim().length < 40;

  const handleGenerate = async () => {
    if (transcript.trim().length < 40) {
      toast.error('Paste a longer conversation to build a useful memory package.');
      return;
    }
    setLoading(true);
    try {
      const res = await api.post('/memory/generate', {
        transcript,
        source_ai: sourceAi,
        target_ai: targetAi,
        project_title: title.trim() || null,
      }, { timeout: 120000 });
      toast.success('Memory package generated');
      onGenerated(res.data);
    } catch (e) {
      const msg = e?.response?.data?.detail || 'Generation failed. Please try again.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-up">
      <div className="rounded-md border border-border bg-card">
        <div className="border-b border-border p-6">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">Workspace</p>
          <h1 className="mt-2 text-2xl font-medium tracking-tight">Generate a memory package</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Paste the conversation where you hit a context wall. The engine reconstructs the full project state so any other AI can continue seamlessly.
          </p>
        </div>

        <div className="grid gap-5 p-6">
          <div className="grid gap-5 md:grid-cols-3">
            <div>
              <label className="font-mono text-xs uppercase tracking-[0.15em] text-muted-foreground">Project title (optional)</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. FlowBoard"
                className="mt-2 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-foreground focus:ring-1 focus:ring-ring"
              />
            </div>
            <div>
              <label className="font-mono text-xs uppercase tracking-[0.15em] text-muted-foreground">Source AI</label>
              <Select value={sourceAi} onValueChange={setSourceAi}>
                <SelectTrigger className="mt-2 bg-background"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {AI_OPTIONS.map((o) => (<SelectItem key={o} value={o}>{o}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="font-mono text-xs uppercase tracking-[0.15em] text-muted-foreground">Target AI</label>
              <Select value={targetAi} onValueChange={setTargetAi}>
                <SelectTrigger className="mt-2 bg-background"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {AI_OPTIONS.map((o) => (<SelectItem key={o} value={o}>{o}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label className="font-mono text-xs uppercase tracking-[0.15em] text-muted-foreground">Conversation transcript</label>
              <span className="font-mono text-xs text-muted-foreground">{chars.toLocaleString()} chars</span>
            </div>
            <textarea
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder={SAMPLE}
              spellCheck={false}
              className="mt-2 h-72 w-full resize-y rounded-md border border-input bg-background px-4 py-3 font-mono text-sm leading-relaxed outline-none transition-colors focus:border-foreground focus:ring-1 focus:ring-ring"
            />
          </div>

          <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
            <p className="flex items-center gap-2 text-xs text-muted-foreground">
              <ClipboardPaste className="h-3.5 w-3.5" />
              Tip: paste the whole thread — more context yields a sharper package.
            </p>
            <button
              onClick={handleGenerate}
              disabled={disabled}
              className="group inline-flex items-center gap-2 rounded-md bg-foreground px-6 py-3 text-sm font-medium text-background transition-colors hover:bg-foreground/90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {loading ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Reconstructing context…</>
              ) : (
                <><Sparkles className="h-4 w-4" /> Generate Memory Package <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" /></>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
