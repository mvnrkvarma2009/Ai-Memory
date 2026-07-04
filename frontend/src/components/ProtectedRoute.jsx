import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { BrainCircuit } from "lucide-react";

function FullScreenLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background" data-testid="auth-loading">
      <div className="flex flex-col items-center gap-4">
        <BrainCircuit className="h-8 w-8 animate-pulse text-brand" />
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
          Verifying session…
        </p>
      </div>
    </div>
  );
}

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <FullScreenLoader />;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}
