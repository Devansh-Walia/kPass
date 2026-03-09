import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { appsApi } from "../api/apps";
import { useAuth } from "../contexts/AuthContext";

interface App {
  id: string;
  name: string;
  slug: string;
  description: string;
  route: string;
  type: string;
}

const typeColors: Record<string, string> = {
  FINANCE: "bg-emerald-100 text-emerald-700",
  CRM: "bg-blue-100 text-blue-700",
  MARKETING: "bg-orange-100 text-orange-700",
  IDEATION: "bg-purple-100 text-purple-700",
  CUSTOM: "bg-gray-100 text-gray-700",
};

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
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">
          Welcome back, {user?.firstName}
        </h2>
        <p className="text-gray-500 mt-1">Here are your assigned applications.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {apps.map(app => (
          <button
            key={app.id}
            onClick={() => navigate(app.route)}
            className="group p-6 bg-white rounded-xl border border-gray-200 hover:border-indigo-300 hover:shadow-lg transition-all text-left"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="text-lg font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
                {app.name}
              </div>
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${typeColors[app.type] || typeColors.CUSTOM}`}>
                {app.type}
              </span>
            </div>
            <p className="text-sm text-gray-500 leading-relaxed">{app.description}</p>
            <div className="mt-4 text-sm font-medium text-indigo-600 group-hover:text-indigo-700">
              Open app &rarr;
            </div>
          </button>
        ))}
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
