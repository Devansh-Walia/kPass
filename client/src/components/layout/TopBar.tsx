import { useAuth } from "../../contexts/AuthContext";

export function TopBar() {
  const { user, logout } = useAuth();

  const initials = user
    ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
    : "";

  return (
    <header className="h-16 shrink-0 bg-white border-b border-gray-200 flex items-center justify-between px-4 sm:px-6 shadow-sm z-10">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
          <span className="text-white text-sm font-bold">k</span>
        </div>
        <h1 className="text-lg font-bold text-gray-900">kPass</h1>
      </div>
      <div className="flex items-center gap-2 sm:gap-4">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
            <span className="text-indigo-700 text-xs font-bold">{initials}</span>
          </div>
          <div className="text-sm hidden sm:block">
            <span className="font-medium text-gray-900">{user?.firstName} {user?.lastName}</span>
            <span className="ml-2 text-xs text-gray-400">{user?.role}</span>
          </div>
        </div>
        <button
          onClick={logout}
          className="text-sm text-gray-500 hover:text-red-600 transition-colors px-2 sm:px-3 py-1.5 rounded-lg hover:bg-red-50"
        >
          Logout
        </button>
      </div>
    </header>
  );
}
