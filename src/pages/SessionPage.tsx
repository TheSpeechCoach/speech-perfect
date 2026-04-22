import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useRecorder } from "@/hooks/use-recorder";
import { READ_PASSAGES, PROMPTS, REPHRASE_TARGETS, pickOne } from "@/lib/exercises";
import { analyse } from "@/lib/speech-analysis";
import { Mic, Square, RotateCcw, Play, ArrowRight, Pause, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type Step = { type: "read" | "prompt" | "rephrase"; prompt: string; hint?: string };

const STEP_META: Record<Step["type"], { index: string; label: string; brief: string }> = {
  read:     { index: "01", label: "Read aloud",       brief: "Deliver the passage as if it were yours. No drift." },
  prompt:   { index: "02", label: "Speak to prompt",  brief: "60–90 seconds. One thesis. Land it." },
  rephrase: { index: "03", label: "Rephrase + deliver", brief: "Rewrite in your head. Then say it once, cleanly." },
};

function fmtTime(s: number) {
  const m = Math.floor(s / 60).toString().padStart(2, "0");
  const sec = (s % 60).toString().padStart(2, "0");
  return `${m}:${sec}`;
}

// Lightweight live waveform visualiser
function Waveform({ stream, active }: { stream: MediaStream | null; active: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !stream || !active) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const source = audioCtx.createMediaStreamSource(stream);
    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 1024;
    source.connect(analyser);
    const data = new Uint8Array(analyser.frequencyBinCount);

    const dpr = window.devicePixelRatio || 1;
    const resize = () => {
      const { width, height } = canvas.getBoundingClientRect();
      canvas.width = width * dpr;
      canvas.height = height * dpr;
    };
    resize();
    const onResize = () => resize();
    window.addEventListener("resize", onResize);

    const bars = 64;
    const draw = () => {
      analyser.getByteTimeDomainData(data);
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      // Compute RMS per bar segment
      const seg = Math.floor(data.length / bars);
      const barW = w / bars;
      const gap = Math.max(1, barW * 0.35);
      const drawW = barW - gap;
      const accent = getComputedStyle(document.documentElement).getPropertyValue("--accent").trim();
      ctx.fillStyle = `hsl(${accent})`;

      for (let i = 0; i < bars; i++) {
        let sum = 0;
        for (let j = 0; j < seg; j++) {
          const v = (data[i * seg + j] - 128) / 128;
          sum += v * v;
        }
        const rms = Math.sqrt(sum / seg);
        const barH = Math.max(2 * dpr, Math.min(h, rms * h * 2.2));
        const x = i * barW + gap / 2;
        const y = (h - barH) / 2;
        ctx.fillRect(x, y, drawW, barH);
      }

      rafRef.current = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", onResize);
      audioCtx.close().catch(() => {});
    };
  }, [stream, active]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-16 md:h-20"
      aria-hidden="true"
    />
  );
}

