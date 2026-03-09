import { useEffect, useState } from "react";
import { apiClient } from "../../api/client";

interface App { id: string; name: string; slug: string; description: string; type: string; isActive: boolean; }

export default function Apps() {
  const [apps, setApps] = useState<App[]>([]);

  useEffect(() => {
    apiClient.get("/apps").then(res => setApps(res.data.data));
  }, []);

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Apps</h2>
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Slug</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {apps.map(app => (
              <tr key={app.id}>
                <td className="px-6 py-4 text-sm font-medium text-gray-900">{app.name}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{app.slug}</td>
                <td className="px-6 py-4"><span className="text-xs font-medium px-2 py-1 rounded bg-indigo-50 text-indigo-700">{app.type}</span></td>
                <td className="px-6 py-4"><span className={`text-xs font-medium px-2 py-1 rounded ${app.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{app.isActive ? "Active" : "Inactive"}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
