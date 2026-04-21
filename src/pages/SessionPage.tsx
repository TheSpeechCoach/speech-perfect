import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useRecorder } from "@/hooks/use-recorder";
import { READ_PASSAGES, PROMPTS, REPHRASE_TARGETS, pickOne } from "@/lib/exercises";
import { analyse } from "@/lib/speech-analysis";
import { Mic, Square, RotateCcw, Play, ArrowRight, Pause } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type Step = { type: "read" | "prompt" | "rephrase"; prompt: string; hint?: string };

function fmtTime(s: number) {
  const m = Math.floor(s / 60).toString().padStart(2, "0");
  const sec = (s % 60).toString().padStart(2, "0");
  return `${m}:${sec}`;
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
  const startedAt = useRef<string>(new Date().toISOString());

  const rec = useRecorder();

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

  const step = steps[stepIdx];
  const total = steps.length;
  const progress = ((stepIdx + (rec.state === "stopped" ? 1 : 0)) / total) * 100;

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
    // include current step
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

    // Update streak
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

    // Increment programme counter
    const { data: profile } = await supabase.from("profiles").select("current_programme_id").eq("id", user.id).maybeSingle();
    if (profile?.current_programme_id) {
      const { data: up } = await supabase.from("user_programmes").select("*").eq("user_id", user.id).eq("programme_id", profile.current_programme_id).eq("active", true).maybeSingle();
      if (up) await supabase.from("user_programmes").update({ completed_sessions: (up.completed_sessions || 0) + 1 }).eq("id", up.id);
    }

    setSubmitting(false);
    nav(`/app/results/${sessionId}`);
  }

  return (
    <AppLayout>
      <div className="container-page py-8 md:py-12 max-w-3xl">
        {/* Header */}
        <div className="flex items-baseline justify-between mb-2">
          <div className="eyebrow">Daily session</div>
          <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Exercise {Math.min(stepIdx + 1, total)} / {total}</div>
        </div>
        <div className="h-1 bg-[hsl(var(--hairline))] mb-8"><div className="h-full bg-foreground transition-all" style={{ width: `${progress}%` }} /></div>

        {/* Step */}
        <div className="space-y-3">
          <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-accent">
            {step?.type === "read" && "01 · Read aloud"}
            {step?.type === "prompt" && "02 · Speak to prompt"}
            {step?.type === "rephrase" && "03 · Rephrase + deliver"}
          </div>
          <h1 className="font-display text-3xl md:text-4xl leading-snug">{step?.prompt}</h1>
          {step?.hint && <p className="text-sm text-muted-foreground italic">{step.hint}</p>}
        </div>

        {/* Recorder panel */}
        <div className="mt-10 card-flat p-6 md:p-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className={cn("h-2.5 w-2.5 rounded-full", rec.state === "recording" ? "bg-accent rec-pulse" : "bg-[hsl(var(--hairline))]")} />
              <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                {rec.state === "recording" ? "Recording" : rec.state === "stopped" ? "Stopped" : "Ready"}
              </span>
            </div>
            <div className="font-display text-3xl tabular-nums">{fmtTime(rec.duration)}</div>
          </div>

          {/* Controls */}
          <div className="mt-6 flex flex-wrap items-center gap-3">
            {rec.state !== "recording" && (
              <button onClick={rec.start} className="inline-flex items-center gap-2 px-5 py-3 bg-accent text-background hover:bg-accent/90">
                <Mic className="h-4 w-4" /> {rec.state === "stopped" ? "Re-record" : "Start recording"}
              </button>
            )}
            {rec.state === "recording" && (
              <button onClick={rec.stop} className="inline-flex items-center gap-2 px-5 py-3 bg-foreground text-background hover:bg-accent transition-colors">
                <Square className="h-4 w-4" /> Stop
              </button>
            )}
            {rec.state === "stopped" && rec.audioUrl && (
              <PlaybackButton url={rec.audioUrl} />
            )}
            {rec.state === "stopped" && (
              <button onClick={rec.reset} className="inline-flex items-center gap-2 px-4 py-3 text-sm text-muted-foreground hover:text-foreground">
                <RotateCcw className="h-3.5 w-3.5" /> Reset
              </button>
            )}
          </div>

          {rec.error && <div className="mt-4 text-sm text-accent">{rec.error}</div>}

          {/* Transcript */}
          <div className="mt-8">
            <div className="eyebrow mb-2">Transcript</div>
            <textarea
              value={rec.transcript + (rec.interim ? " " + rec.interim : "")}
              onChange={e => rec.setManualTranscript(e.target.value)}
              placeholder="Live transcription appears here. You can also type/edit if your browser doesn't support speech recognition."
              className="w-full min-h-[140px] bg-[hsl(var(--surface-2))] border border-[hsl(var(--hairline))] p-4 text-sm focus:outline-none focus:ring-1 focus:ring-foreground"
            />
            <div className="mt-2 font-mono text-[11px] text-muted-foreground uppercase tracking-widest">
              {rec.transcript.trim().split(/\s+/).filter(Boolean).length} words
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="mt-8 flex justify-between items-center">
          <button onClick={() => nav("/app")} className="text-sm text-muted-foreground hover:text-foreground">Cancel</button>
          {stepIdx < total - 1 ? (
            <button
              onClick={continueNext}
              disabled={rec.state !== "stopped"}
              className="inline-flex items-center gap-2 px-6 py-3 bg-foreground text-background hover:bg-accent transition-colors disabled:opacity-30">
              Continue <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <button onClick={submitSession} disabled={submitting || (rec.state !== "stopped" && stored.length === 0)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-accent text-background hover:bg-accent/90 transition-colors disabled:opacity-50">
              {submitting ? "Analysing…" : "Submit session"} <ArrowRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
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
    <button onClick={() => {
      if (!audioRef.current) return;
      if (playing) { audioRef.current.pause(); setPlaying(false); }
      else { audioRef.current.play(); setPlaying(true); }
    }} className="inline-flex items-center gap-2 px-4 py-3 border border-[hsl(var(--hairline))] hover:border-foreground transition-colors">
      {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
      <span className="text-sm">{playing ? "Pause" : "Play"} recording</span>
    </button>
  );
}
