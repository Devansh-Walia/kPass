import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { appsApi } from "../api/apps";
import { useAuth } from "../contexts/AuthContext";
import type { App } from "../types";
import { APP_TYPE_COLORS, APP_TYPE_LABELS } from "../constants";

export default function Dashboard() {
  const { user } = useAuth();
  const [apps, setApps] = useState<App[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    appsApi.list().then(setApps).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-gray-400 text-sm">Loading your apps...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 sm:mb-8">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
          Welcome back, {user?.firstName}
        </h2>
        <p className="text-gray-500 mt-1 text-sm sm:text-base">Here are your assigned applications.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
        {apps.map(app => {
          const label = APP_TYPE_LABELS[app.type] || app.type;
          const colors = APP_TYPE_COLORS[app.type] || APP_TYPE_COLORS.CUSTOM;
          return (
            <button
              key={app.id}
              onClick={() => app.route && navigate(app.route)}
              className="group p-5 sm:p-6 bg-white rounded-xl border border-gray-200 hover:border-indigo-300 hover:shadow-lg transition-all text-left"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors truncate mr-2">
                  {app.name}
                </h3>
                <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full whitespace-nowrap ${colors}`}>
                  {label}
                </span>
              </div>
              <p className="text-sm text-gray-500 leading-relaxed line-clamp-2">{app.description}</p>
              <div className="mt-4 text-sm font-medium text-indigo-600 group-hover:text-indigo-700">
                Open app &rarr;
              </div>
            </button>
          );
        })}
      </div>
      {apps.length === 0 && (
        <div className="text-center py-20">
          <div className="text-gray-400 text-lg mb-2">No apps assigned yet</div>
          <p className="text-gray-400 text-sm">Contact your admin to get access to applications.</p>
        </div>
      )}
    </div>
  );
}
