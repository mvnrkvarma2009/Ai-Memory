import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";
import { BrainCircuit } from "lucide-react";

export default function AuthCallback() {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const hasProcessed = useRef(false);

  useEffect(() => {
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const params = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const sessionId = params.get("session_id");
    if (!sessionId) {
      navigate("/login", { replace: true });
      return;
    }

    (async () => {
      try {
        const res = await api.post(
          "/auth/session",
          {},
          { headers: { "X-Session-ID": sessionId } }
        );
        setUser(res.data);
        navigate("/dashboard", { state: { user: res.data }, replace: true });
      } catch (e) {
        navigate("/login", { replace: true });
      }
    })();
  }, [navigate, setUser]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background" data-testid="auth-callback">
      <div className="flex flex-col items-center gap-4">
        <BrainCircuit className="h-8 w-8 animate-pulse text-brand" />
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
          Establishing memory link…
        </p>
      </div>
    </div>
  );
}
