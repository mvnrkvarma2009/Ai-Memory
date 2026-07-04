'use client';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowRight, Boxes, GitBranch, ListChecks, Lock, Repeat, Sparkles,
  Clipboard, FileJson, BrainCircuit, Code2, Rocket, GraduationCap, FlaskConical,
} from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { useAuth } from '@/context/AuthContext';

const HERO_BG = 'https://images.pexels.com/photos/7599718/pexels-photo-7599718.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.6, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] },
  }),
};
const VIEWPORT_ONCE = { once: true };

const features = [
  { icon: BrainCircuit, title: 'Memory Engine, not a summarizer', desc: 'Reconstructs the working state of your project — decisions, constraints and next actions — not a lossy TL;DR.' },
  { icon: ListChecks, title: 'Structured sections', desc: 'Goal, current state, completed & pending work, architecture decisions, open questions and ordered next tasks.' },
  { icon: Repeat, title: 'Any AI to any AI', desc: 'Move context from Claude to ChatGPT to Gemini. Pick source and target — the handoff prompt adapts.' },
  { icon: FileJson, title: 'Markdown + JSON export', desc: 'Copy a paste-ready markdown package or export structured JSON for tooling and pipelines.' },
  { icon: GitBranch, title: 'Project history', desc: 'Every package is saved to your account. Revisit any snapshot and reload full context instantly.' },
  { icon: Lock, title: 'Private by default', desc: 'Transcripts are tied to your Google account and never shared. Your context stays yours.' },
];

const steps = [
  { n: '01', title: 'Paste your conversation', desc: 'Drop the raw transcript from wherever you hit a context wall — Claude, ChatGPT, Gemini or Cursor.' },
  { n: '02', title: 'Generate the memory package', desc: 'Claude Sonnet 4.5 extracts the true project state into clean, structured sections.' },
  { n: '03', title: 'Paste into the new AI', desc: 'Copy the handoff prompt or full package. The next AI continues exactly where you left off.' },
];

const useCases = [
  { icon: Code2, label: 'Developers' },
  { icon: Rocket, label: 'Startup founders' },
  { icon: GraduationCap, label: 'Students' },
  { icon: Boxes, label: 'Product builders' },
  { icon: Sparkles, label: 'Designers' },
  { icon: FlaskConical, label: 'Researchers' },
];

