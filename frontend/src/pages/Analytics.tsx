import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactElement, ReactNode } from "react";

import {
  Activity,
  Clock3,
  Radio,
  RefreshCw,
  Thermometer,
  TrendingDown,
  TrendingUp,
  Wifi,
} from "lucide-react";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

// =====================================================
// TYPES
// =====================================================

interface TelemetryReading {
  node_id: string;
  temperature: number | null;
  sonar_range: number | null;
  signal_strength: number | null;
  timestamp: string;
}

interface TelemetryHistoryResponse {
  period_seconds: number;
  total_readings: number;
  nodes: string[];
  readings: TelemetryReading[];
}

interface ChartReading {
  time: string;
  timestamp: number;
  temperature: number;
}

interface SignalChartReading {
  time: string;
  timestamp: number;
  signal_strength: number;
}

interface SonarChartReading {
  time: string;
  timestamp: number;
  sonar_range: number;
}

interface Statistics {
  current: number | null;
  minimum: number | null;
  maximum: number | null;
  average: number | null;
}

// =====================================================
// CONFIGURATION
// =====================================================

const API_URL = "http://localhost:8000/api/v1/telemetry/history";
const REFRESH_INTERVAL = 5000;

// =====================================================
// HELPERS
// =====================================================

function formatTemperature(value: number | null): string {
  return value === null ? "--" : `${value.toFixed(2)} °C`;
}

function formatSignal(value: number | null): string {
  return value === null ? "--" : `${value} dBm`;
}

// IMPORTANT:
// This formatter assumes the backend sends sonar_range in metres.
// If your ESP32 sends millimetres or centimetres, convert the
// value in the firmware or backend before displaying it here.
function formatRange(value: number | null): string {
  return value === null ? "--" : `${value.toFixed(3)} m`;
}

