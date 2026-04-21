import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ArrowRight, Check } from "lucide-react";
import { cn } from "@/lib/utils";

const SCENARIOS = ["Team meetings", "Client pitches", "Interviews", "Public speaking", "Investor updates", "Sales calls", "Podcasts", "Internal announcements"];
const GOALS = ["Sound more confident", "Be more concise", "Cut filler words", "Speak under pressure", "Pitch better"];

export default function Onboarding() {
  const { user, loading } = useAuth();
  const nav = useNavigate();
  const [step, setStep] = useState(0);
  const [programmes, setProgrammes] = useState<any[]>([]);
  const [form, setForm] = useState({
    fullName: "", role: "", goal: GOALS[0], confidence: 5,
    scenarios: [] as string[], programmeId: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) { nav("/auth/sign-in"); return; }
    supabase.from("programmes").select("*").order("sort_order").then(({ data }) => {
      setProgrammes(data || []);
      setForm(f => ({ ...f, programmeId: data?.[0]?.id || "" }));
    });
    supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle().then(({ data }) => {
      if (data?.full_name) setForm(f => ({ ...f, fullName: data.full_name }));
    });
  }, [user, loading, nav]);

  function toggleScenario(s: string) {
    setForm(f => ({ ...f, scenarios: f.scenarios.includes(s) ? f.scenarios.filter(x => x !== s) : [...f.scenarios, s] }));
  }

  async function complete() {
    if (!user) return;
    setSaving(true);
    const { error: pErr } = await supabase.from("profiles").update({
      full_name: form.fullName, role: form.role, goal: form.goal,
      confidence_level: form.confidence, scenarios: form.scenarios,
      current_programme_id: form.programmeId, onboarded: true,
      updated_at: new Date().toISOString(),
    }).eq("id", user.id);
    if (pErr) { toast.error(pErr.message); setSaving(false); return; }
    if (form.programmeId) {
      await supabase.from("user_programmes").insert({ user_id: user.id, programme_id: form.programmeId, active: true });
    }
    setSaving(false);
    nav("/app");
  }

  const steps = ["You", "Goal", "Scenarios", "Programme"];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container-page py-10 max-w-3xl">
        <div className="flex items-center justify-between mb-12">
          <div className="font-display text-2xl">SpeechOS</div>
          <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Step {step + 1} / {steps.length}</div>
        </div>

        <div className="grid grid-cols-4 gap-2 mb-12">
          {steps.map((s, i) => (
            <div key={s}>
              <div className={cn("h-0.5 mb-2", i <= step ? "bg-foreground" : "bg-[hsl(var(--hairline))]")} />
              <div className={cn("eyebrow", i <= step ? "text-foreground" : "text-muted-foreground")}>{s}</div>
            </div>
          ))}
        </div>

        {step === 0 && (
          <div className="space-y-6 animate-fade-in">
            <h1 className="font-display text-5xl">Tell us who's training.</h1>
            <div className="space-y-1.5">
              <Label className="eyebrow">Full name</Label>
              <Input value={form.fullName} onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))} className="h-12 rounded-none border-x-0 border-t-0" />
            </div>
            <div className="space-y-1.5">
              <Label className="eyebrow">Role / profession</Label>
              <Input placeholder="e.g. Product Manager" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} className="h-12 rounded-none border-x-0 border-t-0" />
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-8 animate-fade-in">
            <h1 className="font-display text-5xl">What's the goal?</h1>
            <div className="grid sm:grid-cols-2 gap-3">
              {GOALS.map(g => (
                <button key={g} onClick={() => setForm(f => ({ ...f, goal: g }))}
                  className={cn("text-left px-5 py-4 border transition-colors", form.goal === g ? "border-foreground bg-foreground text-background" : "border-[hsl(var(--hairline))] hover:border-foreground")}>
                  {g}
                </button>
              ))}
            </div>
            <div className="space-y-2">
              <Label className="eyebrow">Current confidence (1–10)</Label>
              <input type="range" min={1} max={10} value={form.confidence}
                onChange={e => setForm(f => ({ ...f, confidence: +e.target.value }))}
                className="w-full accent-[hsl(var(--accent))]" />
              <div className="font-mono text-xs text-muted-foreground">{form.confidence} / 10</div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 animate-fade-in">
            <h1 className="font-display text-5xl">Where do you speak?</h1>
            <p className="text-muted-foreground">Pick all that apply.</p>
            <div className="flex flex-wrap gap-2">
              {SCENARIOS.map(s => {
                const on = form.scenarios.includes(s);
                return (
                  <button key={s} onClick={() => toggleScenario(s)}
                    className={cn("px-4 py-2.5 border text-sm transition-colors", on ? "border-foreground bg-foreground text-background" : "border-[hsl(var(--hairline))] hover:border-foreground")}>
                    {on && <Check className="inline h-3.5 w-3.5 mr-1.5" />}
                    {s}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6 animate-fade-in">
            <h1 className="font-display text-5xl">Pick a starting programme.</h1>
            <div className="grid gap-3">
              {programmes.map(p => {
                const on = form.programmeId === p.id;
                return (
                  <button key={p.id} onClick={() => setForm(f => ({ ...f, programmeId: p.id }))}
                    className={cn("text-left p-5 border transition-colors", on ? "border-foreground bg-foreground text-background" : "border-[hsl(var(--hairline))] hover:border-foreground")}>
                    <div className="flex items-baseline justify-between gap-4">
                      <div className="font-display text-2xl">{p.title}</div>
                      <div className={cn("font-mono text-xs", on ? "text-background/60" : "text-muted-foreground")}>{p.weeks}w · daily</div>
                    </div>
                    <p className={cn("mt-2 text-sm", on ? "text-background/70" : "text-muted-foreground")}>{p.description}</p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="mt-12 flex justify-between">
          <button onClick={() => setStep(s => Math.max(0, s - 1))} disabled={step === 0}
            className="px-5 py-3 text-sm text-muted-foreground hover:text-foreground disabled:opacity-30">Back</button>
          {step < steps.length - 1 ? (
            <button onClick={() => setStep(s => s + 1)} className="inline-flex items-center gap-2 px-6 py-3 bg-foreground text-background hover:bg-accent transition-colors">
              Continue <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <button onClick={complete} disabled={saving} className="inline-flex items-center gap-2 px-6 py-3 bg-accent text-background hover:bg-accent/90 transition-colors disabled:opacity-60">
              {saving ? "Saving…" : "Begin training"} <ArrowRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
