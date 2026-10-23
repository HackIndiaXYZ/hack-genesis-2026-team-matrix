import { BrowserRouter, Route, Routes } from "react-router-dom";

import AppLayout from "./components/layout/AppLayout";

import Dashboard from "./pages/Dashboard";
import Machine from "./pages/Machine";
import Nodes from "./pages/Nodes";
import Alerts from "./pages/Alerts";
import Analytics from "./pages/Analytics";
import NetworkPage from "./pages/Network";
import SettingsPage from "./pages/Settings";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/machine" element={<Machine />} />
          <Route path="/nodes" element={<Nodes />} />
          <Route path="/alerts" element={<Alerts />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/network" element={<NetworkPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}