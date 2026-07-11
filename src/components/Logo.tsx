"use client";

// Logo EMZEE recreat ca SVG (blocky, Z roșu). Fundal transparent.
// Părțile negre folosesc currentColor (se adaptează la temă); Z e roșu fix.
const RED = "#ef3e3e";

export function Logo({ className, red = RED }: { className?: string; red?: string }) {
  const t = 26;      // grosime bară
  const w = 88;      // lățime glifă
  const h = 200;     // înălțime
  const adv = 112;   // avans între glife

  const E = (x: number, mirror = false) => {
    const stemX = mirror ? x + w - t : x;
    const midX = mirror ? x + w * 0.26 : x;
    const midW = w * 0.74;
    return (
      <g key={x}>
        <rect x={stemX} y={0} width={t} height={h} />
        <rect x={x} y={0} width={w} height={t} />
        <rect x={midX} y={(h - t) / 2} width={midW} height={t} />
        <rect x={x} y={h - t} width={w} height={t} />
      </g>
    );
  };

  const M = (x: number) => (
    <g key={x}>
      <rect x={x} y={0} width={t} height={h} />
      <rect x={x + w - t} y={0} width={t} height={h} />
      <rect x={x} y={0} width={w} height={t} />
      <rect x={x + (w - t) / 2} y={0} width={t} height={h * 0.52} />
    </g>
  );

  const Z = (x: number) => (
    <g key={x} fill={red}>
      <rect x={x} y={0} width={w} height={t} />
      <rect x={x} y={h - t} width={w} height={t} />
      <polygon points={`${x + w - t},${t} ${x + w},${t} ${x + t},${h - t} ${x},${h - t}`} />
    </g>
  );

  return (
    <svg viewBox="0 0 536 200" className={className} fill="currentColor" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="EMZEE">
      {E(0)}
      {M(adv)}
      {Z(adv * 2)}
      {E(adv * 3, true)}
      {E(adv * 4, true)}
    </svg>
  );
}
