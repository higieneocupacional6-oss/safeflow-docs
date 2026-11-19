/** SVGs anatômicos simplificados para seleção visual RULA/REBA/OWAS/NIOSH. */

type SvgProps = { className?: string; accent?: boolean };

const base = "h-16 w-full";

export function SvgBraco({ grau, className = base }: SvgProps & { grau: 1 | 2 | 3 | 4 }) {
  const angles: Record<number, number> = { 1: -10, 2: 35, 3: 60, 4: 100 };
  const a = angles[grau];
  return (
    <svg viewBox="0 0 100 80" className={className} aria-hidden>
      <circle cx="30" cy="20" r="7" fill="currentColor" opacity="0.2" />
      <path d="M30 27 V48" stroke="currentColor" strokeWidth="3.5" opacity="0.35" />
      <g transform={`rotate(${a} 30 35)`}>
        <path d="M30 35 L68 35" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
        <circle cx="70" cy="35" r="4" fill="currentColor" opacity="0.45" />
      </g>
      <text x="4" y="74" fontSize="8" fill="currentColor" opacity="0.5">
        {grau === 1 ? "−20°…+20°" : grau === 2 ? ">20°" : grau === 3 ? "20–45°" : "45–90°+"}
      </text>
    </svg>
  );
}

export function SvgAntebraco({ grau, className = base }: SvgProps & { grau: 1 | 2 }) {
  return (
    <svg viewBox="0 0 100 80" className={className} aria-hidden>
      <path d="M20 40 H48" stroke="currentColor" strokeWidth="4" opacity="0.35" />
      <path
        d={grau === 1 ? "M48 40 L72 28" : "M48 40 L78 55"}
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <circle cx="20" cy="40" r="5" fill="currentColor" opacity="0.25" />
      <text x="4" y="74" fontSize="8" fill="currentColor" opacity="0.5">
        {grau === 1 ? "60–100°" : "<60° ou >100°"}
      </text>
    </svg>
  );
}

export function SvgPunho({ grau, className = base }: SvgProps & { grau: 1 | 2 | 3 }) {
  const tipY = grau === 1 ? 40 : grau === 2 ? 32 : 24;
  return (
    <svg viewBox="0 0 100 80" className={className} aria-hidden>
      <path d="M18 40 H55" stroke="currentColor" strokeWidth="4" opacity="0.35" />
      <path d={`M55 40 L78 ${tipY}`} stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
      <ellipse cx="82" cy={tipY} rx="6" ry="4" fill="currentColor" opacity="0.4" />
      <text x="4" y="74" fontSize="8" fill="currentColor" opacity="0.5">
        {grau === 1 ? "Neutro" : grau === 2 ? "0–15°" : ">15°"}
      </text>
    </svg>
  );
}

export function SvgPescoco({ grau, className = base }: SvgProps & { grau: 1 | 2 | 3 | 4 }) {
  const headY = grau === 4 ? 8 : grau === 1 ? 14 : grau === 2 ? 18 : 24;
  const neck = grau === 4 ? "M50 32 L50 22 L48 14" : `M50 32 L50 ${headY + 8}`;
  return (
    <svg viewBox="0 0 100 80" className={className} aria-hidden>
      <path d="M35 55 H65 L58 32 H42 Z" fill="currentColor" opacity="0.15" />
      <path d={neck} stroke="currentColor" strokeWidth="3" fill="none" />
      <circle cx="50" cy={headY} r="8" fill="currentColor" opacity="0.3" />
      <text x="4" y="74" fontSize="8" fill="currentColor" opacity="0.5">
        {grau === 1 ? "0–10°" : grau === 2 ? "10–20°" : grau === 3 ? ">20°" : "Extensão"}
      </text>
    </svg>
  );
}

