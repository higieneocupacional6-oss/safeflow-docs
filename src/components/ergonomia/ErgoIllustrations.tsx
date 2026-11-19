import type { ReactNode } from "react";

/** Ilustrações SVG leves para orientação visual ROSA / OCRA. */

export function IlustracaoCadeira({ className = "h-24 w-full" }: { className?: string }) {
  return (
    <svg viewBox="0 0 160 100" className={className} aria-hidden>
      <rect x="48" y="28" width="64" height="10" rx="2" fill="currentColor" opacity="0.15" />
      <path d="M52 28 V18 Q80 8 108 18 V28" fill="currentColor" opacity="0.25" />
      <rect x="54" y="38" width="8" height="28" rx="1" fill="currentColor" opacity="0.35" />
      <rect x="98" y="38" width="8" height="28" rx="1" fill="currentColor" opacity="0.35" />
      <rect x="48" y="38" width="64" height="8" rx="2" fill="currentColor" opacity="0.45" />
      <line x1="80" y1="46" x2="80" y2="78" stroke="currentColor" strokeWidth="3" opacity="0.4" />
      <ellipse cx="80" cy="82" rx="28" ry="6" fill="currentColor" opacity="0.2" />
      <circle cx="28" cy="55" r="10" fill="currentColor" opacity="0.12" />
      <path d="M28 65 V88 M20 88 H36" stroke="currentColor" strokeWidth="2" opacity="0.35" />
      <path d="M28 70 H48" stroke="currentColor" strokeWidth="2" opacity="0.3" strokeDasharray="3 2" />
    </svg>
  );
}

export function IlustracaoEstacao({ className = "h-28 w-full" }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 110" className={className} aria-hidden>
      <rect x="70" y="18" width="70" height="42" rx="3" fill="currentColor" opacity="0.18" />
      <rect x="78" y="26" width="54" height="28" rx="1" fill="currentColor" opacity="0.08" />
      <rect x="98" y="60" width="14" height="8" fill="currentColor" opacity="0.25" />
      <rect x="40" y="68" width="130" height="6" rx="1" fill="currentColor" opacity="0.35" />
      <rect x="55" y="78" width="48" height="10" rx="2" fill="currentColor" opacity="0.3" />
      <ellipse cx="130" cy="83" rx="10" ry="7" fill="currentColor" opacity="0.35" />
      <rect x="155" y="72" width="12" height="20" rx="2" fill="currentColor" opacity="0.25" />
      <circle cx="28" cy="48" r="9" fill="currentColor" opacity="0.15" />
      <path d="M28 57 V90 M18 90 H38 M28 70 H55" stroke="currentColor" strokeWidth="2" opacity="0.35" />
    </svg>
  );
}

export function IlustracaoMonitor({ className = "h-20 w-full" }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 80" className={className} aria-hidden>
      <rect x="25" y="10" width="70" height="45" rx="3" fill="currentColor" opacity="0.2" />
      <rect x="32" y="16" width="56" height="33" fill="currentColor" opacity="0.08" />
      <rect x="52" y="55" width="16" height="8" fill="currentColor" opacity="0.3" />
      <rect x="40" y="63" width="40" height="4" rx="1" fill="currentColor" opacity="0.35" />
      <path d="M10 40 L25 32" stroke="currentColor" strokeWidth="1.5" opacity="0.4" markerEnd="url(#a)" />
      <text x="4" y="52" fontSize="7" fill="currentColor" opacity="0.5">olhos</text>
    </svg>
  );
}

export function IlustracaoMembros({ className = "h-24 w-full" }: { className?: string }) {
  return (
    <svg viewBox="0 0 160 100" className={className} aria-hidden>
      <circle cx="80" cy="18" r="10" fill="currentColor" opacity="0.2" />
      <path d="M80 28 V55" stroke="currentColor" strokeWidth="4" opacity="0.3" />
      <path d="M80 35 L45 55 L35 78" stroke="currentColor" strokeWidth="3.5" fill="none" opacity="0.45" />
      <path d="M80 35 L115 52 L130 72" stroke="currentColor" strokeWidth="3.5" fill="none" opacity="0.35" />
      <ellipse cx="32" cy="82" rx="10" ry="6" fill="currentColor" opacity="0.35" />
      <ellipse cx="132" cy="76" rx="10" ry="6" fill="currentColor" opacity="0.25" />
      <text x="8" y="98" fontSize="7" fill="currentColor" opacity="0.45">ombro · cotovelo · punho · mão</text>
    </svg>
  );
}

export function DicaErgo({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-md bg-muted/60 px-2.5 py-1.5 text-[11px] leading-relaxed text-muted-foreground">
      {children}
    </p>
  );
}
