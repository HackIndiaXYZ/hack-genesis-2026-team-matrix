import {
  Activity,
  Thermometer,
  Radio,
  Wifi,
  Clock3,
  Waves,
} from "lucide-react";

type NodeHealth = "online" | "stale" | "offline" | "unknown";

interface NodeCardProps {
  temperature: number | null;
  sonarRange: number | null;
  online: boolean;
  lastSeen: string | null;
  health?: NodeHealth;
}

const getHealthStyle = (health: NodeHealth) => {
  switch (health) {
    case "online":
      return {
        label: "ONLINE",
        description: "Node is reporting telemetry",
        badge:
          "border-emerald-400/20 bg-emerald-400/10 text-emerald-400",
        indicator: "bg-emerald-400",
      };

    case "stale":
      return {
        label: "STALE",
        description: "Telemetry has not updated recently",
        badge: "border-amber-400/20 bg-amber-400/10 text-amber-400",
        indicator: "bg-amber-400",
      };

    case "offline":
      return {
        label: "OFFLINE",
        description: "Telemetry has stopped",
        badge: "border-red-400/20 bg-red-400/10 text-red-400",
        indicator: "bg-red-400",
      };

    default:
      return {
        label: "UNKNOWN",
        description: "Node health cannot be determined",
        badge: "border-slate-400/20 bg-slate-400/10 text-slate-400",
        indicator: "bg-slate-400",
      };
  }
};

export default function NodeCard({
  temperature,
  sonarRange,
  online,
  lastSeen,
  health,
}: NodeCardProps) {
  // Preserve compatibility with callers that only provide `online`.
  const resolvedHealth: NodeHealth =
    health ??
    (online ? "online" : lastSeen ? "offline" : "unknown");

  const status = getHealthStyle(resolvedHealth);

  const metrics = [
    {
      label: "WATER TEMPERATURE",
      value:
        temperature === null ? "--" : `${temperature.toFixed(1)} °C`,
      icon: Thermometer,
      color: "text-cyan-400",
    },
    {
      label: "SONAR RANGE",
      value: sonarRange === null ? "--" : `${sonarRange.toFixed(2)} m`,
      icon: Waves,
      color: "text-blue-400",
    },
  ];

  return (
    <section className="rounded-2xl border border-cyan-400/15 bg-[#071321] p-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="rounded-xl border border-cyan-400/20 bg-cyan-400/10 p-3">
            <Radio className="h-5 w-5 text-cyan-400" />
          </div>

          <div>
            <h2 className="font-semibold text-white">
              Underwater Node 01
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              ASNSS-NODE-001 · Primary monitoring node
            </p>
          </div>
        </div>

        {/* Node health badge */}
        <span
          className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium ${status.badge}`}
          title={status.description}
        >
          <span
            className={`h-2 w-2 rounded-full ${status.indicator}`}
          />

          {status.label}
        </span>
      </div>

      {/* Metrics */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {metrics.map((metric) => {
          const Icon = metric.icon;

          return (
            <div
              key={metric.label}
              className="rounded-xl border border-white/5 bg-[#030b16] p-4"
            >
              <div className="flex items-center justify-between">
                <p className="text-xs tracking-wider text-slate-500">
                  {metric.label}
                </p>

                <Icon className={`h-4 w-4 ${metric.color}`} />
              </div>

              <p className="mt-4 text-2xl font-semibold text-white">
                {metric.value}
              </p>

              <p className="mt-2 text-xs text-slate-600">
                {metric.label === "WATER TEMPERATURE"
                  ? "DS18B20 sensor"
                  : "Sonar sensor integration pending"}
              </p>
            </div>
          );
        })}
      </div>

      {/* Connection information */}
      <div className="mt-4 grid grid-cols-1 gap-3 border-t border-white/5 pt-4 sm:grid-cols-2">
        <div className="flex items-center gap-3">
          <Wifi className="h-4 w-4 text-slate-500" />

          <div>
            <p className="text-xs text-slate-500">Network Status</p>

            <p className="mt-1 text-sm text-slate-300">
              {status.description}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Clock3 className="h-4 w-4 text-slate-500" />

          <div>
            <p className="text-xs text-slate-500">Last Telemetry</p>

            <p className="mt-1 text-sm text-slate-300">
              {lastSeen ?? "No data available"}
            </p>
          </div>
        </div>
      </div>

      {/* Integration notice */}
      <div className="mt-4 flex items-start gap-3 rounded-xl border border-cyan-400/10 bg-cyan-400/5 p-3">
        <Activity className="mt-0.5 h-4 w-4 shrink-0 text-cyan-400" />

        <p className="text-xs leading-5 text-slate-400">
          Temperature and network readings are received from the connected
          ESP32. Sonar range is displayed only when actual sonar telemetry
          is available.
        </p>
      </div>
    </section>
  );
}