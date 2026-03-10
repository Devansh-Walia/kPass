import { useState } from "react";
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
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setOpen(!open)}
        className="sm:hidden fixed bottom-4 left-4 z-50 w-10 h-10 bg-indigo-600 text-white rounded-full shadow-lg flex items-center justify-center"
        aria-label="Toggle menu"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          {open
            ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          }
        </svg>
      </button>

      {/* Backdrop on mobile */}
      {open && (
        <div className="sm:hidden fixed inset-0 bg-black/30 z-30" onClick={() => setOpen(false)} />
      )}

      <aside className={`
        ${open ? "translate-x-0" : "-translate-x-full"}
        sm:translate-x-0 sm:static
        fixed inset-y-0 left-0 z-40
        w-56 sm:w-56 shrink-0 bg-white border-r border-gray-200
        px-3 py-5 flex flex-col gap-1 overflow-y-auto
        transition-transform duration-200
      `}>
        <NavLink to="/dashboard" className={linkClass} onClick={() => setOpen(false)}>
          Dashboard
        </NavLink>
        {user?.role === "ADMIN" && (
          <>
            <div className="mt-6 mb-2 px-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
              Admin
            </div>
            <NavLink to="/admin/overview" className={linkClass} onClick={() => setOpen(false)}>Overview</NavLink>
            <NavLink to="/admin/users" className={linkClass} onClick={() => setOpen(false)}>Users</NavLink>
            <NavLink to="/admin/apps" className={linkClass} onClick={() => setOpen(false)}>Apps</NavLink>
          </>
        )}
      </aside>
    </>
  );
}