export default function SessionPage() {
  const { user } = useAuth();
  const nav = useNavigate();

  const steps: Step[] = useMemo(() => {
    const r = pickOne(REPHRASE_TARGETS);
    return [
      { type: "read", prompt: pickOne(READ_PASSAGES) },
      { type: "prompt", prompt: pickOne(PROMPTS) },
      { type: "rephrase", prompt: r.messy, hint: r.hint },
    ];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [stepIdx, setStepIdx] = useState(0);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [stored, setStored] = useState<{ transcript: string; duration: number; audioPath: string | null }[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const startedAt = useRef<string>(new Date().toISOString());
  const streamRef = useRef<MediaStream | null>(null);

  const rec = useRecorder();

  // Capture the stream from the recorder (best effort) by grabbing the active mic track
  useEffect(() => {
    if (rec.state !== "recording") {
      streamRef.current = null;
      return;
    }
    // Acquire a parallel low-overhead reference so the visualiser has something to read.
    let cancelled = false;
    navigator.mediaDevices.getUserMedia({ audio: true }).then(s => {
      if (cancelled) { s.getTracks().forEach(t => t.stop()); return; }
      streamRef.current = s;
    }).catch(() => {});
    return () => {
      cancelled = true;
      if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
    };
  }, [rec.state]);

  // Create session row on mount
  useEffect(() => {
    if (!user || sessionId) return;
    (async () => {
      const { data: profile } = await supabase.from("profiles").select("current_programme_id").eq("id", user.id).maybeSingle();
      const { data, error } = await supabase.from("sessions").insert({
        user_id: user.id, programme_id: profile?.current_programme_id || null, started_at: startedAt.current,
      }).select().single();
      if (error) { toast.error(error.message); return; }
      setSessionId(data.id);
    })();
  }, [user, sessionId]);

  // Keyboard shortcut: Space to toggle record/stop
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLInputElement) return;
      if (e.code === "Space") {
        e.preventDefault();
        if (rec.state === "recording") rec.stop();
        else if (rec.state !== "recording") rec.start();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [rec.state]); // eslint-disable-line react-hooks/exhaustive-deps

  const step = steps[stepIdx];
  const total = steps.length;
  const meta = STEP_META[step.type];

  async function continueNext() {
    if (!user || !sessionId) return;
    let audioPath: string | null = null;
    if (rec.audioBlob) {
      const path = `${user.id}/${sessionId}/${stepIdx}-${Date.now()}.webm`;
      const { error: upErr } = await supabase.storage.from("recordings").upload(path, rec.audioBlob, { contentType: rec.audioBlob.type, upsert: false });
      if (!upErr) audioPath = path;
    }
    const transcript = rec.transcript.trim();
    const duration = rec.duration;
    await supabase.from("session_exercises").insert({
      session_id: sessionId, user_id: user.id,
      exercise_type: step.type, prompt: step.prompt,
      transcript, audio_path: audioPath, duration_seconds: duration,
    });
    setStored(s => [...s, { transcript, duration, audioPath }]);
    rec.reset();
    setStepIdx(i => i + 1);
  }

  async function submitSession() {
    if (!user || !sessionId) return;
    setSubmitting(true);
    let final = stored;
    if (rec.transcript.trim() || rec.audioBlob) {
      let audioPath: string | null = null;
      if (rec.audioBlob) {
        const path = `${user.id}/${sessionId}/${stepIdx}-${Date.now()}.webm`;
        const { error: upErr } = await supabase.storage.from("recordings").upload(path, rec.audioBlob, { contentType: rec.audioBlob.type });
        if (!upErr) audioPath = path;
      }
      await supabase.from("session_exercises").insert({
        session_id: sessionId, user_id: user.id, exercise_type: step.type, prompt: step.prompt,
        transcript: rec.transcript.trim(), audio_path: audioPath, duration_seconds: rec.duration,
      });
      final = [...stored, { transcript: rec.transcript.trim(), duration: rec.duration, audioPath }];
    }

    const combinedTranscript = final.map(s => s.transcript).join(" ").trim();
    const totalDuration = final.reduce((a, s) => a + s.duration, 0) || 1;
    const a = analyse({ transcript: combinedTranscript, durationSeconds: totalDuration });

    await supabase.from("session_scores").insert({
      session_id: sessionId, user_id: user.id,
      overall: a.overall, clarity: a.clarity, pace: a.pace, filler: a.filler, structure: a.structure,
      wpm: a.wpm, filler_count: a.fillerCount, avg_sentence_length: a.avgSentenceLength,
      feedback: a.feedback,
    });
    await supabase.from("sessions").update({ completed_at: new Date().toISOString(), duration_seconds: totalDuration }).eq("id", sessionId);

    const today = new Date(); today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().slice(0, 10);
    const { data: streak } = await supabase.from("streaks").select("*").eq("user_id", user.id).maybeSingle();
    if (streak) {
      const last = streak.last_session_date ? new Date(streak.last_session_date) : null;
      let cur = streak.current_streak || 0;
      if (!last || last.toISOString().slice(0, 10) !== todayStr) {
        const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
        cur = (last && last.toISOString().slice(0, 10) === yesterday.toISOString().slice(0, 10)) ? cur + 1 : 1;
      }
      await supabase.from("streaks").update({
        current_streak: cur,
        longest_streak: Math.max(cur, streak.longest_streak || 0),
        last_session_date: todayStr,
        updated_at: new Date().toISOString(),
      }).eq("user_id", user.id);
    }

    const { data: profile } = await supabase.from("profiles").select("current_programme_id").eq("id", user.id).maybeSingle();
    if (profile?.current_programme_id) {
      const { data: up } = await supabase.from("user_programmes").select("*").eq("user_id", user.id).eq("programme_id", profile.current_programme_id).eq("active", true).maybeSingle();
      if (up) await supabase.from("user_programmes").update({ completed_sessions: (up.completed_sessions || 0) + 1 }).eq("id", up.id);
    }

    setSubmitting(false);
    nav(`/app/results/${sessionId}`);
  }

  const wordCount = rec.transcript.trim().split(/\s+/).filter(Boolean).length;
  const isLast = stepIdx === total - 1;

  return (
    <AppLayout>
      <div className="min-h-[calc(100vh-65px)] md:min-h-screen flex flex-col">
        {/* Top status bar — full bleed, instrument-feel */}
        <div className="hairline">
          <div className="container-page py-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0">
              <button
                onClick={() => setConfirmCancel(true)}
                aria-label="Abandon session"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
              <div className="hidden sm:block h-4 w-px bg-[hsl(var(--hairline))]" />
              <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground truncate">
                Daily session · {meta.index} / 0{total}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className={cn(
                "h-1.5 w-1.5 rounded-full",
                rec.state === "recording" ? "bg-accent rec-pulse" : rec.state === "stopped" ? "bg-foreground" : "bg-[hsl(var(--hairline))]"
              )} />
              <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                {rec.state === "recording" ? "Live" : rec.state === "stopped" ? "Captured" : "Standby"}
              </span>
            </div>
          </div>
          {/* Stepper segments */}
          <div className="container-page pb-3 flex gap-1.5">
            {steps.map((_, i) => (
              <div key={i} className="flex-1 h-[3px] bg-[hsl(var(--hairline))] overflow-hidden">
                <div
                  className={cn(
                    "h-full transition-all duration-500",
                    i < stepIdx ? "w-full bg-foreground" :
                    i === stepIdx ? (rec.state === "stopped" ? "w-full bg-foreground" : rec.state === "recording" ? "w-1/2 bg-accent" : "w-0") :
                    "w-0"
                  )}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 container-page py-10 md:py-16 max-w-3xl w-full">
          {/* Step heading */}
          <div className="space-y-4">
            <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-accent">
              {meta.index} · {meta.label}
            </div>
            <h1 className="font-display text-[clamp(1.875rem,4vw,3rem)] leading-[1.15] tracking-tight">
              {step.prompt}
            </h1>
            {step.hint && (
              <p className="text-sm text-muted-foreground">{step.hint}</p>
            )}
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground/80">
              {meta.brief}
            </p>
          </div>

          {/* Recorder console — single block, no card chrome */}
          <div className="mt-12 border-t border-b border-[hsl(var(--hairline))] py-8">
            {/* Timer + waveform */}
            <div className="flex items-center justify-between gap-6">
              <div className="font-display text-5xl md:text-6xl tabular-nums leading-none">
                {fmtTime(rec.duration)}
              </div>
              <div className="flex-1 max-w-md ml-4">
                {rec.state === "recording" ? (
                  <Waveform stream={streamRef.current} active />
                ) : (
                  <div className="h-16 md:h-20 flex items-center justify-end">
                    <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                      {rec.state === "stopped" ? "Take captured" : "Press space or tap record"}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Controls */}
            <div className="mt-6 flex flex-wrap items-center gap-2">
              {rec.state !== "recording" ? (
                <button
                  onClick={rec.start}
                  className="inline-flex items-center gap-2 px-5 py-3 bg-accent text-accent-foreground hover:bg-accent/90 transition-colors text-sm font-medium"
                >
                  <Mic className="h-4 w-4" />
                  {rec.state === "stopped" ? "Re-record" : "Record"}
                </button>
              ) : (
                <button
                  onClick={rec.stop}
                  className="inline-flex items-center gap-2 px-5 py-3 bg-foreground text-background hover:bg-foreground/90 transition-colors text-sm font-medium"
                >
                  <Square className="h-4 w-4 fill-current" /> Stop
                </button>
              )}
              {rec.state === "stopped" && rec.audioUrl && <PlaybackButton url={rec.audioUrl} />}
              {rec.state === "stopped" && (
                <button
                  onClick={rec.reset}
                  className="inline-flex items-center gap-2 px-3 py-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <RotateCcw className="h-3.5 w-3.5" /> Discard
                </button>
              )}
            </div>

            {rec.error && <div className="mt-4 text-sm text-accent font-mono">{rec.error}</div>}
          </div>

          {/* Transcript — shows only when there's something to show */}
          {(rec.transcript || rec.interim || rec.state === "stopped") && (
            <div className="mt-8">
              <div className="flex items-baseline justify-between mb-3">
                <div className="eyebrow">Transcript</div>
                <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground tabular-nums">
                  {wordCount} words
                </div>
              </div>
              <textarea
                value={rec.transcript + (rec.interim ? " " + rec.interim : "")}
                onChange={e => rec.setManualTranscript(e.target.value)}
                placeholder="Live transcription appears here. Edit if needed."
                className="w-full min-h-[120px] bg-transparent border-0 border-l-2 border-[hsl(var(--hairline))] focus:border-l-foreground pl-4 py-1 text-base leading-relaxed focus:outline-none resize-none transition-colors"
              />
            </div>
          )}

          {/* Footer actions */}
          <div className="mt-12 flex items-center justify-between gap-4">
            <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground hidden sm:block">
              {isLast ? "Final exercise" : `Next: ${STEP_META[steps[stepIdx + 1].type].label}`}
            </div>
            {!isLast ? (
              <button
                onClick={continueNext}
                disabled={rec.state !== "stopped"}
                className="inline-flex items-center gap-2 px-6 py-3 bg-foreground text-background hover:bg-accent hover:text-accent-foreground transition-colors disabled:opacity-25 disabled:cursor-not-allowed text-sm font-medium ml-auto"
              >
                Continue <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                onClick={submitSession}
                disabled={submitting || (rec.state !== "stopped" && stored.length === 0)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-accent text-accent-foreground hover:bg-accent/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-sm font-medium ml-auto"
              >
                {submitting ? "Analysing…" : "Submit for analysis"} <ArrowRight className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Cancel confirm */}
      {confirmCancel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 backdrop-blur-sm" onClick={() => setConfirmCancel(false)}>
          <div className="bg-background border border-[hsl(var(--hairline))] max-w-sm w-[90%] p-6" onClick={e => e.stopPropagation()}>
            <div className="eyebrow">Abandon session</div>
            <p className="mt-3 text-sm">This take will not be scored. Progress in this session will be lost.</p>
            <div className="mt-6 flex justify-end gap-2">
              <button onClick={() => setConfirmCancel(false)} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground">Keep training</button>
              <button onClick={() => nav("/app")} className="px-4 py-2 text-sm bg-accent text-accent-foreground hover:bg-accent/90">Abandon</button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}

function PlaybackButton({ url }: { url: string }) {
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  useEffect(() => {
    const a = new Audio(url); audioRef.current = a;
    const onEnd = () => setPlaying(false);
    a.addEventListener("ended", onEnd);
    return () => { a.pause(); a.removeEventListener("ended", onEnd); };
  }, [url]);
  return (
    <button
      onClick={() => {
        if (!audioRef.current) return;
        if (playing) { audioRef.current.pause(); setPlaying(false); }
        else { audioRef.current.play(); setPlaying(true); }
      }}
      className="inline-flex items-center gap-2 px-4 py-3 border border-[hsl(var(--hairline))] hover:border-foreground transition-colors text-sm"
    >
      {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
      {playing ? "Pause" : "Play"}
    </button>
  );
}
