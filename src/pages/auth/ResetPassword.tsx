import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import AuthShell from "@/components/AuthShell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function ResetPassword() {
  const nav = useNavigate();
  const [loading, setLoading] = useState(false);
  const [pwd, setPwd] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (pwd.length < 8) { toast.error("8+ characters"); return; }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: pwd });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Password updated");
    nav("/app");
  }

  return (
    <AuthShell title="New password" subtitle="Set it. Sign in.">
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="pwd" className="eyebrow">New password</Label>
          <Input id="pwd" type="password" value={pwd} onChange={e => setPwd(e.target.value)} className="h-12 rounded-none border-x-0 border-t-0" required minLength={8} />
        </div>
        <button disabled={loading} className="w-full h-12 bg-foreground text-background hover:bg-accent transition-colors disabled:opacity-60">
          {loading ? "Updating…" : "Update password"}
        </button>
      </form>
    </AuthShell>
  );
}
