// Server-side speech analysis for SpeechOS.
// Deterministic heuristics per product spec.
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";

type AnalysisInput = { transcript: string; durationSeconds: number };

type AnalysisResult = {
  wordsPerMinute: number;
  fillerCount: number;
  avgSentenceLength: number;
  paceScore: number;
  fillerScore: number;
  clarityScore: number;
  structureScore: number;
  overallScore: number;
  feedback: string[];
};

const FILLERS = ["um", "uh", "like", "you know", "sort of", "kind of", "basically"];
const OPENERS = ["today", "i want to", "the key point", "my view is", "let me explain"];
const CONNECTORS = ["first", "second", "because", "therefore", "for example", "however"];
const CLOSERS = ["so", "that is why", "in short", "in summary", "the point is"];

function countFillers(lower: string): number {
  let count = 0;
  for (const f of FILLERS) {
    const re = new RegExp(`\\b${f.replace(/ /g, "\\s+")}\\b`, "gi");
    const m = lower.match(re);
    if (m) count += m.length;
  }
  return count;
}

function paceScoreFor(wpm: number): number {
  if (wpm < 90 || wpm > 210) return 30;
  if (wpm >= 130 && wpm <= 160) return 100;
  if ((wpm >= 120 && wpm <= 129) || (wpm >= 161 && wpm <= 170)) return 85;
  if ((wpm >= 110 && wpm <= 119) || (wpm >= 171 && wpm <= 180)) return 70;
  return 50;
}

function clarityScoreFor(avgLen: number, fillerCount: number, wordCount: number): number {
  // Sentence-length component (0-100)
  let lenScore: number;
  if (avgLen >= 12 && avgLen <= 16) lenScore = 100;
  else if (avgLen >= 17 && avgLen <= 20) lenScore = 80;
  else if (avgLen >= 21 && avgLen <= 25) lenScore = 60;
  else if (avgLen > 25) lenScore = 35;
  else if (avgLen >= 8 && avgLen < 12) lenScore = 80;
  else lenScore = 55; // very short

  // Filler burden per 100 words
  const burden = wordCount ? (fillerCount / wordCount) * 100 : 0;
  const burdenPenalty = Math.min(burden * 4, 60);

  return Math.max(0, Math.min(100, Math.round(lenScore - burdenPenalty)));
}

function structureScoreFor(text: string, lower: string, sentenceCount: number): number {
  let score = 0;
  if (OPENERS.some((o) => lower.startsWith(o))) score += 25;
  if (CONNECTORS.some((c) => new RegExp(`\\b${c}\\b`, "i").test(lower))) score += 25;
  const trimmedLower = lower.trim().replace(/[.!?]+$/, "").trim();
  if (CLOSERS.some((c) => trimmedLower.endsWith(c))) score += 25;
  if (sentenceCount > 3) score += 25;
  return score;
}

export function analyseSpeech({ transcript, durationSeconds }: AnalysisInput): AnalysisResult {
  const text = (transcript || "").trim();
  const lower = text.toLowerCase();
  const words = text ? text.split(/\s+/).filter(Boolean) : [];
  const wordCount = words.length;
  const minutes = Math.max(durationSeconds, 1) / 60;
  const wordsPerMinute = Math.round(wordCount / minutes);

  const fillerCount = countFillers(lower);

  const sentences = text.split(/[.!?]+/).map((s) => s.trim()).filter(Boolean);
  const avgSentenceLength = sentences.length
    ? +(wordCount / sentences.length).toFixed(1)
    : wordCount;

  const paceScore = paceScoreFor(wordsPerMinute);
  const fillerScore = Math.max(20, 100 - fillerCount * 5);
  const clarityScore = clarityScoreFor(avgSentenceLength, fillerCount, wordCount);
  const structureScore = structureScoreFor(text, lower, sentences.length);

  const overallScore = Math.round(
    clarityScore * 0.30 +
    paceScore * 0.25 +
    fillerScore * 0.20 +
    structureScore * 0.25
  );

  const feedback: string[] = [];
  if (wordsPerMinute === 0) {
    feedback.push("No speech detected. Check your microphone and try again.");
  } else if (wordsPerMinute > 180) {
    feedback.push(`Your pace averaged ${wordsPerMinute} WPM. Slow down so the listener can process the message.`);
  } else if (wordsPerMinute < 110) {
    feedback.push(`Your pace averaged ${wordsPerMinute} WPM. Pick up energy and aim for 130–160 WPM.`);
  } else if (wordsPerMinute < 130 || wordsPerMinute > 160) {
    feedback.push(`Your pace averaged ${wordsPerMinute} WPM. Tighten toward the 130–160 WPM range for credibility.`);
  } else {
    feedback.push(`Your pace of ${wordsPerMinute} WPM is in the credible range.`);
  }

  if (fillerCount >= 5) {
    feedback.push(`You used ${fillerCount} filler words. Replace fillers with silence.`);
  } else if (fillerCount > 0) {
    feedback.push(`You used ${fillerCount} filler words. A short pause is stronger than “um”.`);
  }

  if (avgSentenceLength > 25) {
    feedback.push(`Your average sentence length was ${avgSentenceLength} words. Shorten your sentences for better clarity.`);
  } else if (avgSentenceLength > 20) {
    feedback.push(`Your sentences averaged ${avgSentenceLength} words. Aim for 12–16 words.`);
  }

  if (structureScore <= 25) {
    feedback.push("Your response needs a cleaner opening and a firmer ending.");
  } else if (structureScore <= 50) {
    feedback.push("Strengthen structure with a clear opening line, connectors, and a closing takeaway.");
  }

  return {
    wordsPerMinute,
    fillerCount,
    avgSentenceLength,
    paceScore,
    fillerScore,
    clarityScore,
    structureScore,
    overallScore,
    feedback,
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => null);
    if (
      !body ||
      typeof body.transcript !== "string" ||
      typeof body.durationSeconds !== "number" ||
      !isFinite(body.durationSeconds) ||
      body.durationSeconds < 0
    ) {
      return new Response(
        JSON.stringify({ error: "Body must be { transcript: string, durationSeconds: number }" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const result = analyseSpeech({
      transcript: body.transcript,
      durationSeconds: body.durationSeconds,
    });

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message ?? "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
