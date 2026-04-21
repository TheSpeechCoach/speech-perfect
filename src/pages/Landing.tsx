import { Link } from "react-router-dom";
import { Mic, ArrowRight, Activity, Gauge, Layers, ShieldCheck, Check } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

function StickyNav() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll); return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <header className={cn(
      "fixed inset-x-0 top-0 z-50 transition-all",
      scrolled ? "backdrop-blur bg-background/80 border-b border-[hsl(var(--hairline))]" : ""
    )}>
      <div className="container-page flex items-center justify-between h-16">
        <Link to="/" className="flex items-center gap-2">
          <span className="font-display text-2xl tracking-tight">SpeechOS</span>
          <span className="h-1.5 w-1.5 rounded-full bg-accent" />
        </Link>
        <nav className="hidden md:flex items-center gap-8 text-sm">
          <a href="#why" className="hover:text-accent transition-colors">Why</a>
          <a href="#how" className="hover:text-accent transition-colors">How it works</a>
          <a href="#programmes" className="hover:text-accent transition-colors">Programmes</a>
          <a href="#pricing" className="hover:text-accent transition-colors">Pricing</a>
        </nav>
        <div className="flex items-center gap-2">
          <Link to="/auth/sign-in" className="hidden sm:inline-block text-sm px-3 py-2 hover:text-accent">Sign in</Link>
          <Link to="/auth/sign-up" className="text-sm px-4 py-2 bg-foreground text-background hover:bg-accent transition-colors">Start training</Link>
        </div>
      </div>
    </header>
  );
}

