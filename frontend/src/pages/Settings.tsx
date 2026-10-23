import { useState } from "react";
import type { FormEvent } from "react";
import {
  Settings as SettingsIcon,
  Server,
  RefreshCw,
  Thermometer,
  Wifi,
  Save,
  RotateCcw,
  CheckCircle2,
  Info,
} from "lucide-react";

export default function Settings() {
const [apiBase, setApiBase] = useState(
  () => localStorage.getItem("asnss_api_base") || "http://localhost:8000"
);

const [refreshInterval, setRefreshInterval] = useState(
  () => localStorage.getItem("asnss_refresh_interval") || "5000"
);

const [temperatureLimit, setTemperatureLimit] = useState(
  () => localStorage.getItem("asnss_temperature_limit") || "35"
);

const [weakWifiLimit, setWeakWifiLimit] = useState(
  () => localStorage.getItem("asnss_weak_wifi_limit") || "-70"
);

const [saved, setSaved] = useState(false);

  function saveSettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedApi = apiBase.trim().replace(/\/+$/, "");
    const interval = Number(refreshInterval);
    const temperature = Number(temperatureLimit);
    const wifi = Number(weakWifiLimit);

    if (
      !/^https?:\/\/.+/i.test(normalizedApi) ||
      !Number.isFinite(interval) ||
      interval < 2000 ||
      interval > 60000 ||
      !Number.isFinite(temperature) ||
      temperature < -55 ||
      temperature > 125 ||
      !Number.isFinite(wifi) ||
      wifi < -100 ||
      wifi > 0
    ) {
      alert(
        "Check your API URL and settings. Refresh must be 2–60 seconds, temperature -55–125 °C, and Wi-Fi threshold -100–0 dBm."
      );
      return;
    }

    localStorage.setItem("asnss_api_base", normalizedApi);
    localStorage.setItem("asnss_refresh_interval", String(interval));
    localStorage.setItem("asnss_temperature_limit", String(temperature));
    localStorage.setItem("asnss_weak_wifi_limit", String(wifi));

    setApiBase(normalizedApi);
    setSaved(true);

    window.setTimeout(() => setSaved(false), 3000);
  }

  function resetSettings() {
    localStorage.removeItem("asnss_api_base");
    localStorage.removeItem("asnss_refresh_interval");
    localStorage.removeItem("asnss_temperature_limit");
    localStorage.removeItem("asnss_weak_wifi_limit");

    setApiBase("http://localhost:8000");
    setRefreshInterval("5000");
    setTemperatureLimit("35");
    setWeakWifiLimit("-70");
    setSaved(false);
  }

  const inputClass =
    "mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-cyan-400";

  return (
    <div className="min-h-screen space-y-6 bg-slate-950 p-5 text-slate-100 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.25em] text-cyan-400">
            <SettingsIcon size={15} />
            System configuration
          </div>

          <h1 className="text-3xl font-bold tracking-tight">
            Settings
          </h1>

          <p className="mt-2 text-sm text-slate-400">
            Configure the ASNSS dashboard and monitoring preferences.
          </p>
        </div>

        <button
          type="button"
          onClick={resetSettings}
          className="flex items-center gap-2 rounded-xl border border-slate-700 px-4 py-3 text-sm transition hover:border-rose-400 hover:text-rose-300"
        >
          <RotateCcw size={16} />
          Reset
        </button>
      </div>

      {saved && (
        <div
          role="status"
          className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-300"
        >
          <CheckCircle2 size={18} />
          Settings saved successfully in this browser.
        </div>
      )}

      <form onSubmit={saveSettings} className="space-y-6">
        <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 md:p-6">
          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-xl bg-cyan-400/10 p-3 text-cyan-400">
              <Server size={22} />
            </div>
            <div>
              <h2 className="font-semibold">Backend configuration</h2>
              <p className="mt-1 text-sm text-slate-400">
                Set the address used by the Network page.
              </p>
            </div>
          </div>

          <label className="block text-sm font-medium" htmlFor="apiBase">
            FastAPI base URL
          </label>

          <input
            id="apiBase"
            className={inputClass}
            type="url"
            value={apiBase}
            onChange={(event) => setApiBase(event.target.value)}
            placeholder="http://localhost:8000"
            required
          />

          <p className="mt-2 text-xs text-slate-500">
            Local demo: http://localhost:8000. Use your Mac's current
            LAN IP when another device needs to reach this backend.
          </p>
        </section>

        <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 md:p-6">
          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-xl bg-violet-400/10 p-3 text-violet-400">
              <RefreshCw size={22} />
            </div>
            <div>
              <h2 className="font-semibold">Dashboard preferences</h2>
              <p className="mt-1 text-sm text-slate-400">
                Control how frequently the Network page refreshes.
              </p>
            </div>
          </div>

          <label
            className="block text-sm font-medium"
            htmlFor="refreshInterval"
          >
            Refresh interval
          </label>

          <select
            id="refreshInterval"
            className={inputClass}
            value={refreshInterval}
            onChange={(event) => setRefreshInterval(event.target.value)}
          >
            <option value="2000">2 seconds</option>
            <option value="5000">5 seconds</option>
            <option value="10000">10 seconds</option>
            <option value="30000">30 seconds</option>
            <option value="60000">60 seconds</option>
          </select>
        </section>

        <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 md:p-6">
          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-xl bg-amber-400/10 p-3 text-amber-400">
              <Thermometer size={22} />
            </div>
            <div>
              <h2 className="font-semibold">Alert thresholds</h2>
              <p className="mt-1 text-sm text-slate-400">
                Store preferred monitoring thresholds for your demo.
              </p>
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label
                className="block text-sm font-medium"
                htmlFor="temperatureLimit"
              >
                High temperature threshold (°C)
              </label>

              <input
                id="temperatureLimit"
                className={inputClass}
                type="number"
                min="-55"
                max="125"
                step="0.5"
                value={temperatureLimit}
                onChange={(event) =>
                  setTemperatureLimit(event.target.value)
                }
                required
              />
            </div>

            <div>
              <label
                className="flex items-center gap-2 text-sm font-medium"
                htmlFor="weakWifiLimit"
              >
                <Wifi size={16} />
                Weak Wi-Fi threshold (dBm)
              </label>

              <input
                id="weakWifiLimit"
                className={inputClass}
                type="number"
                min="-100"
                max="0"
                step="1"
                value={weakWifiLimit}
                onChange={(event) =>
                  setWeakWifiLimit(event.target.value)
                }
                required
              />
            </div>
          </div>

          <div className="mt-5 flex items-start gap-3 rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-4 text-sm text-slate-300">
            <Info className="mt-0.5 shrink-0 text-cyan-400" size={18} />
            These threshold values are saved in your browser. They do
            not change the backend's alert-generation rules.
          </div>
        </section>

        <div className="flex justify-end">
          <button
            type="submit"
            className="flex items-center gap-2 rounded-xl bg-cyan-400 px-6 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300"
          >
            <Save size={18} />
            Save settings
          </button>
        </div>
      </form>
    </div>
  );
}