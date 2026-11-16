import React from 'react';
import PatternGlyph, { patternNumber } from './PatternGlyph';

const SPLINE = '.6 0 .4 1;.6 0 .4 1;.6 0 .4 1;.6 0 .4 1;.6 0 .4 1;.6 0 .4 1';
const TIMES = '0;.16;.33;.5;.66;.83;1';
const BARS: Array<[number, number]> = [
  [24, 60], [50, 90], [76, 50], [102, 120], [128, 80], [154, 140], [180, 70],
  [206, 100], [232, 130], [258, 60], [284, 90], [310, 110], [336, 50], [362, 80],
];

/** Drawing for Sliding Window: a variable window whose right edge only moves forward. */
function WindowFigure() {
  return (
    <svg
      viewBox="0 0 420 270"
      width="100%"
      role="img"
      aria-label="A variable window grows and shrinks across a row of bars while its right edge only moves forward"
      style={{ display: 'block' }}
    >
      <g stroke="rgba(233,228,216,.12)" strokeWidth="1">
        <line x1="20" y1="40" x2="400" y2="40" />
        <line x1="20" y1="90" x2="400" y2="90" />
        <line x1="20" y1="140" x2="400" y2="140" />
      </g>
      <line x1="14" y1="210" x2="406" y2="210" stroke="rgba(233,228,216,.55)" strokeWidth="1.2" />
      <g fill="rgba(233,228,216,.05)" stroke="rgba(233,228,216,.55)" strokeWidth="1">
        {BARS.map(([x, h]) => (
          <rect key={x} x={x} y={210 - h} width={20} height={h} />
        ))}
      </g>
      <g>
        <animate attributeName="opacity" values="0;1;1;1;0" keyTimes="0;.05;.9;.96;1" dur="12s" repeatCount="indefinite" />
        <rect x="18" y="52" width="84" height="168" rx="3" fill="rgba(233,228,216,.07)" stroke="#e9e4d8" strokeWidth="1.4">
          <animate attributeName="x" values="18;18;44;96;96;174;226" keyTimes={TIMES} dur="12s" repeatCount="indefinite" calcMode="spline" keySplines={SPLINE} />
          <animate attributeName="width" values="84;136;162;136;188;162;162" keyTimes={TIMES} dur="12s" repeatCount="indefinite" calcMode="spline" keySplines={SPLINE} />
        </rect>
        <circle cx="102" cy="46" r="5" className="fill-accent">
          <animate attributeName="cx" values="102;154;206;232;284;336;388" keyTimes={TIMES} dur="12s" repeatCount="indefinite" calcMode="spline" keySplines={SPLINE} />
        </circle>
        <text x="18" y="238" fontFamily="JetBrains Mono, monospace" fontSize="11" fill="#9a9488">
          l
          <animate attributeName="x" values="18;18;44;96;96;174;226" keyTimes={TIMES} dur="12s" repeatCount="indefinite" calcMode="spline" keySplines={SPLINE} />
        </text>
        <text x="96" y="238" fontFamily="JetBrains Mono, monospace" fontSize="11" fill="#9a9488">
          r
          <animate attributeName="x" values="96;148;200;226;278;330;382" keyTimes={TIMES} dur="12s" repeatCount="indefinite" calcMode="spline" keySplines={SPLINE} />
        </text>
      </g>
    </svg>
  );
}

/**
 * A framed "plate": the pattern's mechanism drawn large, with printer's
 * registration marks at the corners and a one-line caption underneath.
 */
export default function PatternPlate({
  patternId,
  name,
  note,
}: {
  patternId: string;
  name: string;
  note?: string;
}) {
  const n = patternNumber(patternId);
  return (
    <figure className="m-0">
      <div className="plate">
        <i className="rg a" />
        <i className="rg b" />
        <i className="rg c" />
        <i className="rg d" />
        {n === 3 ? (
          <WindowFigure />
        ) : (
          <div className="flex items-center justify-center py-12">
            <PatternGlyph patternId={patternId} live className="w-52 h-52 sm:w-60 sm:h-60" />
          </div>
        )}
      </div>
      <figcaption className="mt-4 flex items-baseline justify-between gap-4">
        <span className="lbl">PLATE {String(n || 0).padStart(2, '0')}</span>
        <span className="font-serif italic text-[20px] text-text-primary">{name}</span>
        <span className="lbl truncate">{note}</span>
      </figcaption>
    </figure>
  );
}
