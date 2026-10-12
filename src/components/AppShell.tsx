import { useState, useEffect, type ReactNode } from "react";
import {
  LayoutDashboard,
  FlaskConical,
  ScrollText,
  CheckSquare,
  FileClock,
  BookOpen,
  Shield,
  CircleDot,
} from "lucide-react";
import type { Route } from "@/lib/router";
import { api, type HealthStatus } from "@/lib/api";

const navItems: { route: Route; label: string; icon: typeof Shield }[] = [
  { route: "overview", label: "Overview", icon: LayoutDashboard },
  { route: "tester", label: "Permission Tester", icon: FlaskConical },
  { route: "policy", label: "Policy Rules", icon: ScrollText },
  { route: "approvals", label: "Approval Center", icon: CheckSquare },
  { route: "audit", label: "Audit Logs", icon: FileClock },
  { route: "docs", label: "Documentation", icon: BookOpen },
];

const pageInfo: Record<Route, { title: string; description: string }> = {
  overview: {
    title: "Overview",
    description: "Operational summary of permission decisions and security events",
  },
  tester: {
    title: "Permission Tester",
    description: "Execute actions and inspect enforcement decisions in real time",
  },
  policy: {
    title: "Policy Rules",
    description: "Declarative permission rules governing each registered action",
  },
  approvals: {
    title: "Approval Center",
    description: "Review and resolve pending approval requests",
  },
  audit: {
    title: "Audit Logs",
    description: "Chronological record of permission checks and execution outcomes",
  },
  docs: {
    title: "Documentation",
    description: "Developer guide for integrating Sentinel Guard",
  },
};

export function AppShell({
  route,
  navigate,
  children,
}: {
  route: Route;
  navigate: (r: Route) => void;
  children: ReactNode;
}) {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    let mounted = true;
    const check = () => {
      api.health().then(
        (h) => mounted && setHealth(h),
        () => mounted && setHealth({ status: "error" })
      );
    };
    check();
    const interval = setInterval(check, 10000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  const info = pageInfo[route];
  const connected = health?.status === "ok";

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0 fixed lg:sticky top-0 left-0 z-40 h-screen w-60 shrink-0 border-r border-zinc-800/80 bg-zinc-950 transition-transform duration-200 flex flex-col`}
      >
        <div className="flex items-center gap-2.5 px-5 h-14 border-b border-zinc-800/80">
          <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-indigo-600/20 border border-indigo-500/30">
            <Shield size={16} className="text-indigo-400" />
          </div>
          <div>
            <h1 className="text-sm font-semibold tracking-tight">Sentinel Guard</h1>
            <p className="text-[10px] text-zinc-500 leading-none mt-0.5">Permission Engine</p>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = route === item.route;
            return (
              <button
                key={item.route}
                onClick={() => {
                  navigate(item.route);
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40 ${
                  active
                    ? "bg-indigo-600/10 text-indigo-300 border border-indigo-500/20"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40 border border-transparent"
                }`}
              >
                <Icon size={16} className={active ? "text-indigo-400" : ""} />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="px-5 py-3 border-t border-zinc-800/80">
          <div className="flex items-center gap-2 text-[10px] text-zinc-500">
            <CircleDot size={10} className={connected ? "text-emerald-400" : "text-red-400"} />
            <span>v0.1.0 · Demo Environment</span>
          </div>
        </div>
      </aside>

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="sticky top-0 z-20 h-14 border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-sm flex items-center px-5 lg:px-8 gap-4">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-zinc-400 hover:text-zinc-200"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-semibold tracking-tight truncate">{info.title}</h2>
            <p className="text-xs text-zinc-500 truncate hidden sm:block">{info.description}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs ${
                connected
                  ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-400"
                  : "border-red-500/20 bg-red-500/5 text-red-400"
              }`}
            >
              <CircleDot size={8} className={connected ? "animate-pulse" : ""} />
              <span className="hidden sm:inline">{connected ? "Connected" : "Disconnected"}</span>
            </div>
          </div>
        </header>

        <main className="flex-1 px-5 lg:px-8 py-6 lg:py-8 max-w-6xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
