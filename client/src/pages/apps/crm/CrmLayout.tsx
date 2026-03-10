import { useEffect, useState, useMemo } from "react";
import { crmApi } from "../../../api/crm";
import { useAuth } from "../../../contexts/AuthContext";
import { ConfirmDialog } from "../../../components/common/ConfirmDialog";

type Tab = "contacts" | "pipeline" | "activities";

interface Contact {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  notes: string | null;
  deals?: Deal[];
  activities?: Activity[];
  _count?: { deals: number; activities: number };
}

interface Deal {
  id: string;
  title: string;
  value: number;
  stage: "LEAD" | "CONTACTED" | "PROPOSAL" | "CLOSED";
  contact?: Contact;
  contactId: string;
}

interface Activity {
  id: string;
  type: "CALL" | "EMAIL" | "NOTE" | "MEETING";
  content: string;
  contactId: string;
  contact?: Contact;
  createdBy?: { name: string };
  createdAt: string;
}

const STAGES: Deal["stage"][] = ["LEAD", "CONTACTED", "PROPOSAL", "CLOSED"];

const STAGE_COLORS: Record<Deal["stage"], string> = {
  LEAD: "bg-gray-100 border-gray-300",
  CONTACTED: "bg-blue-50 border-blue-300",
  PROPOSAL: "bg-yellow-50 border-yellow-300",
  CLOSED: "bg-green-50 border-green-300",
};

const ACTIVITY_BADGES: Record<Activity["type"], { label: string; color: string }> = {
  CALL: { label: "Call", color: "bg-blue-100 text-blue-800" },
  EMAIL: { label: "Email", color: "bg-purple-100 text-purple-800" },
  NOTE: { label: "Note", color: "bg-gray-100 text-gray-800" },
  MEETING: { label: "Meeting", color: "bg-green-100 text-green-800" },
};

export default function CrmLayout() {
  const [tab, setTab] = useState<Tab>("contacts");
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const [c, d, a] = await Promise.all([
        crmApi.getContacts(),
        crmApi.getDeals(),
        crmApi.getActivities(),
      ]);
      setContacts(c);
      setDeals(d);
      setActivities(a);
    } catch {
      setError("Failed to load CRM data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const tabs: { key: Tab; label: string }[] = [
    { key: "contacts", label: "Contacts" },
    { key: "pipeline", label: "Pipeline" },
    { key: "activities", label: "Activities" },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">CRM</h2>

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
          {tab === "contacts" && (
            <ContactsTab
              contacts={contacts}
              onRefresh={loadData}
            />
          )}
          {tab === "pipeline" && (
            <PipelineTab
              deals={deals}
              contacts={contacts}
              onRefresh={loadData}
            />
          )}
          {tab === "activities" && (
            <ActivitiesTab
              activities={activities}
              contacts={contacts}
              onRefresh={loadData}
            />
          )}
        </>
      )}
    </div>
  );
}

/* ───────────── Contacts Tab ───────────── */

