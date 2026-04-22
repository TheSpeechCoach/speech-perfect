import { Link } from "react-router-dom";
import { Mic, ArrowRight, Activity, Gauge, Layers, ShieldCheck, Check, Repeat, LineChart, Target } from "lucide-react";
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
            <div className="eyebrow mb-6">SpeechOS — Performance speech training</div>
            <h1 className="font-display text-[44px] leading-[1.02] sm:text-6xl md:text-7xl tracking-tight">
              Train your speech <span className="italic">like performance.</span>
            </h1>
            <p className="mt-8 text-lg text-muted-foreground max-w-2xl">
              Daily speaking drills, real-time analysis, and measurable improvement for people who need to think clearly and speak well under pressure.
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
              <Link to="/auth/sign-up" className="inline-flex items-center gap-2 bg-foreground text-background px-6 py-3.5 hover:bg-accent transition-colors">
                Start training <ArrowRight className="h-4 w-4" />
              </Link>
              <a href="#how" className="inline-flex items-center gap-2 px-6 py-3.5 border border-foreground hover:bg-foreground hover:text-background transition-colors">
                See how it works
              </a>
            </div>
            <div className="mt-10 flex items-center gap-6 text-xs font-mono uppercase tracking-widest text-muted-foreground">
              <span className="flex items-center gap-2"><span className="h-1.5 w-1.5 bg-accent inline-block rec-pulse" />Real-time analysis</span>
              <span>·</span>
              <span>5-min daily sessions</span>
              <span className="hidden sm:inline">·</span>
              <span className="hidden sm:inline">Measured every rep</span>
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
          <h2 className="font-display text-4xl md:text-5xl max-w-3xl">
            Most people don't get better at speaking. <span className="italic">They just keep speaking.</span>
          </h2>
          <p className="mt-6 max-w-3xl text-lg text-muted-foreground">
            Reading books doesn't fix pace. Watching talks doesn't reduce fillers. One-off coaching fades within a week.
            Speech is a motor skill. It improves the same way every other motor skill improves: deliberate reps, measured against a target, repeated daily.
            SpeechOS is the system that makes that possible.
          </p>
          <div className="grid md:grid-cols-3 gap-px bg-[hsl(var(--hairline))] mt-14 border border-[hsl(var(--hairline))]">
            {[
              { t: "Systematic reps", d: "Five focused minutes a day. Structured drills, not vague practice." },
              { t: "Hard numbers", d: "Pace, filler rate, sentence length, structure. Tracked every session." },
              { t: "Targeted feedback", d: "Direct corrections after each session. No generic encouragement." },
            ].map(b => (
              <div key={b.t} className="bg-background p-8">
                <div className="font-display text-3xl">{b.t}</div>
                <p className="mt-4 text-muted-foreground">{b.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="hairline border-t border-[hsl(var(--hairline))]">
        <div className="container-page py-24">
          <div className="eyebrow mb-3">How it works</div>
          <h2 className="font-display text-4xl md:text-5xl max-w-3xl">Record. Analyse. Improve. <span className="italic">Repeat.</span></h2>
          <div className="mt-14 grid md:grid-cols-4 gap-px bg-[hsl(var(--hairline))] border border-[hsl(var(--hairline))]">
            {[
              { n: "01", t: "Record", d: "Run a five-minute session. Three drills, one take each.", icon: Mic },
              { n: "02", t: "Analyse", d: "Real-time scoring on clarity, pace, fillers, and structure.", icon: Activity },
              { n: "03", t: "Improve", d: "Direct feedback identifies the one thing to fix tomorrow.", icon: Target },
              { n: "04", t: "Repeat", d: "Daily. Streaks compound. Scores move on the chart.", icon: Repeat },
            ].map(s => (
              <div key={s.n} className="bg-background p-8">
                <div className="font-mono text-xs text-accent">{s.n}</div>
                <s.icon className="h-6 w-6 mt-3" />
                <div className="font-display text-2xl mt-4">{s.t}</div>
                <p className="mt-3 text-sm text-muted-foreground">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DAILY TRAINING */}
      <section className="hairline border-t border-[hsl(var(--hairline))] bg-[hsl(var(--surface-2))]">
        <div className="container-page py-24">
          <div className="eyebrow mb-3">Daily training</div>
          <h2 className="font-display text-4xl md:text-5xl max-w-3xl">
            Three exercises. Five minutes. <span className="italic">Every day.</span>
          </h2>
          <p className="mt-6 max-w-2xl text-muted-foreground">
            Each session is engineered to load a different speaking skill — controlled delivery, structured thinking under pressure, and live verbal editing.
          </p>
          <div className="mt-14 grid md:grid-cols-3 gap-8">
            {[
              { n: "01", t: "Read aloud", d: "Calibrate pace, clarity, and breath against a fixed passage. Establishes baseline before pressure is applied." },
              { n: "02", t: "Speak to prompt", d: "Answer a high-stakes prompt in 30 seconds. Trains structured thinking under live load." },
              { n: "03", t: "Rephrase + deliver", d: "Take a messy sentence. Rewrite it. Say it cleanly. Sharpens spoken editing in real time." },
            ].map(s => (
              <div key={s.n} className="card-flat p-8 bg-background">
                <div className="font-mono text-xs text-accent">{s.n}</div>
                <div className="font-display text-3xl mt-4">{s.t}</div>
                <p className="mt-3 text-muted-foreground">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* REAL-TIME ANALYSIS */}
      <section className="hairline border-t border-[hsl(var(--hairline))]">
        <div className="container-page py-24">
          <div className="eyebrow mb-3">Real-time analysis</div>
          <h2 className="font-display text-4xl md:text-5xl max-w-3xl">
            Four scores. <span className="italic">Every session.</span>
          </h2>
          <p className="mt-6 max-w-2xl text-muted-foreground">
            Every recording is scored on the dimensions that determine whether you sound prepared or improvised.
          </p>
          <div className="mt-14 grid md:grid-cols-2 lg:grid-cols-4 gap-px bg-[hsl(var(--hairline))] border border-[hsl(var(--hairline))]">
            {[
              { k: "Clarity", v: "88", d: "Sentence length, structure, and listenability. Measures whether the listener can actually follow you." },
              { k: "Pace", v: "74", d: "Words per minute against the target band. Penalises rushing and dragging." },
              { k: "Fillers", v: "91", d: "Counts \u201cum\u201d, \u201cuh\u201d, \u201clike\u201d, \u201cyou know\u201d, \u201csort of\u201d. Lower count, higher score." },
              { k: "Structure", v: "76", d: "Detects clean openings, connective logic, and a firm ending. Rewards delivered shape." },
            ].map(s => (
              <div key={s.k} className="bg-background p-8">
                <div className="eyebrow">{s.k}</div>
                <div className="mt-3 font-display text-6xl tabular-nums">{s.v}</div>
                <p className="mt-4 text-sm text-muted-foreground">{s.d}</p>
              </div>
            ))}
          </div>
          <div className="mt-10 inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-muted-foreground">
            <LineChart className="h-3.5 w-3.5" /> Tracked across every session. Trends visible from day one.
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
              { t: "Stop Sounding Confused", d: "Cleaner sentences, slower delivery, deliberate thought-to-speech control.", w: "2 weeks" },
              { t: "Speak With Authority", d: "Stronger vocal delivery, cleaner openings, firmer endings.", w: "4 weeks" },
              { t: "Think Faster, Speak Cleaner", d: "Sharper spontaneous answers. Less verbal clutter under live questioning.", w: "6 weeks" },
              { t: "High-Stakes Delivery", d: "Pitch, interview, board, and keynote-grade vocal control.", w: "8 weeks" },
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
          <h2 className="font-display text-4xl md:text-5xl max-w-3xl">Try it. Then commit.</h2>
          <div className="grid md:grid-cols-2 gap-6 mt-14">
            {[
              {
                tier: "Free",
                price: "£0",
                per: "forever",
                features: [
                  "3 sessions total",
                  "Limited progress history",
                  "Core programme only",
                  "Basic feedback",
                ],
                cta: "Start free",
                featured: false,
              },
              {
                tier: "Pro",
                price: "£12",
                per: "per month",
                features: [
                  "Unlimited daily sessions",
                  "Full analytics history",
                  "All four programmes",
                  "Premium feedback",
                  "Recording history",
                ],
                cta: "Start Pro",
                featured: true,
              },
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

      {/* FINAL CTA */}
      <section className="bg-foreground text-background border-t border-background/10">
        <div className="container-page py-28 grid md:grid-cols-12 gap-10 items-center">
          <div className="md:col-span-8">
            <h2 className="font-display text-4xl md:text-6xl tracking-tight leading-[1.02]">
              Stop hoping you sound good. <span className="italic text-accent">Train properly.</span>
            </h2>
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
