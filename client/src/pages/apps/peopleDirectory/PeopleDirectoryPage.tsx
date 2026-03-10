import { useEffect, useState, useMemo } from "react";
import { peopleDirectoryApi } from "../../../api/peopleDirectory";
import { activeStatusBadge, activeStatusLabel } from "../../../constants";
import { useAuth } from "../../../contexts/AuthContext";
import { ConfirmDialog } from "../../../components/common/ConfirmDialog";

interface Employee {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  department: string;
  designation: string;
  joinDate: string;
  isActive: boolean;
  user?: { firstName: string; lastName: string } | null;
}

const emptyForm = {
  name: "",
  email: "",
  phone: "",
  department: "",
  designation: "",
  joinDate: "",
};

export default function PeopleDirectoryPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("All");
  const [activeOnly, setActiveOnly] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [expandedData, setExpandedData] = useState<Employee | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState<Employee | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await peopleDirectoryApi.getEmployees();
      setEmployees(data);
    } catch {
      setError("Failed to load employee data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filtered = useMemo(
    () =>
      employees.filter((e) => {
        const matchesSearch =
          e.name.toLowerCase().includes(search.toLowerCase()) ||
          (e.email && e.email.toLowerCase().includes(search.toLowerCase())) ||
          e.designation.toLowerCase().includes(search.toLowerCase());
        const matchesDept = department === "All" || e.department === department;
        const matchesActive = !activeOnly || e.isActive;
        return matchesSearch && matchesDept && matchesActive;
      }),
    [employees, search, department, activeOnly]
  );

  const departments = useMemo(() => {
    const unique = new Set(employees.map((e) => e.department));
    const list = ["All", ...Array.from(unique).sort()];
    return list;
  }, [employees]);

  const toggleExpand = async (id: string) => {
    if (expandedId === id) {
      setExpandedId(null);
      setExpandedData(null);
      return;
    }
    setExpandedId(id);
    try {
      const data = await peopleDirectoryApi.getEmployee(id);
      setExpandedData(data);
    } catch {
      setExpandedData(null);
    }
  };

  const startEdit = (emp: Employee) => {
    setEditingId(emp.id);
    setForm({
      name: emp.name,
      email: emp.email || "",
      phone: emp.phone || "",
      department: emp.department,
      designation: emp.designation,
      joinDate: emp.joinDate ? emp.joinDate.slice(0, 10) : "",
    });
    setShowForm(true);
  };

  const cancelForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.department.trim() || !form.designation.trim() || !form.joinDate) return;
    setSubmitting(true);
    try {
      const payload = {
        name: form.name.trim(),
        email: form.email.trim() || undefined,
        phone: form.phone.trim() || undefined,
        department: form.department.trim(),
        designation: form.designation.trim(),
        joinDate: form.joinDate,
      };
      if (editingId) {
        await peopleDirectoryApi.updateEmployee(editingId, payload);
      } else {
        await peopleDirectoryApi.createEmployee(payload);
      }
      cancelForm();
      await loadData();
    } catch {
      /* silent */
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await peopleDirectoryApi.deleteEmployee(deleteTarget.id);
      setDeleteTarget(null);
      if (expandedId === deleteTarget.id) {
        setExpandedId(null);
        setExpandedData(null);
      }
      await loadData();
    } catch {
      /* silent */
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">People Directory</h2>

      {error && (
        <div className="rounded bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}

      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="Search by name, email, or role..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-72 rounded border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
          />
          <select
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="rounded border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
          >
            {departments.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
          <label className="flex items-center gap-1.5 text-sm text-gray-600 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={activeOnly}
              onChange={(e) => setActiveOnly(e.target.checked)}
              className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            Active only
          </label>
        </div>
        <button
          onClick={() => {
            if (showForm) {
              cancelForm();
            } else {
              setEditingId(null);
              setForm(emptyForm);
              setShowForm(true);
            }
          }}
          className="rounded bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          {showForm ? "Cancel" : "Add Employee"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="rounded border border-gray-200 bg-gray-50 p-4 space-y-3">
          <h3 className="text-sm font-semibold text-gray-700">
            {editingId ? "Edit Employee" : "Add Employee"}
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
            <input
              required
              placeholder="Department *"
              value={form.department}
              onChange={(e) => setForm({ ...form, department: e.target.value })}
              className="rounded border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
            />
            <input
              required
              placeholder="Designation *"
              value={form.designation}
              onChange={(e) => setForm({ ...form, designation: e.target.value })}
              className="rounded border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
            />
            <input
              required
              type="date"
              placeholder="Join Date *"
              value={form.joinDate}
              onChange={(e) => setForm({ ...form, joinDate: e.target.value })}
              className="rounded border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={submitting}
              className="rounded bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {submitting ? "Saving..." : editingId ? "Update Employee" : "Save Employee"}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={cancelForm}
                className="rounded border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel Edit
              </button>
            )}
          </div>
        </form>
      )}

      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : (
        <div className="overflow-hidden rounded border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {["Name", "Department", "Designation", "Email", "Phone", "Status", ...(isAdmin ? ["Actions"] : [])].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={isAdmin ? 7 : 6} className="px-4 py-6 text-center text-sm text-gray-500">
                    No employees found.
                  </td>
                </tr>
              )}
              {filtered.map((emp) => (
                <EmployeeRow
                  key={emp.id}
                  employee={emp}
                  expanded={expandedId === emp.id}
                  expandedData={expandedId === emp.id ? expandedData : null}
                  onToggle={() => toggleExpand(emp.id)}
                  isAdmin={isAdmin}
                  onEdit={() => startEdit(emp)}
                  onDelete={() => setDeleteTarget(emp)}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Employee"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        confirmLabel={deleting ? "Deleting..." : "Delete"}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

function EmployeeRow({
  employee,
  expanded,
  expandedData,
  onToggle,
  isAdmin,
  onEdit,
  onDelete,
}: {
  employee: Employee;
  expanded: boolean;
  expandedData: Employee | null;
  onToggle: () => void;
  isAdmin: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <>
      <tr
        onClick={onToggle}
        className="cursor-pointer hover:bg-gray-50"
      >
        <td className="px-4 py-3 text-sm font-medium text-gray-900">{employee.name}</td>
        <td className="px-4 py-3 text-sm text-gray-600">{employee.department}</td>
        <td className="px-4 py-3 text-sm text-gray-600">{employee.designation}</td>
        <td className="px-4 py-3 text-sm text-gray-600">{employee.email || "-"}</td>
        <td className="px-4 py-3 text-sm text-gray-600">{employee.phone || "-"}</td>
        <td className="px-4 py-3 text-sm">
          <span
            className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${activeStatusBadge(employee.isActive)}`}
          >
            {activeStatusLabel(employee.isActive)}
          </span>
        </td>
        {isAdmin && (
          <td className="px-4 py-3 text-sm">
            <div className="flex gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit();
                }}
                className="rounded px-2 py-1 text-xs font-medium text-indigo-600 hover:bg-indigo-50"
              >
                Edit
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
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
          <td colSpan={isAdmin ? 7 : 6} className="bg-gray-50 px-6 py-4">
            {!expandedData ? (
              <p className="text-sm text-gray-500">Loading details...</p>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-xs font-semibold uppercase text-gray-500">Full Name</h4>
                  <p className="mt-1 text-sm text-gray-700">{expandedData.name}</p>
                </div>
                <div>
                  <h4 className="text-xs font-semibold uppercase text-gray-500">Department</h4>
                  <p className="mt-1 text-sm text-gray-700">{expandedData.department}</p>
                </div>
                <div>
                  <h4 className="text-xs font-semibold uppercase text-gray-500">Designation</h4>
                  <p className="mt-1 text-sm text-gray-700">{expandedData.designation}</p>
                </div>
                <div>
                  <h4 className="text-xs font-semibold uppercase text-gray-500">Join Date</h4>
                  <p className="mt-1 text-sm text-gray-700">
                    {new Date(expandedData.joinDate).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <h4 className="text-xs font-semibold uppercase text-gray-500">Email</h4>
                  <p className="mt-1 text-sm text-gray-700">{expandedData.email || "Not provided"}</p>
                </div>
                <div>
                  <h4 className="text-xs font-semibold uppercase text-gray-500">Phone</h4>
                  <p className="mt-1 text-sm text-gray-700">{expandedData.phone || "Not provided"}</p>
                </div>
                {expandedData.user && (
                  <div>
                    <h4 className="text-xs font-semibold uppercase text-gray-500">Linked User</h4>
                    <p className="mt-1 text-sm text-gray-700">
                      {expandedData.user.firstName} {expandedData.user.lastName}
                    </p>
                  </div>
                )}
                <div>
                  <h4 className="text-xs font-semibold uppercase text-gray-500">Status</h4>
                  <p className="mt-1">
                    <span
                      className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${activeStatusBadge(expandedData.isActive)}`}
                    >
                      {activeStatusLabel(expandedData.isActive)}
                    </span>
                  </p>
                </div>
              </div>
            )}
          </td>
        </tr>
      )}
    </>
  );
}
