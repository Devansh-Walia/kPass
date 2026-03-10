import { useEffect, useState } from "react";
import { eventManagerApi } from "../../../api/eventManager";
import { usersApi } from "../../../api/users";

interface EventVolunteer {
  id: string;
  role: string | null;
  user: { id: string; firstName: string; lastName: string };
}

interface Event {
  id: string;
  title: string;
  description: string | null;
  date: string;
  location: string | null;
  status: string;
  budget: number | null;
  createdBy: { firstName: string; lastName: string };
  volunteers?: EventVolunteer[];
  _count?: { volunteers: number };
}

interface User {
  id: string;
  firstName: string;
  lastName: string;
}

type Tab = "upcoming" | "past";

const STATUS_COLORS: Record<string, string> = {
  PLANNING: "bg-yellow-100 text-yellow-700",
  CONFIRMED: "bg-green-100 text-green-700",
  COMPLETED: "bg-blue-100 text-blue-700",
  CANCELLED: "bg-red-100 text-red-700",
};

export default function EventManagerPage() {
  const [tab, setTab] = useState<Tab>("upcoming");
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [expandedEvent, setExpandedEvent] = useState<Event | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Create event form
  const [showForm, setShowForm] = useState(false);
  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formDate, setFormDate] = useState("");
  const [formLocation, setFormLocation] = useState("");
  const [formBudget, setFormBudget] = useState("");
  const [formError, setFormError] = useState("");
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Add volunteer form
  const [volUserId, setVolUserId] = useState("");
  const [volRole, setVolRole] = useState("");
  const [volError, setVolError] = useState("");
  const [volSubmitting, setVolSubmitting] = useState(false);
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    loadEvents();
  }, [tab]);

  useEffect(() => {
    if (expandedId) {
      loadEventDetail(expandedId);
    } else {
      setExpandedEvent(null);
    }
  }, [expandedId]);

  async function loadEvents() {
    setLoading(true);
    try {
      const data = await eventManagerApi.getEvents();
      setEvents(Array.isArray(data) ? data : []);
    } catch {
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }

  async function loadEventDetail(id: string) {
    setDetailLoading(true);
    try {
      const data = await eventManagerApi.getEvent(id);
      setExpandedEvent(data);
      if (users.length === 0) {
        const u = await usersApi.list();
        setUsers(Array.isArray(u) ? u : []);
      }
    } catch {
      setExpandedEvent(null);
    } finally {
      setDetailLoading(false);
    }
  }

  const upcomingStatuses = ["PLANNING", "CONFIRMED"];
  const pastStatuses = ["COMPLETED", "CANCELLED"];
  const filtered = events.filter((e) =>
    tab === "upcoming"
      ? upcomingStatuses.includes(e.status)
      : pastStatuses.includes(e.status)
  );

  async function handleCreateEvent(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    if (!formTitle || !formDate) {
      setFormError("Title and date are required.");
      return;
    }
    setFormSubmitting(true);
    try {
      await eventManagerApi.createEvent({
        title: formTitle,
        description: formDescription || undefined,
        date: formDate,
        location: formLocation || undefined,
        budget: formBudget ? parseFloat(formBudget) : undefined,
      });
      setFormTitle("");
      setFormDescription("");
      setFormDate("");
      setFormLocation("");
      setFormBudget("");
      setShowForm(false);
      loadEvents();
    } catch (err: any) {
      setFormError(err.response?.data?.error || "Failed to create event.");
    } finally {
      setFormSubmitting(false);
    }
  }

  async function handleAddVolunteer(e: React.FormEvent) {
    e.preventDefault();
    if (!expandedId || !volUserId) return;
    setVolError("");
    setVolSubmitting(true);
    try {
      await eventManagerApi.addVolunteer(expandedId, {
        userId: volUserId,
        role: volRole || undefined,
      });
      setVolUserId("");
      setVolRole("");
      loadEventDetail(expandedId);
      loadEvents();
    } catch (err: any) {
      setVolError(err.response?.data?.error || "Failed to add volunteer.");
    } finally {
      setVolSubmitting(false);
    }
  }

  async function handleRemoveVolunteer(userId: string) {
    if (!expandedId) return;
    try {
      await eventManagerApi.removeVolunteer(expandedId, userId);
      loadEventDetail(expandedId);
      loadEvents();
    } catch {
      // silent
    }
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: "upcoming", label: "Upcoming" },
    { key: "past", label: "Past" },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Event Manager</h2>

      {/* Tab Navigation */}
      <div className="flex space-x-1 border-b border-gray-200 mb-6">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => {
              setTab(t.key);
              setExpandedId(null);
            }}
            className={`px-4 py-2 text-sm font-medium rounded-t-md transition-colors ${
              tab === t.key
                ? "bg-white text-indigo-600 border-b-2 border-indigo-600"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
            }`}
          >
            {t.label}
          </button>
        ))}
        <div className="flex-1" />
        <button
          onClick={() => setShowForm((v) => !v)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 transition-colors mb-1"
        >
          {showForm ? "Cancel" : "Create Event"}
        </button>
      </div>

      {/* Create Event Form */}
      {showForm && (
        <form
          onSubmit={handleCreateEvent}
          className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Title</label>
            <input
              type="text"
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              placeholder="Event title"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Date</label>
            <input
              type="date"
              value={formDate}
              onChange={(e) => setFormDate(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Location</label>
            <input
              type="text"
              value={formLocation}
              onChange={(e) => setFormLocation(e.target.value)}
              placeholder="Optional"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Budget</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formBudget}
              onChange={(e) => setFormBudget(e.target.value)}
              placeholder="Optional"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
            <input
              type="text"
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              placeholder="Optional description"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              disabled={formSubmitting}
              className="bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              {formSubmitting ? "Saving..." : "Save Event"}
            </button>
          </div>
          {formError && (
            <p className="text-red-600 text-sm col-span-full">{formError}</p>
          )}
        </form>
      )}

      {/* Events List */}
      {loading ? (
        <p className="text-gray-500">Loading events...</p>
      ) : filtered.length === 0 ? (
        <p className="text-gray-500">No events found.</p>
      ) : (
        <div className="space-y-3">
          {filtered.map((ev) => (
            <div key={ev.id} className="border border-gray-200 rounded-lg">
              {/* Event Row */}
              <button
                onClick={() => setExpandedId(expandedId === ev.id ? null : ev.id)}
                className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <span className="font-medium text-gray-900 truncate">{ev.title}</span>
                  <span className="text-sm text-gray-500 whitespace-nowrap">
                    {new Date(ev.date).toLocaleDateString()}
                  </span>
                  {ev.location && (
                    <span className="text-sm text-gray-400 truncate">{ev.location}</span>
                  )}
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="text-xs text-gray-500">
                    {ev._count?.volunteers ?? 0} volunteer{(ev._count?.volunteers ?? 0) !== 1 ? "s" : ""}
                  </span>
                  <span
                    className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                      STATUS_COLORS[ev.status] || "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {ev.status}
                  </span>
                </div>
              </button>

              {/* Expanded Detail */}
              {expandedId === ev.id && (
                <div className="border-t border-gray-200 px-4 py-4 bg-gray-50">
                  {detailLoading ? (
                    <p className="text-gray-500 text-sm">Loading details...</p>
                  ) : expandedEvent ? (
                    <div className="space-y-4">
                      {/* Event Info */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                        {expandedEvent.description && (
                          <div className="sm:col-span-2">
                            <span className="font-medium text-gray-600">Description: </span>
                            <span className="text-gray-800">{expandedEvent.description}</span>
                          </div>
                        )}
                        <div>
                          <span className="font-medium text-gray-600">Date: </span>
                          <span className="text-gray-800">
                            {new Date(expandedEvent.date).toLocaleDateString()}
                          </span>
                        </div>
                        {expandedEvent.location && (
                          <div>
                            <span className="font-medium text-gray-600">Location: </span>
                            <span className="text-gray-800">{expandedEvent.location}</span>
                          </div>
                        )}
                        {expandedEvent.budget != null && (
                          <div>
                            <span className="font-medium text-gray-600">Budget: </span>
                            <span className="text-gray-800">
                              {new Intl.NumberFormat("en-IN", {
                                style: "currency",
                                currency: "INR",
                              }).format(expandedEvent.budget)}
                            </span>
                          </div>
                        )}
                        <div>
                          <span className="font-medium text-gray-600">Created by: </span>
                          <span className="text-gray-800">
                            {expandedEvent.createdBy.firstName} {expandedEvent.createdBy.lastName}
                          </span>
                        </div>
                      </div>

                      {/* Volunteers */}
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">
                          Volunteers ({expandedEvent.volunteers?.length ?? 0})
                        </h4>
                        {expandedEvent.volunteers && expandedEvent.volunteers.length > 0 ? (
                          <ul className="space-y-1">
                            {expandedEvent.volunteers.map((v) => (
                              <li
                                key={v.id}
                                className="flex items-center justify-between bg-white border border-gray-100 rounded px-3 py-2 text-sm"
                              >
                                <span>
                                  {v.user.firstName} {v.user.lastName}
                                  {v.role && (
                                    <span className="ml-2 text-gray-400">({v.role})</span>
                                  )}
                                </span>
                                <button
                                  onClick={() => handleRemoveVolunteer(v.user.id)}
                                  className="text-red-500 hover:text-red-700 text-xs font-medium"
                                >
                                  Remove
                                </button>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-gray-400 text-sm">No volunteers yet.</p>
                        )}
                      </div>

                      {/* Add Volunteer Form */}
                      <form
                        onSubmit={handleAddVolunteer}
                        className="flex flex-wrap items-end gap-3"
                      >
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            User
                          </label>
                          <select
                            value={volUserId}
                            onChange={(e) => setVolUserId(e.target.value)}
                            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            required
                          >
                            <option value="">Select user</option>
                            {users.map((u) => (
                              <option key={u.id} value={u.id}>
                                {u.firstName} {u.lastName}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Role
                          </label>
                          <input
                            type="text"
                            value={volRole}
                            onChange={(e) => setVolRole(e.target.value)}
                            placeholder="Optional"
                            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>
                        <button
                          type="submit"
                          disabled={volSubmitting}
                          className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                        >
                          {volSubmitting ? "Adding..." : "Add Volunteer"}
                        </button>
                        {volError && (
                          <p className="text-red-600 text-sm">{volError}</p>
                        )}
                      </form>
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">Failed to load details.</p>
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