export default function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <StickyNav />

      {/* HERO */}
      <section className="pt-36 pb-24 container-page">
        <div className="grid md:grid-cols-12 gap-10 items-end">
          <div className="md:col-span-8">
            <div className="eyebrow mb-6">SpeechOS — v1.0 · Performance training</div>
            <h1 className="font-display text-[44px] leading-[1.02] sm:text-6xl md:text-7xl tracking-tight">
              Train the way you <span className="italic">speak.</span><br/>
              Daily. <span className="text-accent">Measurable.</span>
            </h1>
            <p className="mt-8 text-lg text-muted-foreground max-w-2xl">
              SpeechOS is a daily training system for clearer, faster, more authoritative speech.
              Record. Analyse. Improve. No fluff. No motivational posters. Just a measurable scoreboard for your voice.
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
              <Link to="/auth/sign-up" className="inline-flex items-center gap-2 bg-foreground text-background px-6 py-3.5 hover:bg-accent transition-colors">
                Start your first session <ArrowRight className="h-4 w-4" />
              </Link>
              <a href="#how" className="inline-flex items-center gap-2 px-6 py-3.5 border border-foreground hover:bg-foreground hover:text-background transition-colors">
                How it works
              </a>
            </div>
            <div className="mt-10 flex items-center gap-6 text-xs font-mono uppercase tracking-widest text-muted-foreground">
              <span className="flex items-center gap-2"><span className="h-1.5 w-1.5 bg-accent inline-block rec-pulse" />Real-time analysis</span>
              <span>·</span>
              <span>5-min daily sessions</span>
              <span className="hidden sm:inline">·</span>
              <span className="hidden sm:inline">Cancel anytime</span>
            </div>
          </div>
          <div className="md:col-span-4">
            <div className="card-flat p-6">
              <div className="eyebrow">Last session · Sample</div>
              <div className="mt-3 font-display text-7xl">82</div>
              <div className="text-xs font-mono text-muted-foreground uppercase tracking-widest">Overall score</div>
              <div className="mt-6 space-y-3 text-sm">
                {[
                  ["Clarity", 88], ["Pace", 74], ["Filler", 91], ["Structure", 76],
                ].map(([k, v]) => (
                  <div key={k as string} className="flex items-center justify-between gap-4">
                    <span className="text-muted-foreground">{k as string}</span>
                    <div className="flex-1 h-px bg-[hsl(var(--hairline))]" />
                    <span className="font-mono tabular-nums">{v as number}</span>
                  </div>
                ))}
              </div>
              <div className="mt-6 pt-4 border-t border-[hsl(var(--hairline))] text-xs text-muted-foreground">
                "Pace averaged 168 WPM. Slow down to 140."
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* WHY */}
      <section id="why" className="hairline border-t border-[hsl(var(--hairline))]">
        <div className="container-page py-24">
          <div className="eyebrow mb-3">Why SpeechOS</div>
          <h2 className="font-display text-4xl md:text-5xl max-w-3xl">Coaches teach. Books explain. <span className="italic">SpeechOS trains.</span></h2>
          <div className="grid md:grid-cols-3 gap-px bg-[hsl(var(--hairline))] mt-14 border border-[hsl(var(--hairline))]">
            {[
              { t: "Daily reps", d: "Five focused minutes a day beats a one-off workshop. The voice trains like a muscle." },
              { t: "Real numbers", d: "Pace, filler rate, sentence length, structure. Scores you can move on a chart." },
              { t: "No fluff", d: "No mood boards. No mantras. Drills, scores, feedback. Then you do it again tomorrow." },
            ].map(b => (
              <div key={b.t} className="bg-background p-8">
                <div className="font-display text-3xl">{b.t}</div>
                <p className="mt-4 text-muted-foreground">{b.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW */}
      <section id="how" className="hairline border-t border-[hsl(var(--hairline))]">
        <div className="container-page py-24">
          <div className="eyebrow mb-3">How it works</div>
          <h2 className="font-display text-4xl md:text-5xl max-w-3xl">Three exercises. Five minutes. <span className="italic">Every day.</span></h2>
          <div className="mt-14 grid md:grid-cols-3 gap-8">
            {[
              { n: "01", t: "Read aloud", d: "Warm up with a passage. Establishes baseline pace and clarity." , icon: Activity },
              { n: "02", t: "Speak to prompt", d: "Answer a high-pressure prompt in 30 seconds. Trains structured thinking under load.", icon: Mic },
              { n: "03", t: "Rephrase + deliver", d: "Take a messy sentence. Rewrite it. Say it. Sharpens spoken editing.", icon: Gauge },
            ].map(s => (
              <div key={s.n} className="card-flat p-8">
                <div className="font-mono text-xs text-accent">{s.n}</div>
                <s.icon className="h-6 w-6 mt-3" />
                <div className="font-display text-3xl mt-4">{s.t}</div>
                <p className="mt-3 text-muted-foreground">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PROGRAMMES */}
      <section id="programmes" className="hairline border-t border-[hsl(var(--hairline))] bg-[hsl(var(--surface-2))]">
        <div className="container-page py-24">
          <div className="eyebrow mb-3">Programmes</div>
          <h2 className="font-display text-4xl md:text-5xl max-w-3xl">Pick a target. Train against it.</h2>
          <div className="grid md:grid-cols-2 gap-px bg-[hsl(var(--hairline))] mt-14 border border-[hsl(var(--hairline))]">
            {[
              { t: "Stop Sounding Confused", d: "Eliminate fillers, rambling, and structureless answers.", w: "4 weeks" },
              { t: "Speak With Authority", d: "Pace, pauses, weight. Sound like the person in the room.", w: "6 weeks" },
              { t: "Think Faster, Speak Cleaner", d: "Sub-3-second responses. One idea per sentence.", w: "6 weeks" },
              { t: "High-Stakes Delivery", d: "Boards, keynotes, pitches. Long-form vocal control.", w: "8 weeks" },
            ].map(p => (
              <div key={p.t} className="bg-background p-8 group">
                <div className="flex items-center justify-between">
                  <div className="font-display text-3xl">{p.t}</div>
                  <span className="font-mono text-xs text-muted-foreground">{p.w}</span>
                </div>
                <p className="mt-3 text-muted-foreground">{p.d}</p>
                <div className="mt-6 inline-flex items-center gap-2 text-sm group-hover:text-accent transition-colors">
                  Begin programme <ArrowRight className="h-4 w-4" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="hairline border-t border-[hsl(var(--hairline))]">
        <div className="container-page py-24">
          <div className="eyebrow mb-3">Pricing</div>
          <h2 className="font-display text-4xl md:text-5xl max-w-3xl">Train free. Upgrade when you're serious.</h2>
          <div className="grid md:grid-cols-2 gap-6 mt-14">
            {[
              { tier: "Free", price: "£0", per: "forever", features: ["3 sessions / week", "7-day progress history", "1 programme", "Basic feedback"], cta: "Get started", featured: false },
              { tier: "Pro", price: "£9", per: "per month", features: ["Unlimited daily sessions", "Full progress analytics", "All programmes", "Advanced feedback & trends", "Recording history"], cta: "Start Pro", featured: true },
            ].map(p => (
              <div key={p.tier} className={cn("p-8 border", p.featured ? "border-foreground bg-foreground text-background" : "border-[hsl(var(--hairline))] bg-[hsl(var(--surface))]")}>
                <div className={cn("eyebrow", p.featured && "text-background/60")}>{p.tier}</div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="font-display text-6xl">{p.price}</span>
                  <span className={cn("text-sm", p.featured ? "text-background/60" : "text-muted-foreground")}>{p.per}</span>
                </div>
                <ul className="mt-6 space-y-3 text-sm">
                  {p.features.map(f => <li key={f} className="flex gap-2"><Check className="h-4 w-4 mt-0.5 shrink-0" /> {f}</li>)}
                </ul>
                <Link to="/auth/sign-up" className={cn(
                  "mt-8 inline-flex items-center justify-center w-full px-4 py-3 transition-colors",
                  p.featured ? "bg-accent text-background hover:bg-accent/90" : "bg-foreground text-background hover:bg-accent"
                )}>{p.cta}</Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="hairline border-t border-[hsl(var(--hairline))] bg-[hsl(var(--surface-2))]">
        <div className="container-page py-24">
          <div className="eyebrow mb-3">In use by</div>
          <div className="grid md:grid-cols-3 gap-8 mt-10">
            {[
              { q: "Cut my filler rate in half in two weeks. The score is the only thing that finally made me notice.", n: "VP Product, Series-C SaaS" },
              { q: "Replaced my Sunday-night anxiety prep with a five-minute drill every morning.", n: "Founder, AI startup" },
              { q: "First tool that treats speaking like a measurable skill instead of a personality trait.", n: "Director, Strategy" },
            ].map(t => (
              <figure key={t.n} className="card-flat p-8">
                <Layers className="h-5 w-5 text-accent" />
                <blockquote className="mt-4 font-display text-2xl leading-snug">"{t.q}"</blockquote>
                <figcaption className="mt-6 eyebrow">{t.n}</figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-foreground text-background">
        <div className="container-page py-24 grid md:grid-cols-12 gap-10 items-center">
          <div className="md:col-span-8">
            <h2 className="font-display text-4xl md:text-6xl tracking-tight">Five minutes. Today. <span className="italic text-accent">Then tomorrow.</span></h2>
          </div>
          <div className="md:col-span-4 md:text-right">
            <Link to="/auth/sign-up" className="inline-flex items-center gap-2 bg-accent text-background px-6 py-4 hover:bg-accent/90 transition-colors">
              <Mic className="h-4 w-4" /> Start your first session
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-foreground text-background/70 border-t border-background/10">
        <div className="container-page py-10 flex flex-col md:flex-row gap-6 items-start md:items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <span className="font-display text-xl text-background">SpeechOS</span>
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
          </div>
          <div className="flex gap-6">
            <a href="#why" className="hover:text-background">Why</a>
            <a href="#how" className="hover:text-background">How</a>
            <a href="#programmes" className="hover:text-background">Programmes</a>
            <a href="#pricing" className="hover:text-background">Pricing</a>
            <Link to="/auth/sign-in" className="hover:text-background">Sign in</Link>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest">
            <ShieldCheck className="h-3.5 w-3.5" /> Built for daily training
          </div>
        </div>
      </footer>
    </div>
  );
}
