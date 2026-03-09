import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { apiClient } from "../api/client";
import { PasswordInput } from "../components/common/PasswordInput";
import { useAuth } from "../contexts/AuthContext";

export default function ChangePassword() {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await apiClient.patch("/me/password", { currentPassword, newPassword });
      await refreshUser();
      navigate("/dashboard");
    } catch {
      setError("Failed to change password. Check your current password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
          <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center mb-4">
            <span className="text-amber-600 text-xl">!</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-1">Change Password</h2>
          <p className="text-sm text-gray-500 mb-6">You must set a new password before continuing.</p>
          <form className="space-y-4" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg border border-red-100">{error}</div>
            )}
            <div>
              <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-1.5">Current Password</label>
              <PasswordInput id="currentPassword" required value={currentPassword} onChange={e => setCurrentPassword(e.target.value)}
                className="block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
            </div>
            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1.5">New Password</label>
              <PasswordInput id="newPassword" required minLength={8} value={newPassword} onChange={e => setNewPassword(e.target.value)}
                placeholder="Minimum 8 characters"
                className="block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
            </div>
            <button type="submit" disabled={loading}
              className="w-full py-2.5 px-4 rounded-lg text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-sm">
              {loading ? "Updating..." : "Update Password"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
