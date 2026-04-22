import { useEffect, useState } from "react";
import AppLayout from "@/components/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function Programmes() {
  const { user } = useAuth();
  const [programmes, setProgrammes] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [ups, setUps] = useState<any[]>([]);

  async function load() {
    const [{ data: ps }, { data: p }, { data: u }] = await Promise.all([
      supabase.from("programmes").select("*").order("sort_order"),
      supabase.from("profiles").select("current_programme_id").eq("id", user!.id).maybeSingle(),
      supabase.from("user_programmes").select("*").eq("user_id", user!.id),
    ]);
    setProgrammes(ps || []); setProfile(p); setUps(u || []);
  }

  useEffect(() => { if (user) load(); /* eslint-disable-next-line */ }, [user]);

  async function setActive(programmeId: string) {
    if (!user) return;
    await supabase.from("profiles").update({ current_programme_id: programmeId, updated_at: new Date().toISOString() }).eq("id", user.id);
    const existing = ups.find(u => u.programme_id === programmeId);
    if (!existing) await supabase.from("user_programmes").insert({ user_id: user.id, programme_id: programmeId, active: true });
    else await supabase.from("user_programmes").update({ active: true }).eq("id", existing.id);
    await supabase.from("user_programmes").update({ active: false }).eq("user_id", user.id).neq("programme_id", programmeId);
    toast.success("Programme set");
    load();
  }

  return (
    <AppLayout>
      <div className="container-page py-12 md:py-20 space-y-12 md:space-y-16">
        <header className="space-y-3">
          <div className="eyebrow">Programmes</div>
          <h1 className="font-display text-[clamp(2rem,5vw,3.5rem)] leading-[1.05] tracking-tight max-w-2xl">
            Pick a target. Train against it.
          </h1>
        </header>

        <ul className="border-t border-[hsl(var(--hairline))]">
          {programmes.map(p => {
            const up = ups.find(u => u.programme_id === p.id);
            const total = (p.weeks || 4) * 7;
            const completed = up?.completed_sessions || 0;
            const pct = Math.min(100, Math.round((completed / total) * 100));
            const isCurrent = profile?.current_programme_id === p.id;
            return (
              <li key={p.id} className="border-b border-[hsl(var(--hairline))]">
                <div className="grid md:grid-cols-12 gap-6 md:gap-10 py-8 md:py-12 items-start">
                  <div className="md:col-span-3 space-y-2">
                    <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                      {p.weeks} wk · {p.daily_sessions}× daily
                    </div>
                    {isCurrent && (
                      <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-accent">
                        ● Active
                      </div>
                    )}
                  </div>
                  <div className="md:col-span-6 space-y-4">
                    <h3 className="font-display text-2xl md:text-3xl leading-tight">{p.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{p.description}</p>
                    <ul className="grid sm:grid-cols-2 gap-x-6 gap-y-1.5 text-sm">
                      {p.target_outcomes?.map((o: string) => (
                        <li key={o} className="flex gap-2">
                          <span className="font-mono text-muted-foreground">—</span>
                          <span>{o}</span>
                        </li>
                      ))}
                    </ul>
                    {isCurrent && (
                      <div className="pt-2 space-y-2">
                        <div className="flex items-baseline justify-between font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                          <span>{completed} / {total}</span>
                          <span>{pct}%</span>
                        </div>
                        <div className="h-px bg-[hsl(var(--hairline))] relative">
                          <div className="absolute inset-y-0 left-0 h-px bg-foreground" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="md:col-span-3 md:flex md:justify-end">
                    <button
                      onClick={() => setActive(p.id)}
                      disabled={isCurrent}
                      className={cn(
                        "inline-flex items-center gap-2 px-5 py-3 transition-colors text-sm font-medium whitespace-nowrap",
                        isCurrent
                          ? "text-muted-foreground cursor-default"
                          : "bg-foreground text-background hover:bg-accent hover:text-accent-foreground"
                      )}>
                      {isCurrent ? "Currently active" : <>Make active <ArrowRight className="h-4 w-4" /></>}
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </AppLayout>
  );
}
