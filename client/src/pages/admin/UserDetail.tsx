import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { usersApi } from "../../api/users";
import { appsApi } from "../../api/apps";

interface UserDetail {
  id: string; email: string; firstName: string; lastName: string; role: string; isActive: boolean;
  apps: { app: { id: string; name: string; slug: string } }[];
}

interface App { id: string; name: string; slug: string; }

export default function UserDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<UserDetail | null>(null);
  const [allApps, setAllApps] = useState<App[]>([]);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ firstName: "", lastName: "", role: "" });

  useEffect(() => {
    if (!id) return;
    usersApi.getById(id).then(u => { setUser(u); setForm({ firstName: u.firstName, lastName: u.lastName, role: u.role }); });
    appsApi.list().then(setAllApps);
  }, [id]);

  const handleUpdate = async () => {
    if (!id) return;
    await usersApi.update(id, form);
    const u = await usersApi.getById(id);
    setUser(u);
    setEditing(false);
  };

  const handleDeactivate = async () => {
    if (!id) return;
    await usersApi.deactivate(id);
    navigate("/admin/users");
  };

  const handleAssignApp = async (appId: string) => {
    if (!id) return;
    await usersApi.assignApps(id, [appId]);
    const u = await usersApi.getById(id);
    setUser(u);
  };

  const handleRevokeApp = async (appId: string) => {
    if (!id) return;
    await usersApi.revokeApp(id, appId);
    const u = await usersApi.getById(id);
    setUser(u);
  };

  if (!user) return <div>Loading...</div>;

  const assignedAppIds = user.apps.map(a => a.app.id);
  const unassignedApps = allApps.filter(a => !assignedAppIds.includes(a.id));

  return (
    <div className="max-w-2xl">
      <button onClick={() => navigate("/admin/users")} className="text-sm text-gray-500 hover:text-gray-700 mb-4">&larr; Back to Users</button>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">{user.firstName} {user.lastName}</h2>
          <div className="flex gap-2">
            <button onClick={() => setEditing(!editing)} className="text-sm text-indigo-600 hover:text-indigo-800">{editing ? "Cancel" : "Edit"}</button>
            {user.isActive && <button onClick={handleDeactivate} className="text-sm text-red-600 hover:text-red-800">Deactivate</button>}
          </div>
        </div>
        <p className="text-gray-500 text-sm">{user.email}</p>
        {editing ? (
          <div className="mt-4 space-y-3">
            <input value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })} className="border rounded-md px-3 py-2 w-full" />
            <input value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })} className="border rounded-md px-3 py-2 w-full" />
            <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} className="border rounded-md px-3 py-2 w-full">
              <option value="MEMBER">Member</option>
              <option value="ADMIN">Admin</option>
            </select>
            <button onClick={handleUpdate} className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm">Save</button>
          </div>
        ) : (
          <div className="mt-2">
            <span className={`text-xs font-medium px-2 py-1 rounded ${user.role === "ADMIN" ? "bg-purple-100 text-purple-700" : "bg-gray-100 text-gray-700"}`}>{user.role}</span>
            <span className={`ml-2 text-xs font-medium px-2 py-1 rounded ${user.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{user.isActive ? "Active" : "Inactive"}</span>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">App Access</h3>
        <div className="space-y-2 mb-4">
          {user.apps.map(({ app }) => (
            <div key={app.id} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded">
              <span className="text-sm text-gray-900">{app.name}</span>
              <button onClick={() => handleRevokeApp(app.id)} className="text-xs text-red-600 hover:text-red-800">Revoke</button>
            </div>
          ))}
          {user.apps.length === 0 && <p className="text-sm text-gray-500">No apps assigned</p>}
        </div>
        {unassignedApps.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Assign App</h4>
            <div className="flex flex-wrap gap-2">
              {unassignedApps.map(app => (
                <button key={app.id} onClick={() => handleAssignApp(app.id)}
                  className="text-sm px-3 py-1 border border-indigo-300 text-indigo-600 rounded hover:bg-indigo-50">{app.name}</button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
