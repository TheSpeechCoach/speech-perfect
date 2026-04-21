import { NavLink, Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { LayoutDashboard, Mic, LineChart, Layers, Settings, LogOut, Menu, X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const nav = [
  { to: "/app", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/app/session", label: "Session", icon: Mic },
  { to: "/app/progress", label: "Progress", icon: LineChart },
  { to: "/app/programmes", label: "Programmes", icon: Layers },
  { to: "/app/settings", label: "Settings", icon: Settings },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col md:flex-row">
      {/* Mobile bar */}
      <div className="md:hidden flex items-center justify-between px-5 py-4 hairline">
        <Link to="/app" className="font-display text-2xl tracking-tight">SpeechOS</Link>
        <button onClick={() => setOpen(!open)} aria-label="Menu" className="p-2 -mr-2">
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Sidebar */}
      <aside className={cn(
        "md:w-60 md:min-h-screen md:border-r md:border-[hsl(var(--hairline))] md:bg-[hsl(var(--surface))] md:flex md:flex-col",
        open ? "block border-b border-[hsl(var(--hairline))]" : "hidden md:flex"
      )}>
        <div className="hidden md:flex items-center px-6 py-7">
          <Link to="/app" className="font-display text-2xl tracking-tight">SpeechOS</Link>
          <span className="ml-2 mt-2 inline-block h-1.5 w-1.5 rounded-full bg-accent" />
        </div>
        <nav className="flex-1 px-2 py-3 md:px-3 space-y-0.5">
          {nav.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to} to={to} end={end}
              onClick={() => setOpen(false)}
              className={({ isActive }) => cn(
                "flex items-center gap-3 px-3 py-2.5 text-sm rounded-sm transition-colors",
                "hover:bg-[hsl(var(--surface-2))]",
                isActive && "bg-foreground text-background hover:bg-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              <span className="font-medium">{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="px-3 pb-5 hidden md:block">
          <button
            onClick={async () => { await signOut(); navigate("/"); }}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <LogOut className="h-4 w-4" /> Log out
          </button>
        </div>
      </aside>

      <main className="flex-1 min-w-0">{children}</main>
    </div>
  );
}
