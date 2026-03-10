import { useEffect, useState } from "react";
import { taskBoardApi } from "../../../api/taskBoard";
import { usersApi } from "../../../api/users";
import { useAuth } from "../../../contexts/AuthContext";
import { ConfirmDialog } from "../../../components/common/ConfirmDialog";

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
  assigneeId?: string | null;
  assignee: { firstName: string; lastName: string } | null;
}

interface UserOption {
  id: string;
  firstName: string;
  lastName: string;
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
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";

  const [tab, setTab] = useState<Tab>("boards");

  // Board list state
  const [boards, setBoards] = useState<Board[]>([]);
  const [boardsLoading, setBoardsLoading] = useState(false);
  const [showBoardForm, setShowBoardForm] = useState(false);
  const [boardName, setBoardName] = useState("");
  const [boardDescription, setBoardDescription] = useState("");
  const [boardFormError, setBoardFormError] = useState("");
  const [boardFormSubmitting, setBoardFormSubmitting] = useState(false);

  // Board delete state
  const [boardToDelete, setBoardToDelete] = useState<Board | null>(null);

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
  const [taskAssigneeId, setTaskAssigneeId] = useState("");
  const [taskFormError, setTaskFormError] = useState("");
  const [taskFormSubmitting, setTaskFormSubmitting] = useState(false);

  // Edit task state
  const [editingTask, setEditingTask] = useState<TaskCard | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editPriority, setEditPriority] = useState<TaskPriority>("MEDIUM");
  const [editDueDate, setEditDueDate] = useState("");
  const [editAssigneeId, setEditAssigneeId] = useState("");
  const [editFormError, setEditFormError] = useState("");
  const [editFormSubmitting, setEditFormSubmitting] = useState(false);

  // Users for assignee picker
  const [users, setUsers] = useState<UserOption[]>([]);

  // Load boards on mount
  useEffect(() => {
    loadBoards();
    loadUsers();
  }, []);

  async function loadUsers() {
    try {
      const data = await usersApi.list();
      setUsers(Array.isArray(data) ? data : []);
    } catch {
      setUsers([]);
    }
  }

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

  async function handleDeleteBoard() {
    if (!boardToDelete) return;
    try {
      await taskBoardApi.deleteBoard(boardToDelete.id);
      setBoardToDelete(null);
      loadBoards();
    } catch {
      // silently fail
      setBoardToDelete(null);
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
        assigneeId: taskAssigneeId || undefined,
      });
      setTaskTitle("");
      setTaskDescription("");
      setTaskPriority("MEDIUM");
      setTaskDueDate("");
      setTaskAssigneeId("");
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

  function openEditTask(task: TaskCard) {
    setEditingTask(task);
    setEditTitle(task.title);
    setEditDescription(task.description || "");
    setEditPriority(task.priority);
    setEditDueDate(task.dueDate ? task.dueDate.slice(0, 10) : "");
    setEditAssigneeId(task.assigneeId || "");
    setEditFormError("");
  }

  function closeEditTask() {
    setEditingTask(null);
    setEditTitle("");
    setEditDescription("");
    setEditPriority("MEDIUM");
    setEditDueDate("");
    setEditAssigneeId("");
    setEditFormError("");
  }

  async function handleEditTask(e: React.FormEvent) {
    e.preventDefault();
    if (!editingTask) return;
    setEditFormError("");
    if (!editTitle.trim()) {
      setEditFormError("Task title is required.");
      return;
    }
    setEditFormSubmitting(true);
    try {
      const updated = await taskBoardApi.updateTask(editingTask.id, {
        title: editTitle,
        description: editDescription || undefined,
        priority: editPriority,
        dueDate: editDueDate || undefined,
        assigneeId: editAssigneeId || null,
      });
      setTasks((prev) => prev.map((t) => (t.id === editingTask.id ? updated : t)));
      closeEditTask();
    } catch (err: any) {
      setEditFormError(err.response?.data?.error || "Failed to update task.");
    } finally {
      setEditFormSubmitting(false);
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
    closeEditTask();
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
                <div
                  key={board.id}
                  className="relative bg-white border border-gray-200 rounded-lg p-5 hover:border-indigo-300 hover:shadow-sm transition-all"
                >
                  <button
                    onClick={() => selectBoard(board)}
                    className="text-left w-full"
                  >
                    <h3 className="text-lg font-semibold text-gray-900">{board.name}</h3>
                    {board.description && (
                      <p className="text-sm text-gray-500 mt-1">{board.description}</p>
                    )}
                    <p className="text-xs text-gray-400 mt-2">
                      Created {new Date(board.createdAt).toLocaleDateString()}
                    </p>
                  </button>
                  {isAdmin && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setBoardToDelete(board);
                      }}
                      className="absolute top-3 right-3 text-gray-400 hover:text-red-500 text-sm"
                      title="Delete board"
                    >
                      &times;
                    </button>
                  )}
                </div>
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
            <div className="flex items-center gap-2">
              {isAdmin && (
                <button
                  onClick={() => setBoardToDelete(selectedBoard)}
                  className="bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700 transition-colors"
                >
                  Delete Board
                </button>
              )}
              <button
                onClick={() => setShowTaskForm((v) => !v)}
                className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 transition-colors"
              >
                {showTaskForm ? "Cancel" : "New Task"}
              </button>
            </div>
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
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
                <input
                  type="text"
                  value={taskDescription}
                  onChange={(e) => setTaskDescription(e.target.value)}
                  placeholder="Optional description"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Assignee</label>
                <select
                  value={taskAssigneeId}
                  onChange={(e) => setTaskAssigneeId(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Unassigned</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.firstName} {u.lastName}
                    </option>
                  ))}
                </select>
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

          {/* Edit Task Modal */}
          {editingTask && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
              <div className="bg-white rounded-xl shadow-lg p-6 max-w-lg w-full mx-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Edit Task</h3>
                <form onSubmit={handleEditTask} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Title</label>
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
                    <input
                      type="text"
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      placeholder="Optional description"
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Priority</label>
                      <select
                        value={editPriority}
                        onChange={(e) => setEditPriority(e.target.value as TaskPriority)}
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
                        value={editDueDate}
                        onChange={(e) => setEditDueDate(e.target.value)}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Assignee</label>
                    <select
                      value={editAssigneeId}
                      onChange={(e) => setEditAssigneeId(e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">Unassigned</option>
                      {users.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.firstName} {u.lastName}
                        </option>
                      ))}
                    </select>
                  </div>
                  {editFormError && (
                    <p className="text-red-600 text-sm">{editFormError}</p>
                  )}
                  <div className="flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={closeEditTask}
                      className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={editFormSubmitting}
                      className="px-4 py-2 text-sm text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                    >
                      {editFormSubmitting ? "Saving..." : "Save Changes"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
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
                          className="bg-white border border-gray-200 rounded-md p-3 shadow-sm cursor-pointer hover:border-indigo-300 transition-colors"
                          onClick={() => openEditTask(task)}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <h5 className="text-sm font-medium text-gray-900 flex-1">
                              {task.title}
                            </h5>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteTask(task.id);
                              }}
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
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleUpdateStatus(task.id, s.key);
                                }}
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

      {/* Board Delete Confirmation */}
      <ConfirmDialog
        open={!!boardToDelete}
        title="Delete Board"
        message={`Are you sure you want to delete "${boardToDelete?.name}"? All tasks in this board will be permanently removed.`}
        confirmLabel="Delete"
        onConfirm={handleDeleteBoard}
        onCancel={() => setBoardToDelete(null)}
      />
    </div>
  );
}
