import { useEffect, useState } from "react";
import { taskBoardApi } from "../../../api/taskBoard";

interface Board {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
}

interface TaskCard {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string | null;
  assignee: { firstName: string; lastName: string } | null;
}

type TaskStatus = "TODO" | "IN_PROGRESS" | "REVIEW" | "DONE";
type TaskPriority = "LOW" | "MEDIUM" | "HIGH";

type Tab = "boards" | "board";

const STATUS_COLUMNS: { key: TaskStatus; label: string }[] = [
  { key: "TODO", label: "To Do" },
  { key: "IN_PROGRESS", label: "In Progress" },
  { key: "REVIEW", label: "Review" },
  { key: "DONE", label: "Done" },
];

const PRIORITY_COLORS: Record<TaskPriority, string> = {
  LOW: "bg-gray-100 text-gray-700",
  MEDIUM: "bg-yellow-100 text-yellow-700",
  HIGH: "bg-red-100 text-red-700",
};

const STATUS_COLORS: Record<TaskStatus, string> = {
  TODO: "bg-gray-100 text-gray-700",
  IN_PROGRESS: "bg-blue-100 text-blue-700",
  REVIEW: "bg-purple-100 text-purple-700",
  DONE: "bg-green-100 text-green-700",
};

export default function TaskBoardPage() {
  const [tab, setTab] = useState<Tab>("boards");

  // Board list state
  const [boards, setBoards] = useState<Board[]>([]);
  const [boardsLoading, setBoardsLoading] = useState(false);
  const [showBoardForm, setShowBoardForm] = useState(false);
  const [boardName, setBoardName] = useState("");
  const [boardDescription, setBoardDescription] = useState("");
  const [boardFormError, setBoardFormError] = useState("");
  const [boardFormSubmitting, setBoardFormSubmitting] = useState(false);

  // Selected board state
  const [selectedBoard, setSelectedBoard] = useState<Board | null>(null);
  const [tasks, setTasks] = useState<TaskCard[]>([]);
  const [tasksLoading, setTasksLoading] = useState(false);

  // Create task form
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [taskPriority, setTaskPriority] = useState<TaskPriority>("MEDIUM");
  const [taskDueDate, setTaskDueDate] = useState("");
  const [taskFormError, setTaskFormError] = useState("");
  const [taskFormSubmitting, setTaskFormSubmitting] = useState(false);

  // Load boards on mount
  useEffect(() => {
    loadBoards();
  }, []);

  async function loadBoards() {
    setBoardsLoading(true);
    try {
      const data = await taskBoardApi.getBoards();
      setBoards(Array.isArray(data) ? data : []);
    } catch {
      setBoards([]);
    } finally {
      setBoardsLoading(false);
    }
  }

  async function handleCreateBoard(e: React.FormEvent) {
    e.preventDefault();
    setBoardFormError("");
    if (!boardName.trim()) {
      setBoardFormError("Board name is required.");
      return;
    }
    setBoardFormSubmitting(true);
    try {
      await taskBoardApi.createBoard({
        name: boardName,
        description: boardDescription || undefined,
      });
      setBoardName("");
      setBoardDescription("");
      setShowBoardForm(false);
      loadBoards();
    } catch (err: any) {
      setBoardFormError(err.response?.data?.error || "Failed to create board.");
    } finally {
      setBoardFormSubmitting(false);
    }
  }

  async function selectBoard(board: Board) {
    setSelectedBoard(board);
    setTab("board");
    setTasksLoading(true);
    try {
      const data = await taskBoardApi.getBoard(board.id);
      setTasks(Array.isArray(data.tasks) ? data.tasks : []);
    } catch {
      setTasks([]);
    } finally {
      setTasksLoading(false);
    }
  }

  async function handleCreateTask(e: React.FormEvent) {
    e.preventDefault();
    setTaskFormError("");
    if (!taskTitle.trim()) {
      setTaskFormError("Task title is required.");
      return;
    }
    if (!selectedBoard) return;
    setTaskFormSubmitting(true);
    try {
      await taskBoardApi.createTask(selectedBoard.id, {
        title: taskTitle,
        description: taskDescription || undefined,
        priority: taskPriority,
        dueDate: taskDueDate || undefined,
      });
      setTaskTitle("");
      setTaskDescription("");
      setTaskPriority("MEDIUM");
      setTaskDueDate("");
      setShowTaskForm(false);
      // Reload board tasks
      const data = await taskBoardApi.getBoard(selectedBoard.id);
      setTasks(Array.isArray(data.tasks) ? data.tasks : []);
    } catch (err: any) {
      setTaskFormError(err.response?.data?.error || "Failed to create task.");
    } finally {
      setTaskFormSubmitting(false);
    }
  }

  async function handleUpdateStatus(taskId: string, status: TaskStatus) {
    try {
      const updated = await taskBoardApi.updateTask(taskId, { status });
      setTasks((prev) => prev.map((t) => (t.id === taskId ? updated : t)));
    } catch {
      // silently fail
    }
  }

  async function handleDeleteTask(taskId: string) {
    try {
      await taskBoardApi.deleteTask(taskId);
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
    } catch {
      // silently fail
    }
  }

  function goBackToBoards() {
    setTab("boards");
    setSelectedBoard(null);
    setTasks([]);
    setShowTaskForm(false);
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: "boards", label: "Boards" },
    ...(selectedBoard ? [{ key: "board" as Tab, label: selectedBoard.name }] : []),
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Task Board</h2>

      {/* Tab Navigation */}
      <div className="flex space-x-1 border-b border-gray-200 mb-6">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => (t.key === "boards" ? goBackToBoards() : undefined)}
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

      {/* Boards Tab */}
      {tab === "boards" && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-600">
              {boards.length} board{boards.length !== 1 ? "s" : ""}
            </p>
            <button
              onClick={() => setShowBoardForm((v) => !v)}
              className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 transition-colors"
            >
              {showBoardForm ? "Cancel" : "New Board"}
            </button>
          </div>

          {/* Create Board Form */}
          {showBoardForm && (
            <form
              onSubmit={handleCreateBoard}
              className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4 grid grid-cols-1 sm:grid-cols-2 gap-4"
            >
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Board Name</label>
                <input
                  type="text"
                  value={boardName}
                  onChange={(e) => setBoardName(e.target.value)}
                  placeholder="e.g. Sprint 1"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
                <input
                  type="text"
                  value={boardDescription}
                  onChange={(e) => setBoardDescription(e.target.value)}
                  placeholder="Optional description"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={boardFormSubmitting}
                  className="bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
                >
                  {boardFormSubmitting ? "Creating..." : "Create Board"}
                </button>
              </div>
              {boardFormError && (
                <p className="text-red-600 text-sm col-span-full">{boardFormError}</p>
              )}
            </form>
          )}

          {/* Board List */}
          {boardsLoading ? (
            <p className="text-gray-500">Loading boards...</p>
          ) : boards.length === 0 ? (
            <p className="text-gray-500">No boards found. Create one to get started.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {boards.map((board) => (
                <button
                  key={board.id}
                  onClick={() => selectBoard(board)}
                  className="text-left bg-white border border-gray-200 rounded-lg p-5 hover:border-indigo-300 hover:shadow-sm transition-all"
                >
                  <h3 className="text-lg font-semibold text-gray-900">{board.name}</h3>
                  {board.description && (
                    <p className="text-sm text-gray-500 mt-1">{board.description}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-2">
                    Created {new Date(board.createdAt).toLocaleDateString()}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Board Detail / Kanban Tab */}
      {tab === "board" && selectedBoard && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={goBackToBoards}
              className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
            >
              &larr; Back to Boards
            </button>
            <button
              onClick={() => setShowTaskForm((v) => !v)}
              className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 transition-colors"
            >
              {showTaskForm ? "Cancel" : "New Task"}
            </button>
          </div>

          {/* Create Task Form */}
          {showTaskForm && (
            <form
              onSubmit={handleCreateTask}
              className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
            >
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">Title</label>
                <input
                  type="text"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  placeholder="Task title"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Priority</label>
                <select
                  value={taskPriority}
                  onChange={(e) => setTaskPriority(e.target.value as TaskPriority)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Due Date</label>
                <input
                  type="date"
                  value={taskDueDate}
                  onChange={(e) => setTaskDueDate(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="sm:col-span-2 lg:col-span-3">
                <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
                <input
                  type="text"
                  value={taskDescription}
                  onChange={(e) => setTaskDescription(e.target.value)}
                  placeholder="Optional description"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={taskFormSubmitting}
                  className="bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
                >
                  {taskFormSubmitting ? "Creating..." : "Create Task"}
                </button>
              </div>
              {taskFormError && (
                <p className="text-red-600 text-sm col-span-full">{taskFormError}</p>
              )}
            </form>
          )}

          {/* Kanban Board */}
          {tasksLoading ? (
            <p className="text-gray-500">Loading tasks...</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {STATUS_COLUMNS.map((col) => {
                const colTasks = tasks.filter((t) => t.status === col.key);
                return (
                  <div key={col.key} className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-semibold text-gray-700">{col.label}</h4>
                      <span className="text-xs text-gray-400">{colTasks.length}</span>
                    </div>
                    <div className="space-y-2">
                      {colTasks.map((task) => (
                        <div
                          key={task.id}
                          className="bg-white border border-gray-200 rounded-md p-3 shadow-sm"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <h5 className="text-sm font-medium text-gray-900 flex-1">
                              {task.title}
                            </h5>
                            <button
                              onClick={() => handleDeleteTask(task.id)}
                              className="text-gray-400 hover:text-red-500 text-xs ml-2"
                              title="Delete task"
                            >
                              &times;
                            </button>
                          </div>
                          {task.description && (
                            <p className="text-xs text-gray-500 mb-2">{task.description}</p>
                          )}
                          <div className="flex flex-wrap items-center gap-1 mb-2">
                            <span
                              className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${PRIORITY_COLORS[task.priority]}`}
                            >
                              {task.priority}
                            </span>
                            {task.assignee && (
                              <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-700">
                                {task.assignee.firstName} {task.assignee.lastName}
                              </span>
                            )}
                            {task.dueDate && (
                              <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
                                {new Date(task.dueDate).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                          {/* Status move buttons */}
                          <div className="flex flex-wrap gap-1">
                            {STATUS_COLUMNS.filter((s) => s.key !== task.status).map((s) => (
                              <button
                                key={s.key}
                                onClick={() => handleUpdateStatus(task.id, s.key)}
                                className={`px-2 py-0.5 rounded text-xs font-medium transition-colors hover:opacity-80 ${STATUS_COLORS[s.key]}`}
                              >
                                {s.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                      {colTasks.length === 0 && (
                        <p className="text-xs text-gray-400 text-center py-4">No tasks</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
