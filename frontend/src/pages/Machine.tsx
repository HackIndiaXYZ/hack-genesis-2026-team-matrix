import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import {
  Activity,
  Clock3,
  Radio,
  ShieldCheck,
  Target,
  Wifi,
} from "lucide-react";

import SonarScreen from "../components/machine/SonarScreen";
import NodeCard from "../components/machine/NodeCard";
import { useTelemetry } from "../hooks/useTelemetry";

type NodeHealth = "online" | "stale" | "offline" | "unknown";

export default function Machine() {
  const [time, setTime] = useState(new Date());
  const [now, setNow] = useState<number | null>(null);

  const { telemetry, connected, lastSeen } = useTelemetry();

  // Update the clock and node freshness status every second.
  useEffect(() => {
    const updateClock = () => {
      setTime(new Date());
      setNow(Date.now());
    };

    updateClock();

    const timer = window.setInterval(updateClock, 1000);

    return () => window.clearInterval(timer);
  }, []);

  // Calculate the age of the most recent telemetry.
  const telemetryAge =
    now !== null && telemetry?.timestamp
      ? now - new Date(telemetry.timestamp).getTime()
      : Infinity;

  // Determine node health using the same thresholds as the backend.
  const nodeHealth: NodeHealth = (() => {
    if (!Number.isFinite(telemetryAge) || telemetryAge < 0) {
      return "unknown";
    }

    if (telemetryAge <= 30000) {
      return "online";
    }

    if (telemetryAge <= 60000) {
      return "stale";
    }

    return "offline";
  })();

  const nodeOnline = nodeHealth === "online";

  const healthDisplay = {
    online: {
      label: "NODE ONLINE",
      className:
        "border-emerald-500/30 bg-emerald-500/5 text-emerald-400",
    },
    stale: {
      label: "NODE STALE",
      className:
        "border-amber-500/30 bg-amber-500/5 text-amber-400",
    },
    offline: {
      label: "NODE OFFLINE",
      className:
        "border-red-500/30 bg-red-500/5 text-red-400",
    },
    unknown: {
      label: "NODE UNKNOWN",
      className:
        "border-slate-500/30 bg-slate-500/5 text-slate-400",
    },
  }[nodeHealth];

  const temperature = telemetry?.temperature ?? null;
  const sonarRange = telemetry?.sonar_range ?? null;

  return (
    <div className="min-h-full space-y-4 bg-[#030817] p-4 md:p-6">
      {/* Machine header */}
      <section className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-cyan-500/20 bg-[#071020] px-5 py-4">
        <div>
          <p className="text-[10px] tracking-[0.25em] text-cyan-500">
            ASNSS / MACHINE CONTROL
          </p>

          <h1 className="mt-2 text-xl font-bold tracking-wide text-white">
            Machine View
          </h1>

          <p className="mt-1 text-xs text-slate-500">
            Sonar visualization and hardware monitoring
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Backend connection */}
          <span
            className={`flex items-center gap-2 rounded-md border px-3 py-2 text-[10px] ${
              connected
                ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-400"
                : "border-amber-500/30 bg-amber-500/5 text-amber-400"
            }`}
          >
            <Wifi size={13} />
            {connected ? "BACKEND CONNECTED" : "CONNECTING TO BACKEND"}
          </span>

          {/* Actual node health */}
          <span
            className={`rounded-md border px-3 py-2 text-[10px] ${healthDisplay.className}`}
          >
            ● {healthDisplay.label}
          </span>

          {/* Live clock */}
          <span className="flex items-center gap-2 font-mono text-xs text-slate-400">
            <Clock3 size={14} className="text-cyan-400" />

            {time.toLocaleTimeString("en-IN", {
              timeZone: "Asia/Kolkata",
              hour12: false,
            })}{" "}
            IST
          </span>
        </div>
      </section>

      {/* Main monitoring area */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.7fr)_minmax(280px,0.8fr)]">
        {/* Sonar scope */}
        <section className="flex min-h-[480px] flex-col overflow-hidden rounded-xl border border-cyan-500/20 bg-[#071020] p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-xs font-semibold tracking-[0.2em] text-cyan-300">
              SONAR SCOPE
            </h2>

            <span className="text-[10px] text-slate-500">
              NODE 001
            </span>
          </div>

          <div className="flex flex-1">
            <SonarScreen />
          </div>

          <div className="mt-3 flex flex-wrap justify-between gap-2 border-t border-slate-800 pt-3 text-[10px] text-slate-500">
            <span>Visualization: Animated demo</span>

            <span>
              Actual sonar data:{" "}
              {sonarRange === null ? "Unavailable" : "Range received"}
            </span>
          </div>
        </section>

        {/* Target information */}
        <section className="rounded-xl border border-cyan-500/20 bg-[#071020] p-5">
          <h2 className="text-xs font-semibold tracking-[0.2em] text-cyan-300">
            TARGET DATA
          </h2>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <InfoCard
              icon={<Target size={17} />}
              label="TARGET COUNT"
              value="--"
            />

            <InfoCard
              icon={<Activity size={17} />}
              label="SONAR RANGE"
              value={
                sonarRange === null
                  ? "--"
                  : `${sonarRange.toFixed(2)} m`
              }
            />

            <InfoCard
              icon={<Radio size={17} />}
              label="BEARING"
              value="--"
            />

            <InfoCard
              icon={<ShieldCheck size={17} />}
              label="CLASSIFICATION"
              value="N/A"
            />
          </div>

          <div className="mt-5 rounded-lg border border-slate-800 bg-slate-950/60 p-4">
            <p className="text-[10px] tracking-widest text-slate-500">
              DETECTION STATUS
            </p>

            <p className="mt-3 text-sm text-amber-400">
              {sonarRange === null
                ? "Waiting for sonar measurements"
                : "Range data received — detection unverified"}
            </p>

            <p className="mt-2 text-xs leading-5 text-slate-500">
              {sonarRange === null
                ? "No sonar range has been received. Target detection, bearing, and classification remain unavailable."
                : "A range value has been received from the backend. It does not by itself confirm an object detection or identify a target."}
            </p>
          </div>

          <div className="mt-4 flex items-center justify-between text-xs">
            <span className="text-slate-500">System mode</span>
            <span className="text-cyan-300">Development</span>
          </div>
        </section>
      </div>

      {/* Node monitoring panel */}
      <NodeCard
        temperature={temperature}
        sonarRange={sonarRange}
        online={nodeOnline}
        lastSeen={lastSeen}
        health={nodeHealth}
      />

      {/* Footer */}
      <footer className="flex flex-wrap justify-between gap-2 px-1 py-2 text-[10px] text-slate-600">
        <span>ASNSS MACHINE CONSOLE</span>

        <span>1 NODE CONFIGURED</span>

        <span>
          {nodeHealth === "online"
            ? "NODE REPORTING"
            : nodeHealth === "stale"
              ? "TELEMETRY STALE"
              : nodeHealth === "offline"
                ? "NODE OFFLINE"
                : "NODE HEALTH UNKNOWN"}
        </span>
      </footer>
    </div>
  );
}

function InfoCard({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-4">
      <div className="flex items-center gap-2 text-cyan-400">
        {icon}

        <span className="text-[9px] tracking-widest text-slate-500">
          {label}
        </span>
      </div>

      <p className="mt-4 font-mono text-lg font-semibold text-cyan-300">
        {value}
      </p>
    </div>
  );
}