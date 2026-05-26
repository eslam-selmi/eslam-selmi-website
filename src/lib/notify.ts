import { toast } from "sonner";

const DEFAULT_DURATION = 4500;

// Generate a short premium "chime" with Web Audio. No external assets.
let audioCtx: AudioContext | null = null;
function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    if (!audioCtx) {
      const Ctx = (window.AudioContext || (window as any).webkitAudioContext) as
        | typeof AudioContext
        | undefined;
      if (!Ctx) return null;
      audioCtx = new Ctx();
    }
    if (audioCtx.state === "suspended") void audioCtx.resume();
    return audioCtx;
  } catch {
    return null;
  }
}

type Tone = "success" | "error" | "info";

function playChime(tone: Tone) {
  const ctx = getCtx();
  if (!ctx) return;
  const now = ctx.currentTime;
  const notes: Record<Tone, number[]> = {
    success: [659.25, 987.77], // E5 -> B5
    info: [523.25, 783.99], // C5 -> G5
    error: [392.0, 261.63], // G4 -> C4
  };
  const seq = notes[tone];
  const master = ctx.createGain();
  master.gain.setValueAtTime(0.0001, now);
  master.gain.exponentialRampToValueAtTime(0.16, now + 0.02);
  master.gain.exponentialRampToValueAtTime(0.0001, now + 0.55);
  master.connect(ctx.destination);

  seq.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, now + i * 0.12);
    g.gain.setValueAtTime(0.0001, now + i * 0.12);
    g.gain.exponentialRampToValueAtTime(0.9, now + i * 0.12 + 0.03);
    g.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.12 + 0.35);
    osc.connect(g).connect(master);
    osc.start(now + i * 0.12);
    osc.stop(now + i * 0.12 + 0.4);
  });
}

export function notifySuccess(msg: string, opts?: { description?: string; silent?: boolean }) {
  if (!opts?.silent) playChime("success");
  toast.success(msg, { description: opts?.description, duration: DEFAULT_DURATION });
}

export function notifyError(msg: string, opts?: { description?: string; silent?: boolean }) {
  if (!opts?.silent) playChime("error");
  toast.error(msg, { description: opts?.description, duration: DEFAULT_DURATION });
}

export function notifyInfo(msg: string, opts?: { description?: string; silent?: boolean }) {
  if (!opts?.silent) playChime("info");
  toast(msg, { description: opts?.description, duration: DEFAULT_DURATION });
}
