import { createFileRoute } from "@tanstack/react-router";
import { VideoWithCues } from "@/components/VideoWithCues";
import { CUE_PREFIX } from "@/lib/video-cues";

// TEMPORARY test page for the YouTube cue player. Removed after verification.
export const Route = createFileRoute("/cue-harness")({ component: Harness });

const content = CUE_PREFIX + JSON.stringify([
  { at: 8, question: "سؤال تجريبي أول (اختبار تقني للمشغّل)", options: ["اختيار أ", "اختيار ب", "اختيار ج"], correct: 1, explanation: "شرح تجريبي." },
  { at: 20, question: "سؤال تجريبي ثانٍ", options: ["أ", "ب"], correct: 0 },
]);

function Harness() {
  return (
    <div style={{ height: "100dvh", background: "#000" }}>
      <VideoWithCues youtubeId="s3dy0jlzZOI" src="" content={content} isAr />
    </div>
  );
}
