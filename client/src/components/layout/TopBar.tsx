import { useAuth } from "../../contexts/AuthContext";

export function TopBar() {
  const { user, logout } = useAuth();
  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
      <h1 className="text-lg font-semibold text-gray-900">kPass</h1>
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-600">{user?.firstName} {user?.lastName}</span>
        <button onClick={logout} className="text-sm text-gray-500 hover:text-gray-700">Logout</button>
      </div>
    </header>
  );
}
