import { useEffect, useRef } from "react";

export default function SonarScreen() {
  const sweepRef = useRef<SVGGElement>(null);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    let angle = 0;
    let previousTime = 0;

    const animate = (time: number) => {
      if (!previousTime) previousTime = time;

      // Rotation speed: 35 degrees per second
      const delta = Math.min((time - previousTime) / 1000, 0.05);
      previousTime = time;

      angle = (angle + delta * 35) % 360;

      if (sweepRef.current) {
        sweepRef.current.setAttribute(
          "transform",
          `rotate(${angle} 500 500)`
        );
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <div className="relative w-full overflow-hidden rounded-2xl border border-cyan-400/20 bg-[#04111f]">
      <div className="absolute left-4 top-4 z-10">
        <p className="text-xs font-semibold tracking-[0.25em] text-cyan-400">
          SONAR SCOPE
        </p>
        <p className="mt-1 text-xs text-slate-500">
          360° scanning visualization
        </p>
      </div>

      <svg
        viewBox="0 0 1000 1000"
        className="block h-auto w-full"
        role="img"
        aria-label="Animated sonar sweep rotating clockwise through 360 degrees"
      >
        <defs>
          <radialGradient id="sonarBackground">
            <stop offset="0%" stopColor="#0b2a3b" />
            <stop offset="100%" stopColor="#04111f" />
          </radialGradient>

          <linearGradient id="sonarBeam" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.02" />
            <stop offset="100%" stopColor="#22d3ee" stopOpacity="0.30" />
          </linearGradient>

          <clipPath id="sonarClip">
            <circle cx="500" cy="500" r="480" />
          </clipPath>
        </defs>

        {/* Scope background */}
        <circle
          cx="500"
          cy="500"
          r="480"
          fill="url(#sonarBackground)"
        />

        {/* Grid and sweep share the same center */}
        <g clipPath="url(#sonarClip)">
          {/* Range rings */}
          {[48, 144, 240, 336, 432, 480].map((radius) => (
            <circle
              key={radius}
              cx="500"
              cy="500"
              r={radius}
              fill="none"
              stroke="#08718a"
              strokeOpacity="0.65"
              strokeWidth="2"
            />
          ))}

          {/* Four primary axes */}
          <g
            stroke="#08718a"
            strokeOpacity="0.55"
            strokeWidth="2"
          >
            <line x1="20" y1="500" x2="980" y2="500" />
            <line x1="500" y1="20" x2="500" y2="980" />
            <line x1="160" y1="160" x2="840" y2="840" />
            <line x1="840" y1="160" x2="160" y2="840" />
          </g>

          {/* Rotating beam: its origin is exactly (500, 500) */}
          <g ref={sweepRef} transform="rotate(0 500 500)">
            <path
              d="M 500 500 L 500 20 A 480 480 0 0 1 980 500 Z"
              fill="url(#sonarBeam)"
              opacity="0.9"
            />

            {/* Bright leading edge */}
            <line
              x1="500"
              y1="500"
              x2="500"
              y2="20"
              stroke="#22d3ee"
              strokeOpacity="0.85"
              strokeWidth="3"
            />

            {/* Fading trail */}
            <path
              d="M 500 500 L 160 160 A 480 480 0 0 1 500 20 Z"
              fill="#22d3ee"
              opacity="0.08"
            />
          </g>

          {/* Center node */}
          <circle
            cx="500"
            cy="500"
            r="12"
            fill="#22d3ee"
            fillOpacity="0.2"
            stroke="#22d3ee"
            strokeWidth="3"
          />

          <circle cx="500" cy="500" r="4" fill="#67e8f9" />
        </g>

        {/* Direction labels */}
        <g
          fill="#67e8f9"
          fontSize="20"
          textAnchor="middle"
          dominantBaseline="middle"
        >
          <text x="500" y="60">N</text>
          <text x="940" y="500">E</text>
          <text x="500" y="940">S</text>
          <text x="60" y="500">W</text>
        </g>
      </svg>

      <div className="flex items-center justify-between border-t border-cyan-400/10 px-4 py-3">
        <span className="flex items-center gap-2 text-xs text-slate-400">
          <span className="h-2 w-2 animate-pulse rounded-full bg-cyan-400" />
          DEMO SWEEP
        </span>

        <span className="text-xs text-slate-500">
          Simulation · Not live sonar data
        </span>
      </div>
    </div>
  );
}