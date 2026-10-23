import { useCallback, useEffect, useState } from "react";
import {
  Activity,
  Wifi,
  Server,
  RefreshCw,
  ShieldCheck,
  Radio,
  Thermometer,
  Clock,
  CheckCircle2,
  XCircle,
} from "lucide-react";

const getApiBase = () =>
  (localStorage.getItem("asnss_api_base") || "http://localhost:8000")
    .replace(/\/+$/, "");

type NodeData = {
  node_id: string;
  temperature: number | null;
  sonar_range: number | null;
  signal_strength: number | null;
  timestamp: string;
  health: string;
  online: boolean;
};

type NodeResponse = {
  total_nodes: number;
  online_nodes: number;
  stale_nodes: number;
  offline_nodes: number;
  unknown_nodes: number;
  nodes: NodeData[];
};

export default function Network() {
  const [backend, setBackend] = useState(false);
  const [loading, setLoading] = useState(true);
  const [nodes, setNodes] = useState<NodeResponse | null>(null);
  const [error, setError] = useState("");
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");

    const base = getApiBase();

    try {
      const [healthResponse, nodesResponse] = await Promise.all([
        fetch(`${base}/api/v1/health`),
        fetch(`${base}/api/v1/nodes`),
      ]);

      if (!healthResponse.ok || !nodesResponse.ok) {
        throw new Error("Backend returned an unsuccessful response.");
      }

      const healthData = await healthResponse.json();
      const nodeData: NodeResponse = await nodesResponse.json();

      setBackend(healthData.status === "ok");
      setNodes(nodeData);
      setLastChecked(new Date());
    } catch {
      setBackend(false);
      setNodes(null);
      setError(
        "Unable to reach the backend. Check the server and API address."
      );
      setLastChecked(new Date());
    } finally {
      setLoading(false);
    }
  }, []);

