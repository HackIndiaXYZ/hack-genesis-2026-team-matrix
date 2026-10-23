import { NavLink } from "react-router-dom";
import {
  Activity,
  Bell,
  ChartNoAxesCombined,
  LayoutDashboard,
  Network,
  Radio,
  Settings,
  Waves,
} from "lucide-react";

const navigation = [
  { name: "Dashboard", path: "/", icon: LayoutDashboard },
  { name: "Machine", path: "/machine", icon: Waves },
  { name: "Nodes", path: "/nodes", icon: Radio },
  { name: "Alerts", path: "/alerts", icon: Bell },
  { name: "Analytics", path: "/analytics", icon: ChartNoAxesCombined },
  { name: "Network", path: "/network", icon: Network },
  { name: "Settings", path: "/settings", icon: Settings },
];

export default function Sidebar() {
  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-cyan-500/15 bg-[#050b18]">
      <div className="flex h-20 items-center gap-3 border-b border-cyan-500/15 px-5">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-cyan-400/30 bg-cyan-400/10">
          <Waves className="h-6 w-6 text-cyan-300" />
        </div>

        <div>
          <h1 className="text-sm font-bold tracking-[0.2em] text-white">
            ASNSS
          </h1>
          <p className="mt-1 text-[9px] tracking-widest text-cyan-500">
            AQUA SONAR SYSTEM
          </p>
        </div>
      </div>

      <div className="px-4 pt-7">
        <p className="mb-3 px-3 text-[10px] font-semibold tracking-[0.2em] text-slate-600">
          MAIN MENU
        </p>

        <nav className="space-y-1">
          {navigation.map(({ name, path, icon: Icon }) => (
            <NavLink
              key={path}
              to={path}
              end={path === "/"}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-3 text-sm transition ${
                  isActive
                    ? "border border-cyan-400/20 bg-cyan-400/10 text-cyan-300"
                    : "text-slate-400 hover:bg-slate-800/60 hover:text-white"
                }`
              }
            >
              <Icon size={18} strokeWidth={1.8} />
              <span>{name}</span>
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="mt-auto border-t border-cyan-500/15 p-4">
        <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-3">
          <div className="flex items-center gap-2">
            <Activity size={15} className="text-cyan-400" />
            <span className="text-xs text-slate-300">System Status</span>
          </div>

          <p className="mt-2 text-[10px] text-amber-400">
            ● Awaiting hardware
          </p>

          <p className="mt-1 text-[10px] leading-4 text-slate-500">
            Hardware connection will be enabled during integration.
          </p>
        </div>

        <p className="mt-4 text-center text-[9px] tracking-widest text-slate-600">
          ASNSS CONSOLE v2.0
        </p>
      </div>
    </aside>
  );
}