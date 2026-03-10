import { useEffect, useState, useMemo } from "react";
import { ideationApi } from "../../../api/ideation";

type IdeaStage = "IDEA" | "APPROVED" | "IN_PROGRESS" | "DONE";

interface Idea {
  id: string;
  title: string;
  description: string;
  stage: IdeaStage;
  votes: number;
  createdBy?: { firstName: string; lastName: string };
  createdAt: string;
}

const STAGES: IdeaStage[] = ["IDEA", "APPROVED", "IN_PROGRESS", "DONE"];

const STAGE_LABELS: Record<IdeaStage, string> = {
  IDEA: "Idea",
  APPROVED: "Approved",
  IN_PROGRESS: "In Progress",
  DONE: "Done",
};

const STAGE_COLORS: Record<IdeaStage, string> = {
  IDEA: "bg-gray-100 border-gray-300",
  APPROVED: "bg-blue-50 border-blue-300",
  IN_PROGRESS: "bg-yellow-50 border-yellow-300",
  DONE: "bg-green-50 border-green-300",
};

export default function IdeationPage() {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", description: "" });
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await ideationApi.getIdeas();
      setIdeas(data);
    } catch {
      setError("Failed to load ideas.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const ideasByStage = useMemo(() => {
    const map: Record<IdeaStage, Idea[]> = { IDEA: [], APPROVED: [], IN_PROGRESS: [], DONE: [] };
    ideas.forEach((idea) => {
      if (map[idea.stage]) map[idea.stage].push(idea);
    });
    return map;
  }, [ideas]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.description.trim()) return;
    setSubmitting(true);
    try {
      await ideationApi.createIdea({
        title: form.title.trim(),
        description: form.description.trim(),
      });
      setForm({ title: "", description: "" });
      setShowForm(false);
      await loadData();
    } catch {
      /* silent */
    } finally {
      setSubmitting(false);
    }
  };

  const moveIdea = async (ideaId: string, newStage: IdeaStage) => {
    try {
      await ideationApi.updateIdea(ideaId, { stage: newStage });
      await loadData();
    } catch {
      /* silent */
    }
  };

  const voteIdea = async (ideaId: string) => {
    try {
      await ideationApi.voteIdea(ideaId);
      await loadData();
    } catch {
      /* silent */
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Ideation Board</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="rounded bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          {showForm ? "Cancel" : "New Idea"}
        </button>
      </div>

      {error && (
        <div className="rounded bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}

      {showForm && (
        <form onSubmit={handleCreate} className="rounded border border-gray-200 bg-gray-50 p-4 space-y-3">
          <input
            required
            placeholder="Idea title *"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
          />
          <textarea
            required
            placeholder="Describe the idea *"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
            rows={3}
          />
          <button
            type="submit"
            disabled={submitting}
            className="rounded bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {submitting ? "Saving..." : "Submit Idea"}
          </button>
        </form>
      )}

      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : (
        <div className="grid grid-cols-4 gap-4">
          {STAGES.map((stage) => (
            <div key={stage} className={`rounded-lg border p-3 ${STAGE_COLORS[stage]}`}>
              <h3 className="mb-3 text-sm font-bold uppercase text-gray-700">
                {STAGE_LABELS[stage]}{" "}
                <span className="text-gray-400">({ideasByStage[stage].length})</span>
              </h3>
              <div className="space-y-2">
                {ideasByStage[stage].length === 0 && (
                  <p className="text-xs text-gray-400">No ideas</p>
                )}
                {ideasByStage[stage].map((idea) => (
                  <IdeaCard
                    key={idea.id}
                    idea={idea}
                    currentStage={stage}
                    onMove={moveIdea}
                    onVote={voteIdea}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function IdeaCard({
  idea,
  currentStage,
  onMove,
  onVote,
}: {
  idea: Idea;
  currentStage: IdeaStage;
  onMove: (id: string, stage: IdeaStage) => void;
  onVote: (id: string) => void;
}) {
  const stageIdx = STAGES.indexOf(currentStage);
  const creatorName = idea.createdBy
    ? `${idea.createdBy.firstName} ${idea.createdBy.lastName}`
    : "Unknown";

  return (
    <div className="rounded border border-white bg-white p-3 shadow-sm">
      <p className="text-sm font-medium text-gray-900">{idea.title}</p>
      <p className="mt-1 text-xs text-gray-500 line-clamp-2">{idea.description}</p>
      <p className="mt-1 text-xs text-gray-400">by {creatorName}</p>
      <div className="mt-2 flex items-center justify-between">
        <button
          onClick={() => onVote(idea.id)}
          className="flex items-center gap-1 rounded bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700 hover:bg-indigo-100"
        >
          &uarr; {idea.votes}
        </button>
        <div className="flex gap-1">
          {stageIdx > 0 && (
            <button
              onClick={() => onMove(idea.id, STAGES[stageIdx - 1])}
              className="rounded bg-gray-200 px-2 py-0.5 text-xs text-gray-700 hover:bg-gray-300"
            >
              &larr;
            </button>
          )}
          {stageIdx < STAGES.length - 1 && (
            <button
              onClick={() => onMove(idea.id, STAGES[stageIdx + 1])}
              className="rounded bg-gray-200 px-2 py-0.5 text-xs text-gray-700 hover:bg-gray-300"
            >
              &rarr;
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
