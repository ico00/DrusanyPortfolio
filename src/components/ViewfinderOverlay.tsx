"use client";

/**
 * Overlay koji simulira pogled kroz Canon DSLR viewfinder / Live View:
 * - Vigneta (tamniji rubovi)
 * - Unutarnji okvir
 * - AF točke (9-point grid), središnja crvena
 * - Info bar na dnu (shutter, exposure scale)
 */
export default function ViewfinderOverlay({ className = "" }: { className?: string }) {
  return (
    <div
      className={`pointer-events-none absolute inset-0 ${className}`}
      aria-hidden
    >
      {/* Vigneta – tamniji rubovi kao kroz optiku */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 75% 65% at 50% 50%, transparent 45%, rgba(0,0,0,0.3) 80%, rgba(0,0,0,0.6) 100%)",
        }}
      />
      {/* Unutarnji okvir – viewfinder crop */}
      <div className="absolute inset-3 border-2 border-white/30" />
      {/* AF točke – 9-point grid (Canon style), središnja crvena */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="grid h-[60%] w-[80%] grid-cols-3 grid-rows-3 place-items-center">
          {[...Array(9)].map((_, i) => {
            const isCenter = i === 4;
            return (
              <div
                key={i}
                className="flex items-center justify-center"
              >
                <div
                  className={`h-2 w-2 border-2 ${
                    isCenter ? "border-red-500" : "border-white/50"
                  }`}
                />
              </div>
            );
          })}
        </div>
      </div>
      {/* Info bar na dnu – shutter, exposure scale */}
      <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-4 rounded bg-black/50 px-3 py-1.5 text-[10px] font-mono text-white/80">
        <span>1/250</span>
        <div className="flex items-center gap-0.5">
          {[-3, -2, -1, 0, 1, 2, 3].map((n) => (
            <span
              key={n}
              className={`w-3 text-center ${n === 0 ? "text-red-500" : "text-white/50"}`}
            >
              {n}
            </span>
          ))}
        </div>
        <span>ISO AUTO</span>
      </div>
    </div>
  );
}
