// Lightweight speech analysis heuristics. Replace with a remote model later.
export type Feedback = { title: string; detail: string; severity: "good" | "warn" | "bad" };

export type AnalysisInput = {
  transcript: string;
  durationSeconds: number;
};

export type Analysis = {
  wpm: number;
  fillerCount: number;
  avgSentenceLength: number;
  clarity: number;
  pace: number;
  filler: number;
  structure: number;
  overall: number;
  feedback: Feedback[];
};

const FILLERS = [
  "um", "uh", "uhm", "erm", "like", "you know", "sort of", "kind of",
  "basically", "actually", "literally", "i mean", "so yeah",
];

const OPENERS = ["first", "today", "let me", "i want to", "the question", "to start", "the key", "here's"];
const CONNECTORS = ["because", "however", "therefore", "for example", "in short", "as a result", "next", "then", "finally"];
const CLOSERS = ["in summary", "to conclude", "the takeaway", "bottom line", "that's why", "in short", "finally"];

const clamp = (n: number, min = 0, max = 100) => Math.max(min, Math.min(max, n));

export function analyse({ transcript, durationSeconds }: AnalysisInput): Analysis {
  const text = (transcript || "").trim();
  const lower = text.toLowerCase();
  const words = text ? text.split(/\s+/).filter(Boolean) : [];
  const wordCount = words.length;
  const minutes = Math.max(durationSeconds, 1) / 60;
  const wpm = Math.round(wordCount / minutes);

  // Filler count
  let fillerCount = 0;
  for (const f of FILLERS) {
    const re = new RegExp(`\\b${f.replace(/ /g, "\\s+")}\\b`, "gi");
    const m = lower.match(re);
    if (m) fillerCount += m.length;
  }

  // Sentence stats
  const sentences = text.split(/[.!?]+/).map(s => s.trim()).filter(Boolean);
  const avgSentenceLength = sentences.length
    ? +(wordCount / sentences.length).toFixed(1)
    : wordCount;

  // Pace score: ideal 130-160 WPM
  let pace = 100;
  if (wpm === 0) pace = 0;
  else if (wpm < 110) pace = clamp(100 - (110 - wpm) * 1.6);
  else if (wpm > 175) pace = clamp(100 - (wpm - 175) * 1.4);
  else if (wpm < 130 || wpm > 160) pace = 88;

  // Filler score: per 100 words
  const fillerRate = wordCount ? (fillerCount / wordCount) * 100 : 0;
  const filler = clamp(100 - fillerRate * 12);

  // Clarity: sentence length penalty + filler penalty
  let clarity = 100;
  if (avgSentenceLength > 22) clarity -= (avgSentenceLength - 22) * 3.5;
  if (avgSentenceLength < 6 && wordCount > 20) clarity -= (6 - avgSentenceLength) * 4;
  clarity -= fillerRate * 6;
  clarity = clamp(clarity);

  // Structure: opener / connector / closer signals
  const hasOpener = OPENERS.some(o => lower.startsWith(o)) || sentences[0]?.split(" ").length <= 14;
  const connectorHits = CONNECTORS.reduce((a, c) => a + (lower.includes(c) ? 1 : 0), 0);
  const hasCloser = CLOSERS.some(c => lower.includes(c)) || /\.\s*$/.test(text);
  let structure = 40;
  if (hasOpener) structure += 22;
  structure += Math.min(connectorHits * 8, 24);
  if (hasCloser) structure += 14;
  if (wordCount < 12) structure = Math.min(structure, 45);
  structure = clamp(structure);

  // Overall weighted
  const overall = Math.round(clarity * 0.3 + pace * 0.25 + filler * 0.25 + structure * 0.2);

  // Feedback
  const feedback: Feedback[] = [];
  if (wpm === 0) feedback.push({ title: "No speech detected", detail: "We couldn't hear you clearly. Move closer to the mic and try again.", severity: "bad" });
  else if (wpm > 175) feedback.push({ title: `Pace averaged ${wpm} WPM`, detail: "Slow down toward 140 WPM. Add deliberate pauses between ideas.", severity: "warn" });
  else if (wpm < 110) feedback.push({ title: `Pace averaged ${wpm} WPM`, detail: "Pick up energy. Aim for 130–155 WPM to hold attention.", severity: "warn" });
  else feedback.push({ title: `Pace averaged ${wpm} WPM`, detail: "Pace is in the credible range. Keep variation between fast and slow phrases.", severity: "good" });

  if (fillerCount >= 4) feedback.push({ title: `${fillerCount} filler words used`, detail: "Replace fillers with a one-second pause. Pauses signal authority.", severity: fillerCount > 7 ? "bad" : "warn" });
  else feedback.push({ title: `${fillerCount} filler words`, detail: "Filler discipline is strong. Hold the line.", severity: "good" });

  if (avgSentenceLength > 22) feedback.push({ title: `Sentences averaged ${avgSentenceLength} words`, detail: "Aim for 12–16 words per sentence. Break long ideas with full stops.", severity: "warn" });
  else if (wordCount > 20 && avgSentenceLength < 6) feedback.push({ title: "Sentences are very short", detail: "Combine ideas to avoid sounding choppy. Target 12–16 words.", severity: "warn" });

  if (!hasOpener) feedback.push({ title: "Opening lacked structure", detail: "Lead with a clear thesis line. Tell the listener what's coming.", severity: "warn" });
  if (!hasCloser && wordCount > 30) feedback.push({ title: "No clear landing", detail: "End with a single takeaway sentence. Don't trail off.", severity: "warn" });

  return { wpm, fillerCount, avgSentenceLength, clarity: Math.round(clarity), pace: Math.round(pace), filler: Math.round(filler), structure: Math.round(structure), overall, feedback };
}
