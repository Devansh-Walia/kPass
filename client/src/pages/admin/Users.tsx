import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { usersApi } from "../../api/users";

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  isActive: boolean;
}

export default function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ email: "", firstName: "", lastName: "", password: "", role: "MEMBER" });
  const [error, setError] = useState("");

  useEffect(() => { loadUsers(); }, []);

  const loadUsers = () => usersApi.list().then(setUsers);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await usersApi.create(form);
      setShowCreate(false);
      setForm({ email: "", firstName: "", lastName: "", password: "", role: "MEMBER" });
      loadUsers();
    } catch {
      setError("Failed to create user");
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Users</h2>
        <button onClick={() => setShowCreate(!showCreate)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm hover:bg-indigo-700">
          {showCreate ? "Cancel" : "Create User"}
        </button>
      </div>

      {showCreate && (
        <form onSubmit={handleCreate} className="bg-white p-6 rounded-lg shadow mb-6 grid grid-cols-2 gap-4">
          {error && <div className="col-span-2 text-red-600 text-sm">{error}</div>}
          <input placeholder="First Name" required value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })}
            className="border rounded-md px-3 py-2" />
          <input placeholder="Last Name" required value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })}
            className="border rounded-md px-3 py-2" />
          <input type="email" placeholder="Email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
            className="border rounded-md px-3 py-2" />
          <input type="password" placeholder="Temp Password (min 8)" required minLength={8} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
            className="border rounded-md px-3 py-2" />
          <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} className="border rounded-md px-3 py-2">
            <option value="MEMBER">Member</option>
            <option value="ADMIN">Admin</option>
          </select>
          <button type="submit" className="bg-indigo-600 text-white rounded-md px-4 py-2 hover:bg-indigo-700">Create</button>
        </form>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {users.map(user => (
              <tr key={user.id}>
                <td className="px-6 py-4 text-sm text-gray-900">{user.firstName} {user.lastName}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{user.email}</td>
                <td className="px-6 py-4"><span className={`text-xs font-medium px-2 py-1 rounded ${user.role === "ADMIN" ? "bg-purple-100 text-purple-700" : "bg-gray-100 text-gray-700"}`}>{user.role}</span></td>
                <td className="px-6 py-4"><span className={`text-xs font-medium px-2 py-1 rounded ${user.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{user.isActive ? "Active" : "Inactive"}</span></td>
                <td className="px-6 py-4 text-right"><Link to={`/admin/users/${user.id}`} className="text-indigo-600 hover:text-indigo-800 text-sm">Manage</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