function formatTime(timestamp: string): string {
  return new Date(timestamp).toLocaleTimeString("en-IN", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

function isValidTimestamp(timestamp: string): boolean {
  return Number.isFinite(Date.parse(timestamp));
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function calculateStatistics(values: number[]): Statistics {
  if (values.length === 0) {
    return {
      current: null,
      minimum: null,
      maximum: null,
      average: null,
    };
  }

  const sum = values.reduce((total, value) => total + value, 0);

  return {
    current: values[values.length - 1],
    minimum: Math.min(...values),
    maximum: Math.max(...values),
    average: sum / values.length,
  };
}

// =====================================================
// ANALYTICS PAGE
// =====================================================

export default function Analytics() {
  const [readings, setReadings] = useState<TelemetryReading[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // ---------------------------------------------------
  // FETCH TELEMETRY HISTORY
  // ---------------------------------------------------

  const fetchHistory = useCallback(async (manual = false) => {
    if (manual) {
      setRefreshing(true);
    }

    try {
      const response = await fetch(API_URL, {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(`Backend returned HTTP ${response.status}`);
      }

      const data: TelemetryHistoryResponse = await response.json();

      if (!data || !Array.isArray(data.readings)) {
        throw new Error("Invalid telemetry history response.");
      }

      // Ignore malformed records rather than allowing them to break charts.
      const validReadings = data.readings.filter(
        (reading): reading is TelemetryReading =>
          reading !== null &&
          typeof reading === "object" &&
          typeof reading.node_id === "string" &&
          typeof reading.timestamp === "string" &&
          isValidTimestamp(reading.timestamp)
      );

      setReadings(validReadings);
      setLastUpdated(new Date());
      setError(null);
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to retrieve telemetry history."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // ---------------------------------------------------
  // INITIAL FETCH + AUTOMATIC REFRESH
  // ---------------------------------------------------

  useEffect(() => {
    let active = true;
    let requestInProgress = false;

    const loadHistory = async () => {
      // Avoid overlapping requests if the backend is slow.
      if (requestInProgress || !active) {
        return;
      }

      requestInProgress = true;

      try {
        const response = await fetch(API_URL, {
          cache: "no-store",
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`Backend returned HTTP ${response.status}`);
        }

        const data: TelemetryHistoryResponse = await response.json();

        if (!active) {
          return;
        }

        if (!data || !Array.isArray(data.readings)) {
          throw new Error("Invalid telemetry history response.");
        }

        const validReadings = data.readings.filter(
          (reading): reading is TelemetryReading =>
            reading !== null &&
            typeof reading === "object" &&
            typeof reading.node_id === "string" &&
            typeof reading.timestamp === "string" &&
            isValidTimestamp(reading.timestamp)
        );

        setReadings(validReadings);
        setLastUpdated(new Date());
        setError(null);
      } catch (err: unknown) {
        if (!active) {
          return;
        }

        if (err instanceof Error && err.name === "AbortError") {
          return;
        }

        setError(
          err instanceof Error
            ? err.message
            : "Unable to retrieve telemetry history."
        );
      } finally {
        requestInProgress = false;

        if (active) {
          setLoading(false);
        }
      }
    };

    const controller = new AbortController();

    // Defer the first request to avoid synchronous state changes in the effect.
    const initialTimeout = window.setTimeout(() => {
      void loadHistory();
    }, 0);

    const interval = window.setInterval(() => {
      void loadHistory();
    }, REFRESH_INTERVAL);

    return () => {
      active = false;
      window.clearTimeout(initialTimeout);
      window.clearInterval(interval);
      controller.abort();
    };
  }, []);

  // ---------------------------------------------------
  // TEMPERATURE DATA
  // ---------------------------------------------------

  const temperatureReadings = useMemo<ChartReading[]>(() => {
    return readings
      .filter(
        (
          reading
        ): reading is TelemetryReading & { temperature: number } =>
          isFiniteNumber(reading.temperature)
      )
      .sort(
        (a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp)
      )
      .map((reading) => ({
        time: formatTime(reading.timestamp),
        timestamp: Date.parse(reading.timestamp),
        temperature: reading.temperature,
      }));
  }, [readings]);

  const temperatureStats = useMemo(
    () =>
      calculateStatistics(
        temperatureReadings.map((reading) => reading.temperature)
      ),
    [temperatureReadings]
  );

  // ---------------------------------------------------
  // WIFI SIGNAL DATA
  // ---------------------------------------------------

  const signalChartData = useMemo<SignalChartReading[]>(() => {
    return readings
      .filter(
        (
          reading
        ): reading is TelemetryReading & { signal_strength: number } =>
          isFiniteNumber(reading.signal_strength)
      )
      .sort(
        (a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp)
      )
      .map((reading) => ({
        time: formatTime(reading.timestamp),
        timestamp: Date.parse(reading.timestamp),
        signal_strength: reading.signal_strength,
      }));
  }, [readings]);

  const signalStats = useMemo(
    () =>
      calculateStatistics(
        signalChartData.map((reading) => reading.signal_strength)
      ),
    [signalChartData]
  );

  // ---------------------------------------------------
  // L08 SONAR DATA
  // ---------------------------------------------------

  const sonarChartData = useMemo<SonarChartReading[]>(() => {
    return readings
      .filter(
        (
          reading
        ): reading is TelemetryReading & { sonar_range: number } =>
          isFiniteNumber(reading.sonar_range) &&
          reading.sonar_range >= 0
      )
      .sort(
        (a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp)
      )
      .map((reading) => ({
        time: formatTime(reading.timestamp),
        timestamp: Date.parse(reading.timestamp),
        sonar_range: reading.sonar_range,
      }));
  }, [readings]);

  const sonarStats = useMemo(
    () =>
      calculateStatistics(
        sonarChartData.map((reading) => reading.sonar_range)
      ),
    [sonarChartData]
  );

  // ---------------------------------------------------
  // PAGE UI
  // ---------------------------------------------------

  return (
    <div className="min-h-full space-y-5 bg-[#030817] p-4 md:p-6">
      {/* HEADER */}
      <section className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-cyan-500/20 bg-[#071020] p-5">
        <div>
          <p className="text-[10px] tracking-[0.25em] text-cyan-500">
            ASNSS / DATA INTELLIGENCE
          </p>

          <h1 className="mt-2 text-xl font-bold text-white">
            System Analytics
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Real-time sensor monitoring and historical telemetry analysis
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <span className="flex items-center gap-2 rounded-md border border-cyan-500/20 bg-cyan-500/5 px-3 py-2 text-xs text-cyan-300">
            <Clock3 size={14} />
            LAST 60 MINUTES
          </span>

          <button
            type="button"
            onClick={() => void fetchHistory(true)}
            disabled={refreshing}
            className="flex items-center gap-2 rounded-md border border-slate-700 px-3 py-2 text-xs text-slate-300 transition hover:border-cyan-500/40 hover:text-cyan-300 disabled:opacity-50"
          >
            <RefreshCw
              size={14}
              className={refreshing ? "animate-spin" : ""}
            />
            Refresh
          </button>
        </div>
      </section>

      {/* ERROR MESSAGE */}
      {error && (
        <section
          role="alert"
          className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-300"
        >
          <p className="font-medium">Unable to load telemetry</p>

          <p className="mt-1 text-xs text-red-300/70">{error}</p>

          <button
            type="button"
            onClick={() => void fetchHistory(true)}
            disabled={refreshing}
            className="mt-3 text-xs underline underline-offset-4 disabled:opacity-50"
          >
            Try again
          </button>
        </section>
      )}

      {/* TEMPERATURE STATISTICS */}
      <section>
        <div className="mb-3 flex items-center gap-2">
          <Thermometer size={17} className="text-cyan-400" />
          <h2 className="text-sm font-semibold text-white">
            Temperature Statistics
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="CURRENT TEMPERATURE"
            value={formatTemperature(temperatureStats.current)}
            icon={<Thermometer size={19} />}
            description="Latest valid sensor reading"
          />

          <StatCard
            label="MINIMUM TEMPERATURE"
            value={formatTemperature(temperatureStats.minimum)}
            icon={<TrendingDown size={19} />}
            description="Lowest recorded temperature"
          />

          <StatCard
            label="MAXIMUM TEMPERATURE"
            value={formatTemperature(temperatureStats.maximum)}
            icon={<TrendingUp size={19} />}
            description="Highest recorded temperature"
          />

          <StatCard
            label="AVERAGE TEMPERATURE"
            value={formatTemperature(temperatureStats.average)}
            icon={<Activity size={19} />}
            description="Average of available readings"
          />
        </div>
      </section>

      {/* TEMPERATURE GRAPH */}
      <ChartPanel
        title="Temperature History"
        description="DS18B20 measurements received from the ESP32"
        count={temperatureReadings.length}
        color="cyan"
        loading={loading}
        emptyMessage="No temperature readings available. Check the DS18B20 and ESP32."
        dataExists={temperatureReadings.length > 0}
        footer="Source: ASNSS FastAPI telemetry history"
      >
        <LineChart
          data={temperatureReadings}
          margin={{ top: 10, right: 15, left: 5, bottom: 5 }}
        >
          <CartesianGrid
            stroke="#1e293b"
            strokeDasharray="3 3"
            vertical={false}
          />

          <XAxis
            dataKey="time"
            tick={{ fill: "#64748b", fontSize: 10 }}
            tickLine={false}
            axisLine={{ stroke: "#334155" }}
            minTickGap={35}
          />

          <YAxis
            domain={["auto", "auto"]}
            tick={{ fill: "#64748b", fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            width={65}
            tickFormatter={(value: number) => `${value} °C`}
          />

          <Tooltip
            contentStyle={tooltipStyle("#164e63")}
            labelStyle={{ color: "#94a3b8" }}
            formatter={(value) => [
              `${Number(value).toFixed(2)} °C`,
              "Temperature",
            ]}
            labelFormatter={(label) => `Time: ${label}`}
          />

          <Line
            type="monotone"
            dataKey="temperature"
            name="Temperature"
            stroke="#22d3ee"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 5 }}
            isAnimationActive={false}
          />
        </LineChart>
      </ChartPanel>

      {/* SONAR STATISTICS */}
      <section>
        <div className="mb-3 flex items-center gap-2">
          <Radio size={17} className="text-amber-400" />
          <h2 className="text-sm font-semibold text-white">
            L08 Sonar Range Statistics
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="CURRENT RANGE"
            value={formatRange(sonarStats.current)}
            icon={<Radio size={19} />}
            description="Latest valid sonar measurement"
          />

          <StatCard
            label="MINIMUM RANGE"
            value={formatRange(sonarStats.minimum)}
            icon={<TrendingDown size={19} />}
            description="Smallest recorded distance"
          />

          <StatCard
            label="MAXIMUM RANGE"
            value={formatRange(sonarStats.maximum)}
            icon={<TrendingUp size={19} />}
            description="Largest recorded distance"
          />

          <StatCard
            label="AVERAGE RANGE"
            value={formatRange(sonarStats.average)}
            icon={<Activity size={19} />}
            description="Average of valid measurements"
          />
        </div>
      </section>

      {/* SONAR GRAPH */}
      <ChartPanel
        title="L08 Sonar Range History"
        description="Distance measurements received from the ultrasonic sensor"
        count={sonarChartData.length}
        color="amber"
        loading={loading}
        emptyMessage="No valid sonar readings received. Check the sensor wiring, communication protocol, and backend telemetry."
        dataExists={sonarChartData.length > 0}
        footer="Source: sonar sensor telemetry"
      >
        <LineChart
          data={sonarChartData}
          margin={{ top: 10, right: 15, left: 5, bottom: 5 }}
        >
          <CartesianGrid
            stroke="#1e293b"
            strokeDasharray="3 3"
            vertical={false}
          />

          <XAxis
            dataKey="time"
            tick={{ fill: "#64748b", fontSize: 10 }}
            tickLine={false}
            axisLine={{ stroke: "#334155" }}
            minTickGap={35}
          />

          <YAxis
            domain={["auto", "auto"]}
            tick={{ fill: "#64748b", fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            width={65}
            tickFormatter={(value: number) => `${value} m`}
          />

          <Tooltip
            contentStyle={tooltipStyle("#92400e")}
            labelStyle={{ color: "#94a3b8" }}
            formatter={(value) => [
              `${Number(value).toFixed(3)} m`,
              "Sonar Range",
            ]}
            labelFormatter={(label) => `Time: ${label}`}
          />

          <Line
            type="monotone"
            dataKey="sonar_range"
            name="Sonar Range"
            stroke="#fbbf24"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 5 }}
            isAnimationActive={false}
          />
        </LineChart>
      </ChartPanel>

      {/* WIFI STATISTICS */}
      <section>
        <div className="mb-3 flex items-center gap-2">
          <Wifi size={17} className="text-violet-400" />
          <h2 className="text-sm font-semibold text-white">
            Network Signal Statistics
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="CURRENT SIGNAL"
            value={formatSignal(signalStats.current)}
            icon={<Wifi size={19} />}
            description="Latest ESP32 Wi-Fi RSSI"
          />

          <StatCard
            label="STRONGEST SIGNAL"
            value={formatSignal(signalStats.maximum)}
            icon={<TrendingUp size={19} />}
            description="Highest RSSI value recorded"
          />

          <StatCard
            label="WEAKEST SIGNAL"
            value={formatSignal(signalStats.minimum)}
            icon={<TrendingDown size={19} />}
            description="Lowest RSSI value recorded"
          />

          <StatCard
            label="AVERAGE SIGNAL"
            value={
              signalStats.average === null
                ? "--"
                : `${signalStats.average.toFixed(1)} dBm`
            }
            icon={<Activity size={19} />}
            description="Average RSSI across readings"
          />
        </div>
      </section>

      {/* WIFI GRAPH */}
      <ChartPanel
        title="Wi-Fi Signal Strength History"
        description="Actual signal-strength telemetry received from the ESP32"
        count={signalChartData.length}
        color="violet"
        loading={loading}
        emptyMessage="No signal-strength readings available. Check ESP32 connectivity."
        dataExists={signalChartData.length > 0}
        footer="Source: ESP32 Wi-Fi signal strength"
      >
        <LineChart
          data={signalChartData}
          margin={{ top: 10, right: 15, left: 5, bottom: 5 }}
        >
          <CartesianGrid
            stroke="#1e293b"
            strokeDasharray="3 3"
            vertical={false}
          />

          <XAxis
            dataKey="time"
            tick={{ fill: "#64748b", fontSize: 10 }}
            tickLine={false}
            axisLine={{ stroke: "#334155" }}
            minTickGap={35}
          />

          <YAxis
            domain={["auto", "auto"]}
            tick={{ fill: "#64748b", fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            width={65}
            tickFormatter={(value: number) => `${value} dBm`}
          />

          <Tooltip
            contentStyle={tooltipStyle("#5b21b6")}
            labelStyle={{ color: "#94a3b8" }}
            formatter={(value) => [
              `${Number(value)} dBm`,
              "Wi-Fi RSSI",
            ]}
            labelFormatter={(label) => `Time: ${label}`}
          />

          <Line
            type="monotone"
            dataKey="signal_strength"
            name="Wi-Fi RSSI"
            stroke="#a78bfa"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 5 }}
            isAnimationActive={false}
          />
        </LineChart>
      </ChartPanel>

      {/* TELEMETRY STATUS */}
      <section className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-800 bg-[#071020] p-4">
        <div>
          <p className="text-xs font-medium text-slate-300">
            Telemetry Collection
          </p>

          <p className="mt-1 text-xs text-slate-500">
            {readings.length} total readings currently available in history
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

// =====================================================
// REUSABLE COMPONENTS
// =====================================================

function StatCard({
  label,
  value,
  icon,
  description,
}: {
  label: string;
  value: string;
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

function ChartPanel({
  title,
  description,
  count,
  color,
  loading,
  emptyMessage,
  dataExists,
  footer,
  children,
}: {
  title: string;
  description: string;
  count: number;
  color: "cyan" | "amber" | "violet";
  loading: boolean;
  emptyMessage: string;
  dataExists: boolean;
  footer: string;
  children: ReactNode;
}) {
  const styles = {
    cyan: {
      border: "border-cyan-500/20",
      badge: "border-cyan-500/20 bg-cyan-500/5 text-cyan-300",
    },
    amber: {
      border: "border-amber-500/20",
      badge: "border-amber-500/20 bg-amber-500/5 text-amber-300",
    },
    violet: {
      border: "border-violet-500/20",
      badge: "border-violet-500/20 bg-violet-500/5 text-violet-300",
    },
  }[color];

  return (
    <section
      className={`rounded-xl border ${styles.border} bg-[#071020] p-4 md:p-5`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold tracking-wide text-white">
            {title}
          </h2>

          <p className="mt-1 text-xs text-slate-500">{description}</p>
        </div>

        <span
          className={`rounded-md border px-3 py-1.5 text-[10px] ${styles.badge}`}
        >
          {count} READINGS
        </span>
      </div>

      <div className="mt-6 h-[320px] w-full">
        {loading && !dataExists ? (
          <ChartMessage message="Loading telemetry history..." />
        ) : !dataExists ? (
          <ChartMessage message={emptyMessage} />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            {children as ReactElement}
          </ResponsiveContainer>
        )}
      </div>

      <div className="mt-4 flex flex-wrap justify-between gap-2 border-t border-slate-800 pt-3 text-[10px] text-slate-500">
        <span>{footer}</span>
        <span>{count} valid readings · Refresh every 5 seconds</span>
      </div>
    </section>
  );
}

function ChartMessage({ message }: { message: string }) {
  return (
    <div className="flex h-full items-center justify-center px-4 text-center text-sm text-slate-500">
      {message}
    </div>
  );
}

function tooltipStyle(borderColor: string) {
  return {
    backgroundColor: "#071321",
    border: `1px solid ${borderColor}`,
    borderRadius: "8px",
    color: "#e2e8f0",
    fontSize: "12px",
  };
}