useEffect(() => {
  const initialTimer = window.setTimeout(() => {
    void refresh();
  }, 0);

  const savedInterval = Number(
    localStorage.getItem("asnss_refresh_interval") || 5000
  );

  const interval = Math.min(
    60000,
    Math.max(
      2000,
      Number.isFinite(savedInterval) ? savedInterval : 5000
    )
  );

  const intervalTimer = window.setInterval(() => {
    void refresh();
  }, interval);

  return () => {
    window.clearTimeout(initialTimer);
    window.clearInterval(intervalTimer);
  };
}, [refresh]);

  const node = nodes?.nodes?.[0];

  const signalLabel =
    node?.signal_strength == null
      ? "Unavailable"
      : node.signal_strength >= -50
        ? "Strong"
        : node.signal_strength >= -70
          ? "Moderate"
          : "Weak";

  const healthColor = (health?: string) => {
    switch (health?.toLowerCase()) {
      case "online":
        return "text-emerald-400 bg-emerald-400/10";
      case "stale":
        return "text-amber-400 bg-amber-400/10";
      case "offline":
        return "text-rose-400 bg-rose-400/10";
      default:
        return "text-slate-400 bg-slate-400/10";
    }
  };

  const services = [
    {
      name: "FastAPI Backend",
      description: "REST API and telemetry ingestion",
      online: backend,
      icon: Server,
    },
    {
      name: "ESP32 Sensor Node",
      description: node?.node_id || "No node data received",
      online: node?.online === true,
      icon: Radio,
    },
    {
      name: "Telemetry Pipeline",
      description: "Temperature and Wi-Fi RSSI reporting",
      online: Boolean(backend && node?.timestamp),
      icon: Activity,
    },
  ];

  return (
    <div className="min-h-screen space-y-6 bg-slate-950 p-5 text-slate-100 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.25em] text-cyan-400">
            <Activity size={15} />
            Infrastructure monitoring
          </div>

          <h1 className="text-3xl font-bold tracking-tight">
            Network Operations
          </h1>

          <p className="mt-2 text-sm text-slate-400">
            Monitor backend availability, sensor connectivity and telemetry.
          </p>
        </div>

        <button
          onClick={refresh}
          disabled={loading}
          className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm font-medium transition hover:border-cyan-500 disabled:opacity-50"
        >
          <RefreshCw
            size={16}
            className={loading ? "animate-spin" : ""}
          />
          Refresh network
        </button>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-300"
        >
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: "Backend",
            value: backend ? "Connected" : "Unavailable",
            icon: Server,
            color: backend ? "text-emerald-400" : "text-rose-400",
          },
          {
            label: "Registered nodes",
            value: nodes?.total_nodes ?? "--",
            icon: Radio,
            color: "text-cyan-400",
          },
          {
            label: "Online nodes",
            value: nodes?.online_nodes ?? "--",
            icon: ShieldCheck,
            color: "text-emerald-400",
          },
          {
            label: "Offline nodes",
            value: nodes?.offline_nodes ?? "--",
            icon: Wifi,
            color: "text-rose-400",
          },
        ].map((item) => {
          const Icon = item.icon;

          return (
            <div
              key={item.label}
              className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400">
                  {item.label}
                </span>
                <Icon size={20} className={item.color} />
              </div>

              <div className="mt-4 text-2xl font-bold">
                {item.value}
              </div>
            </div>
          );
        })}
      </div>

      <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 md:p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Infrastructure status</h2>
            <p className="mt-1 text-sm text-slate-400">
              Current availability of system components.
            </p>
          </div>

          <span
            className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
              backend
                ? "bg-emerald-400/10 text-emerald-400"
                : "bg-rose-400/10 text-rose-400"
            }`}
          >
            {backend ? "API OPERATIONAL" : "API UNAVAILABLE"}
          </span>
        </div>

        <div className="divide-y divide-slate-800">
          {services.map((service) => {
            const Icon = service.icon;

            return (
              <div
                key={service.name}
                className="flex items-center gap-4 py-4"
              >
                <div className="rounded-xl bg-slate-800 p-3 text-cyan-400">
                  <Icon size={21} />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="font-medium">{service.name}</p>
                  <p className="mt-1 break-words text-sm text-slate-400">
                    {service.description}
                  </p>
                </div>

                {service.online ? (
                  <CheckCircle2
                    className="shrink-0 text-emerald-400"
                    size={21}
                  />
                ) : (
                  <XCircle
                    className="shrink-0 text-rose-400"
                    size={21}
                  />
                )}
              </div>
            );
          })}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 md:p-6">
        <div className="mb-5 flex items-center gap-3">
          <Radio className="text-cyan-400" size={22} />
          <div>
            <h2 className="text-lg font-semibold">Connected sensor nodes</h2>
            <p className="mt-1 text-sm text-slate-400">
              Live information received from the backend.
            </p>
          </div>
        </div>

        {!node && (
          <p className="rounded-xl bg-slate-800/70 p-4 text-sm text-slate-400">
            {loading ? "Loading node data..." : "No node data available."}
          </p>
        )}

        {node && (
          <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4 md:p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-semibold">{node.node_id}</p>
                <p className="mt-1 text-xs text-slate-500">
                  ESP32 · DS18B20
                </p>
              </div>

              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${healthColor(
                  node.health
                )}`}
              >
                {node.health.toUpperCase()}
              </span>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-3">
              <div>
                <Thermometer size={18} className="text-amber-400" />
                <p className="mt-2 text-xl font-bold">
                  {node.temperature == null
                    ? "--"
                    : `${node.temperature.toFixed(2)} °C`}
                </p>
                <p className="text-xs text-slate-500">Temperature</p>
              </div>

              <div>
                <Wifi size={18} className="text-cyan-400" />
                <p className="mt-2 text-xl font-bold">
                  {node.signal_strength == null
                    ? "--"
                    : `${node.signal_strength} dBm`}
                </p>
                <p className="text-xs text-slate-500">
                  Wi-Fi · {signalLabel}
                </p>
              </div>

              <div>
                <Activity size={18} className="text-violet-400" />
                <p className="mt-2 text-xl font-bold">
                  {node.sonar_range == null
                    ? "N/A"
                    : `${node.sonar_range} m`}
                </p>
                <p className="text-xs text-slate-500">Sonar range</p>
              </div>
            </div>

            <div className="mt-5 flex items-center gap-2 border-t border-slate-800 pt-4 text-xs text-slate-500">
              <Clock size={14} />
              Last reading:{" "}
              {new Date(node.timestamp).toLocaleString()}
            </div>
          </div>
        )}

        <p className="mt-4 text-xs text-slate-500">
          Last checked:{" "}
          {lastChecked ? lastChecked.toLocaleTimeString() : "--"}
        </p>
      </section>
    </div>
  );
}
