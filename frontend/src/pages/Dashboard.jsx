import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { toast } from "sonner";
import {
  BrainCircuit, Plus, Trash2, LogOut, Loader2, ArrowRight, History, PanelLeft,
} from "lucide-react";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { ThemeToggle } from "@/components/ThemeToggle";
import Workspace from "@/components/Workspace";
import MemoryPackageViewer from "@/components/MemoryPackageViewer";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function HistorySidebar({ packages, activeId, onNew, onDelete, navigate }) {
  return (
    <div className="flex h-full flex-col">
      <button
        data-testid="new-memory-btn"
        onClick={onNew}
        className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-foreground px-4 py-2.5 text-sm font-medium text-background transition-colors hover:bg-foreground/90"
      >
        <Plus className="h-4 w-4" /> New memory
      </button>

      <div className="mt-6 flex items-center gap-2 px-1">
        <History className="h-3.5 w-3.5 text-muted-foreground" />
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">History</p>
        <span className="ml-auto font-mono text-xs text-muted-foreground/60">{packages.length}</span>
      </div>

      <div className="mt-3 flex-1 space-y-2 overflow-y-auto pr-1" data-testid="history-list">
        {packages.length === 0 && (
          <p className="px-1 py-4 text-xs leading-relaxed text-muted-foreground">
            No packages yet. Generate your first memory package to see it here.
          </p>
        )}
        {packages.map((p) => (
          <div
            key={p.id}
            data-testid={`history-item-${p.id}`}
            onClick={() => navigate(`/dashboard/${p.id}`)}
            className={`group cursor-pointer rounded-md border p-3 transition-colors ${
              activeId === p.id ? "border-brand/60 bg-accent" : "border-border bg-card hover:border-foreground/30"
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <p className="line-clamp-1 text-sm font-medium">{p.project_title}</p>
              <button
                data-testid={`delete-item-${p.id}`}
                onClick={(e) => { e.stopPropagation(); onDelete(p.id); }}
                className="opacity-0 transition-opacity group-hover:opacity-100"
                aria-label="Delete package"
              >
                <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
              </button>
            </div>
            <div className="mt-1.5 flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground">
              <span>{p.source_ai}</span>
              <ArrowRight className="h-2.5 w-2.5 text-brand" />
              <span>{p.target_ai}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [packages, setPackages] = useState([]);
  const [activeItem, setActiveItem] = useState(null);
  const [loadingItem, setLoadingItem] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const deletedIds = useRef(new Set());

  const fetchList = useCallback(async () => {
    try {
      const res = await api.get("/memory");
      setPackages(res.data);
    } catch (e) {
      // 401 is expected pre-auth and handled by ProtectedRoute; log anything else.
      if (e?.response?.status !== 401) console.error("Failed to load memory packages", e);
    }
  }, []);

  useEffect(() => { fetchList(); }, [fetchList]);

  useEffect(() => {
    if (!id || deletedIds.current.has(id)) {
      setActiveItem(null);
      setLoadingItem(false);
      return;
    }
    const found = packages.find((p) => p.id === id);
    if (found) {
      setActiveItem(found);
      setLoadingItem(false);
      return;
    }
    // Not in the local cache (direct link / hard reload) -> fetch it.
    let cancelled = false;
    setLoadingItem(true);
    (async () => {
      try {
        const res = await api.get(`/memory/${id}`);
        if (!cancelled) setActiveItem(res.data);
      } catch (e) {
        if (!cancelled) {
          if (e?.response?.status !== 404) console.error("Failed to load package", e);
          toast.error("Package not found");
          navigate("/dashboard", { replace: true });
        }
      } finally {
        // Always clear the spinner, even if this run was superseded, so it can never stick.
        setLoadingItem(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id, packages, navigate]);

  const onGenerated = (pkg) => {
    deletedIds.current.delete(pkg.id);
    setPackages((prev) => [pkg, ...prev.filter((p) => p.id !== pkg.id)]);
    navigate(`/dashboard/${pkg.id}`);
  };

  const onDelete = async (pkgId) => {
    try {
      await api.delete(`/memory/${pkgId}`);
      // Guard the id-effect so it never tries to refetch a just-deleted package.
      deletedIds.current.add(pkgId);
      if (id === pkgId) { setActiveItem(null); navigate("/dashboard", { replace: true }); }
      setPackages((prev) => prev.filter((p) => p.id !== pkgId));
      toast.success("Package deleted");
    } catch (e) {
      console.error("Delete failed", e);
      toast.error("Delete failed");
    }
  };

  const onNew = () => { setSidebarOpen(false); navigate("/dashboard"); };

  const handleLogout = async () => {
    // Navigate to a public route first so ProtectedRoute doesn't win the race to /login.
    navigate("/", { replace: true });
    await logout();
  };

  const initials = (user?.name || user?.email || "U").slice(0, 1).toUpperCase();

  const renderMain = () => {
    if (loadingItem) {
      return (
        <div className="flex h-64 items-center justify-center rounded-md border border-border bg-card" data-testid="item-loading">
          <Loader2 className="h-5 w-5 animate-spin text-brand" />
        </div>
      );
    }
    if (activeItem) return <MemoryPackageViewer item={activeItem} />;
    return <Workspace onGenerated={onGenerated} />;
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top bar */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/70 backdrop-blur-xl">
        <div className="flex h-16 items-center justify-between px-4 md:px-8">
          <div className="flex items-center gap-3">
            <button
              data-testid="mobile-sidebar-toggle"
              onClick={() => setSidebarOpen((v) => !v)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border text-muted-foreground lg:hidden"
              aria-label="Toggle history"
            >
              <PanelLeft className="h-4 w-4" />
            </button>
            <Link to="/" className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-md border border-border bg-card">
                <BrainCircuit className="h-4 w-4 text-brand" />
              </div>
              <span className="font-mono text-base font-semibold tracking-tight">AI&nbsp;Memory</span>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button data-testid="user-menu-btn" className="flex items-center gap-2 rounded-md border border-border px-2 py-1.5 transition-colors hover:border-foreground/40">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={user?.picture} alt={user?.name} />
                    <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                  </Avatar>
                  <span className="hidden max-w-[140px] truncate text-sm md:inline">{user?.name || user?.email}</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <p className="text-sm font-medium">{user?.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem data-testid="logout-btn" onClick={handleLogout} className="cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" /> Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 md:px-8 lg:grid-cols-[300px_1fr]">
        {/* Sidebar (desktop) */}
        <aside className="hidden lg:block">
          <div className="sticky top-24 h-[calc(100vh-8rem)]">
            <HistorySidebar packages={packages} activeId={id} onNew={onNew} onDelete={onDelete} navigate={navigate} />
          </div>
        </aside>

        {/* Sidebar (mobile) */}
        {sidebarOpen && (
          <div className="lg:hidden">
            <div className="rounded-md border border-border bg-card p-4">
              <HistorySidebar
                packages={packages}
                activeId={id}
                onNew={onNew}
                onDelete={onDelete}
                navigate={(to) => { setSidebarOpen(false); navigate(to); }}
              />
            </div>
          </div>
        )}

        {/* Main */}
        <main className="min-w-0">
          {renderMain()}
        </main>
      </div>
    </div>
  );
}
