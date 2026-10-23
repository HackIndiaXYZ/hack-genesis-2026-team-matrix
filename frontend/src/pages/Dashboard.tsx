import { Activity, Radio, Waves } from "lucide-react";

const metrics = [
  { label: "REGISTERED NODES", value: "01", icon: Radio },
  { label: "ACTIVE CONNECTIONS", value: "--", icon: Activity },
  { label: "SONAR STATUS", value: "STANDBY", icon: Waves },
];

export default function Dashboard() {
  return (
    <div className="space-y-6 p-5 md:p-8">
      <div>
        <p className="text-xs tracking-[0.2em] text-cyan-500">
          SYSTEM OVERVIEW
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-white">
          Aqua Sonar Network
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Monitoring console for the ASNSS prototype.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {metrics.map(({ label, value, icon: Icon }) => (
          <div
            key={label}
            className="rounded-xl border border-cyan-500/15 bg-[#071020] p-5"
          >
            <div className="flex items-center justify-between">
              <p className="text-[10px] tracking-widest text-slate-500">
                {label}
              </p>
              <Icon size={19} className="text-cyan-400" />
            </div>

            <p className="mt-5 text-2xl font-semibold text-cyan-300">{value}</p>
          </div>
        ))}
      </div>

      <section className="rounded-xl border border-cyan-500/15 bg-[#071020] p-6">
        <h2 className="text-sm font-semibold text-white">
          System Initialization
        </h2>
        <p className="mt-3 text-sm leading-6 text-slate-400">
          The frontend is initialized. Live node readings will appear after
          the backend and ESP32 telemetry connection are configured.
        </p>
        <div className="mt-5 inline-flex rounded-md border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-xs text-amber-400">
          ● Awaiting hardware integration
        </div>
      </section>
    </div>
  );
}