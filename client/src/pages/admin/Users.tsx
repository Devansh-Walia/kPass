import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { usersApi } from "../../api/users";
import { PasswordInput } from "../../components/common/PasswordInput";
import type { User } from "../../types";
import { UserRole, ROLE_BADGE_COLORS, activeStatusBadge, activeStatusLabel } from "../../constants";

export default function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ email: "", firstName: "", lastName: "", password: "", role: "MEMBER" as string });
  const [error, setError] = useState("");

  useEffect(() => { loadUsers(); }, []);
  const loadUsers = () => usersApi.list().then(setUsers);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await usersApi.create(form);
      setShowCreate(false);
      setForm({ email: "", firstName: "", lastName: "", password: "", role: UserRole.MEMBER });
      loadUsers();
    } catch {
      setError("Failed to create user. Email may already exist.");
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Users</h2>
        <button onClick={() => setShowCreate(!showCreate)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm">
          {showCreate ? "Cancel" : "+ Create User"}
        </button>
      </div>

      {showCreate && (
        <form onSubmit={handleCreate} className="bg-white p-6 rounded-xl border border-gray-200 mb-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">New User</h3>
          {error && <div className="text-red-600 text-sm mb-4 bg-red-50 px-4 py-2 rounded-lg">{error}</div>}
          <div className="grid grid-cols-2 gap-4">
            <input placeholder="First Name" required value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
            <input placeholder="Last Name" required value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
            <input type="email" placeholder="Email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
            <PasswordInput placeholder="Temp Password (min 8)" required minLength={8} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
            <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none">
              <option value="MEMBER">Member</option>
              <option value="ADMIN">Admin</option>
            </select>
            <button type="submit" className="bg-indigo-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-indigo-700 transition-colors">Create</button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-6 py-3 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider">Email</th>
              <th className="px-6 py-3 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider">Role</th>
              <th className="px-6 py-3 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.map(user => (
              <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 text-sm font-medium text-gray-900">{user.firstName} {user.lastName}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{user.email}</td>
                <td className="px-6 py-4">
                  <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${ROLE_BADGE_COLORS[user.role] ?? "bg-gray-100 text-gray-600"}`}>
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${activeStatusBadge(user.isActive)}`}>
                    {activeStatusLabel(user.isActive)}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <Link to={`/admin/users/${user.id}`} className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">
                    Manage &rarr;
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {users.length === 0 && (
          <div className="text-center py-10 text-gray-400 text-sm">No users found</div>
        )}
      </div>
    </div>
  );
}
