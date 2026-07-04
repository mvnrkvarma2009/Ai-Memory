import { useState } from "react";
import { toast } from "sonner";
import {
  Copy, Check, Download, FileJson, FileText, ArrowRight, Target,
  Flag, Activity, Layers, CheckCircle2, Clock, GitBranch, ShieldAlert,
  Boxes, HelpCircle, ListTodo, MessageSquareText, Share2, Loader2,
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import api from "@/lib/api";
import HandoffPanel from "@/components/HandoffPanel";

function CopyButton({ getText, label, testId }) {
  const [copied, setCopied] = useState(false);
  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(getText());
      setCopied(true);
      toast.success(`${label} copied`);
      setTimeout(() => setCopied(false), 1600);
    } catch (e) {
      toast.error("Copy failed");
    }
  };
  return (
    <button data-testid={testId} onClick={onCopy}
      className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground">
      {copied ? <Check className="h-3.5 w-3.5 text-brand" /> : <Copy className="h-3.5 w-3.5" />}
      {label}
    </button>
  );
}

function download(filename, content, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function SharePanel({ packageId, initialShareId }) {
  const [shareId, setShareId] = useState(initialShareId || null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const url = shareId ? `${window.location.origin}/s/${shareId}` : "";

  const createLink = async () => {
    setBusy(true);
    try {
      const res = await api.post(`/memory/${packageId}/share`);
      setShareId(res.data.share_id);
      toast.success("Public link created");
    } catch (e) {
      toast.error("Could not create link");
    } finally {
      setBusy(false);
    }
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Link copied");
      setTimeout(() => setCopied(false), 1600);
    } catch (e) {
      toast.error("Copy failed");
    }
  };

  const revoke = async () => {
    setBusy(true);
    try {
      await api.delete(`/memory/${packageId}/share`);
      setShareId(null);
      toast.success("Link revoked");
    } catch (e) {
      toast.error("Could not revoke");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          data-testid="share-btn"
          className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground"
        >
          <Share2 className="h-3.5 w-3.5" /> Share
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80">
        <p className="font-mono text-xs uppercase tracking-[0.15em] text-muted-foreground">Public share link</p>
        {shareId ? (
          <>
            <div className="mt-3 flex gap-2">
              <input
                data-testid="share-url-input"
                readOnly
                value={url}
                onFocus={(e) => e.target.select()}
                className="min-w-0 flex-1 rounded-md border border-input bg-background px-2 py-1.5 font-mono text-xs outline-none"
              />
              <button
                data-testid="share-copy-btn"
                onClick={copy}
                className="inline-flex h-8 w-9 items-center justify-center rounded-md border border-border text-muted-foreground hover:text-foreground"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-brand" /> : <Copy className="h-3.5 w-3.5" />}
              </button>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">Anyone with this link can view a read-only copy.</p>
            <button
              data-testid="share-revoke-btn"
              onClick={revoke}
              disabled={busy}
              className="mt-3 text-xs text-destructive hover:underline disabled:opacity-40"
            >
              Revoke link
            </button>
          </>
        ) : (
          <>
            <p className="mt-2 text-xs text-muted-foreground">Create a read-only link to share this memory package with anyone.</p>
            <button
              data-testid="share-create-btn"
              onClick={createLink}
              disabled={busy}
              className="mt-3 inline-flex items-center gap-2 rounded-md bg-foreground px-3 py-2 text-xs font-medium text-background transition-colors hover:bg-foreground/90 disabled:opacity-40"
            >
              {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Share2 className="h-3.5 w-3.5" />}
              {busy ? "Creating…" : "Create public link"}
            </button>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
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
              {ordered ? String(i + 1).padStart(2, "0") : "—"}
            </span>
            <span>{it}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function MemoryPackageViewer({ item, readOnly = false }) {
  const p = item.package || {};
  const jsonStr = JSON.stringify(
    { project_title: item.project_title, source_ai: item.source_ai, target_ai: item.target_ai, ...p },
    null, 2
  );
  const safeName = (item.project_title || "memory-package").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const created = item.created_at ? new Date(item.created_at).toLocaleString() : "";

  return (
    <div data-testid="memory-package-viewer" className="animate-fade-up">
      {/* Header */}
      <div className="rounded-md border border-border bg-card">
        <div className="flex flex-col gap-4 border-b border-border p-6 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">Memory package</p>
            <h1 data-testid="package-title" className="mt-2 text-2xl font-medium tracking-tight">{item.project_title}</h1>
            {p.one_liner && <p className="mt-2 max-w-xl text-sm text-muted-foreground">{p.one_liner}</p>}
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1 font-mono text-xs">
                {item.source_ai} <ArrowRight className="h-3 w-3 text-brand" /> {item.target_ai}
              </span>
              {created && <span className="font-mono text-xs text-muted-foreground">{created}</span>}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {!readOnly && <HandoffPanel packageId={item.id} projectTitle={item.project_title} />}
            {!readOnly && <SharePanel packageId={item.id} initialShareId={item.share_id} />}
            <CopyButton testId="copy-markdown-btn" label="Copy Markdown" getText={() => item.markdown} />
            <CopyButton testId="copy-json-btn" label="Copy JSON" getText={() => jsonStr} />
            <button data-testid="download-md-btn" onClick={() => download(`${safeName}.md`, item.markdown, "text/markdown")}
              className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground">
              <FileText className="h-3.5 w-3.5" /> .md
            </button>
            <button data-testid="download-json-btn" onClick={() => download(`${safeName}.json`, jsonStr, "application/json")}
              className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground">
              <FileJson className="h-3.5 w-3.5" /> .json
            </button>
          </div>
        </div>

        {/* Handoff prompt highlighted */}
        {p.handoff_prompt && (
          <div className="border-b border-border bg-brand/[0.06] p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquareText className="h-3.5 w-3.5 text-brand" />
                <p className="font-mono text-xs uppercase tracking-[0.2em] text-brand">Handoff prompt — paste this first</p>
              </div>
              <CopyButton testId="copy-handoff-btn" label="Copy" getText={() => p.handoff_prompt} />
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
