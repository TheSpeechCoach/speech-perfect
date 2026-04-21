import { useEffect, useRef, useState } from "react";

type SpeechRecognitionLike = any;

export type RecorderState = "idle" | "recording" | "stopped";

export function useRecorder() {
  const [state, setState] = useState<RecorderState>("idle");
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [transcript, setTranscript] = useState("");
  const [interim, setInterim] = useState("");
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike>(null);
  const startTimeRef = useRef<number>(0);
  const tickRef = useRef<number | null>(null);
  const finalTextRef = useRef<string>("");

  useEffect(() => () => {
    cleanup();
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function cleanup() {
    if (tickRef.current) { window.clearInterval(tickRef.current); tickRef.current = null; }
    if (recognitionRef.current) { try { recognitionRef.current.stop(); } catch {} recognitionRef.current = null; }
    if (mediaRef.current && mediaRef.current.state !== "inactive") { try { mediaRef.current.stop(); } catch {} }
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
  }

  async function start() {
    setError(null);
    setTranscript(""); setInterim(""); setAudioBlob(null);
    if (audioUrl) { URL.revokeObjectURL(audioUrl); setAudioUrl(null); }
    finalTextRef.current = "";
    chunksRef.current = [];
    setDuration(0);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mr = new MediaRecorder(stream);
      mediaRef.current = mr;
      mr.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: chunksRef.current[0]?.type || "audio/webm" });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
      };
      mr.start();

      // Web Speech API (best-effort)
      const SR: any = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SR) {
        const rec = new SR();
        rec.lang = "en-US";
        rec.continuous = true;
        rec.interimResults = true;
        rec.onresult = (e: any) => {
          let interimText = "";
          for (let i = e.resultIndex; i < e.results.length; i++) {
            const r = e.results[i];
            if (r.isFinal) finalTextRef.current += r[0].transcript + " ";
            else interimText += r[0].transcript;
          }
          setTranscript(finalTextRef.current.trim());
          setInterim(interimText);
        };
        rec.onerror = () => {};
        try { rec.start(); recognitionRef.current = rec; } catch {}
      }

      startTimeRef.current = Date.now();
      tickRef.current = window.setInterval(() => {
        setDuration(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 250);

      setState("recording");
    } catch (e: any) {
      setError(e?.message || "Microphone access denied.");
    }
  }

  function stop() {
    if (tickRef.current) { window.clearInterval(tickRef.current); tickRef.current = null; }
    if (recognitionRef.current) { try { recognitionRef.current.stop(); } catch {} recognitionRef.current = null; }
    if (mediaRef.current && mediaRef.current.state === "recording") mediaRef.current.stop();
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
    setInterim("");
    setState("stopped");
  }

  function reset() {
    cleanup();
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioBlob(null); setAudioUrl(null);
    setTranscript(""); setInterim(""); setDuration(0); setState("idle"); setError(null);
    finalTextRef.current = "";
  }

  function setManualTranscript(t: string) {
    finalTextRef.current = t;
    setTranscript(t);
  }

  return { state, audioBlob, audioUrl, transcript, interim, duration, error, start, stop, reset, setManualTranscript };
}
