import { useEffect, useState } from "react";
import { contentCalendarApi } from "../../../api/contentCalendar";

interface ContentPost {
  id: string;
  title: string;
  content?: string;
  platform: string;
  scheduledDate: string;
  status: string;
  createdBy: { firstName: string; lastName: string };
  createdAt: string;
}

type Tab = "calendar" | "list";

const PLATFORMS = ["INSTAGRAM", "FACEBOOK", "TWITTER", "OTHER"] as const;
const STATUSES = ["DRAFT", "SCHEDULED", "PUBLISHED"] as const;

const PLATFORM_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  INSTAGRAM: { bg: "bg-pink-100", text: "text-pink-700", dot: "bg-pink-500" },
  FACEBOOK: { bg: "bg-blue-100", text: "text-blue-700", dot: "bg-blue-500" },
  TWITTER: { bg: "bg-sky-100", text: "text-sky-700", dot: "bg-sky-500" },
  OTHER: { bg: "bg-gray-100", text: "text-gray-700", dot: "bg-gray-500" },
};

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  DRAFT: { bg: "bg-yellow-100", text: "text-yellow-700" },
  SCHEDULED: { bg: "bg-indigo-100", text: "text-indigo-700" },
  PUBLISHED: { bg: "bg-green-100", text: "text-green-700" },
};

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

