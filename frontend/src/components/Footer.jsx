import { BrainCircuit } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto max-w-7xl px-6 py-14 md:px-10">
        <div className="flex flex-col justify-between gap-10 md:flex-row">
          <div className="max-w-sm">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-md border border-border bg-card">
                <BrainCircuit className="h-4 w-4 text-brand" />
              </div>
              <span className="font-mono text-base font-semibold tracking-tight">AI&nbsp;Memory</span>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              The project-memory engine. Move full context between any AI system —
              never explain your project from scratch again.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-12 sm:grid-cols-3">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">Product</p>
              <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
                <li><a href="#features" className="transition-colors hover:text-foreground">Features</a></li>
                <li><a href="#how" className="transition-colors hover:text-foreground">How it works</a></li>
                <li><a href="#usecases" className="transition-colors hover:text-foreground">Use cases</a></li>
              </ul>
            </div>
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">Engine</p>
              <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
                <li>Claude Sonnet 4.6</li>
                <li>Structured Markdown</li>
                <li>JSON Export</li>
              </ul>
            </div>
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">Made for</p>
              <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
                <li>Developers</li>
                <li>Founders &amp; Builders</li>
                <li>Researchers</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-4 border-t border-border pt-8 text-xs text-muted-foreground sm:flex-row sm:items-center">
          <span className="font-mono">© {new Date().getFullYear()} AI Memory · Built by Nagendra Varma Mudunuri</span>
          <span className="font-mono">Context that travels with you.</span>
        </div>
      </div>
    </footer>
  );
}