export function SvgTronco({ grau, className = base }: SvgProps & { grau: 1 | 2 | 3 | 4 }) {
  const lean = grau === 1 ? 0 : grau === 2 ? 15 : grau === 3 ? 35 : 55;
  return (
    <svg viewBox="0 0 100 80" className={className} aria-hidden>
      <g transform={`rotate(${lean} 50 60)`}>
        <circle cx="50" cy="14" r="7" fill="currentColor" opacity="0.25" />
        <path d="M50 21 V48" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
        <path d="M38 48 H62" stroke="currentColor" strokeWidth="4" />
      </g>
      <path d="M42 60 H58 V72 H42 Z" fill="currentColor" opacity="0.2" />
      <text x="4" y="78" fontSize="8" fill="currentColor" opacity="0.5">
        {grau === 1 ? "Ereto" : grau === 2 ? "0–20°" : grau === 3 ? "20–60°" : ">60°"}
      </text>
    </svg>
  );
}

export function SvgPernas({ grau, className = base }: SvgProps & { grau: 1 | 2 }) {
  return (
    <svg viewBox="0 0 100 80" className={className} aria-hidden>
      <circle cx="50" cy="12" r="6" fill="currentColor" opacity="0.2" />
      <path d="M50 18 V36" stroke="currentColor" strokeWidth="3" opacity="0.35" />
      {grau === 1 ? (
        <>
          <path d="M50 36 L38 68 M50 36 L62 68" stroke="currentColor" strokeWidth="3.5" />
          <path d="M32 68 H44 M56 68 H68" stroke="currentColor" strokeWidth="2.5" />
        </>
      ) : (
        <>
          <path d="M50 36 L40 68" stroke="currentColor" strokeWidth="3.5" />
          <path d="M50 36 L70 50 L66 68" stroke="currentColor" strokeWidth="3.5" opacity="0.45" />
          <path d="M34 68 H46" stroke="currentColor" strokeWidth="2.5" />
        </>
      )}
      <text x="4" y="78" fontSize="8" fill="currentColor" opacity="0.5">
        {grau === 1 ? "Apoiadas" : "Instável / unilateral"}
      </text>
    </svg>
  );
}

export function SvgOwasCostas({ grau, className = base }: SvgProps & { grau: 1 | 2 | 3 | 4 }) {
  const paths: Record<number, string> = {
    1: "M50 18 V52",
    2: "M50 18 Q42 35 50 52",
    3: "M50 18 Q62 30 55 52",
    4: "M50 18 Q35 32 48 52",
  };
  return (
    <svg viewBox="0 0 100 80" className={className} aria-hidden>
      <circle cx="50" cy="12" r="6" fill="currentColor" opacity="0.25" />
      <path d={paths[grau]} stroke="currentColor" strokeWidth="4" fill="none" strokeLinecap="round" />
      <path d="M40 52 H60 V68 H40 Z" fill="currentColor" opacity="0.15" />
    </svg>
  );
}

export function SvgOwasBracos({ grau, className = base }: SvgProps & { grau: 1 | 2 | 3 }) {
  return (
    <svg viewBox="0 0 100 80" className={className} aria-hidden>
      <circle cx="50" cy="14" r="6" fill="currentColor" opacity="0.2" />
      <path d="M50 20 V40" stroke="currentColor" strokeWidth="3" opacity="0.35" />
      <path
        d={grau === 1 ? "M50 28 L28 48 M50 28 L72 48" : grau === 2 ? "M50 28 L28 48 M50 28 L72 12" : "M50 28 L28 12 M50 28 L72 12"}
        stroke="currentColor"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      <line x1="20" y1="28" x2="80" y2="28" stroke="currentColor" strokeWidth="1" strokeDasharray="3 2" opacity="0.35" />
    </svg>
  );
}

