import { useState, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { apiClient } from "../api/client";

export default function ChangePassword() {
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await apiClient.patch("/me/password", { currentPassword, newPassword });
      navigate("/dashboard");
    } catch {
      setError("Failed to change password");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full p-8 bg-white rounded-lg shadow">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Change Password</h2>
        <p className="text-sm text-gray-600 mb-6">You must change your password before continuing.</p>
        <form className="space-y-4" onSubmit={handleSubmit}>
          {error && <div className="text-red-600 text-sm">{error}</div>}
          <div>
            <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700">Current Password</label>
            <input id="currentPassword" type="password" required value={currentPassword} onChange={e => setCurrentPassword(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2" />
          </div>
          <div>
            <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">New Password (min 8 chars)</label>
            <input id="newPassword" type="password" required minLength={8} value={newPassword} onChange={e => setNewPassword(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2" />
          </div>
          <button type="submit"
            className="w-full py-2 px-4 rounded-md text-white bg-indigo-600 hover:bg-indigo-700">
            Change Password
          </button>
        </form>
      </div>
    </div>
  );
}
