import { useEffect, useState } from "react";
import { needsRegistryApi } from "../../../api/needsRegistry";
import { APPROVAL_STATUS_COLORS } from "../../../constants";
import { useAuth } from "../../../contexts/AuthContext";
import { ConfirmDialog } from "../../../components/common/ConfirmDialog";

type Status = "ALL" | "PENDING" | "APPROVED" | "FULFILLED" | "REJECTED";
type Category = "SANITATION" | "HEALTH" | "SUPPLIES" | "OTHER";

interface NeedRequest {
  id: string;
  childName: string;
  category: Category;
  description: string;
  status: "PENDING" | "APPROVED" | "FULFILLED" | "REJECTED";
  requestedBy: { firstName: string; lastName: string };
  approvedBy: { firstName: string; lastName: string } | null;
  fulfilledAt: string | null;
  createdAt: string;
}

const STATUS_BADGES: Record<NeedRequest["status"], { label: string; color: string }> = {
  PENDING: { label: "Pending", color: APPROVAL_STATUS_COLORS.PENDING },
  APPROVED: { label: "Approved", color: "bg-blue-100 text-blue-800" },
  FULFILLED: { label: "Fulfilled", color: APPROVAL_STATUS_COLORS.FULFILLED },
  REJECTED: { label: "Rejected", color: APPROVAL_STATUS_COLORS.REJECTED },
};

const CATEGORY_BADGES: Record<Category, { label: string; color: string }> = {
  SANITATION: { label: "Sanitation", color: "bg-purple-100 text-purple-800" },
  HEALTH: { label: "Health", color: "bg-pink-100 text-pink-800" },
  SUPPLIES: { label: "Supplies", color: "bg-indigo-100 text-indigo-800" },
  OTHER: { label: "Other", color: "bg-gray-100 text-gray-800" },
};

const CATEGORIES: Category[] = ["SANITATION", "HEALTH", "SUPPLIES", "OTHER"];
const TABS: { key: Status; label: string }[] = [
  { key: "ALL", label: "All" },
  { key: "PENDING", label: "Pending" },
  { key: "APPROVED", label: "Approved" },
  { key: "FULFILLED", label: "Fulfilled" },
  { key: "REJECTED", label: "Rejected" },
];