export default function Landing() {
  const router = useRouter();
  const { user } = useAuth();
  const go = () => router.push(user ? '/dashboard' : '/login');

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      <section className="relative overflow-hidden border-b border-border">
        <div className="pointer-events-none absolute inset-0 opacity-[0.14]"
          style={{ backgroundImage: `url(${HERO_BG})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-background/40 via-background/80 to-background" />
        <div className="bg-grid pointer-events-none absolute inset-0 opacity-[0.25]" />

        <div className="relative mx-auto max-w-7xl px-6 pb-24 pt-20 md:px-10 md:pb-32 md:pt-28">
          <motion.div variants={fadeUp} initial="hidden" animate="show" custom={0}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1">
            <span className="h-1.5 w-1.5 rounded-full bg-brand" />
            <span className="font-mono text-xs tracking-tight text-muted-foreground">AI project-memory engine</span>
          </motion.div>

          <motion.h1 variants={fadeUp} initial="hidden" animate="show" custom={1}
            className="mt-6 max-w-4xl text-4xl font-medium tracking-tighter sm:text-5xl lg:text-6xl">
            Never explain your project<br />to a new AI again.
          </motion.h1>

          <motion.p variants={fadeUp} initial="hidden" animate="show" custom={2}
            className="mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
            You spent hours building with one AI. Then it hit its context limit. AI Memory turns that conversation into a structured memory package you can paste into any other AI — so it instantly understands the goal, the state, the decisions and what&apos;s next.
          </motion.p>

          <motion.div variants={fadeUp} initial="hidden" animate="show" custom={3}
            className="mt-9 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
            <button onClick={go}
              className="group inline-flex items-center gap-2 rounded-md bg-foreground px-6 py-3 text-sm font-medium text-background transition-colors hover:bg-foreground/90">
              Build a memory package
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </button>
            <a href="#how"
              className="inline-flex items-center gap-2 rounded-md border border-border px-6 py-3 text-sm text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground">
              See how it works
            </a>
          </motion.div>

          <motion.div variants={fadeUp} initial="hidden" animate="show" custom={4}
            className="mt-16 grid gap-4 md:grid-cols-2">
            <div className="rounded-md border border-border bg-card p-6">
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">Without AI Memory</p>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                &ldquo;Ok so let me re-explain everything… the stack, what we already built, the decisions we made, the parts that broke…&rdquo; — 30 minutes gone, context still lossy.
              </p>
            </div>
            <div className="animate-processing rounded-md border border-border bg-card p-6">
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-brand">With AI Memory</p>
              <p className="mt-4 text-sm leading-relaxed text-foreground">
                One paste. A structured package with goal, state, completed &amp; pending work, architecture decisions and next tasks. The new AI is caught up in seconds.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      <section id="features" className="border-b border-border">
        <div className="mx-auto max-w-7xl px-6 py-24 md:px-10">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">Capabilities</p>
          <h2 className="mt-3 max-w-2xl text-2xl font-medium tracking-tight sm:text-3xl lg:text-4xl">
            A serious tool for moving context between AI systems.
          </h2>
          <div className="mt-14 grid gap-px overflow-hidden rounded-md border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f, i) => (
              <motion.div key={f.title} variants={fadeUp} initial="hidden" whileInView="show" viewport={VIEWPORT_ONCE} custom={i}
                className="group bg-card p-8 transition-colors hover:bg-accent">
                <f.icon className="h-5 w-5 text-brand" />
                <h3 className="mt-5 text-lg font-medium tracking-tight">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section id="how" className="border-b border-border bg-grid-lines">
        <div className="mx-auto max-w-7xl px-6 py-24 md:px-10">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">How it works</p>
          <h2 className="mt-3 max-w-2xl text-2xl font-medium tracking-tight sm:text-3xl lg:text-4xl">Three steps. Zero re-explaining.</h2>
          <div className="mt-14 grid gap-4 md:grid-cols-3">
            {steps.map((s, i) => (
              <motion.div key={s.n} variants={fadeUp} initial="hidden" whileInView="show" viewport={VIEWPORT_ONCE} custom={i}
                className="rounded-md border border-border bg-card p-8">
                <span className="font-mono text-3xl font-semibold text-brand">{s.n}</span>
                <h3 className="mt-5 text-lg font-medium tracking-tight">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section id="usecases" className="border-b border-border">
        <div className="mx-auto max-w-7xl px-6 py-24 md:px-10">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">Made for AI power users</p>
          <h2 className="mt-3 max-w-2xl text-2xl font-medium tracking-tight sm:text-3xl lg:text-4xl">Whoever you build with, your context comes along.</h2>
          <div className="mt-14 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {useCases.map((u, i) => (
              <motion.div key={u.label} variants={fadeUp} initial="hidden" whileInView="show" viewport={VIEWPORT_ONCE} custom={i}
                className="flex flex-col items-center gap-3 rounded-md border border-border bg-card p-6 text-center transition-colors hover:border-foreground/30">
                <u.icon className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm text-foreground">{u.label}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-border">
        <div className="mx-auto max-w-7xl px-6 py-24 md:px-10">
          <div className="relative overflow-hidden rounded-md border border-border bg-card p-10 md:p-16">
            <div className="bg-grid pointer-events-none absolute inset-0 opacity-40" />
            <div className="relative">
              <Clipboard className="h-6 w-6 text-brand" />
              <h2 className="mt-5 max-w-2xl text-2xl font-medium tracking-tight sm:text-3xl lg:text-4xl">
                Turn your next context wall into a clean handoff.
              </h2>
              <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground">
                Sign in, paste a conversation, and generate your first memory package in under a minute.
              </p>
              <button onClick={go}
                className="group mt-8 inline-flex items-center gap-2 rounded-md bg-foreground px-6 py-3 text-sm font-medium text-background transition-colors hover:bg-foreground/90">
                Get started free
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
