import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import AuthShell from "@/components/AuthShell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function SignIn() {
  const nav = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword(form);
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    nav("/app");
  }

  return (
    <AuthShell
      title="Sign in"
      subtitle="Back to training."
      footer={<>No account? <Link className="text-foreground underline underline-offset-4" to="/auth/sign-up">Sign up</Link></>}
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email" className="eyebrow">Email</Label>
          <Input id="email" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className="h-12 rounded-none border-x-0 border-t-0" required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password" className="eyebrow">Password</Label>
          <Input id="password" type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} className="h-12 rounded-none border-x-0 border-t-0" required />
        </div>
        <div className="text-right -mt-2">
          <Link to="/auth/forgot" className="text-xs text-muted-foreground hover:text-foreground">Forgot password?</Link>
        </div>
        <button disabled={loading} className="w-full h-12 bg-foreground text-background hover:bg-accent transition-colors disabled:opacity-60">
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </AuthShell>
  );
}
