'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  BrainCircuit, Plus, Trash2, Loader2, ArrowRight, History, PanelLeft, Home,
} from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';
import Workspace from '@/components/Workspace';
import MemoryPackageViewer from '@/components/MemoryPackageViewer';

const STORAGE_KEY = 'aiMemory.packages.v1';

function loadPackages() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch { return []; }
}

function savePackages(list) {
  if (typeof window === 'undefined') return;
  try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list)); } catch {}
}

function HistorySidebar({ packages, activeId, onSelect, onNew, onDelete, onClearAll }) {
  return (
    <div className="flex h-full flex-col">
      <button onClick={onNew}
        className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-foreground px-4 py-2.5 text-sm font-medium text-background transition-colors hover:bg-foreground/90">
        <Plus className="h-4 w-4" /> New memory
      </button>
      <div className="mt-6 flex items-center gap-2 px-1">
        <History className="h-3.5 w-3.5 text-muted-foreground" />
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">History</p>
        <span className="ml-auto font-mono text-xs text-muted-foreground/60">{packages.length}</span>
      </div>
      <div className="mt-3 flex-1 space-y-2 overflow-y-auto pr-1">
        {packages.length === 0 && (
          <p className="px-1 py-4 text-xs leading-relaxed text-muted-foreground">
            No packages yet. Generate your first memory package to see it here. History is stored locally in this browser.
          </p>
        )}
        {packages.map((p) => (
          <div key={p.id}
            onClick={() => onSelect(p.id)}
            className={`group cursor-pointer rounded-md border p-3 transition-colors ${
              activeId === p.id ? 'border-brand/60 bg-accent' : 'border-border bg-card hover:border-foreground/30'
            }`}>
            <div className="flex items-start justify-between gap-2">
              <p className="line-clamp-1 text-sm font-medium">{p.project_title}</p>
              <button onClick={(e) => { e.stopPropagation(); onDelete(p.id); }}
                className="opacity-0 transition-opacity group-hover:opacity-100" aria-label="Delete package">
                <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
              </button>
            </div>
            <div className="mt-1.5 flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground">
              <span>{p.source_ai}</span><ArrowRight className="h-2.5 w-2.5 text-brand" /><span>{p.target_ai}</span>
            </div>
          </div>
        ))}
      </div>
      {packages.length > 0 && (
        <button onClick={onClearAll}
          className="mt-3 rounded-md border border-border px-3 py-2 text-xs text-muted-foreground transition-colors hover:border-destructive/50 hover:text-destructive">
          Clear all history
        </button>
      )}
    </div>
  );
}

export default function DashboardShell() {
  const [packages, setPackages] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const loaded = useRef(false);

  useEffect(() => {
    if (loaded.current) return;
    loaded.current = true;
    setPackages(loadPackages());
  }, []);

  const activeItem = activeId ? packages.find((p) => p.id === activeId) : null;

  const onGenerated = useCallback((pkg) => {
    setPackages((prev) => {
      const next = [pkg, ...prev.filter((p) => p.id !== pkg.id)];
      savePackages(next);
      return next;
    });
    setActiveId(pkg.id);
  }, []);

  const onDelete = useCallback((pkgId) => {
    setPackages((prev) => {
      const next = prev.filter((p) => p.id !== pkgId);
      savePackages(next);
      return next;
    });
    setActiveId((cur) => (cur === pkgId ? null : cur));
    toast.success('Package deleted');
  }, []);

  const onClearAll = useCallback(() => {
    if (!confirm('Delete all saved memory packages from this browser?')) return;
    setPackages([]);
    setActiveId(null);
    savePackages([]);
    toast.success('History cleared');
  }, []);

  const onNew = () => { setSidebarOpen(false); setActiveId(null); };
  const onSelect = (id) => { setSidebarOpen(false); setActiveId(id); };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-50 border-b border-border bg-background/70 backdrop-blur-xl">
        <div className="flex h-16 items-center justify-between px-4 md:px-8">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen((v) => !v)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border text-muted-foreground lg:hidden" aria-label="Toggle history">
              <PanelLeft className="h-4 w-4" />
            </button>
            <Link href="/" className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-md border border-border bg-card">
                <BrainCircuit className="h-4 w-4 text-brand" />
              </div>
              <span className="font-mono text-base font-semibold tracking-tight">AI Memory</span>
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link href="/"
              className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground">
              <Home className="h-3.5 w-3.5" /> Home
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 md:px-8 lg:grid-cols-[300px_1fr]">
        <aside className="hidden lg:block">
          <div className="sticky top-24 h-[calc(100vh-8rem)]">
            <HistorySidebar packages={packages} activeId={activeId} onSelect={onSelect}
              onNew={onNew} onDelete={onDelete} onClearAll={onClearAll} />
          </div>
        </aside>
        {sidebarOpen && (
          <div className="lg:hidden">
            <div className="rounded-md border border-border bg-card p-4">
              <HistorySidebar packages={packages} activeId={activeId} onSelect={onSelect}
                onNew={onNew} onDelete={onDelete} onClearAll={onClearAll} />
            </div>
          </div>
        )}
        <main className="min-w-0">
          {activeItem ? <MemoryPackageViewer item={activeItem} /> : <Workspace onGenerated={onGenerated} />}
        </main>
      </div>
    </div>
  );
}
