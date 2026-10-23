import { useCallback, useEffect, useState } from "react";
import type { ReactNode } from "react";

import {
  Activity,
  Clock3,
  Cpu,
  RefreshCw,
  Radio,
  Thermometer,
  Wifi,
} from "lucide-react";

const API_URL = "http://localhost:8000/api/v1/nodes";

type NodeHealth = "online" | "stale" | "offline" | "unknown";

interface NodeData {
  node_id: string;
  health?: NodeHealth;
  online?: boolean;
  temperature?: number | null;
  sonar_range?: number | null;
  signal_strength?: number | null;
  last_seen?: string | null;
  timestamp?: string | null;
}

interface NodesResponse {
  nodes?: NodeData[];
}

interface StatusStyle {
  label: string;
  className: string;
  dotClass: string;
}

const HEALTH_STYLES: Record<NodeHealth, StatusStyle> = {
  online: {
    label: "Online",
    className: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
    dotClass: "bg-emerald-400",
  },
  stale: {
    label: "Stale",
    className: "border-amber-500/30 bg-amber-500/10 text-amber-400",
    dotClass: "bg-amber-400",
  },
  offline: {
    label: "Offline",
    className: "border-red-500/30 bg-red-500/10 text-red-400",
    dotClass: "bg-red-400",
  },
  unknown: {
    label: "Unknown",
    className: "border-slate-500/30 bg-slate-500/10 text-slate-400",
    dotClass: "bg-slate-400",
  },
};

function getHealth(node: NodeData): NodeHealth {
  if (
    node.health === "online" ||
    node.health === "stale" ||
    node.health === "offline" ||
    node.health === "unknown"
  ) {
    return node.health;
  }

  return node.online === true ? "online" : "unknown";
}

function getLastSeen(node: NodeData): string | null {
  return node.last_seen ?? node.timestamp ?? null;
}

function getTelemetryFreshness(timestamp: string | null): StatusStyle {
  if (!timestamp) {
    return {
      label: "Unknown",
      className: "text-slate-400",
      dotClass: "bg-slate-400",
    };
  }

  const lastSeen = Date.parse(timestamp);

  if (!Number.isFinite(lastSeen) || lastSeen > Date.now()) {
    return {
      label: "Unknown",
      className: "text-slate-400",
      dotClass: "bg-slate-400",
    };
  }

  const ageSeconds = (Date.now() - lastSeen) / 1000;

  if (ageSeconds <= 5) {
    return {
      label: "Live",
      className: "text-emerald-400",
      dotClass: "bg-emerald-400",
    };
  }

  if (ageSeconds <= 30) {
    return {
      label: "Online",
      className: "text-emerald-400",
      dotClass: "bg-emerald-400",
    };
  }

  if (ageSeconds <= 60) {
    return {
      label: "Stale",
      className: "text-amber-400",
      dotClass: "bg-amber-400",
    };
  }

  return {
    label: "Offline",
    className: "text-red-400",
    dotClass: "bg-red-400",
  };
}

function formatLastSeen(value: string | null): string {
  if (!value) return "No timestamp available";

  const timestamp = Date.parse(value);

  if (!Number.isFinite(timestamp)) {
    return "Invalid timestamp";
  }

  return (
    new Date(timestamp).toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      hour12: false,
    }) + " IST"
  );
}

function formatTemperature(value?: number | null): string {
  return typeof value === "number" && Number.isFinite(value)
    ? `${value.toFixed(2)} °C`
    : "--";
}

function formatSignal(value?: number | null): string {
  return typeof value === "number" && Number.isFinite(value)
    ? `${value} dBm`
    : "--";
}

function formatRange(value?: number | null): string {
  return typeof value === "number" && Number.isFinite(value)
    ? value.toFixed(2)
    : "--";
}

