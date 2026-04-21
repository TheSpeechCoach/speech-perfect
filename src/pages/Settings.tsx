import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { LogOut, Trash2, CreditCard, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Settings() {
  const { user, signOut } = useAuth();
  const nav = useNavigate();
  const [profile, setProfile] = useState<any>({ full_name: "", role: "" });
  const [sub, setSub] = useState<any>(null);
  const [notif, setNotif] = useState({ daily: true, weekly: true });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
      supabase.from("subscriptions").select("*").eq("user_id", user.id).maybeSingle(),
    ]).then(([{ data: p }, { data: s }]) => { setProfile(p || {}); setSub(s); });
  }, [user]);

  async function save() {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update({
      full_name: profile.full_name, role: profile.role, updated_at: new Date().toISOString(),
    }).eq("id", user.id);
    setSaving(false);
    if (error) toast.error(error.message); else toast.success("Saved");
  }

  async function deleteAccount() {
    if (!user) return;
    if (!confirm("Delete your account and all training data? This cannot be undone.")) return;
    // Best-effort client cleanup; full deletion ideally via edge function with service role
    await supabase.from("session_scores").delete().eq("user_id", user.id);
    await supabase.from("session_exercises").delete().eq("user_id", user.id);
    await supabase.from("sessions").delete().eq("user_id", user.id);
    await supabase.from("user_programmes").delete().eq("user_id", user.id);
    await supabase.from("streaks").delete().eq("user_id", user.id);
    await supabase.from("subscriptions").delete().eq("user_id", user.id);
    await supabase.from("profiles").delete().eq("id", user.id);
    await supabase.auth.signOut();
    toast.success("Data wiped. Sign back in to recreate your account.");
    nav("/");
  }

  const isPro = sub?.tier === "pro";

  return (
    <AppLayout>
      <div className="container-page py-10 md:py-14 max-w-3xl space-y-12">
        <div>
          <div className="eyebrow">Settings</div>
          <h1 className="font-display text-4xl md:text-5xl mt-2">Profile & billing.</h1>
        </div>

        {/* Profile */}
        <section className="card-flat p-8 space-y-5">
          <h2 className="font-display text-2xl">Profile</h2>
          <div className="space-y-1.5">
            <Label className="eyebrow">Email</Label>
            <Input value={user?.email || ""} disabled className="h-12 rounded-none" />
          </div>
          <div className="space-y-1.5">
            <Label className="eyebrow">Full name</Label>
            <Input value={profile?.full_name || ""} onChange={e => setProfile((p: any) => ({ ...p, full_name: e.target.value }))} className="h-12 rounded-none" />
          </div>
          <div className="space-y-1.5">
            <Label className="eyebrow">Role</Label>
            <Input value={profile?.role || ""} onChange={e => setProfile((p: any) => ({ ...p, role: e.target.value }))} className="h-12 rounded-none" />
          </div>
          <button onClick={save} disabled={saving} className="px-5 py-3 bg-foreground text-background hover:bg-accent transition-colors disabled:opacity-60">
            {saving ? "Saving…" : "Save changes"}
          </button>
        </section>

        {/* Billing */}
        <section className="card-flat p-8">
          <div className="flex items-baseline justify-between">
            <h2 className="font-display text-2xl">Subscription</h2>
            <span className={cn("font-mono text-[10px] uppercase tracking-widest px-2 py-1",
              isPro ? "bg-accent text-background" : "bg-[hsl(var(--surface-2))] text-muted-foreground")}>
              {isPro ? "Pro" : "Free"}
            </span>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            {isPro ? "Pro plan active. Manage billing through your Stripe portal." : "Upgrade to unlock unlimited sessions, all programmes, and full analytics history."}
          </p>
          <div className="mt-6 grid sm:grid-cols-2 gap-3 text-sm">
            {["Unlimited sessions", "All programmes", "Full analytics history", "Recording history"].map(f => (
              <div key={f} className="flex gap-2"><Check className="h-4 w-4 mt-0.5" />{f}</div>
            ))}
          </div>
          <div className="mt-6 flex gap-3">
            <button disabled className="inline-flex items-center gap-2 px-5 py-3 bg-foreground text-background hover:bg-accent transition-colors disabled:opacity-60">
              <CreditCard className="h-4 w-4" /> {isPro ? "Manage billing" : "Upgrade to Pro"}
            </button>
            <span className="text-xs text-muted-foreground self-center">Stripe checkout coming soon</span>
          </div>
        </section>

        {/* Notifications */}
        <section className="card-flat p-8 space-y-5">
          <h2 className="font-display text-2xl">Notifications</h2>
          <Row label="Daily training reminder" sub="One nudge a day, at the time you typically train." value={notif.daily} onChange={v => setNotif(n => ({ ...n, daily: v }))} />
          <Row label="Weekly progress recap" sub="A summary of last week's scores and trends." value={notif.weekly} onChange={v => setNotif(n => ({ ...n, weekly: v }))} />
        </section>

        {/* Danger */}
        <section className="card-flat p-8 border-accent/40">
          <h2 className="font-display text-2xl">Danger zone</h2>
          <div className="mt-4 flex flex-col sm:flex-row gap-3">
            <button onClick={async () => { await signOut(); nav("/"); }} className="inline-flex items-center gap-2 px-5 py-3 border border-foreground hover:bg-foreground hover:text-background transition-colors">
              <LogOut className="h-4 w-4" /> Log out
            </button>
            <button onClick={deleteAccount} className="inline-flex items-center gap-2 px-5 py-3 bg-accent text-background hover:bg-accent/90">
              <Trash2 className="h-4 w-4" /> Delete account
            </button>
          </div>
        </section>
      </div>
    </AppLayout>
  );
}

function Row({ label, sub, value, onChange }: { label: string; sub: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <div className="text-sm font-medium">{label}</div>
        <div className="text-xs text-muted-foreground">{sub}</div>
      </div>
      <Switch checked={value} onCheckedChange={onChange} />
    </div>
  );
}
