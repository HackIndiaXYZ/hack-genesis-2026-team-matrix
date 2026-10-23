import { useCallback, useEffect, useState } from "react";
import type { ReactNode } from "react";

import {
  Activity,
  AlertCircle,
  AlertTriangle,
  Bell,
  CheckCircle2,
  Clock3,
  RefreshCw,
  ShieldAlert,
  Wifi,
  XCircle,
} from "lucide-react";

const API_URL = "http://localhost:8000/api/v1/alerts";

type AlertSeverity = "critical" | "high" | "medium" | "low" | "info";

interface AlertItem {
  id?: string | number;
  alert_id?: string | number;
  node_id?: string;
  title?: string;
  message?: string;
  description?: string;
  type?: string;
  severity?: string;
  status?: string;
  timestamp?: string;
  created_at?: string;
}

interface AlertsResponse {
  alerts?: AlertItem[];
}

const SEVERITY_STYLES: Record<
  AlertSeverity,
  { label: string; className: string; icon: ReactNode }
> = {
  critical: {
    label: "Critical",
    className: "border-red-500/30 bg-red-500/10 text-red-400",
    icon: <ShieldAlert size={17} />,
  },
  high: {
    label: "High",
    className: "border-orange-500/30 bg-orange-500/10 text-orange-400",
    icon: <AlertCircle size={17} />,
  },
  medium: {
    label: "Medium",
    className: "border-amber-500/30 bg-amber-500/10 text-amber-400",
    icon: <AlertTriangle size={17} />,
  },
  low: {
    label: "Low",
    className: "border-cyan-500/30 bg-cyan-500/10 text-cyan-400",
    icon: <Activity size={17} />,
  },
  info: {
    label: "Info",
    className: "border-slate-500/30 bg-slate-500/10 text-slate-400",
    icon: <Bell size={17} />,
  },
};

function normalizeSeverity(value?: string): AlertSeverity {
  switch (value?.toLowerCase()) {
    case "critical":
    case "emergency":
      return "critical";

    case "high":
    case "error":
      return "high";

    case "medium":
    case "warning":
    case "warn":
      return "medium";

    case "low":
      return "low";

    default:
      return "info";
  }
}

function getAlertTitle(alert: AlertItem): string {
  return (
    alert.title ||
    alert.type ||
    "System Notification"
  );
}

function getAlertMessage(alert: AlertItem): string {
  return (
    alert.message ||
    alert.description ||
    "No additional details were provided."
  );
}

function getAlertTimestamp(alert: AlertItem): string | null {
  return alert.timestamp ?? alert.created_at ?? null;
}

