import { useEffect, useState } from "react";
import { attendanceApi } from "../../../api/attendance";
import { ATTENDANCE_STATUS_COLORS, APPROVAL_STATUS_COLORS } from "../../../constants";

type Tab = "daily" | "leaves" | "report";

interface Employee {
  id: string;
  name: string;
  department: string;
  designation?: string;
}

interface AttendanceRecord {
  id: string;
  employeeId: string;
  date: string;
  status: "PRESENT" | "ABSENT" | "LEAVE";
  checkIn: string | null;
  checkOut: string | null;
  employee: { id: string; name: string; department: string };
}

interface LeaveRequest {
  id: string;
  employeeId: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  employee: { id: string; name: string; department: string };
  reviewedBy: { firstName: string; lastName: string } | null;
  createdAt: string;
}

interface ReportRow {
  employeeId: string;
  employeeName: string;
  department: string;
  present: number;
  absent: number;
  leave: number;
  totalMarked: number;
}

interface MonthlyReport {
  month: number;
  year: number;
  totalDays: number;
  report: ReportRow[];
}

const STATUS_COLORS: Record<string, string> = {
  ...ATTENDANCE_STATUS_COLORS,
  ...APPROVAL_STATUS_COLORS,
};

export default function AttendancePage() {
  const [tab, setTab] = useState<Tab>("daily");

  const tabs: { key: Tab; label: string }[] = [
    { key: "daily", label: "Daily" },
    { key: "leaves", label: "Leaves" },
    { key: "report", label: "Report" },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Staff Attendance</h2>

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

      {tab === "daily" && <DailyTab />}
      {tab === "leaves" && <LeavesTab />}
      {tab === "report" && <ReportTab />}
    </div>
  );
}

/* ───────────── Daily Tab ───────────── */

