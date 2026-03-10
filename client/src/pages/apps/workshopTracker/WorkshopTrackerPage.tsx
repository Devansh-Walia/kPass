import { useEffect, useState } from "react";
import { workshopTrackerApi } from "../../../api/workshopTracker";

type Tab = "upcoming" | "past";

interface Workshop {
  id: string;
  title: string;
  description: string | null;
  date: string;
  instructor: string;
  materialsNeeded: string | null;
  maxParticipants: number | null;
  createdBy: { firstName: string; lastName: string };
  _count: { participants: number };
}

interface Participant {
  id: string;
  workshopId: string;
  studentId: string | null;
  studentName: string;
  attended: boolean;
  createdAt: string;
}

interface WorkshopDetail extends Omit<Workshop, "_count"> {
  participants: Participant[];
}

const TABS: { key: Tab; label: string }[] = [
  { key: "upcoming", label: "Upcoming" },
  { key: "past", label: "Past" },
];

export default function WorkshopTrackerPage() {
  const [tab, setTab] = useState<Tab>("upcoming");
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Expanded workshop detail
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<WorkshopDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Create form state
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    date: "",
    instructor: "",
    materialsNeeded: "",
    maxParticipants: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  // Add participant form
  const [participantForm, setParticipantForm] = useState({ studentName: "", studentId: "" });
  const [addingParticipant, setAddingParticipant] = useState(false);
  const [participantError, setParticipantError] = useState("");

  const loadWorkshops = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await workshopTrackerApi.getWorkshops();
      setWorkshops(Array.isArray(data) ? data : []);
    } catch {
      setError("Failed to load workshops.");
      setWorkshops([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWorkshops();
  }, []);

  const loadDetail = async (id: string) => {
    if (expandedId === id) {
      setExpandedId(null);
      setDetail(null);
      return;
    }
    setExpandedId(id);
    setDetailLoading(true);
    setParticipantError("");
    setParticipantForm({ studentName: "", studentId: "" });
    try {
      const data = await workshopTrackerApi.getWorkshop(id);
      setDetail(data);
    } catch {
      setDetail(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    if (!form.title.trim() || !form.date || !form.instructor.trim()) {
      setFormError("Title, date, and instructor are required.");
      return;
    }
    setSubmitting(true);
    try {
      const payload: any = {
        title: form.title.trim(),
        date: form.date,
        instructor: form.instructor.trim(),
      };
      if (form.description.trim()) payload.description = form.description.trim();
      if (form.materialsNeeded.trim()) payload.materialsNeeded = form.materialsNeeded.trim();
      if (form.maxParticipants) payload.maxParticipants = Number(form.maxParticipants);
      await workshopTrackerApi.createWorkshop(payload);
      setForm({ title: "", description: "", date: "", instructor: "", materialsNeeded: "", maxParticipants: "" });
      setShowForm(false);
      await loadWorkshops();
    } catch (err: any) {
      setFormError(err.response?.data?.error || "Failed to create workshop.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddParticipant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expandedId || !participantForm.studentName.trim()) return;
    setAddingParticipant(true);
    setParticipantError("");
    try {
      const payload: any = { studentName: participantForm.studentName.trim() };
      if (participantForm.studentId.trim()) payload.studentId = participantForm.studentId.trim();
      await workshopTrackerApi.addParticipant(expandedId, payload);
      setParticipantForm({ studentName: "", studentId: "" });
      const data = await workshopTrackerApi.getWorkshop(expandedId);
      setDetail(data);
      await loadWorkshops();
    } catch (err: any) {
      setParticipantError(err.response?.data?.error || "Failed to add participant.");
    } finally {
      setAddingParticipant(false);
    }
  };

  const handleToggleAttendance = async (participantId: string) => {
    if (!expandedId) return;
    try {
      await workshopTrackerApi.toggleAttendance(participantId);
      const data = await workshopTrackerApi.getWorkshop(expandedId);
      setDetail(data);
    } catch {
      /* silent */
    }
  };

  const now = new Date().toISOString();
  const filtered = workshops.filter((w) =>
    tab === "upcoming" ? w.date >= now.split("T")[0] : w.date < now.split("T")[0]
  );

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Workshop Tracker</h2>

      {error && <div className="rounded bg-red-50 p-3 text-sm text-red-700">{error}</div>}

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
          {showForm ? "Cancel" : "New Workshop"}
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <form onSubmit={handleCreate} className="rounded border border-gray-200 bg-gray-50 p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              required
              placeholder="Title *"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="rounded border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
            />
            <input
              required
              placeholder="Instructor *"
              value={form.instructor}
              onChange={(e) => setForm({ ...form, instructor: e.target.value })}
              className="rounded border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
            />
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Date *</label>
              <input
                type="datetime-local"
                required
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <input
              type="number"
              placeholder="Max participants"
              min={1}
              value={form.maxParticipants}
              onChange={(e) => setForm({ ...form, maxParticipants: e.target.value })}
              className="rounded border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
            />
          </div>
          <textarea
            placeholder="Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
            rows={2}
          />
          <input
            placeholder="Materials needed"
            value={form.materialsNeeded}
            onChange={(e) => setForm({ ...form, materialsNeeded: e.target.value })}
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={submitting}
            className="rounded bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {submitting ? "Saving..." : "Create Workshop"}
          </button>
          {formError && <p className="text-red-600 text-sm">{formError}</p>}
        </form>
      )}

      {/* Workshop list */}
      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-gray-500">No {tab} workshops found.</p>
      ) : (
        <div className="space-y-4">
          {filtered.map((w) => (
            <div key={w.id} className="rounded-lg border border-gray-200 bg-white shadow-sm">
              {/* Workshop summary row */}
              <button
                onClick={() => loadDetail(w.id)}
                className="w-full text-left p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">{w.title}</h3>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(w.date).toLocaleDateString()} at{" "}
                      {new Date(w.date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      {" | "}Instructor: {w.instructor}
                      {" | "}Participants: {w._count.participants}
                      {w.maxParticipants ? `/${w.maxParticipants}` : ""}
                    </p>
                  </div>
                  <span className="text-gray-400 text-sm">{expandedId === w.id ? "▲" : "▼"}</span>
                </div>
              </button>

              {/* Expanded detail */}
              {expandedId === w.id && (
                <div className="border-t border-gray-200 p-4 space-y-4">
                  {detailLoading ? (
                    <p className="text-gray-500 text-sm">Loading details...</p>
                  ) : detail ? (
                    <>
                      {/* Workshop info */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                        {detail.description && (
                          <div>
                            <span className="font-medium text-gray-700">Description:</span>{" "}
                            <span className="text-gray-600">{detail.description}</span>
                          </div>
                        )}
                        {detail.materialsNeeded && (
                          <div>
                            <span className="font-medium text-gray-700">Materials:</span>{" "}
                            <span className="text-gray-600">{detail.materialsNeeded}</span>
                          </div>
                        )}
                        <div>
                          <span className="font-medium text-gray-700">Created by:</span>{" "}
                          <span className="text-gray-600">
                            {detail.createdBy.firstName} {detail.createdBy.lastName}
                          </span>
                        </div>
                      </div>

                      {/* Participants table */}
                      <div>
                        <h4 className="text-sm font-semibold text-gray-800 mb-2">Participants</h4>
                        {detail.participants.length === 0 ? (
                          <p className="text-xs text-gray-500">No participants yet.</p>
                        ) : (
                          <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 rounded border border-gray-200">
                              <thead className="bg-gray-50">
                                <tr>
                                  {["Name", "Attended"].map((h) => (
                                    <th
                                      key={h}
                                      className="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500"
                                    >
                                      {h}
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-200 bg-white">
                                {detail.participants.map((p) => (
                                  <tr key={p.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-2 text-sm text-gray-900">{p.studentName}</td>
                                    <td className="px-4 py-2">
                                      <input
                                        type="checkbox"
                                        checked={p.attended}
                                        onChange={() => handleToggleAttendance(p.id)}
                                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                      />
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>

                      {/* Add participant form */}
                      <form onSubmit={handleAddParticipant} className="flex items-end gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Student Name *</label>
                          <input
                            required
                            placeholder="Student name"
                            value={participantForm.studentName}
                            onChange={(e) =>
                              setParticipantForm({ ...participantForm, studentName: e.target.value })
                            }
                            className="rounded border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Student ID</label>
                          <input
                            placeholder="Optional UUID"
                            value={participantForm.studentId}
                            onChange={(e) =>
                              setParticipantForm({ ...participantForm, studentId: e.target.value })
                            }
                            className="rounded border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                          />
                        </div>
                        <button
                          type="submit"
                          disabled={addingParticipant}
                          className="rounded bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                        >
                          {addingParticipant ? "Adding..." : "Add Participant"}
                        </button>
                      </form>
                      {participantError && (
                        <p className="text-red-600 text-sm">{participantError}</p>
                      )}
                    </>
                  ) : (
                    <p className="text-red-500 text-sm">Failed to load workshop details.</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
