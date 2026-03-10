import { useEffect, useState } from "react";
import { usersApi } from "../../api/users";
import { appsApi } from "../../api/apps";
import { UserRole } from "../../constants";

export default function Overview() {
  const [users, setUsers] = useState<any[]>([]);
  const [apps, setApps] = useState<any[]>([]);

  useEffect(() => {
    usersApi.list().then(setUsers);
    appsApi.list().then(setApps);
  }, []);

  const activeUsers = users.filter(u => u.isActive).length;
  const adminCount = users.filter(u => u.role === UserRole.ADMIN).length;

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Admin Overview</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-gray-200">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Users</div>
          <div className="mt-2 text-3xl font-bold text-gray-900">{users.length}</div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-200">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Active Users</div>
          <div className="mt-2 text-3xl font-bold text-emerald-600">{activeUsers}</div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-200">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Admins</div>
          <div className="mt-2 text-3xl font-bold text-indigo-600">{adminCount}</div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-200">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Active Apps</div>
          <div className="mt-2 text-3xl font-bold text-gray-900">{apps.length}</div>
        </div>
      </div>
    </div>
  );
}
