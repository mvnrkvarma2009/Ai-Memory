'use client';
import { useState } from 'react';
import {
  Copy, Check, FileJson, FileText, ArrowRight, Flag, Activity, Layers,
  CheckCircle2, Clock, GitBranch, ShieldAlert, Boxes, HelpCircle,
  ListTodo, MessageSquareText,
} from 'lucide-react';
import { toast } from 'sonner';

function CopyButton({ getText, label }) {
  const [copied, setCopied] = useState(false);
  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(getText());
      setCopied(true);
      toast.success(`${label} copied`);
      setTimeout(() => setCopied(false), 1600);
    } catch { toast.error('Copy failed'); }
  };
  return (
    <button onClick={onCopy}
      className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground">
      {copied ? <Check className="h-3.5 w-3.5 text-brand" /> : <Copy className="h-3.5 w-3.5" />} {label}
    </button>
  );
}

function download(filename, content, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

function TextSection({ icon: Icon, label, value }) {
  if (!value) return null;
  return (
    <div className="border-t border-border px-6 py-5">
      <div className="flex items-center gap-2">
        <Icon className="h-3.5 w-3.5 text-brand" />
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">{label}</p>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-foreground/90">{value}</p>
    </div>
  );
}

function ListSection({ icon: Icon, label, items, ordered }) {
  if (!items || items.length === 0) return null;
  return (
    <div className="border-t border-border px-6 py-5">
      <div className="flex items-center gap-2">
        <Icon className="h-3.5 w-3.5 text-brand" />
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">{label}</p>
        <span className="ml-1 font-mono text-xs text-muted-foreground/60">{items.length}</span>
      </div>
      <ul className="mt-3 space-y-2">
        {items.map((it, i) => (
          <li key={`${label}-${i}`} className="flex gap-3 text-sm leading-relaxed text-foreground/90">
            <span className="mt-0.5 select-none font-mono text-xs text-brand">
              {ordered ? String(i + 1).padStart(2, '0') : '—'}
            </span>
            <span>{it}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function MemoryPackageViewer({ item }) {
  const p = item.package || {};
  const jsonStr = JSON.stringify(
    { project_title: item.project_title, source_ai: item.source_ai, target_ai: item.target_ai, ...p },
    null, 2
  );
  const safeName = (item.project_title || 'memory-package').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const created = item.created_at ? new Date(item.created_at).toLocaleString() : '';

  return (
    <div className="animate-fade-up">
      <div className="rounded-md border border-border bg-card">
        <div className="flex flex-col gap-4 border-b border-border p-6 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">Memory package</p>
            <h1 className="mt-2 text-2xl font-medium tracking-tight">{item.project_title}</h1>
            {p.one_liner && <p className="mt-2 max-w-xl text-sm text-muted-foreground">{p.one_liner}</p>}
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1 font-mono text-xs">
                {item.source_ai} <ArrowRight className="h-3 w-3 text-brand" /> {item.target_ai}
              </span>
              {created && <span className="font-mono text-xs text-muted-foreground">{created}</span>}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <CopyButton label="Copy Markdown" getText={() => item.markdown} />
            <CopyButton label="Copy JSON" getText={() => jsonStr} />
            <button onClick={() => download(`${safeName}.md`, item.markdown, 'text/markdown')}
              className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground">
              <FileText className="h-3.5 w-3.5" /> .md
            </button>
            <button onClick={() => download(`${safeName}.json`, jsonStr, 'application/json')}
              className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground">
              <FileJson className="h-3.5 w-3.5" /> .json
            </button>
          </div>
        </div>

        {p.handoff_prompt && (
          <div className="border-b border-border bg-brand/[0.06] p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquareText className="h-3.5 w-3.5 text-brand" />
                <p className="font-mono text-xs uppercase tracking-[0.2em] text-brand">Handoff prompt — paste this first</p>
              </div>
              <CopyButton label="Copy" getText={() => p.handoff_prompt} />
            </div>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">{p.handoff_prompt}</p>
          </div>
        )}

        <TextSection icon={Flag} label="Project Goal" value={p.project_goal} />
        <TextSection icon={Activity} label="Current State" value={p.current_state} />
        <ListSection icon={Layers} label="Tech Stack" items={p.tech_stack} />
        <ListSection icon={CheckCircle2} label="Completed Work" items={p.completed_work} />
        <ListSection icon={Clock} label="Pending Work" items={p.pending_work} />
        <ListSection icon={GitBranch} label="Architecture Decisions" items={p.architecture_decisions} />
        <ListSection icon={ShieldAlert} label="Constraints" items={p.constraints} />
        <ListSection icon={Boxes} label="Key Components" items={p.key_components} />
        <ListSection icon={HelpCircle} label="Open Questions" items={p.open_questions} />
        <ListSection icon={ListTodo} label="Next Tasks" items={p.next_tasks} ordered />
      </div>
    </div>
  );
}
