import { useEffect, useState } from "react";
import { financeApi } from "../../../api/finance";
import { formatCurrency, TRANSACTION_TYPE_COLORS } from "../../../constants";

interface Transaction {
  id: string;
  amount: number;
  type: string;
  description: string;
  date: string;
  category: { name: string };
  createdBy: { firstName: string; lastName: string };
}

interface Category {
  id: string;
  name: string;
  type: string;
}

interface Report {
  income: number;
  expense: number;
  profit: number;
  transactionCount: number;
}

type Tab = "overview" | "transactions" | "reports";

function getMonthRange(): { start: string; end: string } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return {
    start: start.toISOString().split("T")[0],
    end: end.toISOString().split("T")[0],
  };
}

export default function FinanceDashboard() {
  const [tab, setTab] = useState<Tab>("overview");

  // Overview state
  const [overview, setOverview] = useState<Report | null>(null);
  const [overviewLoading, setOverviewLoading] = useState(false);

  // Transactions state
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [txLoading, setTxLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [filterType, setFilterType] = useState("");
  const [filterStart, setFilterStart] = useState("");
  const [filterEnd, setFilterEnd] = useState("");

  // Add transaction form
  const [showForm, setShowForm] = useState(false);
  const [formAmount, setFormAmount] = useState("");
  const [formType, setFormType] = useState("EXPENSE");
  const [formCategory, setFormCategory] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formDate, setFormDate] = useState(new Date().toISOString().split("T")[0]);
  const [formError, setFormError] = useState("");
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Reports state
  const [reportStart, setReportStart] = useState("");
  const [reportEnd, setReportEnd] = useState("");
  const [report, setReport] = useState<Report | null>(null);
  const [reportLoading, setReportLoading] = useState(false);

  // Load overview on mount
  useEffect(() => {
    loadOverview();
  }, []);

  // Load categories when needed
  useEffect(() => {
    if (tab === "transactions" && categories.length === 0) {
      financeApi.getCategories().then(setCategories).catch(() => {});
    }
  }, [tab, categories.length]);

  // Load transactions when tab changes or filters change
  useEffect(() => {
    if (tab === "transactions") {
      loadTransactions();
    }
  }, [tab, filterType, filterStart, filterEnd]);

  async function loadOverview() {
    setOverviewLoading(true);
    try {
      const { start, end } = getMonthRange();
      const data = await financeApi.getReport(start, end);
      setOverview(data);
    } catch {
      setOverview(null);
    } finally {
      setOverviewLoading(false);
    }
  }

  async function loadTransactions() {
    setTxLoading(true);
    try {
      const params: any = {};
      if (filterType) params.type = filterType;
      if (filterStart) params.startDate = filterStart;
      if (filterEnd) params.endDate = filterEnd;
      const data = await financeApi.getTransactions(params);
      setTransactions(Array.isArray(data) ? data : []);
    } catch {
      setTransactions([]);
    } finally {
      setTxLoading(false);
    }
  }

  async function handleAddTransaction(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    if (!formAmount || !formCategory) {
      setFormError("Amount and category are required.");
      return;
    }
    setFormSubmitting(true);
    try {
      await financeApi.createTransaction({
        amount: parseFloat(formAmount),
        type: formType,
        categoryId: formCategory,
        description: formDescription,
        date: formDate,
      });
      setFormAmount("");
      setFormDescription("");
      setFormCategory("");
      setFormDate(new Date().toISOString().split("T")[0]);
      setShowForm(false);
      loadTransactions();
      loadOverview();
    } catch (err: any) {
      setFormError(err.response?.data?.error || "Failed to create transaction.");
    } finally {
      setFormSubmitting(false);
    }
  }

  async function handleGenerateReport() {
    if (!reportStart || !reportEnd) return;
    setReportLoading(true);
    try {
      const data = await financeApi.getReport(reportStart, reportEnd);
      setReport(data);
    } catch {
      setReport(null);
    } finally {
      setReportLoading(false);
    }
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: "overview", label: "Overview" },
    { key: "transactions", label: "Transactions" },
    { key: "reports", label: "Reports" },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Finance Dashboard</h2>

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

      {/* Overview Tab */}
      {tab === "overview" && (
        <div>
          {overviewLoading ? (
            <p className="text-gray-500">Loading overview...</p>
          ) : overview ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-5">
                <p className="text-sm text-green-600 font-medium">Total Income</p>
                <p className="text-2xl font-bold text-green-700 mt-1">
                  {formatCurrency(overview.income)}
                </p>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-lg p-5">
                <p className="text-sm text-red-600 font-medium">Total Expense</p>
                <p className="text-2xl font-bold text-red-700 mt-1">
                  {formatCurrency(overview.expense)}
                </p>
              </div>
              <div
                className={`border rounded-lg p-5 ${
                  overview.profit >= 0
                    ? "bg-blue-50 border-blue-200"
                    : "bg-orange-50 border-orange-200"
                }`}
              >
                <p
                  className={`text-sm font-medium ${
                    overview.profit >= 0 ? "text-blue-600" : "text-orange-600"
                  }`}
                >
                  Net Profit
                </p>
                <p
                  className={`text-2xl font-bold mt-1 ${
                    overview.profit >= 0 ? "text-blue-700" : "text-orange-700"
                  }`}
                >
                  {formatCurrency(overview.profit)}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-gray-500">No data available for this month.</p>
          )}
        </div>
      )}

      {/* Transactions Tab */}
      {tab === "transactions" && (
        <div>
          {/* Filters */}
          <div className="flex flex-wrap items-end gap-4 mb-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Type</label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">All</option>
                <option value="INCOME">Income</option>
                <option value="EXPENSE">Expense</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">From</label>
              <input
                type="date"
                value={filterStart}
                onChange={(e) => setFilterStart(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">To</label>
              <input
                type="date"
                value={filterEnd}
                onChange={(e) => setFilterEnd(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <button
              onClick={() => setShowForm((v) => !v)}
              className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 transition-colors"
            >
              {showForm ? "Cancel" : "Add Transaction"}
            </button>
          </div>

          {/* Add Transaction Form */}
          {showForm && (
            <form
              onSubmit={handleAddTransaction}
              className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
            >
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Amount</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formAmount}
                  onChange={(e) => setFormAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Type</label>
                <select
                  value={formType}
                  onChange={(e) => setFormType(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="INCOME">Income</option>
                  <option value="EXPENSE">Expense</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Category</label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                >
                  <option value="">Select category</option>
                  {categories
                    .filter((c) => c.type === formType || c.type === "BOTH")
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
                <input
                  type="text"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Optional description"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
                >
                  {formSubmitting ? "Saving..." : "Save Transaction"}
                </button>
              </div>
              {formError && (
                <p className="text-red-600 text-sm col-span-full">{formError}</p>
              )}
            </form>
          )}

          {/* Transactions Table */}
          {txLoading ? (
            <p className="text-gray-500">Loading transactions...</p>
          ) : transactions.length === 0 ? (
            <p className="text-gray-500">No transactions found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left border border-gray-200 rounded-lg">
                <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
                  <tr>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">Description</th>
                    <th className="px-4 py-3 text-right">Amount</th>
                    <th className="px-4 py-3">Created By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap">
                        {new Date(tx.date).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${TRANSACTION_TYPE_COLORS[tx.type] ?? "bg-gray-100 text-gray-700"}`}
                        >
                          {tx.type}
                        </span>
                      </td>
                      <td className="px-4 py-3">{tx.category?.name ?? "-"}</td>
                      <td className="px-4 py-3 text-gray-600">{tx.description || "-"}</td>
                      <td className="px-4 py-3 text-right font-medium">
                        {formatCurrency(tx.amount)}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {tx.createdBy
                          ? `${tx.createdBy.firstName} ${tx.createdBy.lastName}`
                          : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Reports Tab */}
      {tab === "reports" && (
        <div>
          <div className="flex flex-wrap items-end gap-4 mb-6">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Start Date</label>
              <input
                type="date"
                value={reportStart}
                onChange={(e) => setReportStart(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">End Date</label>
              <input
                type="date"
                value={reportEnd}
                onChange={(e) => setReportEnd(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <button
              onClick={handleGenerateReport}
              disabled={!reportStart || !reportEnd || reportLoading}
              className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {reportLoading ? "Generating..." : "Generate Report"}
            </button>
          </div>

          {report && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-5">
                <p className="text-sm text-green-600 font-medium">Income</p>
                <p className="text-2xl font-bold text-green-700 mt-1">
                  {formatCurrency(report.income)}
                </p>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-lg p-5">
                <p className="text-sm text-red-600 font-medium">Expense</p>
                <p className="text-2xl font-bold text-red-700 mt-1">
                  {formatCurrency(report.expense)}
                </p>
              </div>
              <div
                className={`border rounded-lg p-5 ${
                  report.profit >= 0
                    ? "bg-blue-50 border-blue-200"
                    : "bg-orange-50 border-orange-200"
                }`}
              >
                <p
                  className={`text-sm font-medium ${
                    report.profit >= 0 ? "text-blue-600" : "text-orange-600"
                  }`}
                >
                  Net Profit
                </p>
                <p
                  className={`text-2xl font-bold mt-1 ${
                    report.profit >= 0 ? "text-blue-700" : "text-orange-700"
                  }`}
                >
                  {formatCurrency(report.profit)}
                </p>
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-5">
                <p className="text-sm text-gray-600 font-medium">Transactions</p>
                <p className="text-2xl font-bold text-gray-700 mt-1">
                  {report.transactionCount}
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