export function SvgOwasPernas({ grau, className = base }: SvgProps & { grau: 1 | 2 | 3 | 4 | 5 | 6 | 7 }) {
  const map: Record<number, string> = {
    1: "sentado",
    2: "em pé 2",
    3: "1 perna",
    4: "2 joelhos",
    5: "1 joelho",
    6: "ajoelhado",
    7: "andando",
  };
  return (
    <svg viewBox="0 0 100 80" className={className} aria-hidden>
      <circle cx="50" cy="10" r="5" fill="currentColor" opacity="0.2" />
      <path d="M50 15 V32" stroke="currentColor" strokeWidth="3" opacity="0.3" />
      {grau === 1 && (
        <>
          <rect x="38" y="32" width="24" height="10" rx="2" fill="currentColor" opacity="0.25" />
          <path d="M42 42 V62 M58 42 V62" stroke="currentColor" strokeWidth="3" />
        </>
      )}
      {grau === 2 && <path d="M50 32 L40 68 M50 32 L60 68" stroke="currentColor" strokeWidth="3.5" />}
      {grau === 3 && (
        <>
          <path d="M50 32 L40 68" stroke="currentColor" strokeWidth="3.5" />
          <path d="M50 32 L62 50" stroke="currentColor" strokeWidth="3" opacity="0.4" />
        </>
      )}
      {(grau === 4 || grau === 5) && (
        <path
          d={grau === 4 ? "M50 32 L38 50 L40 68 M50 32 L62 50 L60 68" : "M50 32 L38 50 L40 68 M50 32 L60 68"}
          stroke="currentColor"
          strokeWidth="3.5"
          fill="none"
        />
      )}
      {grau === 6 && <path d="M50 32 L42 55 H58 L50 32 M42 55 V68 M58 55 V68" stroke="currentColor" strokeWidth="3" fill="none" />}
      {grau === 7 && (
        <>
          <path d="M50 32 L36 60 M50 32 L68 48 L62 68" stroke="currentColor" strokeWidth="3.5" />
          <path d="M20 72 H80" stroke="currentColor" strokeWidth="1" strokeDasharray="4 3" opacity="0.3" />
        </>
      )}
      <text x="4" y="78" fontSize="7" fill="currentColor" opacity="0.5">{map[grau]}</text>
    </svg>
  );
}

export function SvgNioshLift({
  mode,
  className = "h-20 w-full",
}: {
  mode: "H" | "V" | "D" | "A" | "F" | "peso";
  className?: string;
}) {
  return (
    <svg viewBox="0 0 140 90" className={className} aria-hidden>
      <circle cx="40" cy="18" r="7" fill="currentColor" opacity="0.2" />
      <path d="M40 25 V48 L28 72 M40 48 L52 72" stroke="currentColor" strokeWidth="3" opacity="0.4" />
      <rect x="70" y={mode === "V" ? 20 : 45} width="28" height="18" rx="2" fill="currentColor" opacity="0.35" />
      {mode === "H" && (
        <>
          <path d="M52 48 H70" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 2" />
          <text x="55" y="44" fontSize="9" fill="currentColor">H</text>
        </>
      )}
      {mode === "V" && (
        <>
          <path d="M105 20 V75" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 2" />
          <text x="108" y="50" fontSize="9" fill="currentColor">V</text>
        </>
      )}
      {mode === "D" && (
        <>
          <path d="M84 45 V28" stroke="currentColor" strokeWidth="2" markerEnd="url(#a)" />
          <text x="88" y="38" fontSize="9" fill="currentColor">D</text>
          <rect x="70" y="20" width="28" height="10" rx="1" fill="currentColor" opacity="0.2" />
        </>
      )}
      {mode === "A" && (
        <>
          <path d="M40 48 Q55 35 70 48" stroke="currentColor" strokeWidth="1.5" fill="none" strokeDasharray="2 2" />
          <text x="50" y="36" fontSize="9" fill="currentColor">A°</text>
        </>
      )}
      {mode === "F" && (
        <text x="68" y="40" fontSize="11" fill="currentColor" opacity="0.7">n×/min</text>
      )}
      {mode === "peso" && (
        <text x="76" y="57" fontSize="10" fontWeight="bold" fill="currentColor">kg</text>
      )}
    </svg>
  );
}
