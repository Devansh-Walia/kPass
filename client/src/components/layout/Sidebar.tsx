import { NavLink } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `block px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
    isActive
      ? "bg-indigo-600 text-white shadow-sm"
      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
  }`;

export function Sidebar() {
  const { user } = useAuth();
  return (
    <aside className="w-64 bg-white border-r border-gray-200 px-4 py-6 flex flex-col gap-1">
      <NavLink to="/dashboard" className={linkClass}>
        Dashboard
      </NavLink>
      {user?.role === "ADMIN" && (
        <>
          <div className="mt-6 mb-2 px-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
            Admin
          </div>
          <NavLink to="/admin/overview" className={linkClass}>Overview</NavLink>
          <NavLink to="/admin/users" className={linkClass}>Users</NavLink>
          <NavLink to="/admin/apps" className={linkClass}>Apps</NavLink>
        </>
      )}
    </aside>
  );
}