export default function NeedsRegistryPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";

  const [tab, setTab] = useState<Status>("ALL");
  const [requests, setRequests] = useState<NeedRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Create form state
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ childName: "", category: "SANITATION" as Category, description: "" });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ childName: "", category: "SANITATION" as Category, description: "" });
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState("");

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState<NeedRequest | null>(null);

  const loadRequests = async () => {
    setLoading(true);
    setError("");
    try {
      const status = tab === "ALL" ? undefined : tab;
      const data = await needsRegistryApi.getRequests(status);
      setRequests(Array.isArray(data) ? data : []);
    } catch {
      setError("Failed to load requests.");
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, [tab]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    if (!form.childName.trim() || !form.description.trim()) {
      setFormError("Child name and description are required.");
      return;
    }
    setSubmitting(true);
    try {
      await needsRegistryApi.createRequest({
        childName: form.childName.trim(),
        category: form.category,
        description: form.description.trim(),
      });
      setForm({ childName: "", category: "SANITATION", description: "" });
      setShowForm(false);
      await loadRequests();
    } catch (err: any) {
      setFormError(err.response?.data?.error || "Failed to create request.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAction = async (id: string, status: "APPROVED" | "FULFILLED" | "REJECTED") => {
    try {
      await needsRegistryApi.updateStatus(id, { status });
      await loadRequests();
    } catch {
      /* silent */
    }
  };

  const startEdit = (req: NeedRequest) => {
    setEditingId(req.id);
    setEditForm({ childName: req.childName, category: req.category, description: req.description });
    setEditError("");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditError("");
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditError("");
    if (!editForm.childName.trim() || !editForm.description.trim()) {
      setEditError("Child name and description are required.");
      return;
    }
    setEditSubmitting(true);
    try {
      await needsRegistryApi.updateRequest(editingId!, {
        childName: editForm.childName.trim(),
        category: editForm.category,
        description: editForm.description.trim(),
      });
      setEditingId(null);
      await loadRequests();
    } catch (err: any) {
      setEditError(err.response?.data?.error || "Failed to update request.");
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await needsRegistryApi.deleteRequest(deleteTarget.id);
      setDeleteTarget(null);
      await loadRequests();
    } catch {
      /* silent */
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Needs Registry</h2>

      {error && (
        <div className="rounded bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`whitespace-nowrap border-b-2 py-3 px-1 text-sm font-medium ${
                tab === t.key
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Action bar */}
      <div className="flex justify-end">
        <button
          onClick={() => setShowForm(!showForm)}
          className="rounded bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          {showForm ? "Cancel" : "New Request"}
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <form onSubmit={handleCreate} className="rounded border border-gray-200 bg-gray-50 p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              required
              placeholder="Child name *"
              value={form.childName}
              onChange={(e) => setForm({ ...form, childName: e.target.value })}
              className="rounded border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
            />
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value as Category })}
              className="rounded border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {CATEGORY_BADGES[c].label}
                </option>
              ))}
            </select>
          </div>
          <textarea
            required
            placeholder="Description *"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
            rows={3}
          />
          <button
            type="submit"
            disabled={submitting}
            className="rounded bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {submitting ? "Saving..." : "Submit Request"}
          </button>
          {formError && (
            <p className="text-red-600 text-sm">{formError}</p>
          )}
        </form>
      )}

      {/* Request cards */}
      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : requests.length === 0 ? (
        <p className="text-sm text-gray-500">No requests found.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {requests.map((req) => (
            <div key={req.id} className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm space-y-3">
              {editingId === req.id ? (
                /* Edit mode */
                <form onSubmit={handleEdit} className="space-y-3">
                  <input
                    required
                    placeholder="Child name *"
                    value={editForm.childName}
                    onChange={(e) => setEditForm({ ...editForm, childName: e.target.value })}
                    className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                  />
                  <select
                    value={editForm.category}
                    onChange={(e) => setEditForm({ ...editForm, category: e.target.value as Category })}
                    className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {CATEGORY_BADGES[c].label}
                      </option>
                    ))}
                  </select>
                  <textarea
                    required
                    placeholder="Description *"
                    value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                    rows={3}
                  />
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={editSubmitting}
                      className="rounded bg-indigo-600 px-3 py-1 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                    >
                      {editSubmitting ? "Saving..." : "Save"}
                    </button>
                    <button
                      type="button"
                      onClick={cancelEdit}
                      className="rounded border border-gray-300 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                  </div>
                  {editError && (
                    <p className="text-red-600 text-sm">{editError}</p>
                  )}
                </form>
              ) : (
                /* View mode */
                <>
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-gray-900">{req.childName}</h3>
                    <span
                      className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${STATUS_BADGES[req.status].color}`}
                    >
                      {STATUS_BADGES[req.status].label}
                    </span>
                  </div>

                  <span
                    className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${CATEGORY_BADGES[req.category].color}`}
                  >
                    {CATEGORY_BADGES[req.category].label}
                  </span>

                  <p className="text-sm text-gray-600">{req.description}</p>

                  <div className="text-xs text-gray-400">
                    <span>
                      Requested by {req.requestedBy.firstName} {req.requestedBy.lastName}
                    </span>
                    {req.approvedBy && (
                      <span>
                        {" "}
                        &middot; Approved by {req.approvedBy.firstName} {req.approvedBy.lastName}
                      </span>
                    )}
                    {req.fulfilledAt && (
                      <span> &middot; Fulfilled {new Date(req.fulfilledAt).toLocaleDateString()}</span>
                    )}
                  </div>

                  {/* Action buttons */}
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => startEdit(req)}
                      className="rounded border border-gray-300 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Edit
                    </button>
                    {isAdmin && (
                      <button
                        onClick={() => setDeleteTarget(req)}
                        className="rounded bg-red-600 px-3 py-1 text-xs font-medium text-white hover:bg-red-700"
                      >
                        Delete
                      </button>
                    )}
                    {req.status === "PENDING" && (
                      <>
                        <button
                          onClick={() => handleAction(req.id, "APPROVED")}
                          className="rounded bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-700"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleAction(req.id, "REJECTED")}
                          className="rounded bg-red-600 px-3 py-1 text-xs font-medium text-white hover:bg-red-700"
                        >
                          Reject
                        </button>
                      </>
                    )}
                    {req.status === "APPROVED" && (
                      <button
                        onClick={() => handleAction(req.id, "FULFILLED")}
                        className="rounded bg-green-600 px-3 py-1 text-xs font-medium text-white hover:bg-green-700"
                      >
                        Mark Fulfilled
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Delete confirmation dialog */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Request"
        message={`Are you sure you want to delete the request for "${deleteTarget?.childName}"? This action cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
