import React from 'react';

/**
 * One line drawing per pattern: a tiny diagram of the mechanism, with a single
 * moving point in the accent colour. Purely decorative (aria-hidden). The point
 * rests until the nearest `.group` is hovered, or always moves when `live`.
 */

type Vars = React.CSSProperties;

const mv = (dx: number, dy: number): Vars =>
  ({ ['--dx' as string]: `${dx}px`, ['--dy' as string]: `${dy}px` } as Vars);

/** "pattern-07" -> 7. Returns 0 when the id carries no trailing number. */
export function patternNumber(patternId: string): number {
  const m = /(\d+)$/.exec(patternId);
  return m ? parseInt(m[1], 10) : 0;
}

const Dot = ({ cx, cy, dx, dy, r = 3 }: { cx: number; cy: number; dx: number; dy: number; r?: number }) => (
  <circle className="pg-d pg-m" cx={cx} cy={cy} r={r} style={mv(dx, dy)} />
);

const L = (props: React.SVGProps<SVGLineElement>) => <line className="pg-l" {...props} />;
const R = (props: React.SVGProps<SVGRectElement>) => <rect className="pg-l" {...props} />;
const C = (props: React.SVGProps<SVGCircleElement>) => <circle className="pg-l" {...props} />;

function shapes(n: number): React.ReactNode {
  switch (n) {
    case 1: // Arrays and Hashing
      return (
        <>
          {[4, 12, 20, 28, 36].map((x) => <R key={x} x={x} y={20} width={8} height={8} />)}
          <Dot cx={8} cy={12} dx={32} dy={0} />
        </>
      );
    case 2: // Two Pointers
      return (
        <>
          <L x1={4} y1={26} x2={44} y2={26} />
          <L x1={4} y1={20} x2={4} y2={32} />
          <L x1={44} y1={20} x2={44} y2={32} />
          <Dot cx={6} cy={26} dx={16} dy={0} />
          <Dot cx={42} cy={26} dx={-16} dy={0} />
        </>
      );
    case 3: // Sliding Window
      return (
        <>
          <L x1={3} y1={40} x2={45} y2={40} />
          <R x={6} y={30} width={4} height={10} />
          <R x={14} y={22} width={4} height={18} />
          <R x={22} y={28} width={4} height={12} />
          <R x={30} y={18} width={4} height={22} />
          <R x={38} y={26} width={4} height={14} />
          <rect className="pg-l pg-m" x={3} y={12} width={18} height={30} rx={2} style={mv(21, 0)} />
          <Dot cx={21} cy={9} dx={21} dy={0} />
        </>
      );
    case 4: // Prefix Sum
      return (
        <>
          <L x1={3} y1={42} x2={45} y2={42} />
          <R x={6} y={34} width={6} height={8} />
          <R x={15} y={28} width={6} height={14} />
          <R x={24} y={20} width={6} height={22} />
          <R x={33} y={10} width={6} height={32} />
          <Dot cx={9} cy={28} dx={24} dy={-22} />
        </>
      );
    case 5: // Binary Search
      return (
        <>
          <R x={4} y={20} width={40} height={16} />
          <L x1={24} y1={14} x2={24} y2={42} />
          <Dot cx={14} cy={28} dx={20} dy={0} />
        </>
      );
    case 6: // Stack and Monotonic Stack
      return (
        <>
          <R x={14} y={32} width={20} height={8} />
          <R x={14} y={23} width={20} height={8} />
          <R x={14} y={14} width={20} height={8} />
          <Dot cx={24} cy={5} dx={0} dy={5} />
        </>
      );
    case 7: // Linked Lists
      return (
        <>
          <C cx={8} cy={28} r={4} />
          <C cx={24} cy={28} r={4} />
          <C cx={40} cy={28} r={4} />
          <L x1={12} y1={28} x2={20} y2={28} />
          <L x1={28} y1={28} x2={36} y2={28} />
          <Dot cx={8} cy={16} dx={32} dy={0} />
        </>
      );
    case 8: // Heap and Priority Queue
      return (
        <>
          <L x1={24} y1={10} x2={12} y2={26} />
          <L x1={24} y1={10} x2={36} y2={26} />
          <L x1={12} y1={26} x2={6} y2={40} />
          <L x1={12} y1={26} x2={18} y2={40} />
          <C cx={24} cy={10} r={4} />
          <C cx={12} cy={26} r={4} />
          <C cx={36} cy={26} r={4} />
          <Dot cx={24} cy={10} dx={-12} dy={16} r={2.6} />
        </>
      );
    case 9: // Intervals
      return (
        <>
          <R x={4} y={10} width={20} height={5} />
          <R x={16} y={20} width={24} height={5} />
          <R x={30} y={30} width={14} height={5} />
          <Dot cx={4} cy={42} dx={40} dy={0} />
        </>
      );
    case 10: // Trees
      return (
        <>
          <L x1={24} y1={8} x2={12} y2={24} />
          <L x1={24} y1={8} x2={36} y2={24} />
          <L x1={12} y1={24} x2={6} y2={40} />
          <L x1={12} y1={24} x2={18} y2={40} />
          <C cx={24} cy={8} r={3.5} />
          <C cx={12} cy={24} r={3.5} />
          <C cx={36} cy={24} r={3.5} />
          <C cx={6} cy={40} r={3.5} />
          <C cx={18} cy={40} r={3.5} />
          <Dot cx={24} cy={8} dx={-18} dy={32} r={2.6} />
        </>
      );
    case 11: // Graphs
      return (
        <>
          <L x1={8} y1={12} x2={24} y2={24} />
          <L x1={40} y1={10} x2={24} y2={24} />
          <L x1={10} y1={38} x2={24} y2={24} />
          <L x1={38} y1={36} x2={24} y2={24} />
          <L x1={8} y1={12} x2={40} y2={10} />
          <C cx={8} cy={12} r={3} />
          <C cx={40} cy={10} r={3} />
          <C cx={10} cy={38} r={3} />
          <C cx={38} cy={36} r={3} />
          <C cx={24} cy={24} r={3} />
          <Dot cx={8} cy={12} dx={30} dy={24} r={2.6} />
        </>
      );
    case 12: // Backtracking
      return (
        <>
          <L x1={24} y1={8} x2={12} y2={22} />
          <L x1={24} y1={8} x2={36} y2={22} />
          <L x1={12} y1={22} x2={6} y2={38} />
          <L x1={12} y1={22} x2={18} y2={38} />
          <L x1={33} y1={19} x2={39} y2={25} />
          <L x1={39} y1={19} x2={33} y2={25} />
          <Dot cx={24} cy={8} dx={-6} dy={30} r={2.8} />
        </>
      );
    case 13: // Greedy
      return (
        <>
          <polyline className="pg-l" points="4,40 14,40 14,30 24,30 24,20 34,20 34,10 44,10" />
          <Dot cx={4} cy={40} dx={40} dy={-30} />
        </>
      );
    case 14: // Dynamic Programming
      return (
        <>
          {[7, 18, 29].flatMap((x) => [7, 18, 29].map((y) => <R key={`${x}-${y}`} x={x} y={y} width={11} height={11} />))}
          <Dot cx={12.5} cy={12.5} dx={22} dy={22} />
        </>
      );
    case 15: // Bit Manipulation
      return (
        <>
          <R x={4} y={21} width={6} height={6} />
          <rect className="pg-f" x={11} y={21} width={6} height={6} />
          <rect className="pg-f" x={18} y={21} width={6} height={6} />
          <R x={25} y={21} width={6} height={6} />
          <rect className="pg-f" x={32} y={21} width={6} height={6} />
          <R x={39} y={21} width={6} height={6} />
          <Dot cx={7} cy={13} dx={35} dy={0} />
        </>
      );
    case 16: // Tries and String Matching
      return (
        <>
          <L x1={24} y1={8} x2={10} y2={24} />
          <L x1={24} y1={8} x2={24} y2={24} />
          <L x1={24} y1={8} x2={38} y2={24} />
          <L x1={10} y1={24} x2={10} y2={40} />
          <L x1={38} y1={24} x2={38} y2={40} />
          <C cx={24} cy={8} r={3} />
          <C cx={10} cy={24} r={3} />
          <C cx={24} cy={24} r={3} />
          <C cx={38} cy={24} r={3} />
          <Dot cx={24} cy={8} dx={-14} dy={32} r={2.6} />
        </>
      );
    case 17: // Range Query Data Structures
      return (
        <>
          <L x1={4} y1={32} x2={44} y2={32} />
          {[4, 14, 24, 34, 44].map((x) => <L key={x} x1={x} y1={29} x2={x} y2={35} />)}
          <polyline className="pg-l" points="14,24 14,16 34,16 34,24" />
          <Dot cx={14} cy={32} dx={20} dy={0} />
        </>
      );
    case 18: // Recursion and Divide and Conquer
      return (
        <>
          <L x1={4} y1={10} x2={44} y2={10} />
          <L x1={4} y1={26} x2={22} y2={26} />
          <L x1={26} y1={26} x2={44} y2={26} />
          <L x1={4} y1={40} x2={12} y2={40} />
          <L x1={14} y1={40} x2={22} y2={40} />
          <L x1={26} y1={40} x2={34} y2={40} />
          <L x1={36} y1={40} x2={44} y2={40} />
          <Dot cx={24} cy={10} dx={-12} dy={30} />
        </>
      );
    case 19: // Math and Number Theory
      return (
        <>
          <C cx={24} cy={24} r={14} />
          <L x1={24} y1={6} x2={24} y2={10} />
          <g className="pg-orb">
            <circle className="pg-d" cx={38} cy={24} r={3} />
          </g>
        </>
      );
    case 20: // Queue and Deque
      return (
        <>
          {[10, 18, 26, 34].map((x) => <R key={x} x={x} y={20} width={8} height={8} />)}
          <Dot cx={4} cy={24} dx={40} dy={0} />
        </>
      );
    case 21: // Specialized Combined Patterns
      return (
        <>
          <C cx={18} cy={24} r={12} />
          <C cx={30} cy={24} r={12} />
          <Dot cx={18} cy={24} dx={12} dy={0} />
        </>
      );
    default:
      return (
        <>
          <L x1={4} y1={24} x2={44} y2={24} />
          <Dot cx={6} cy={24} dx={36} dy={0} />
        </>
      );
  }
}

export default function PatternGlyph({
  patternId,
  className = 'w-14 h-14',
  live = false,
}: {
  patternId: string;
  className?: string;
  live?: boolean;
}) {
  return (
    <svg
      viewBox="0 0 48 48"
      aria-hidden="true"
      focusable="false"
      className={`pg ${live ? 'pg-live' : ''} ${className}`}
    >
      {shapes(patternNumber(patternId))}
    </svg>
  );
}