export default function Nodes() {
  const [nodes, setNodes] = useState<NodeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [, setClock] = useState(0);

  // Fetch node data manually or from the Refresh button.
  const fetchNodes = useCallback(async () => {
    try {
      const response = await fetch(API_URL, {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(`Backend returned HTTP ${response.status}`);
      }

      const data: NodesResponse | NodeData[] = await response.json();

      const nodeList = Array.isArray(data)
        ? data
        : Array.isArray(data.nodes)
          ? data.nodes
          : [];

      setNodes(nodeList);
      setLastUpdated(new Date());
      setError(null);
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to retrieve node information."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  // Automatic backend refresh.
  useEffect(() => {
    let active = true;

    const loadNodes = async () => {
      try {
        const response = await fetch(API_URL, {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error(`Backend returned HTTP ${response.status}`);
        }

        const data: NodesResponse | NodeData[] = await response.json();

        const nodeList = Array.isArray(data)
          ? data
          : Array.isArray(data.nodes)
            ? data.nodes
            : [];

        if (!active) return;

        setNodes(nodeList);
        setLastUpdated(new Date());
        setError(null);
      } catch (err: unknown) {
        if (!active) return;

        setError(
          err instanceof Error
            ? err.message
            : "Unable to retrieve node information."
        );
      } finally {
        if (active) setLoading(false);
      }
    };

    void loadNodes();

    const intervalId = window.setInterval(() => {
      void loadNodes();
    }, 5000);

    return () => {
      active = false;
      window.clearInterval(intervalId);
    };
  }, []);

  // Update freshness indicators every second without extra API calls.
  useEffect(() => {
    const timer = window.setInterval(() => {
      setClock((previous) => previous + 1);
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  const counts = nodes.reduce(
    (result, node) => {
      result[getHealth(node)] += 1;
      return result;
    },
    {
      online: 0,
      stale: 0,
      offline: 0,
      unknown: 0,
    }
  );

  return (
    <div className="min-h-full space-y-5 bg-[#030817] p-4 md:p-6">
      {/* Header */}
      <section className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-cyan-500/20 bg-[#071020] p-5">
        <div>
          <p className="text-[10px] tracking-[0.25em] text-cyan-500">
            ASNSS / INFRASTRUCTURE
          </p>

          <h1 className="mt-2 text-xl font-bold text-white">
            Node Management
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Monitor ESP32 nodes, connectivity, and sensor availability.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void fetchNodes()}
          disabled={loading}
          className="flex items-center gap-2 rounded-md border border-slate-700 px-3 py-2 text-xs text-slate-300 transition hover:border-cyan-500/40 hover:text-cyan-300 disabled:opacity-50"
        >
          <RefreshCw
            size={14}
            className={loading ? "animate-spin" : ""}
          />
          Refresh
        </button>
      </section>

      {/* Error */}
      {error && (
        <section className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
          <p className="text-sm font-medium text-red-300">
            Unable to load nodes
          </p>

          <p className="mt-1 text-xs text-red-300/70">{error}</p>

          <button
            type="button"
            onClick={() => void fetchNodes()}
            className="mt-3 text-xs text-red-300 underline"
          >
            Try again
          </button>
        </section>
      )}

      {/* Health summary */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label="TOTAL NODES"
          value={nodes.length}
          icon={<Cpu size={19} />}
          description="Registered nodes returned by backend"
        />

        <SummaryCard
          label="ONLINE"
          value={counts.online}
          icon={<Activity size={19} />}
          description="Recently reporting telemetry"
        />

        <SummaryCard
          label="STALE"
          value={counts.stale}
          icon={<Clock3 size={19} />}
          description="Telemetry is delayed"
        />

        <SummaryCard
          label="OFFLINE / UNKNOWN"
          value={counts.offline + counts.unknown}
          icon={<Radio size={19} />}
          description={`${counts.offline} offline · ${counts.unknown} unknown`}
        />
      </section>

      {/* Registered nodes */}
      <section className="rounded-xl border border-cyan-500/20 bg-[#071020] p-4 md:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-sm font-semibold text-white">
              Registered Nodes
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Backend refresh every five seconds
            </p>
          </div>

          <span className="rounded-md border border-cyan-500/20 bg-cyan-500/5 px-3 py-1.5 text-[10px] text-cyan-300">
            {nodes.length} NODES
          </span>
        </div>

        {loading && nodes.length === 0 ? (
          <div className="py-12 text-center text-sm text-slate-500">
            Loading registered nodes...
          </div>
        ) : nodes.length === 0 ? (
          <div className="py-12 text-center">
            <Radio size={32} className="mx-auto text-slate-600" />

            <p className="mt-3 text-sm text-slate-400">
              No registered nodes found
            </p>

            <p className="mt-1 text-xs text-slate-600">
              Check that your ESP32 is sending telemetry to FastAPI.
            </p>
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
            {nodes.map((node) => {
              const health = getHealth(node);
              const style = HEALTH_STYLES[health];
              const freshness = getTelemetryFreshness(getLastSeen(node));

              return (
                <article
                  key={node.node_id}
                  className="rounded-xl border border-slate-800 bg-[#030817] p-4 transition hover:border-cyan-500/30"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg border border-cyan-500/20 bg-cyan-500/5 p-3 text-cyan-400">
                        <Cpu size={21} />
                      </div>

                      <div>
                        <h3 className="text-sm font-semibold text-white">
                          {node.node_id}
                        </h3>

                        <p className="mt-1 text-[11px] text-slate-500">
                          ESP32 telemetry node
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <StatusBadge style={style} />

                      <span
                        className={`inline-flex items-center gap-1.5 text-[10px] ${freshness.className}`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${freshness.dotClass} ${
                            freshness.label === "Live"
                              ? "animate-pulse"
                              : ""
                          }`}
                        />
                        {freshness.label}
                      </span>
                    </div>
                  </div>

                  {/* Sensor metrics */}
                  <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <Metric
                      icon={<Thermometer size={15} />}
                      label="TEMPERATURE"
                      value={formatTemperature(node.temperature)}
                    />

                    <Metric
                      icon={<Radio size={15} />}
                      label="SONAR RANGE"
                      value={
                        node.sonar_range == null
                          ? "--"
                          : formatRange(node.sonar_range)
                      }
                      unit={
                        node.sonar_range == null ? "" : "range units"
                      }
                    />

                    <Metric
                      icon={<Wifi size={15} />}
                      label="WI-FI RSSI"
                      value={formatSignal(node.signal_strength)}
                    />
                  </div>

                  {/* Last telemetry */}
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-800 pt-3">
                    <span className="text-[10px] text-slate-500">
                      Last telemetry
                    </span>

                    <span className="text-[10px] text-slate-400">
                      {formatLastSeen(getLastSeen(node))}
                    </span>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* Footer */}
      <section className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-800 bg-[#071020] p-4">
        <div>
          <p className="text-xs font-medium text-slate-300">
            Node monitoring
          </p>

          <p className="mt-1 text-xs text-slate-500">
            Health is evaluated by the backend; freshness is calculated locally.
          </p>
        </div>

        <div className="text-right">
          <p className="text-xs text-slate-400">
            Last successful refresh
          </p>

          <p className="mt-1 text-xs text-cyan-300">
            {lastUpdated
              ? `${lastUpdated.toLocaleTimeString("en-IN", {
                  timeZone: "Asia/Kolkata",
                  hour12: false,
                })} IST`
              : "--"}
          </p>
        </div>
      </section>
    </div>
  );
}

function StatusBadge({ style }: { style: StatusStyle }) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-[10px] ${style.className}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${style.dotClass}`} />
      {style.label}
    </span>
  );
}

function SummaryCard({
  label,
  value,
  icon,
  description,
}: {
  label: string;
  value: number;
  icon: ReactNode;
  description: string;
}) {
  return (
    <section className="rounded-xl border border-cyan-500/15 bg-[#071020] p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[10px] tracking-wider text-slate-500">
          {label}
        </p>

        <span className="text-cyan-400">{icon}</span>
      </div>

      <p className="mt-4 text-2xl font-semibold text-white">{value}</p>

      <p className="mt-2 text-[11px] text-slate-500">{description}</p>
    </section>
  );
}

function Metric({
  icon,
  label,
  value,
  unit,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  unit?: string;
}) {
  return (
    <div className="rounded-lg border border-slate-800 bg-[#071020] p-3">
      <div className="flex items-center gap-2 text-slate-500">
        {icon}

        <span className="text-[9px] tracking-wide">{label}</span>
      </div>

      <p className="mt-3 text-sm font-semibold text-white">{value}</p>

      {unit && (
        <p className="mt-1 text-[9px] text-slate-500">{unit}</p>
      )}
    </div>
  );
}