import { Outlet } from "react-router-dom";
import Sidebar from "./sidebar";
import Topbar from "./Topbar";

export default function AppLayout() {
  return (
    <div className="flex min-h-screen bg-[#030817] text-slate-200">
      <div className="sticky top-0 hidden h-screen md:block">
        <Sidebar />
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />

        <main className="min-h-0 flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
}