function formatTimestamp(value: string | null): string {
  if (!value) return "Timestamp unavailable";

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

function getAlertKey(alert: AlertItem, index: number): string {
  const id = alert.id ?? alert.alert_id;

  if (id !== undefined && id !== null) {
    return String(id);
  }

  return `${alert.node_id ?? "system"}-${getAlertTimestamp(alert) ?? "unknown"}-${index}`;
}

export default function Alerts() {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchAlerts = useCallback(async () => {
    try {
      const response = await fetch(API_URL, {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(`Backend returned HTTP ${response.status}`);
      }

      const data: AlertsResponse = await response.json();

      setAlerts(Array.isArray(data.alerts) ? data.alerts : []);
      setLastUpdated(new Date());
      setError(null);
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to retrieve alerts."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch and five-second automatic refresh.
  useEffect(() => {
    let active = true;

    const loadAlerts = async () => {
      try {
        const response = await fetch(API_URL, {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error(`Backend returned HTTP ${response.status}`);
        }

        const data: AlertsResponse = await response.json();

        if (!active) return;

        setAlerts(Array.isArray(data.alerts) ? data.alerts : []);
        setLastUpdated(new Date());
        setError(null);
      } catch (err: unknown) {
        if (!active) return;

        setError(
          err instanceof Error
            ? err.message
            : "Unable to retrieve alerts."
        );
      } finally {
        if (active) setLoading(false);
      }
    };

    void loadAlerts();

    const intervalId = window.setInterval(() => {
      void loadAlerts();
    }, 5000);

    return () => {
      active = false;
      window.clearInterval(intervalId);
    };
  }, []);

  const counts = alerts.reduce(
    (result, alert) => {
      result[normalizeSeverity(alert.severity)] += 1;
      return result;
    },
    {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
      info: 0,
    }
  );

  return (
    <div className="min-h-full space-y-5 bg-[#030817] p-4 md:p-6">
      {/* Page header */}
      <section className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-cyan-500/20 bg-[#071020] p-5">
        <div>
          <p className="text-[10px] tracking-[0.25em] text-cyan-500">
            ASNSS / SECURITY MONITORING
          </p>

          <h1 className="mt-2 text-xl font-bold text-white">
            Alerts & Events
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Monitor node connectivity, sensor events, and system notifications.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void fetchAlerts()}
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

      {/* Error state */}
      {error && (
        <section className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
          <div className="flex items-start gap-3">
            <XCircle size={19} className="mt-0.5 text-red-400" />

            <div>
              <p className="text-sm font-medium text-red-300">
                Unable to load alerts
              </p>

              <p className="mt-1 text-xs text-red-300/70">
                {error}. Check that FastAPI is running on port 8000.
              </p>

              <button
                type="button"
                onClick={() => void fetchAlerts()}
                className="mt-3 text-xs text-red-300 underline"
              >
                Try again
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Summary cards */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label="TOTAL ALERTS"
          value={alerts.length}
          icon={<Bell size={19} />}
          description="Alerts returned by the backend"
        />

        <SummaryCard
          label="CRITICAL"
          value={counts.critical}
          icon={<ShieldAlert size={19} />}
          description="Critical-severity events"
        />

        <SummaryCard
          label="HIGH PRIORITY"
          value={counts.high}
          icon={<AlertCircle size={19} />}
          description="High-severity events"
        />

        <SummaryCard
          label="WARNINGS"
          value={counts.medium}
          icon={<AlertTriangle size={19} />}
          description="Medium-severity events"
        />
      </section>

      {/* Alert list */}
      <section className="rounded-xl border border-cyan-500/20 bg-[#071020] p-4 md:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-sm font-semibold text-white">
              Alert Activity
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Automatically refreshed every five seconds
            </p>
          </div>

          <span className="rounded-md border border-cyan-500/20 bg-cyan-500/5 px-3 py-1.5 text-[10px] text-cyan-300">
            {alerts.length} EVENTS
          </span>
        </div>

        {loading && alerts.length === 0 ? (
          <div className="py-12 text-center text-sm text-slate-500">
            Loading alerts...
          </div>
        ) : alerts.length === 0 ? (
          <div className="py-14 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-emerald-500/20 bg-emerald-500/5">
              <CheckCircle2 size={28} className="text-emerald-400" />
            </div>

            <h3 className="mt-4 text-sm font-semibold text-white">
              No active alerts
            </h3>

            <p className="mx-auto mt-2 max-w-md text-xs leading-5 text-slate-500">
              The backend currently returns no alerts. New events will appear
              here when they are generated and stored by your alert system.
            </p>
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {alerts.map((alert, index) => {
              const severity = normalizeSeverity(alert.severity);
              const style = SEVERITY_STYLES[severity];
              const timestamp = getAlertTimestamp(alert);

              return (
                <article
                  key={getAlertKey(alert, index)}
                  className="rounded-lg border border-slate-800 bg-[#030817] p-4 transition hover:border-cyan-500/20"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex min-w-0 items-start gap-3">
                      <div className={`rounded-lg border p-3 ${style.className}`}>
                        {style.icon}
                      </div>

                      <div className="min-w-0">
                        <h3 className="text-sm font-semibold text-white">
                          {getAlertTitle(alert)}
                        </h3>

                        <p className="mt-2 break-words text-xs leading-5 text-slate-400">
                          {getAlertMessage(alert)}
                        </p>

                        <div className="mt-3 flex flex-wrap items-center gap-3 text-[10px] text-slate-500">
                          {alert.node_id && (
                            <span className="flex items-center gap-1.5">
                              <Wifi size={12} />
                              {alert.node_id}
                            </span>
                          )}

                          <span className="flex items-center gap-1.5">
                            <Clock3 size={12} />
                            {formatTimestamp(timestamp)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <span
                      className={`shrink-0 rounded-md border px-2.5 py-1.5 text-[10px] ${style.className}`}
                    >
                      {style.label}
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
            Alert service status
          </p>

          <p className="mt-1 text-xs text-slate-500">
            Source: ASNSS FastAPI alerts endpoint
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

      <p className="mt-2 text-[11px] text-slate-500">
        {description}
      </p>
    </section>
  );
}