function ContactsTab({
  contacts,
  onRefresh,
}: {
  contacts: Contact[];
  onRefresh: () => Promise<void>;
}) {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [expandedData, setExpandedData] = useState<Contact | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", company: "", notes: "" });
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: "", email: "", phone: "", company: "", notes: "" });
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; name: string } | null>(null);

  const filtered = useMemo(
    () =>
      contacts.filter((c) =>
        c.name.toLowerCase().includes(search.toLowerCase())
      ),
    [contacts, search]
  );

  const toggleExpand = async (id: string) => {
    if (expandedId === id) {
      setExpandedId(null);
      setExpandedData(null);
      return;
    }
    setExpandedId(id);
    try {
      const data = await crmApi.getContact(id);
      setExpandedData(data);
    } catch {
      setExpandedData(null);
    }
  };

  const startEdit = (c: Contact, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(c.id);
    setEditForm({
      name: c.name,
      email: c.email || "",
      phone: c.phone || "",
      company: c.company || "",
      notes: c.notes || "",
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({ name: "", email: "", phone: "", company: "", notes: "" });
  };

  const handleEditSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId || !editForm.name.trim()) return;
    setEditSubmitting(true);
    try {
      await crmApi.updateContact(editingId, {
        name: editForm.name.trim(),
        email: editForm.email.trim() || undefined,
        phone: editForm.phone.trim() || undefined,
        company: editForm.company.trim() || undefined,
        notes: editForm.notes.trim() || undefined,
      });
      cancelEdit();
      await onRefresh();
    } catch {
      /* silent */
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      await crmApi.deleteContact(confirmDelete.id);
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

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSubmitting(true);
    try {
      await crmApi.createContact({
        name: form.name.trim(),
        email: form.email.trim() || undefined,
        phone: form.phone.trim() || undefined,
        company: form.company.trim() || undefined,
        notes: form.notes.trim() || undefined,
      });
      setForm({ name: "", email: "", phone: "", company: "", notes: "" });
      setShowForm(false);
      await onRefresh();
    } catch {
      /* silent */
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <ConfirmDialog
        open={!!confirmDelete}
        title="Delete Contact"
        message={`Are you sure you want to delete "${confirmDelete?.name}"? All associated deals and activities will also be deleted.`}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(null)}
      />

      <div className="flex items-center justify-between gap-4">
        <input
          type="text"
          placeholder="Search contacts..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-64 rounded border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
        />
        <button
          onClick={() => setShowForm(!showForm)}
          className="rounded bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          {showForm ? "Cancel" : "Add Contact"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="rounded border border-gray-200 bg-gray-50 p-4 space-y-3">
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
            <input
              placeholder="Company"
              value={form.company}
              onChange={(e) => setForm({ ...form, company: e.target.value })}
              className="rounded border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
            />
          </div>
          <textarea
            placeholder="Notes"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
            rows={2}
          />
          <button
            type="submit"
            disabled={submitting}
            className="rounded bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {submitting ? "Saving..." : "Save Contact"}
          </button>
        </form>
      )}

      <div className="overflow-hidden rounded border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {["Name", "Email", "Phone", "Company", "Deals", "Activities", ...(isAdmin ? [""] : [])].map((h, i) => (
                <th key={i} className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {filtered.length === 0 && (
              <tr>
                <td colSpan={isAdmin ? 7 : 6} className="px-4 py-6 text-center text-sm text-gray-500">
                  No contacts found.
                </td>
              </tr>
            )}
            {filtered.map((c) =>
              editingId === c.id ? (
                <tr key={c.id}>
                  <td colSpan={isAdmin ? 7 : 6} className="bg-indigo-50 px-4 py-4">
                    <form onSubmit={handleEditSave} className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <input
                          required
                          placeholder="Name *"
                          value={editForm.name}
                          onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                          className="rounded border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                        />
                        <input
                          type="email"
                          placeholder="Email"
                          value={editForm.email}
                          onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                          className="rounded border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                        />
                        <input
                          placeholder="Phone"
                          value={editForm.phone}
                          onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                          className="rounded border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                        />
                        <input
                          placeholder="Company"
                          value={editForm.company}
                          onChange={(e) => setEditForm({ ...editForm, company: e.target.value })}
                          className="rounded border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                        />
                      </div>
                      <textarea
                        placeholder="Notes"
                        value={editForm.notes}
                        onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                        className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                        rows={2}
                      />
                      <div className="flex gap-2">
                        <button
                          type="submit"
                          disabled={editSubmitting}
                          className="rounded bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                        >
                          {editSubmitting ? "Saving..." : "Save"}
                        </button>
                        <button
                          type="button"
                          onClick={cancelEdit}
                          className="rounded border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  </td>
                </tr>
              ) : (
                <ContactRow
                  key={c.id}
                  contact={c}
                  expanded={expandedId === c.id}
                  expandedData={expandedId === c.id ? expandedData : null}
                  onToggle={() => toggleExpand(c.id)}
                  onEdit={(e) => startEdit(c, e)}
                  isAdmin={isAdmin}
                  onDelete={() => setConfirmDelete({ id: c.id, name: c.name })}
                />
              )
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ContactRow({
  contact,
  expanded,
  expandedData,
  onToggle,
  onEdit,
  isAdmin,
  onDelete,
}: {
  contact: Contact;
  expanded: boolean;
  expandedData: Contact | null;
  onToggle: () => void;
  onEdit: (e: React.MouseEvent) => void;
  isAdmin: boolean;
  onDelete: () => void;
}) {
  return (
    <>
      <tr
        onClick={onToggle}
        className="cursor-pointer hover:bg-gray-50"
      >
        <td className="px-4 py-3 text-sm font-medium text-indigo-600 hover:text-indigo-800">
          <button onClick={onEdit} className="text-left hover:underline">
            {contact.name}
          </button>
        </td>
        <td className="px-4 py-3 text-sm text-gray-600">{contact.email || "-"}</td>
        <td className="px-4 py-3 text-sm text-gray-600">{contact.phone || "-"}</td>
        <td className="px-4 py-3 text-sm text-gray-600">{contact.company || "-"}</td>
        <td className="px-4 py-3 text-sm text-gray-600">{contact._count?.deals ?? 0}</td>
        <td className="px-4 py-3 text-sm text-gray-600">{contact._count?.activities ?? 0}</td>
        {isAdmin && (
          <td className="px-4 py-3 text-sm">
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              className="rounded bg-red-50 px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-100"
            >
              Delete
            </button>
          </td>
        )}
      </tr>
      {expanded && (
        <tr>
          <td colSpan={isAdmin ? 7 : 6} className="bg-gray-50 px-6 py-4">
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
                  <h4 className="text-xs font-semibold uppercase text-gray-500">Deals</h4>
                  {expandedData.deals && expandedData.deals.length > 0 ? (
                    <ul className="mt-1 space-y-1">
                      {expandedData.deals.map((d) => (
                        <li key={d.id} className="text-sm text-gray-700">
                          <span className="font-medium">{d.title}</span>{" "}
                          — ${Number(d.value).toLocaleString()}{" "}
                          <span className="rounded bg-gray-200 px-1.5 py-0.5 text-xs">{d.stage}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-1 text-sm text-gray-400">No deals.</p>
                  )}
                </div>

                <div>
                  <h4 className="text-xs font-semibold uppercase text-gray-500">Activities</h4>
                  {expandedData.activities && expandedData.activities.length > 0 ? (
                    <ul className="mt-1 space-y-1">
                      {expandedData.activities.map((a) => (
                        <li key={a.id} className="text-sm text-gray-700">
                          <span className={`inline-block rounded px-1.5 py-0.5 text-xs font-medium ${ACTIVITY_BADGES[a.type].color}`}>
                            {ACTIVITY_BADGES[a.type].label}
                          </span>{" "}
                          {a.content}{" "}
                          <span className="text-gray-400">
                            {new Date(a.createdAt).toLocaleDateString()}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-1 text-sm text-gray-400">No activities.</p>
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

/* ───────────── Pipeline Tab ───────────── */

function PipelineTab({
  deals,
  contacts,
  onRefresh,
}: {
  deals: Deal[];
  contacts: Contact[];
  onRefresh: () => Promise<void>;
}) {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", value: "", contactId: "", stage: "LEAD" as Deal["stage"] });
  const [submitting, setSubmitting] = useState(false);
  const [editingDealId, setEditingDealId] = useState<string | null>(null);
  const [editDealForm, setEditDealForm] = useState({ title: "", value: "" });
  const [editDealSubmitting, setEditDealSubmitting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; title: string } | null>(null);

  const dealsByStage = useMemo(() => {
    const map: Record<Deal["stage"], Deal[]> = { LEAD: [], CONTACTED: [], PROPOSAL: [], CLOSED: [] };
    deals.forEach((d) => {
      if (map[d.stage]) map[d.stage].push(d);
    });
    return map;
  }, [deals]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.contactId) return;
    setSubmitting(true);
    try {
      await crmApi.createDeal({
        title: form.title.trim(),
        value: parseFloat(form.value) || 0,
        contactId: form.contactId,
        stage: form.stage,
      });
      setForm({ title: "", value: "", contactId: "", stage: "LEAD" });
      setShowForm(false);
      await onRefresh();
    } catch {
      /* silent */
    } finally {
      setSubmitting(false);
    }
  };

  const moveDeal = async (dealId: string, newStage: Deal["stage"]) => {
    try {
      await crmApi.updateDeal(dealId, { stage: newStage });
      await onRefresh();
    } catch {
      /* silent */
    }
  };

  const startEditDeal = (deal: Deal) => {
    setEditingDealId(deal.id);
    setEditDealForm({ title: deal.title, value: String(deal.value) });
  };

  const cancelEditDeal = () => {
    setEditingDealId(null);
    setEditDealForm({ title: "", value: "" });
  };

  const handleEditDealSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDealId || !editDealForm.title.trim()) return;
    setEditDealSubmitting(true);
    try {
      await crmApi.updateDeal(editingDealId, {
        title: editDealForm.title.trim(),
        value: parseFloat(editDealForm.value) || 0,
      });
      cancelEditDeal();
      await onRefresh();
    } catch {
      /* silent */
    } finally {
      setEditDealSubmitting(false);
    }
  };

  const handleDeleteDeal = async () => {
    if (!confirmDelete) return;
    try {
      await crmApi.deleteDeal(confirmDelete.id);
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
        title="Delete Deal"
        message={`Are you sure you want to delete "${confirmDelete?.title}"?`}
        onConfirm={handleDeleteDeal}
        onCancel={() => setConfirmDelete(null)}
      />

      <div className="flex justify-end">
        <button
          onClick={() => setShowForm(!showForm)}
          className="rounded bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          {showForm ? "Cancel" : "Add Deal"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="rounded border border-gray-200 bg-gray-50 p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <input
              required
              placeholder="Deal title *"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="rounded border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
            />
            <input
              type="number"
              step="0.01"
              placeholder="Value"
              value={form.value}
              onChange={(e) => setForm({ ...form, value: e.target.value })}
              className="rounded border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
            />
            <select
              required
              value={form.contactId}
              onChange={(e) => setForm({ ...form, contactId: e.target.value })}
              className="rounded border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
            >
              <option value="">Select contact *</option>
              {contacts.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <select
              value={form.stage}
              onChange={(e) => setForm({ ...form, stage: e.target.value as Deal["stage"] })}
              className="rounded border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
            >
              {STAGES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="rounded bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {submitting ? "Saving..." : "Save Deal"}
          </button>
        </form>
      )}

      <div className="grid grid-cols-4 gap-4">
        {STAGES.map((stage) => (
          <div key={stage} className={`rounded-lg border p-3 ${STAGE_COLORS[stage]}`}>
            <h3 className="mb-3 text-sm font-bold uppercase text-gray-700">
              {stage}{" "}
              <span className="text-gray-400">({dealsByStage[stage].length})</span>
            </h3>
            <div className="space-y-2">
              {dealsByStage[stage].length === 0 && (
                <p className="text-xs text-gray-400">No deals</p>
              )}
              {dealsByStage[stage].map((deal) =>
                editingDealId === deal.id ? (
                  <form key={deal.id} onSubmit={handleEditDealSave} className="rounded border border-indigo-300 bg-white p-3 shadow-sm space-y-2">
                    <input
                      required
                      placeholder="Title *"
                      value={editDealForm.title}
                      onChange={(e) => setEditDealForm({ ...editDealForm, title: e.target.value })}
                      className="w-full rounded border border-gray-300 px-2 py-1 text-sm focus:border-indigo-500 focus:outline-none"
                    />
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Value"
                      value={editDealForm.value}
                      onChange={(e) => setEditDealForm({ ...editDealForm, value: e.target.value })}
                      className="w-full rounded border border-gray-300 px-2 py-1 text-sm focus:border-indigo-500 focus:outline-none"
                    />
                    <div className="flex gap-1">
                      <button
                        type="submit"
                        disabled={editDealSubmitting}
                        className="rounded bg-indigo-600 px-2 py-1 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                      >
                        {editDealSubmitting ? "..." : "Save"}
                      </button>
                      <button
                        type="button"
                        onClick={cancelEditDeal}
                        className="rounded border border-gray-300 px-2 py-1 text-xs text-gray-700 hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <DealCard
                    key={deal.id}
                    deal={deal}
                    currentStage={stage}
                    onMove={moveDeal}
                    onEdit={() => startEditDeal(deal)}
                    isAdmin={isAdmin}
                    onDelete={() => setConfirmDelete({ id: deal.id, title: deal.title })}
                  />
                )
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function DealCard({
  deal,
  currentStage,
  onMove,
  onEdit,
  isAdmin,
  onDelete,
}: {
  deal: Deal;
  currentStage: Deal["stage"];
  onMove: (id: string, stage: Deal["stage"]) => void;
  onEdit: () => void;
  isAdmin: boolean;
  onDelete: () => void;
}) {
  const stageIdx = STAGES.indexOf(currentStage);

  return (
    <div className="rounded border border-white bg-white p-3 shadow-sm">
      <p
        onClick={onEdit}
        className="cursor-pointer text-sm font-medium text-indigo-600 hover:text-indigo-800 hover:underline"
      >
        {deal.title}
      </p>
      <p className="text-xs text-gray-500">${Number(deal.value).toLocaleString()}</p>
      {deal.contact && (
        <p className="text-xs text-gray-400">{deal.contact.name}</p>
      )}
      <div className="mt-2 flex items-center gap-1">
        {stageIdx > 0 && (
          <button
            onClick={() => onMove(deal.id, STAGES[stageIdx - 1])}
            className="rounded bg-gray-200 px-2 py-0.5 text-xs text-gray-700 hover:bg-gray-300"
          >
            &larr; {STAGES[stageIdx - 1]}
          </button>
        )}
        {stageIdx < STAGES.length - 1 && (
          <button
            onClick={() => onMove(deal.id, STAGES[stageIdx + 1])}
            className="rounded bg-gray-200 px-2 py-0.5 text-xs text-gray-700 hover:bg-gray-300"
          >
            {STAGES[stageIdx + 1]} &rarr;
          </button>
        )}
        {isAdmin && (
          <button
            onClick={onDelete}
            className="ml-auto rounded bg-red-50 px-2 py-0.5 text-xs font-medium text-red-600 hover:bg-red-100"
          >
            Delete
          </button>
        )}
      </div>
    </div>
  );
}

/* ───────────── Activities Tab ───────────── */

function ActivitiesTab({
  activities,
  contacts,
  onRefresh,
}: {
  activities: Activity[];
  contacts: Contact[];
  onRefresh: () => Promise<void>;
}) {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ contactId: "", type: "NOTE" as Activity["type"], content: "" });
  const [submitting, setSubmitting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; content: string } | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.contactId || !form.content.trim()) return;
    setSubmitting(true);
    try {
      await crmApi.createActivity({
        contactId: form.contactId,
        type: form.type,
        content: form.content.trim(),
      });
      setForm({ contactId: "", type: "NOTE", content: "" });
      setShowForm(false);
      await onRefresh();
    } catch {
      /* silent */
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      await crmApi.deleteActivity(confirmDelete.id);
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
        title="Delete Activity"
        message={`Are you sure you want to delete this activity?`}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(null)}
      />

      <div className="flex justify-end">
        <button
          onClick={() => setShowForm(!showForm)}
          className="rounded bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          {showForm ? "Cancel" : "Add Activity"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="rounded border border-gray-200 bg-gray-50 p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <select
              required
              value={form.contactId}
              onChange={(e) => setForm({ ...form, contactId: e.target.value })}
              className="rounded border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
            >
              <option value="">Select contact *</option>
              {contacts.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value as Activity["type"] })}
              className="rounded border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
            >
              <option value="CALL">Call</option>
              <option value="EMAIL">Email</option>
              <option value="NOTE">Note</option>
              <option value="MEETING">Meeting</option>
            </select>
          </div>
          <textarea
            required
            placeholder="Activity content *"
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
            rows={3}
          />
          <button
            type="submit"
            disabled={submitting}
            className="rounded bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {submitting ? "Saving..." : "Save Activity"}
          </button>
        </form>
      )}

      <div className="space-y-3">
        {activities.length === 0 && (
          <p className="text-sm text-gray-500">No activities yet.</p>
        )}
        {activities.map((a) => (
          <div key={a.id} className="flex items-start gap-3 rounded border border-gray-200 bg-white p-4">
            <span className={`mt-0.5 inline-block rounded px-2 py-0.5 text-xs font-medium ${ACTIVITY_BADGES[a.type].color}`}>
              {ACTIVITY_BADGES[a.type].label}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm text-gray-900">{a.content}</p>
              <p className="mt-1 text-xs text-gray-500">
                {a.contact?.name && (
                  <span className="font-medium">{a.contact.name}</span>
                )}
                {a.createdBy?.name && (
                  <span> &middot; by {a.createdBy.name}</span>
                )}
                <span> &middot; {new Date(a.createdAt).toLocaleString()}</span>
              </p>
            </div>
            {isAdmin && (
              <button
                onClick={() => setConfirmDelete({ id: a.id, content: a.content })}
                className="shrink-0 rounded bg-red-50 px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-100"
              >
                Delete
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
