// Static artwork for the certificate: navy bands with wave lines, edge micro-text and the guilloche seal.
// All geometry is generated from fixed formulas so the sheet renders identically on screen and in the PDF export.
const W = 794;
const H = 1123;

const f2 = (n: number) => n.toFixed(2);
const wave = (y: number) => [0, 1, 2].map((k) => {
  const pts: string[] = [];
  for (let x = 0; x <= W; x += 3) pts.push(`${x},${f2(y + 5 * Math.sin((x / 38) * Math.PI * 2 / 2.2 + k * 2.1))}`);
  return pts.join(" ");
});
const TOP_WAVES = wave(18);
const BOTTOM_WAVES = wave(H - 18);

export function CertificateBands() {
  return <>
    <svg className="certificate-bands" width={W} height={H} viewBox={`0 0 ${W} ${H}`} aria-hidden="true">
      <rect x="0" y="0" width={W} height="56" fill="#0f2a63" />
      <line x1="0" x2={W} y1="56" y2="56" stroke="#19b9b5" strokeWidth="1.5" />
      {TOP_WAVES.map((p, i) => <polyline key={`t${i}`} points={p} fill="none" stroke="#7fa3e6" strokeWidth=".5" opacity=".9" />)}
      <rect x="0" y={H - 56} width={W} height="56" fill="#0f2a63" />
      <line x1="0" x2={W} y1={H - 56} y2={H - 56} stroke="#19b9b5" strokeWidth="1.5" />
      {BOTTOM_WAVES.map((p, i) => <polyline key={`b${i}`} points={p} fill="none" stroke="#7fa3e6" strokeWidth=".5" opacity=".9" />)}
    </svg>
  </>;
}

const R = 70;
const CX = 80;
const rosette = (k: number) => {
  const r0 = R - 30;
  const pts: string[] = [];
  for (let i = 0; i <= 1440; i++) {
    const t = (i / 1440) * 2 * Math.PI;
    const r = r0 + 7.5 * Math.sin(t * 18 + (k * Math.PI / 5) * 2);
    pts.push(`${f2(CX + r * Math.cos(t))},${f2(CX + r * Math.sin(t))}`);
  }
  return pts.join(" ");
};
const ROSETTES = [0, 1, 2, 3, 4].map(rosette);
const RING = (() => {
  const pts: string[] = [];
  for (let i = 0; i <= 1440; i++) {
    const t = (i / 1440) * 2 * Math.PI;
    const r = R - 12 + 2.2 * Math.sin(t * 90);
    pts.push(`${f2(CX + r * Math.cos(t))},${f2(CX + r * Math.sin(t))}`);
  }
  return pts.join(" ");
})();
const TICKS = Array.from({ length: 120 }, (_, i) => {
  const a = (i * Math.PI) / 60;
  return [CX + (R + 3) * Math.cos(a), CX + (R + 3) * Math.sin(a), CX + (R + 6) * Math.cos(a), CX + (R + 6) * Math.sin(a)];
});
const RING_TEXT = "ESLAM SELMI · VERIFIED CERTIFICATE · ".repeat(2);
const RING_CHARS = Array.from(RING_TEXT).map((c, i, a) => ({ c, angle: (i * 360) / a.length })).filter((x) => x.c !== " ");

export function CertificateSeal({ logo }: { logo: string }) {
  return <svg className="certificate-seal" viewBox="0 0 160 160" width="156" height="156" aria-hidden="true">
    <circle cx="80" cy="80" r={R + 7} fill="#0f2a63" />
    <circle cx="80" cy="80" r={R + 7.5} fill="none" stroke="#0a1f4d" strokeWidth=".7" />
    {TICKS.map((t, i) => <line key={i} x1={f2(t[0])} y1={f2(t[1])} x2={f2(t[2])} y2={f2(t[3])} stroke="#7fa3e6" strokeWidth=".5" />)}
    {RING_CHARS.map((x, i) => <text key={i} x="80" y={f2(80 - (R - 5))} fontSize="6.6" fontWeight="600" textAnchor="middle" fill="#e6eefc" transform={`rotate(${f2(x.angle)} 80 80)`}>{x.c}</text>)}
    <circle cx="80" cy="80" r={R - 9} fill="#f4f5f2" stroke="#19b9b5" strokeWidth=".8" />
    {ROSETTES.map((p, k) => <polyline key={k} points={p} fill="none" stroke={k % 2 ? "#19b9b5" : "#0a1f4d"} strokeWidth=".4" opacity=".8" />)}
    <polyline points={RING} fill="none" stroke="#0a1f4d" strokeWidth=".4" />
    <circle cx="80" cy="80" r={R - 38} fill="#f4f5f2" stroke="#0a1f4d" strokeWidth=".7" />
    <circle cx="80" cy="80" r={R - 40.5} fill="none" stroke="#19b9b5" strokeWidth=".5" />
    <image href={logo} x="58" y="65" width="44" height="32" />
  </svg>;
}
