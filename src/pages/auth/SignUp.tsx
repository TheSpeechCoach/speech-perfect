import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import AuthShell from "@/components/AuthShell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const schema = z.object({
  fullName: z.string().trim().min(2, "Name too short").max(80),
  email: z.string().trim().email().max(255),
  password: z.string().min(8, "8+ characters").max(72),
});

export default function SignUp() {
  const nav = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ fullName: "", email: "", password: "" });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: { emailRedirectTo: window.location.origin + "/onboarding", data: { full_name: parsed.data.fullName } },
    });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Account created");
    nav("/onboarding");
  }

  return (
    <AuthShell
      title="Create account"
      subtitle="Start training."
      footer={<>Already on SpeechOS? <Link className="text-foreground underline underline-offset-4" to="/auth/sign-in">Sign in</Link></>}
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="fullName" className="eyebrow">Full name</Label>
          <Input id="fullName" value={form.fullName} onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))} className="h-12 rounded-none border-x-0 border-t-0" required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email" className="eyebrow">Email</Label>
          <Input id="email" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className="h-12 rounded-none border-x-0 border-t-0" required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password" className="eyebrow">Password</Label>
          <Input id="password" type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} className="h-12 rounded-none border-x-0 border-t-0" required minLength={8} />
        </div>
        <button disabled={loading} className="w-full h-12 bg-foreground text-background hover:bg-accent transition-colors disabled:opacity-60">
          {loading ? "Creating…" : "Create account"}
        </button>
      </form>
    </AuthShell>
  );
}
