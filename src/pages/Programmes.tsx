import { useEffect, useState } from "react";
import AppLayout from "@/components/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Check, ArrowRight } from "lucide-react";
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
    // deactivate others
    await supabase.from("user_programmes").update({ active: false }).eq("user_id", user.id).neq("programme_id", programmeId);
    toast.success("Programme set");
    load();
  }

  return (
    <AppLayout>
      <div className="container-page py-10 md:py-14 space-y-10">
        <div>
          <div className="eyebrow">Programmes</div>
          <h1 className="font-display text-4xl md:text-5xl mt-2">Pick a target. Train against it.</h1>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {programmes.map(p => {
            const up = ups.find(u => u.programme_id === p.id);
            const total = (p.weeks || 4) * 7;
            const completed = up?.completed_sessions || 0;
            const pct = Math.min(100, Math.round((completed / total) * 100));
            const isCurrent = profile?.current_programme_id === p.id;
            return (
              <div key={p.id} className={cn("p-7 border", isCurrent ? "border-foreground bg-foreground text-background" : "card-flat")}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className={cn("eyebrow", isCurrent && "text-background/60")}>
                      {p.weeks} weeks · {p.daily_sessions}× daily
                    </div>
                    <h3 className="font-display text-3xl mt-2">{p.title}</h3>
                  </div>
                  {isCurrent && <span className="font-mono text-[10px] uppercase tracking-widest text-accent bg-background px-2 py-1">Active</span>}
                </div>
                <p className={cn("mt-3 text-sm", isCurrent ? "text-background/70" : "text-muted-foreground")}>{p.description}</p>
                <ul className="mt-5 space-y-1.5 text-sm">
                  {p.target_outcomes?.map((o: string) => (
                    <li key={o} className="flex gap-2"><Check className={cn("h-4 w-4 mt-0.5 shrink-0", isCurrent ? "text-accent" : "text-foreground")} />{o}</li>
                  ))}
                </ul>
                <div className="mt-6">
                  <div className="flex items-baseline justify-between font-mono text-[11px] uppercase tracking-widest opacity-70">
                    <span>{completed} / {total}</span>
                    <span>{pct}%</span>
                  </div>
                  <div className={cn("mt-2 h-1", isCurrent ? "bg-background/20" : "bg-[hsl(var(--hairline))]")}>
                    <div className={cn("h-full", isCurrent ? "bg-accent" : "bg-foreground")} style={{ width: `${pct}%` }} />
                  </div>
                </div>
                <button
                  onClick={() => setActive(p.id)}
                  disabled={isCurrent}
                  className={cn(
                    "mt-6 inline-flex items-center gap-2 px-5 py-3 transition-colors",
                    isCurrent
                      ? "bg-background/10 text-background/60 cursor-default"
                      : "bg-foreground text-background hover:bg-accent"
                  )}>
                  {isCurrent ? "Currently active" : "Make active"} {!isCurrent && <ArrowRight className="h-4 w-4" />}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </AppLayout>
  );
}