export default function ContentCalendarPage() {
  const [tab, setTab] = useState<Tab>("calendar");

  // Calendar state
  const now = new Date();
  const [calYear, setCalYear] = useState(now.getFullYear());
  const [calMonth, setCalMonth] = useState(now.getMonth()); // 0-indexed
  const [calPosts, setCalPosts] = useState<ContentPost[]>([]);
  const [calLoading, setCalLoading] = useState(false);

  // List state
  const [posts, setPosts] = useState<ContentPost[]>([]);
  const [listLoading, setListLoading] = useState(false);
  const [filterPlatform, setFilterPlatform] = useState("");

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingPost, setEditingPost] = useState<ContentPost | null>(null);
  const [formTitle, setFormTitle] = useState("");
  const [formContent, setFormContent] = useState("");
  const [formPlatform, setFormPlatform] = useState<string>("INSTAGRAM");
  const [formScheduledDate, setFormScheduledDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [formStatus, setFormStatus] = useState<string>("DRAFT");
  const [formError, setFormError] = useState("");
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Load calendar posts when month/year changes
  useEffect(() => {
    if (tab === "calendar") loadCalendarPosts();
  }, [tab, calYear, calMonth]);

  // Load list posts when tab or filter changes
  useEffect(() => {
    if (tab === "list") loadListPosts();
  }, [tab, filterPlatform]);

  async function loadCalendarPosts() {
    setCalLoading(true);
    try {
      const data = await contentCalendarApi.getPosts({
        month: calMonth + 1,
        year: calYear,
      });
      setCalPosts(Array.isArray(data) ? data : []);
    } catch {
      setCalPosts([]);
    } finally {
      setCalLoading(false);
    }
  }

  async function loadListPosts() {
    setListLoading(true);
    try {
      const params: any = {};
      if (filterPlatform) params.platform = filterPlatform;
      const data = await contentCalendarApi.getPosts(params);
      setPosts(Array.isArray(data) ? data : []);
    } catch {
      setPosts([]);
    } finally {
      setListLoading(false);
    }
  }

  function openCreateForm() {
    setEditingPost(null);
    setFormTitle("");
    setFormContent("");
    setFormPlatform("INSTAGRAM");
    setFormScheduledDate(new Date().toISOString().split("T")[0]);
    setFormStatus("DRAFT");
    setFormError("");
    setShowForm(true);
  }

  function openEditForm(post: ContentPost) {
    setEditingPost(post);
    setFormTitle(post.title);
    setFormContent(post.content || "");
    setFormPlatform(post.platform);
    setFormScheduledDate(post.scheduledDate.split("T")[0]);
    setFormStatus(post.status);
    setFormError("");
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    if (!formTitle.trim()) {
      setFormError("Title is required.");
      return;
    }
    setFormSubmitting(true);
    try {
      const payload: any = {
        title: formTitle,
        content: formContent || undefined,
        platform: formPlatform,
        scheduledDate: formScheduledDate,
        status: formStatus,
      };
      if (editingPost) {
        await contentCalendarApi.updatePost(editingPost.id, payload);
      } else {
        await contentCalendarApi.createPost(payload);
      }
      setShowForm(false);
      setEditingPost(null);
      if (tab === "calendar") loadCalendarPosts();
      else loadListPosts();
    } catch (err: any) {
      setFormError(err.response?.data?.error || "Failed to save post.");
    } finally {
      setFormSubmitting(false);
    }
  }

  function prevMonth() {
    if (calMonth === 0) {
      setCalMonth(11);
      setCalYear(calYear - 1);
    } else {
      setCalMonth(calMonth - 1);
    }
  }

  function nextMonth() {
    if (calMonth === 11) {
      setCalMonth(0);
      setCalYear(calYear + 1);
    } else {
      setCalMonth(calMonth + 1);
    }
  }

  // Build calendar grid
  const daysInMonth = getDaysInMonth(calYear, calMonth);
  const firstDay = getFirstDayOfWeek(calYear, calMonth);
  const calendarDays: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) calendarDays.push(null);
  for (let d = 1; d <= daysInMonth; d++) calendarDays.push(d);

  // Group posts by day
  const postsByDay: Record<number, ContentPost[]> = {};
  calPosts.forEach((p) => {
    const day = new Date(p.scheduledDate).getDate();
    if (!postsByDay[day]) postsByDay[day] = [];
    postsByDay[day].push(p);
  });

  const tabs: { key: Tab; label: string }[] = [
    { key: "calendar", label: "Calendar" },
    { key: "list", label: "List" },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Content Calendar</h2>
        <button
          onClick={openCreateForm}
          className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          New Post
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 border-b border-gray-200 mb-6">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm font-medium rounded-t-md transition-colors ${
              tab === t.key
                ? "bg-white text-indigo-600 border-b-2 border-indigo-600"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Post Form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          <div className="sm:col-span-2 lg:col-span-3">
            <label className="block text-xs font-medium text-gray-600 mb-1">Title</label>
            <input
              type="text"
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              placeholder="Post title"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>
          <div className="sm:col-span-2 lg:col-span-3">
            <label className="block text-xs font-medium text-gray-600 mb-1">Content</label>
            <textarea
              value={formContent}
              onChange={(e) => setFormContent(e.target.value)}
              placeholder="Optional content or caption"
              rows={3}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Platform</label>
            <select
              value={formPlatform}
              onChange={(e) => setFormPlatform(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {PLATFORMS.map((p) => (
                <option key={p} value={p}>
                  {p.charAt(0) + p.slice(1).toLowerCase()}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Scheduled Date</label>
            <input
              type="date"
              value={formScheduledDate}
              onChange={(e) => setFormScheduledDate(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
            <select
              value={formStatus}
              onChange={(e) => setFormStatus(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s.charAt(0) + s.slice(1).toLowerCase()}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end gap-2">
            <button
              type="submit"
              disabled={formSubmitting}
              className="bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              {formSubmitting ? "Saving..." : editingPost ? "Update Post" : "Create Post"}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setEditingPost(null);
              }}
              className="text-gray-500 hover:text-gray-700 px-4 py-2 text-sm font-medium"
            >
              Cancel
            </button>
          </div>
          {formError && (
            <p className="text-red-600 text-sm col-span-full">{formError}</p>
          )}
        </form>
      )}

      {/* Calendar Tab */}
      {tab === "calendar" && (
        <div>
          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={prevMonth}
              className="text-gray-600 hover:text-gray-900 px-3 py-1 rounded-md hover:bg-gray-100 text-sm font-medium transition-colors"
            >
              &larr; Prev
            </button>
            <h3 className="text-lg font-semibold text-gray-800">
              {MONTH_NAMES[calMonth]} {calYear}
            </h3>
            <button
              onClick={nextMonth}
              className="text-gray-600 hover:text-gray-900 px-3 py-1 rounded-md hover:bg-gray-100 text-sm font-medium transition-colors"
            >
              Next &rarr;
            </button>
          </div>

          {calLoading ? (
            <p className="text-gray-500">Loading calendar...</p>
          ) : (
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              {/* Day headers */}
              <div className="grid grid-cols-7 bg-gray-50 text-center text-xs font-medium text-gray-500 uppercase">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                  <div key={d} className="px-2 py-2 border-b border-gray-200">
                    {d}
                  </div>
                ))}
              </div>
              {/* Calendar grid */}
              <div className="grid grid-cols-7">
                {calendarDays.map((day, idx) => (
                  <div
                    key={idx}
                    className={`min-h-[80px] p-1 border-b border-r border-gray-100 ${
                      day === null ? "bg-gray-50" : "bg-white"
                    }`}
                  >
                    {day !== null && (
                      <>
                        <span className="text-xs font-medium text-gray-500">{day}</span>
                        <div className="mt-0.5 space-y-0.5">
                          {(postsByDay[day] || []).slice(0, 3).map((p) => (
                            <div
                              key={p.id}
                              onClick={() => openEditForm(p)}
                              className="flex items-center gap-1 cursor-pointer hover:opacity-80"
                              title={`${p.title} (${p.platform})`}
                            >
                              <span
                                className={`inline-block w-2 h-2 rounded-full flex-shrink-0 ${
                                  PLATFORM_COLORS[p.platform]?.dot || "bg-gray-500"
                                }`}
                              />
                              <span className="text-[10px] text-gray-700 truncate">
                                {p.title}
                              </span>
                            </div>
                          ))}
                          {(postsByDay[day]?.length || 0) > 3 && (
                            <span className="text-[10px] text-gray-400">
                              +{postsByDay[day].length - 3} more
                            </span>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Platform Legend */}
          <div className="flex flex-wrap gap-4 mt-3 text-xs text-gray-500">
            {PLATFORMS.map((p) => (
              <div key={p} className="flex items-center gap-1">
                <span
                  className={`inline-block w-2.5 h-2.5 rounded-full ${PLATFORM_COLORS[p].dot}`}
                />
                {p.charAt(0) + p.slice(1).toLowerCase()}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* List Tab */}
      {tab === "list" && (
        <div>
          {/* Filter */}
          <div className="flex flex-wrap items-end gap-4 mb-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Platform</label>
              <select
                value={filterPlatform}
                onChange={(e) => setFilterPlatform(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">All</option>
                {PLATFORMS.map((p) => (
                  <option key={p} value={p}>
                    {p.charAt(0) + p.slice(1).toLowerCase()}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Posts Table */}
          {listLoading ? (
            <p className="text-gray-500">Loading posts...</p>
          ) : posts.length === 0 ? (
            <p className="text-gray-500">No posts found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left border border-gray-200 rounded-lg">
                <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
                  <tr>
                    <th className="px-4 py-3">Title</th>
                    <th className="px-4 py-3">Platform</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Scheduled Date</th>
                    <th className="px-4 py-3">Created By</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {posts.map((post) => (
                    <tr key={post.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">{post.title}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                            PLATFORM_COLORS[post.platform]?.bg || "bg-gray-100"
                          } ${PLATFORM_COLORS[post.platform]?.text || "text-gray-700"}`}
                        >
                          {post.platform}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                            STATUS_COLORS[post.status]?.bg || "bg-gray-100"
                          } ${STATUS_COLORS[post.status]?.text || "text-gray-700"}`}
                        >
                          {post.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {new Date(post.scheduledDate).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {post.createdBy
                          ? `${post.createdBy.firstName} ${post.createdBy.lastName}`
                          : "-"}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => openEditForm(post)}
                          className="text-indigo-600 hover:text-indigo-800 text-xs font-medium"
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
