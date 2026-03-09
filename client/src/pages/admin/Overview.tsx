import { useEffect, useState } from "react";
import { usersApi } from "../../api/users";
import { appsApi } from "../../api/apps";

export default function Overview() {
  const [userCount, setUserCount] = useState(0);
  const [appCount, setAppCount] = useState(0);

  useEffect(() => {
    usersApi.list().then(users => setUserCount(users.length));
    appsApi.list().then(apps => setAppCount(apps.length));
  }, []);

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Admin Overview</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-sm font-medium text-gray-500">Total Users</div>
          <div className="mt-2 text-3xl font-bold text-gray-900">{userCount}</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-sm font-medium text-gray-500">Active Apps</div>
          <div className="mt-2 text-3xl font-bold text-gray-900">{appCount}</div>
        </div>
      </div>
    </div>
  );
}
