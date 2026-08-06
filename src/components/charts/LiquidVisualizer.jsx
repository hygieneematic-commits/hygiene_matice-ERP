import { motion } from "framer-motion";

const PALETTE = ["#4338CA", "#06B6D4", "#10B981", "#F59E0B", "#EC4899", "#8B5CF6", "#0EA5E9", "#F43F5E", "#14B8A6", "#F97316"];

export default function LiquidVisualizer({ ingredients, batchLiters }) {
  const total = ingredients.reduce((sum, i) => sum + i.scaledBaseQty, 0) || 1;
  let cumulative = 0;
  const bands = ingredients.map((ing, idx) => {
    const fraction = ing.scaledBaseQty / total;
    const start = cumulative;
    cumulative += fraction;
    return { ...ing, fraction, start, color: PALETTE[idx % PALETTE.length] };
  });

  const cylX = 60;
  const cylWidth = 120;
  const cylTop = 20;
  const cylHeight = 280;

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 240 340" className="w-full max-w-[220px]" role="img" aria-label="Formula composition graduated cylinder">
        {/* graduation marks */}
        {[0, 0.25, 0.5, 0.75, 1].map((g) => (
          <g key={g}>
            <line
              x1={cylX - 8}
              y1={cylTop + cylHeight * (1 - g)}
              x2={cylX}
              y2={cylTop + cylHeight * (1 - g)}
              stroke="#94A3B8"
              strokeWidth="1.5"
            />
            <text x={cylX - 12} y={cylTop + cylHeight * (1 - g) + 4} fontSize="9" fill="#94A3B8" textAnchor="end" fontFamily="JetBrains Mono, monospace">
              {Math.round(batchLiters * g * 100) / 100}L
            </text>
          </g>
        ))}

        {/* cylinder outline */}
        <rect x={cylX} y={cylTop} width={cylWidth} height={cylHeight} rx="10" fill="#FFFFFF" stroke="#D8DCEC" strokeWidth="2" />

        {/* liquid bands, clipped to cylinder shape */}
        <clipPath id="cylClip">
          <rect x={cylX} y={cylTop} width={cylWidth} height={cylHeight} rx="10" />
        </clipPath>
        <g clipPath="url(#cylClip)">
          {bands.map((band, idx) => (
            <motion.rect
              key={band.id || idx}
              x={cylX}
              width={cylWidth}
              initial={false}
              animate={{
                y: cylTop + cylHeight * (1 - band.start - band.fraction),
                height: cylHeight * band.fraction,
              }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              fill={band.color}
              opacity={0.88}
            />
          ))}
        </g>
        <rect x={cylX} y={cylTop} width={cylWidth} height={cylHeight} rx="10" fill="none" stroke="#D8DCEC" strokeWidth="2" />

        {/* neck */}
        <rect x={cylX + 30} y={cylTop - 14} width={cylWidth - 60} height="16" rx="4" fill="#FFFFFF" stroke="#D8DCEC" strokeWidth="2" />
      </svg>

      <div className="w-full mt-2 space-y-1.5 max-h-[180px] overflow-y-auto scrollbar-none pr-1">
        {bands.map((band, idx) => (
          <div key={band.id || idx} className="flex items-center gap-2 text-xs">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: band.color }} />
            <span className="text-ink-600 flex-1 truncate">{band.rawMaterialName}</span>
            <span className="text-ink-400 font-mono">{Math.round(band.fraction * 1000) / 10}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
