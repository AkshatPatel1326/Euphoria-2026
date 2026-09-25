import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { ShieldAlert, RefreshCw, ExternalLink, LogOut, Sparkles } from "lucide-react";
import { useNavigate } from "react-router";

interface AdminHeaderProps {
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export function AdminHeader({ onRefresh, isRefreshing = false }: AdminHeaderProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = () => {
    logout();
    navigate("/");
  };

  const isAdmin = user?.role === "ADMIN";

  return (
    <header className="border-b border-white/[0.08] bg-[#120d24]/90 backdrop-blur-md sticky top-0 z-30 px-4 sm:px-6 py-3.5 shadow-md shadow-black/20">
      <div className="mx-auto flex max-w-7xl flex-col gap-3.5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-euphoria-purple to-euphoria-plum text-white border border-euphoria-purple/40 shadow-sm shadow-euphoria-purple/20">
            <Sparkles className="size-5" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white">
                Euphoria Admin Portal
              </h1>
              <Badge
                variant={isAdmin ? "default" : "secondary"}
                className={`text-[11px] font-semibold tracking-wide rounded-full px-2 py-0.5 ${
                  isAdmin
                    ? "bg-euphoria-purple/25 text-euphoria-aqua border border-euphoria-purple/40 shadow-xs"
                    : "bg-white/[0.08] text-white/80 border border-white/[0.12]"
                }`}
              >
                {user?.role || "PORTAL"}
              </Badge>
            </div>
            <p className="text-xs text-white/60 mt-0.5">
              Logged in as <span className="font-medium text-white/90">{user?.email}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          {onRefresh && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={isRefreshing}
              className="gap-1.5 text-xs h-8 bg-white/[0.04] border-white/[0.12] text-white/85 hover:bg-white/[0.08] hover:text-white transition-colors"
            >
              <RefreshCw className={`size-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          )}

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => navigate("/")}
            className="gap-1.5 text-xs h-8 text-white/70 hover:text-white hover:bg-white/[0.06] transition-colors"
          >
            <ExternalLink className="size-3.5" />
            Website
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleSignOut}
            className="gap-1.5 text-xs h-8 text-rose-300 border-rose-500/30 hover:bg-rose-500/15 hover:text-rose-200 transition-colors"
          >
            <LogOut className="size-3.5" />
            Sign out
          </Button>
        </div>
      </div>
    </header>
  );
}
