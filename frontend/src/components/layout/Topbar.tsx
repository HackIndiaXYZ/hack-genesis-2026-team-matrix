import { Bell, Clock3 } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

const titles: Record<string, string> = {
  "/": "Dashboard",
  "/machine": "Machine View",
  "/nodes": "Node Management",
  "/alerts": "Alerts & Events",
  "/analytics": "System Analytics",
  "/network": "Network Topology",
  "/settings": "System Settings",
};

export default function Topbar() {
  const location = useLocation();
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setTime(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <header className="flex min-h-[76px] items-center justify-between gap-4 border-b border-cyan-500/15 bg-[#070d1d] px-5 md:px-8">
      <div>
        <p className="text-[10px] tracking-[0.2em] text-cyan-500">
          ASNSS / CONTROL CENTER
        </p>

        <h2 className="mt-1 text-lg font-semibold text-white">
          {titles[location.pathname] ?? "Control Center"}
        </h2>
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden items-center gap-2 text-xs text-slate-400 sm:flex">
          <Clock3 size={15} className="text-cyan-400" />

          <span>
            {time.toLocaleTimeString("en-IN", {
              timeZone: "Asia/Kolkata",
              hour12: false,
            })}
          </span>

          <span className="text-slate-600">IST</span>
        </div>

        <div className="relative rounded-lg border border-slate-800 p-2">
          <Bell size={18} className="text-slate-400" />
          <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-cyan-400" />
        </div>

        <div className="hidden border-l border-slate-800 pl-4 sm:block">
          <p className="text-xs font-medium text-slate-200">Operator Console</p>
          <p className="mt-1 text-[10px] text-slate-500">Development Mode</p>
        </div>
      </div>
    </header>
  );
}