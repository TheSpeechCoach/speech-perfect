export const READ_PASSAGES = [
  "Clarity is a discipline. Choose your words. Land your sentences. Then stop talking. Each pause is a chance for the listener to catch up, and each pause is a chance for you to think one step ahead.",
  "Confidence is not volume. Confidence is the absence of hesitation. The voice that lands in a room is the one that knows where it is going. Begin with a thesis. Support it with two points. Close cleanly.",
  "Speak as if every sentence costs money. Cut filler. Cut repetition. Cut the throat-clearing. Say the thing once, with weight, and move on.",
];

export const PROMPTS = [
  "Explain what you do for work in 30 seconds, as if to a smart stranger.",
  "Describe a recent challenge and how you solved it.",
  "Why should someone trust your judgement?",
  "Give a status update on a project to a sceptical executive.",
  "Pitch an idea you've been sitting on for a while.",
  "Disagree with a colleague's plan without being defensive.",
];

export const REPHRASE_TARGETS = [
  { messy: "Basically, what we're trying to do, sort of, is leverage our cross-functional synergies to ideate a kind of go-forward strategy that, you know, aligns stakeholders.", hint: "Strip jargon. One idea per sentence." },
  { messy: "I mean, like, the thing is, we kind of need to maybe think about possibly revisiting the timeline because of, you know, certain dependencies that aren't quite resolved yet.", hint: "Cut hedges. State the ask." },
  { messy: "So, um, what I would say is that, basically, the data sort of suggests that there might be, like, an opportunity for us to, you know, double down on this segment.", hint: "Lead with the takeaway." },
];

export function pickOne<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }
