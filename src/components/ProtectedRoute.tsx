import { Navigate } from "react-router-dom";
import { ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen grid place-items-center text-muted-foreground font-mono text-xs uppercase tracking-widest">Loading</div>;
  if (!user) return <Navigate to="/auth/sign-in" replace />;
  return <>{children}</>;
}
