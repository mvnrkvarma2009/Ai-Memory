import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  Send, Loader2, Package, KeyRound, Plug, ArrowLeft, Sparkles, ShieldCheck,
} from "lucide-react";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import api from "@/lib/api";

const PROVIDERS = [
  { v: "anthropic", l: "Claude — Anthropic" },
  { v: "openai", l: "ChatGPT — OpenAI" },
  { v: "gemini", l: "Gemini — Google" },
];

const MODELS = {
  anthropic: [
    { v: "claude-sonnet-4-6", l: "Claude Sonnet 4.6" },
    { v: "claude-opus-4-7", l: "Claude Opus 4.7" },
  ],
  openai: [
    { v: "gpt-4o", l: "GPT-4o" },
    { v: "gpt-5.4-mini", l: "GPT-5.4 mini" },
    { v: "gpt-5.4", l: "GPT-5.4" },
  ],
  gemini: [
    { v: "gemini-3-flash-preview", l: "Gemini 3 Flash" },
    { v: "gemini-3.1-pro-preview", l: "Gemini 3.1 Pro" },
  ],
};

const PROVIDER_LABEL = { anthropic: "Claude", openai: "ChatGPT", gemini: "Gemini" };

function MessageBubble({ m }) {
  if (m.seed) {
    return (
      <div className="flex justify-end" data-testid="handoff-seed-msg">
        <div className="inline-flex items-center gap-2 rounded-full border border-brand/40 bg-brand/10 px-3 py-1.5 text-xs text-brand">
          <Package className="h-3.5 w-3.5" /> Memory package delivered
        </div>
      </div>
    );
  }
  const isUser = m.role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] whitespace-pre-wrap rounded-md border px-4 py-3 text-sm leading-relaxed ${
          isUser
            ? "border-border bg-secondary text-foreground"
            : "border-border bg-card text-foreground/90"
        }`}
      >
        {m.content}
      </div>
    </div>
  );
}

export default function HandoffPanel({ packageId, projectTitle }) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState("setup"); // setup | chat
  const [provider, setProvider] = useState("anthropic");
  const [model, setModel] = useState("claude-sonnet-4-6");
  const [useOwnKey, setUseOwnKey] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [chat, setChat] = useState(null);
  const [existing, setExisting] = useState([]);
  const [starting, setStarting] = useState(false);
  const [sending, setSending] = useState(false);
  const [input, setInput] = useState("");
  const scrollRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    setView("setup");
    setChat(null);
    api.get(`/memory/${packageId}/handoffs`).then((r) => setExisting(r.data)).catch(() => {});
  }, [open, packageId]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [chat, sending]);

  const onProviderChange = (v) => {
    setProvider(v);
    setModel(MODELS[v][0].v);
  };

  const keyPayload = () => (useOwnKey && apiKey.trim() ? { api_key: apiKey.trim() } : {});

  const startHandoff = async () => {
    setStarting(true);
    try {
      const res = await api.post(`/memory/${packageId}/handoff`, { provider, model, ...keyPayload() });
      setChat(res.data);
      setView("chat");
      toast.success(`Context delivered to ${PROVIDER_LABEL[provider]}`);
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Could not reach the AI. Check your model/key.");
    } finally {
      setStarting(false);
    }
  };

  const resume = async (chatId) => {
    try {
      const res = await api.get(`/handoff/${chatId}`);
      setChat(res.data);
      setView("chat");
    } catch (e) {
      toast.error("Could not open conversation");
    }
  };

  const sendMessage = async () => {
    const content = input.trim();
    if (!content || !chat) return;
    setInput("");
    setSending(true);
    // optimistic append
    const optimistic = { ...chat, messages: [...chat.messages, { role: "user", content, ts: "", seed: false }] };
    setChat(optimistic);
    try {
      const res = await api.post(`/handoff/${chat.id}/message`, { content, ...keyPayload() });
      setChat(res.data);
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Message failed");
      setChat(chat); // revert optimistic
      setInput(content);
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          data-testid="handoff-open-btn"
          className="inline-flex items-center gap-2 rounded-md bg-brand px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-brand/90"
        >
          <Plug className="h-3.5 w-3.5" /> Connect to an AI
        </button>
      </DialogTrigger>

      <DialogContent className="flex max-h-[85vh] w-[95vw] max-w-2xl flex-col gap-0 overflow-hidden p-0">
        <DialogHeader className="border-b border-border p-5">
          <DialogTitle className="flex items-center gap-2 text-base font-medium">
            {view === "chat" && (
              <button
                data-testid="handoff-back-btn"
                onClick={() => setView("setup")}
                className="mr-1 text-muted-foreground transition-colors hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
            )}
            <Sparkles className="h-4 w-4 text-brand" />
            {view === "chat"
              ? `${PROVIDER_LABEL[chat?.provider] || "AI"} · ${chat?.model || ""}`
              : "Send this memory to a live AI"}
          </DialogTitle>
          <DialogDescription className="mt-1 text-xs text-muted-foreground">
            {view === "chat"
              ? `${projectTitle} — the AI already has your full project context.`
              : "Pick a target AI. It receives the memory package directly and picks up the project instantly."}
          </DialogDescription>
        </DialogHeader>

        {view === "setup" ? (
          <div className="space-y-5 overflow-y-auto p-6">
            {existing.length > 0 && (
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.15em] text-muted-foreground">Resume a conversation</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {existing.map((h) => (
                    <button
                      key={h.id}
                      data-testid={`handoff-resume-${h.id}`}
                      onClick={() => resume(h.id)}
                      className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-xs transition-colors hover:border-foreground/40"
                    >
                      <Sparkles className="h-3 w-3 text-brand" />
                      {PROVIDER_LABEL[h.provider]} · {h.model}
                      <span className="text-muted-foreground/70">({h.messages.filter((m) => !m.seed).length})</span>
                    </button>
                  ))}
                </div>
                <div className="mt-5 h-px bg-border" />
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="font-mono text-xs uppercase tracking-[0.15em] text-muted-foreground">Target AI</label>
                <Select value={provider} onValueChange={onProviderChange}>
                  <SelectTrigger data-testid="handoff-provider-select" className="mt-2 bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PROVIDERS.map((p) => (
                      <SelectItem key={p.v} value={p.v} data-testid={`handoff-provider-${p.v}`}>{p.l}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="font-mono text-xs uppercase tracking-[0.15em] text-muted-foreground">Model</label>
                <Select value={model} onValueChange={setModel}>
                  <SelectTrigger data-testid="handoff-model-select" className="mt-2 bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MODELS[provider].map((m) => (
                      <SelectItem key={m.v} value={m.v} data-testid={`handoff-model-${m.v}`}>{m.l}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="rounded-md border border-border bg-card p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <KeyRound className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Use my own API key</span>
                </div>
                <Switch data-testid="handoff-byok-toggle" checked={useOwnKey} onCheckedChange={setUseOwnKey} />
              </div>
              {useOwnKey ? (
                <div className="mt-3">
                  <input
                    data-testid="handoff-apikey-input"
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder={`Your ${PROVIDER_LABEL[provider]} API key (sk-… )`}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-sm outline-none focus:border-foreground focus:ring-1 focus:ring-ring"
                  />
                  <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <ShieldCheck className="h-3.5 w-3.5" /> Sent directly to the provider for this request. Never stored.
                  </p>
                </div>
              ) : (
                <p className="mt-2 text-xs text-muted-foreground">
                  Uses the built-in engine credits. Toggle on to route through your own provider key.
                </p>
              )}
            </div>

            <button
              data-testid="handoff-start-btn"
              onClick={startHandoff}
              disabled={starting}
              className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-foreground px-6 py-3 text-sm font-medium text-background transition-colors hover:bg-foreground/90 disabled:opacity-40"
            >
              {starting ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Delivering context to {PROVIDER_LABEL[provider]}…</>
              ) : (
                <><Plug className="h-4 w-4" /> Send package &amp; start</>
              )}
            </button>
          </div>
        ) : (
          <>
            <div ref={scrollRef} data-testid="handoff-chat-messages" className="flex-1 space-y-4 overflow-y-auto p-6">
              {chat?.messages.map((m, i) => (
                <MessageBubble key={i} m={m} />
              ))}
              {sending && (
                <div className="flex justify-start">
                  <div className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin text-brand" /> Thinking…
                  </div>
                </div>
              )}
            </div>
            <div className="border-t border-border p-4">
              <div className="flex items-end gap-2">
                <textarea
                  data-testid="handoff-message-input"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
                  }}
                  rows={1}
                  placeholder={`Continue the project with ${PROVIDER_LABEL[chat?.provider] || "the AI"}…`}
                  className="max-h-32 min-h-[44px] flex-1 resize-none rounded-md border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-foreground focus:ring-1 focus:ring-ring"
                />
                <button
                  data-testid="handoff-send-btn"
                  onClick={sendMessage}
                  disabled={sending || !input.trim()}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-md bg-foreground text-background transition-colors hover:bg-foreground/90 disabled:opacity-40"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
