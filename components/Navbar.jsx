'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BrainCircuit } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';

export function Navbar() {
  const router = useRouter();
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-background/60 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 md:px-10">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-md border border-border bg-card">
            <BrainCircuit className="h-4 w-4 text-brand" />
          </div>
          <span className="font-mono text-base font-semibold tracking-tight">AI Memory</span>
        </Link>
        <nav className="hidden items-center gap-8 md:flex">
          <a href="#features" className="text-sm text-muted-foreground transition-colors hover:text-foreground">Features</a>
          <a href="#how" className="text-sm text-muted-foreground transition-colors hover:text-foreground">How it works</a>
          <a href="#usecases" className="text-sm text-muted-foreground transition-colors hover:text-foreground">Use cases</a>
        </nav>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <button
            onClick={() => router.push('/dashboard')}
            className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background transition-colors hover:bg-foreground/90"
          >
            Open Workspace
          </button>
        </div>
      </div>
    </header>
  );
}
