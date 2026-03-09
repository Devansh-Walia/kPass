import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { appsApi } from "../api/apps";

interface App {
  id: string;
  name: string;
  slug: string;
  description: string;
  route: string;
  type: string;
}

export default function Dashboard() {
  const [apps, setApps] = useState<App[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    appsApi.list().then(setApps).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-gray-500">Loading apps...</div>;

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Apps</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {apps.map(app => (
          <button key={app.id} onClick={() => navigate(app.route)}
            className="p-6 bg-white rounded-lg shadow hover:shadow-md transition-shadow text-left">
            <div className="text-lg font-semibold text-gray-900">{app.name}</div>
            <p className="mt-1 text-sm text-gray-500">{app.description}</p>
            <span className="mt-3 inline-block text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-1 rounded">
              {app.type}
            </span>
          </button>
        ))}
        {apps.length === 0 && (
          <p className="text-gray-500 col-span-full">No apps assigned yet. Contact your admin.</p>
        )}
      </div>
    </div>
  );
}
