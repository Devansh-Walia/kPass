import { NavLink } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `block px-4 py-2 rounded-md text-sm ${isActive ? "bg-indigo-50 text-indigo-700 font-medium" : "text-gray-700 hover:bg-gray-100"}`;

export function Sidebar() {
  const { user } = useAuth();
  return (
    <aside className="w-64 bg-white border-r border-gray-200 p-4 space-y-1">
      <NavLink to="/dashboard" className={linkClass}>Dashboard</NavLink>
      {user?.role === "ADMIN" && (
        <>
          <div className="pt-4 pb-1 px-4 text-xs font-semibold text-gray-400 uppercase">Admin</div>
          <NavLink to="/admin/overview" className={linkClass}>Overview</NavLink>
          <NavLink to="/admin/users" className={linkClass}>Users</NavLink>
          <NavLink to="/admin/apps" className={linkClass}>Apps</NavLink>
        </>
      )}
    </aside>
  );
}
