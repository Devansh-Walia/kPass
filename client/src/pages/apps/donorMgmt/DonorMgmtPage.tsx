import { useEffect, useState, useMemo } from "react";
import { donorMgmtApi } from "../../../api/donorMgmt";
import { formatCurrency, DONOR_TYPE_COLORS } from "../../../constants";
import { ConfirmDialog } from "../../../components/common/ConfirmDialog";
import { BulkImportModal } from "../../../components/common/BulkImportModal";
import { useAuth } from "../../../contexts/AuthContext";

type Tab = "donors" | "donations";

interface Donor {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  type: "INDIVIDUAL" | "CORPORATE";
  notes: string | null;
  _count?: { donations: number };
}

interface DonorDetail extends Donor {
  donations: Donation[];
  totalDonated: number;
  createdBy?: { firstName: string; lastName: string };
}

interface Donation {
  id: string;
  donorId: string;
  amount: number;
  date: string;
  purpose: string | null;
  receiptNo: string | null;
  donor?: { name: string };
  createdBy?: { firstName: string; lastName: string };
}

export default function DonorMgmtPage() {
  const [tab, setTab] = useState<Tab>("donors");
  const [donors, setDonors] = useState<Donor[]>([]);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showImport, setShowImport] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const [d, dn] = await Promise.all([
        donorMgmtApi.getDonors(),
        donorMgmtApi.getDonations(),
      ]);
      setDonors(d);
      setDonations(dn);
    } catch {
      setError("Failed to load donor management data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const tabs: { key: Tab; label: string }[] = [
    { key: "donors", label: "Donors" },
    { key: "donations", label: "Donations" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Donor / Sponsor Management</h2>
        <button
          onClick={() => setShowImport(true)}
          className="rounded bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
        >
          Import CSV/Excel
        </button>
      </div>

      {error && (
        <div className="rounded bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}

      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((t) => (
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

      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : (
        <>
          {tab === "donors" && (
            <DonorsTab donors={donors} onRefresh={loadData} />
          )}
          {tab === "donations" && (
            <DonationsTab donations={donations} donors={donors} onRefresh={loadData} />
          )}
        </>
      )}
    </div>
  );
}

/* ───────────── Donors Tab ───────────── */

function DonorsTab({
  donors,
  onRefresh,
}: {
  donors: Donor[];
  onRefresh: () => Promise<void>;
}) {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [expandedData, setExpandedData] = useState<DonorDetail | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingDonorId, setEditingDonorId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", email: "", phone: "", type: "INDIVIDUAL" as Donor["type"], notes: "" });
  const [submitting, setSubmitting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; name: string } | null>(null);

  const filtered = useMemo(
    () =>
      donors.filter((d) => {
        const matchesSearch = d.name.toLowerCase().includes(search.toLowerCase());
        const matchesType = !filterType || d.type === filterType;
        return matchesSearch && matchesType;
      }),
    [donors, search, filterType]
  );

  const toggleExpand = async (id: string) => {
    if (expandedId === id) {
      setExpandedId(null);
      setExpandedData(null);
      return;
    }
    setExpandedId(id);
    try {
      const data = await donorMgmtApi.getDonor(id);
      setExpandedData(data);
    } catch {
      setExpandedData(null);
    }
  };

  const startEdit = (donor: Donor) => {
    setEditingDonorId(donor.id);
    setForm({
      name: donor.name,
      email: donor.email || "",
      phone: donor.phone || "",
      type: donor.type,
      notes: donor.notes || "",
    });
    setShowForm(true);
  };

  const cancelForm = () => {
    setShowForm(false);
    setEditingDonorId(null);
    setForm({ name: "", email: "", phone: "", type: "INDIVIDUAL", notes: "" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSubmitting(true);
    try {
      const payload = {
        name: form.name.trim(),
        email: form.email.trim() || undefined,
        phone: form.phone.trim() || undefined,
        type: form.type,
        notes: form.notes.trim() || undefined,
      };
      if (editingDonorId) {
        await donorMgmtApi.updateDonor(editingDonorId, payload);
      } else {
        await donorMgmtApi.createDonor(payload);
      }
      cancelForm();
      await onRefresh();
    } catch {
      /* silent */
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteDonor = async () => {
    if (!confirmDelete) return;
    try {
      await donorMgmtApi.deleteDonor(confirmDelete.id);
      setConfirmDelete(null);
      if (expandedId === confirmDelete.id) {
        setExpandedId(null);
        setExpandedData(null);
      }
      await onRefresh();
    } catch {
      /* silent */
    }
  };

  return (
    <div className="space-y-4">
      <ConfirmDialog
        open={!!confirmDelete}
        title="Delete Donor"
        message={`Are you sure you want to delete "${confirmDelete?.name}"? This will also delete all associated donations.`}
        onConfirm={handleDeleteDonor}
        onCancel={() => setConfirmDelete(null)}
      />

      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="Search donors..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-64 rounded border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
          />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="rounded border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
          >
            <option value="">All Types</option>
            <option value="INDIVIDUAL">Individual</option>
            <option value="CORPORATE">Corporate</option>
          </select>
        </div>
        <button
          onClick={() => {
            if (showForm) {
              cancelForm();
            } else {
              setShowForm(true);
            }
          }}
          className="rounded bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          {showForm ? "Cancel" : "Add Donor"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="rounded border border-gray-200 bg-gray-50 p-4 space-y-3">
          <h3 className="text-sm font-semibold text-gray-700">
            {editingDonorId ? "Edit Donor" : "New Donor"}
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <input
              required
              placeholder="Name *"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="rounded border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
            />
            <input
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="rounded border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
            />
            <input
              placeholder="Phone"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="rounded border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
            />
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value as Donor["type"] })}
              className="rounded border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
            >
              <option value="INDIVIDUAL">Individual</option>
              <option value="CORPORATE">Corporate</option>
            </select>
          </div>
          <textarea
            placeholder="Notes"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
            rows={2}
          />
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={submitting}
              className="rounded bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {submitting ? "Saving..." : editingDonorId ? "Update Donor" : "Save Donor"}
            </button>
            {editingDonorId && (
              <button
                type="button"
                onClick={cancelForm}
                className="rounded border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      )}

      <div className="overflow-hidden rounded border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {["Name", "Email", "Phone", "Type", "Donations", ...(isAdmin ? ["Actions"] : [])].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {filtered.length === 0 && (
              <tr>
                <td colSpan={isAdmin ? 6 : 5} className="px-4 py-6 text-center text-sm text-gray-500">
                  No donors found.
                </td>
              </tr>
            )}
            {filtered.map((d) => (
              <DonorRow
                key={d.id}
                donor={d}
                expanded={expandedId === d.id}
                expandedData={expandedId === d.id ? expandedData : null}
                onToggle={() => toggleExpand(d.id)}
                isAdmin={isAdmin}
                onEdit={() => startEdit(d)}
                onDelete={() => setConfirmDelete({ id: d.id, name: d.name })}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function DonorRow({
  donor,
  expanded,
  expandedData,
  onToggle,
  isAdmin,
  onEdit,
  onDelete,
}: {
  donor: Donor;
  expanded: boolean;
  expandedData: DonorDetail | null;
  onToggle: () => void;
  isAdmin: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <>
      <tr
        className="cursor-pointer hover:bg-gray-50"
      >
        <td className="px-4 py-3 text-sm font-medium text-gray-900" onClick={onToggle}>{donor.name}</td>
        <td className="px-4 py-3 text-sm text-gray-600" onClick={onToggle}>{donor.email || "-"}</td>
        <td className="px-4 py-3 text-sm text-gray-600" onClick={onToggle}>{donor.phone || "-"}</td>
        <td className="px-4 py-3 text-sm" onClick={onToggle}>
          <span
            className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${DONOR_TYPE_COLORS[donor.type] ?? "bg-gray-100 text-gray-800"}`}
          >
            {donor.type}
          </span>
        </td>
        <td className="px-4 py-3 text-sm text-gray-600" onClick={onToggle}>{donor._count?.donations ?? 0}</td>
        {isAdmin && (
          <td className="px-4 py-3 text-sm">
            <div className="flex gap-2">
              <button
                onClick={(e) => { e.stopPropagation(); onEdit(); }}
                className="rounded px-2 py-1 text-xs font-medium text-indigo-600 hover:bg-indigo-50"
              >
                Edit
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(); }}
                className="rounded px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
              >
                Delete
              </button>
            </div>
          </td>
        )}
      </tr>
      {expanded && (
        <tr>
          <td colSpan={isAdmin ? 6 : 5} className="bg-gray-50 px-6 py-4">
            {!expandedData ? (
              <p className="text-sm text-gray-500">Loading details...</p>
            ) : (
              <div className="space-y-4">
                {expandedData.notes && (
                  <div>
                    <h4 className="text-xs font-semibold uppercase text-gray-500">Notes</h4>
                    <p className="mt-1 text-sm text-gray-700">{expandedData.notes}</p>
                  </div>
                )}

                <div>
                  <h4 className="text-xs font-semibold uppercase text-gray-500">
                    Total Donated: {formatCurrency(expandedData.totalDonated)}
                  </h4>
                </div>

                {expandedData.createdBy && (
                  <div>
                    <h4 className="text-xs font-semibold uppercase text-gray-500">Created By</h4>
                    <p className="mt-1 text-sm text-gray-700">
                      {expandedData.createdBy.firstName} {expandedData.createdBy.lastName}
                    </p>
                  </div>
                )}

                <div>
                  <h4 className="text-xs font-semibold uppercase text-gray-500">Donation History</h4>
                  {expandedData.donations && expandedData.donations.length > 0 ? (
                    <ul className="mt-1 space-y-1">
                      {expandedData.donations.map((dn) => (
                        <li key={dn.id} className="text-sm text-gray-700">
                          <span className="font-medium">{formatCurrency(dn.amount)}</span>{" "}
                          on {new Date(dn.date).toLocaleDateString()}
                          {dn.purpose && <span> -- {dn.purpose}</span>}
                          {dn.receiptNo && (
                            <span className="ml-2 rounded bg-gray-200 px-1.5 py-0.5 text-xs">
                              #{dn.receiptNo}
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-1 text-sm text-gray-400">No donations yet.</p>
                  )}
                </div>
              </div>
            )}
          </td>
        </tr>
      )}
    </>
  );
}

/* ───────────── Donations Tab ───────────── */

function DonationsTab({
  donations,
  donors,
  onRefresh,
}: {
  donations: Donation[];
  donors: Donor[];
  onRefresh: () => Promise<void>;
}) {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ donorId: "", amount: "", date: new Date().toISOString().split("T")[0], purpose: "", receiptNo: "" });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; label: string } | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    if (!form.donorId || !form.amount) {
      setFormError("Donor and amount are required.");
      return;
    }
    setSubmitting(true);
    try {
      await donorMgmtApi.createDonation({
        donorId: form.donorId,
        amount: parseFloat(form.amount),
        date: form.date,
        purpose: form.purpose.trim() || undefined,
        receiptNo: form.receiptNo.trim() || undefined,
      });
      setForm({ donorId: "", amount: "", date: new Date().toISOString().split("T")[0], purpose: "", receiptNo: "" });
      setShowForm(false);
      await onRefresh();
    } catch (err: any) {
      setFormError(err.response?.data?.error || "Failed to record donation.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteDonation = async () => {
    if (!confirmDelete) return;
    try {
      await donorMgmtApi.deleteDonation(confirmDelete.id);
      setConfirmDelete(null);
      await onRefresh();
    } catch {
      /* silent */
    }
  };

  return (
    <div className="space-y-4">
      <ConfirmDialog
        open={!!confirmDelete}
        title="Delete Donation"
        message={`Are you sure you want to delete this donation (${confirmDelete?.label})?`}
        onConfirm={handleDeleteDonation}
        onCancel={() => setConfirmDelete(null)}
      />

      <div className="flex justify-end">
        <button
          onClick={() => setShowForm(!showForm)}
          className="rounded bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          {showForm ? "Cancel" : "Record Donation"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="rounded border border-gray-200 bg-gray-50 p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <select
              required
              value={form.donorId}
              onChange={(e) => setForm({ ...form, donorId: e.target.value })}
              className="rounded border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
            >
              <option value="">Select donor *</option>
              {donors.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
            <input
              type="number"
              step="0.01"
              min="0"
              required
              placeholder="Amount *"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              className="rounded border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
            />
            <input
              type="date"
              required
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              className="rounded border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
            />
            <input
              placeholder="Purpose"
              value={form.purpose}
              onChange={(e) => setForm({ ...form, purpose: e.target.value })}
              className="rounded border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
            />
            <input
              placeholder="Receipt No."
              value={form.receiptNo}
              onChange={(e) => setForm({ ...form, receiptNo: e.target.value })}
              className="rounded border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
            />
          </div>
          {formError && (
            <p className="text-red-600 text-sm">{formError}</p>
          )}
          <button
            type="submit"
            disabled={submitting}
            className="rounded bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {submitting ? "Saving..." : "Save Donation"}
          </button>
        </form>
      )}

      <div className="overflow-hidden rounded border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {["Donor", "Amount", "Date", "Purpose", "Receipt No.", "Created By", ...(isAdmin ? ["Actions"] : [])].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {donations.length === 0 && (
              <tr>
                <td colSpan={isAdmin ? 7 : 6} className="px-4 py-6 text-center text-sm text-gray-500">
                  No donations recorded yet.
                </td>
              </tr>
            )}
            {donations.map((dn) => (
              <tr key={dn.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm font-medium text-gray-900">{dn.donor?.name ?? "-"}</td>
                <td className="px-4 py-3 text-sm font-medium text-gray-900">{formatCurrency(dn.amount)}</td>
                <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                  {new Date(dn.date).toLocaleDateString()}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">{dn.purpose || "-"}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{dn.receiptNo || "-"}</td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {dn.createdBy
                    ? `${dn.createdBy.firstName} ${dn.createdBy.lastName}`
                    : "-"}
                </td>
                {isAdmin && (
                  <td className="px-4 py-3 text-sm">
                    <button
                      onClick={() => setConfirmDelete({ id: dn.id, label: formatCurrency(dn.amount) })}
                      className="rounded px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                    >
                      Delete
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <BulkImportModal
        open={showImport}
        onClose={() => setShowImport(false)}
        appSlug="donor-mgmt"
        onComplete={loadData}
      />
    </div>
  );
}
