import { Link } from "react-router-dom";

export default function AuthShell({ title, subtitle, children, footer }: { title: string; subtitle?: string; children: React.ReactNode; footer?: React.ReactNode }) {
  return (
    <div className="min-h-screen grid md:grid-cols-2 bg-background">
      <div className="hidden md:flex flex-col justify-between bg-foreground text-background p-10">
        <Link to="/" className="font-display text-3xl tracking-tight inline-flex items-center gap-2">
          SpeechOS <span className="h-1.5 w-1.5 rounded-full bg-accent" />
        </Link>
        <div>
          <div className="eyebrow text-background/60">Daily training</div>
          <h2 className="font-display text-5xl mt-3 leading-[1.05]">Five minutes a day. <span className="italic text-accent">Measurable progress.</span></h2>
          <p className="mt-6 text-background/60 max-w-md">Pace, clarity, filler rate, structure. Scored every session. Tracked every week.</p>
        </div>
        <div className="text-xs font-mono uppercase tracking-widest text-background/40">v1.0 · Performance system</div>
      </div>
      <div className="flex flex-col p-6 md:p-12">
        <Link to="/" className="md:hidden font-display text-2xl mb-8">SpeechOS</Link>
        <div className="m-auto w-full max-w-sm">
          <div className="eyebrow">{title}</div>
          {subtitle && <h1 className="font-display text-4xl mt-2">{subtitle}</h1>}
          <div className="mt-8">{children}</div>
          {footer && <div className="mt-8 text-sm text-muted-foreground">{footer}</div>}
        </div>
      </div>
    </div>
  );
}
