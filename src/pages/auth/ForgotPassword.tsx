import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import AuthShell from "@/components/AuthShell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function ForgotPassword() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + "/auth/reset-password",
    });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    setSent(true);
  }

  return (
    <AuthShell title="Reset password" subtitle="Send reset link." footer={<Link className="text-foreground underline underline-offset-4" to="/auth/sign-in">Back to sign in</Link>}>
      {sent ? (
        <p className="text-sm text-muted-foreground">If that account exists, a reset link is on its way.</p>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email" className="eyebrow">Email</Label>
            <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} className="h-12 rounded-none border-x-0 border-t-0" required />
          </div>
          <button disabled={loading} className="w-full h-12 bg-foreground text-background hover:bg-accent transition-colors disabled:opacity-60">
            {loading ? "Sending…" : "Send reset link"}
          </button>
        </form>
      )}
    </AuthShell>
  );
}
