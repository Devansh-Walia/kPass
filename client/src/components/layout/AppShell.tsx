import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { AdBanner } from "../common/AdBanner";

export function AppShell() {
  return (
    <div className="min-h-screen bg-gray-50">
      <TopBar />
      <div className="flex min-h-[calc(100vh-4rem)]">
        <Sidebar />
        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
          <AdBanner />
        </main>
      </div>
    </div>
  );
}