function DailyTab() {
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [records, setRecords] = useState<Record<string, { status: string; checkIn: string; checkOut: string }>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadData = async () => {
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const [emps, existing] = await Promise.all([
        attendanceApi.getEmployees(),
        attendanceApi.getDailyAttendance(date),
      ]);
      setEmployees(emps);

      const map: Record<string, { status: string; checkIn: string; checkOut: string }> = {};
      emps.forEach((emp: Employee) => {
        const found = (existing as AttendanceRecord[]).find((r) => r.employeeId === emp.id);
        map[emp.id] = {
          status: found?.status ?? "PRESENT",
          checkIn: found?.checkIn ? new Date(found.checkIn).toTimeString().slice(0, 5) : "",
          checkOut: found?.checkOut ? new Date(found.checkOut).toTimeString().slice(0, 5) : "",
        };
      });
      setRecords(map);
    } catch {
      setError("Failed to load attendance data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [date]);

  const setStatus = (empId: string, status: string) => {
    setRecords((prev) => ({ ...prev, [empId]: { ...prev[empId], status } }));
  };

  const setTime = (empId: string, field: "checkIn" | "checkOut", value: string) => {
    setRecords((prev) => ({ ...prev, [empId]: { ...prev[empId], [field]: value } }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const payload = employees.map((emp) => {
        const r = records[emp.id];
        const rec: any = { employeeId: emp.id, status: r.status };
        if (r.checkIn) rec.checkIn = `${date}T${r.checkIn}:00`;
        if (r.checkOut) rec.checkOut = `${date}T${r.checkOut}:00`;
        return rec;
      });
      await attendanceApi.markDailyAttendance({ date, records: payload });
      setSuccess("Attendance saved successfully.");
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to save attendance.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-end gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
          />
        </div>
        <button
          onClick={handleSave}
          disabled={saving || loading}
          className="rounded bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Attendance"}
        </button>
      </div>

      {error && <div className="rounded bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      {success && <div className="rounded bg-green-50 p-3 text-sm text-green-700">{success}</div>}

      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : employees.length === 0 ? (
        <p className="text-gray-500">No active employees found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 rounded border border-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {["Employee", "Department", "Status", "Check In", "Check Out"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {employees.map((emp) => {
                const r = records[emp.id];
                if (!r) return null;
                return (
                  <tr key={emp.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{emp.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{emp.department}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        {(["PRESENT", "ABSENT", "LEAVE"] as const).map((s) => (
                          <button
                            key={s}
                            onClick={() => setStatus(emp.id, s)}
                            className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
                              r.status === s
                                ? STATUS_COLORS[s]
                                : "bg-gray-100 text-gray-400 hover:bg-gray-200"
                            }`}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="time"
                        value={r.checkIn}
                        onChange={(e) => setTime(emp.id, "checkIn", e.target.value)}
                        className="rounded border border-gray-300 px-2 py-1 text-sm focus:border-indigo-500 focus:outline-none"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="time"
                        value={r.checkOut}
                        onChange={(e) => setTime(emp.id, "checkOut", e.target.value)}
                        className="rounded border border-gray-300 px-2 py-1 text-sm focus:border-indigo-500 focus:outline-none"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ───────────── Leaves Tab ───────────── */

function LeavesTab() {
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filterStatus, setFilterStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ employeeId: "", startDate: "", endDate: "", reason: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const [l, e] = await Promise.all([
        attendanceApi.getLeaves(filterStatus || undefined),
        attendanceApi.getEmployees(),
      ]);
      setLeaves(l);
      setEmployees(e);
    } catch {
      setError("Failed to load leave data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [filterStatus]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.employeeId || !form.startDate || !form.endDate || !form.reason.trim()) return;
    setSubmitting(true);
    try {
      await attendanceApi.createLeave({
        employeeId: form.employeeId,
        startDate: form.startDate,
        endDate: form.endDate,
        reason: form.reason.trim(),
      });
      setForm({ employeeId: "", startDate: "", endDate: "", reason: "" });
      setShowForm(false);
      await loadData();
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to create leave request.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (id: string, status: "APPROVED" | "REJECTED") => {
    try {
      await attendanceApi.updateLeaveStatus(id, status);
      await loadData();
    } catch {
      /* silent */
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Filter by Status</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="rounded border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
          >
            <option value="">All</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="rounded bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          {showForm ? "Cancel" : "New Leave Request"}
        </button>
      </div>

      {error && <div className="rounded bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      {showForm && (
        <form onSubmit={handleCreate} className="rounded border border-gray-200 bg-gray-50 p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <select
              required
              value={form.employeeId}
              onChange={(e) => setForm({ ...form, employeeId: e.target.value })}
              className="rounded border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
            >
              <option value="">Select employee *</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>{emp.name}</option>
              ))}
            </select>
            <div />
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Start Date</label>
              <input
                type="date"
                required
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">End Date</label>
              <input
                type="date"
                required
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>
          <textarea
            required
            placeholder="Reason for leave *"
            value={form.reason}
            onChange={(e) => setForm({ ...form, reason: e.target.value })}
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
            rows={3}
          />
          <button
            type="submit"
            disabled={submitting}
            className="rounded bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {submitting ? "Saving..." : "Submit Leave Request"}
          </button>
        </form>
      )}

      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : leaves.length === 0 ? (
        <p className="text-gray-500">No leave requests found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 rounded border border-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {["Employee", "Department", "Start", "End", "Reason", "Status", "Reviewed By", "Actions"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {leaves.map((leave) => (
                <tr key={leave.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{leave.employee.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{leave.employee.department}</td>
                  <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                    {new Date(leave.startDate).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                    {new Date(leave.endDate).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">{leave.reason}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[leave.status]}`}>
                      {leave.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {leave.reviewedBy
                      ? `${leave.reviewedBy.firstName} ${leave.reviewedBy.lastName}`
                      : "-"}
                  </td>
                  <td className="px-4 py-3">
                    {leave.status === "PENDING" && (
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleUpdateStatus(leave.id, "APPROVED")}
                          className="rounded bg-green-100 px-2 py-1 text-xs font-medium text-green-800 hover:bg-green-200"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(leave.id, "REJECTED")}
                          className="rounded bg-red-100 px-2 py-1 text-xs font-medium text-red-800 hover:bg-red-200"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ───────────── Report Tab ───────────── */

function ReportTab() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [report, setReport] = useState<MonthlyReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGenerate = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await attendanceApi.getReport(month, year);
      setReport(data);
    } catch {
      setError("Failed to generate report.");
      setReport(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-end gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Month</label>
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="rounded border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
          >
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                {new Date(2000, i).toLocaleString("default", { month: "long" })}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Year</label>
          <input
            type="number"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            min={2020}
            max={2100}
            className="w-24 rounded border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
          />
        </div>
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="rounded bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? "Generating..." : "Generate Report"}
        </button>
      </div>

      {error && <div className="rounded bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      {report && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-5">
              <p className="text-sm text-blue-600 font-medium">Total Days in Month</p>
              <p className="text-2xl font-bold text-blue-700 mt-1">{report.totalDays}</p>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-5">
              <p className="text-sm text-gray-600 font-medium">Total Employees</p>
              <p className="text-2xl font-bold text-gray-700 mt-1">{report.report.length}</p>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-5">
              <p className="text-sm text-green-600 font-medium">Avg. Attendance Rate</p>
              <p className="text-2xl font-bold text-green-700 mt-1">
                {report.report.length > 0
                  ? Math.round(
                      (report.report.reduce((sum, r) => sum + r.present, 0) /
                        (report.report.length * report.totalDays)) *
                        100
                    )
                  : 0}
                %
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 rounded border border-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {["Employee", "Department", "Present", "Absent", "Leave", "Total Marked"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {report.report.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-center text-sm text-gray-500">
                      No data available.
                    </td>
                  </tr>
                )}
                {report.report.map((row) => (
                  <tr key={row.employeeId} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{row.employeeName}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{row.department}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className="rounded bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                        {row.present}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className="rounded bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800">
                        {row.absent}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className="rounded bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-800">
                        {row.leave}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{row.totalMarked}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
