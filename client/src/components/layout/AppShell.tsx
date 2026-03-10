import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { AdBanner } from "../common/AdBanner";

export function AppShell() {
  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <TopBar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <Outlet />
          <AdBanner />
        </main>
      </div>
    </div>
  );
}
