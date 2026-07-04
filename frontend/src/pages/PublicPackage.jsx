import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { BrainCircuit, Loader2, ArrowRight } from "lucide-react";
import api from "@/lib/api";
import MemoryPackageViewer from "@/components/MemoryPackageViewer";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function PublicPackage() {
  const { shareId } = useParams();
  const [item, setItem] = useState(null);
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    let cancelled = false;
    api
      .get(`/public/memory/${shareId}`)
      .then((r) => { if (!cancelled) { setItem(r.data); setStatus("ok"); } })
      .catch(() => { if (!cancelled) setStatus("notfound"); });
    return () => { cancelled = true; };
  }, [shareId]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-50 border-b border-border bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-4 md:px-8">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-md border border-border bg-card">
              <BrainCircuit className="h-4 w-4 text-brand" />
            </div>
            <span className="font-mono text-base font-semibold tracking-tight">AI&nbsp;Memory</span>
          </Link>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link
              to="/"
              data-testid="public-cta-btn"
              className="inline-flex items-center gap-2 rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background transition-colors hover:bg-foreground/90"
            >
              Try AI Memory <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8 md:px-8">
        {status === "loading" && (
          <div className="flex h-64 items-center justify-center rounded-md border border-border bg-card" data-testid="public-loading">
            <Loader2 className="h-5 w-5 animate-spin text-brand" />
          </div>
        )}

        {status === "notfound" && (
          <div className="rounded-md border border-border bg-card p-10 text-center" data-testid="public-notfound">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">404</p>
            <h1 className="mt-3 text-2xl font-medium tracking-tight">This shared package doesn&apos;t exist</h1>
            <p className="mt-2 text-sm text-muted-foreground">The link may have been revoked or is incorrect.</p>
            <Link to="/" className="mt-6 inline-flex items-center gap-2 rounded-md bg-foreground px-5 py-2.5 text-sm font-medium text-background hover:bg-foreground/90">
              Go to AI Memory <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )}

        {status === "ok" && item && (
          <>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-md border border-border bg-card px-4 py-3 text-xs text-muted-foreground" data-testid="public-banner">
              <span className="font-mono uppercase tracking-[0.15em]">Read-only shared memory package</span>
              <Link to="/" className="text-brand hover:underline">Create your own with AI Memory →</Link>
            </div>
            <MemoryPackageViewer item={item} readOnly />
          </>
        )}
      </main>
    </div>
  );
}
