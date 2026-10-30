import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import {
  AlertCircle,
  Baby,
  BriefcaseBusiness,
  CalendarDays,
  Check,
  CheckCircle2,
  Circle,
  Clock3,
  LoaderCircle,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  Target,
  Trash2,
  X,
} from "lucide-react";

import plannerService, {
  type ChecklistCategory,
  type ChecklistItem,
  type PlannerPlan,
  type WorkType,
} from "../../services/plannerService";

/*
  Palette (shared with the landing page, auth page, dashboard, wellbeing and layout):
  light #e6f5f8 | cyan #3cc3dd | blue #1a77ab | deep #0d5694 | grey #626569
*/

const gradientSquare =
  "bg-gradient-to-br from-[#3cc3dd] to-[#0d5694] text-white shadow-lg shadow-[#0d5694]/25";

const gradientButton =
  "bg-gradient-to-b from-[#3cc3dd] to-[#0d5694] text-white shadow-md shadow-[#0d5694]/25";

const card =
  "rounded-3xl bg-white p-6 shadow-lg shadow-[#0d5694]/5 ring-1 ring-[#0d5694]/5";

const fieldClass =
  "w-full rounded-lg border border-[#d3eaf0] bg-[#f3fafc] text-sm text-[#2a2f33] outline-none transition placeholder:text-[#8a9399] focus:border-[#3cc3dd] focus:bg-white focus:ring-4 focus:ring-[#3cc3dd]/20";

const labelClass = "mb-2 block text-sm font-extrabold text-[#626569]";

const workTypes: { value: WorkType; label: string; description: string }[] = [
  {
    value: "corporate",
    label: "Corporate",
    description: "Returning to a formal workplace.",
  },
  {
    value: "remote",
    label: "Remote",
    description: "Working from home or remotely.",
  },
  {
    value: "hybrid",
    label: "Hybrid",
    description: "Combining office and remote work.",
  },
  {
    value: "gig",
    label: "Gig work",
    description: "Freelance or contract-based work.",
  },
  {
    value: "informal",
    label: "Informal work",
    description: "Returning to informal or self-employed work.",
  },
  {
    value: "other",
    label: "Other",
    description: "Another type of work arrangement.",
  },
];

const categories: {
  value: ChecklistCategory;
  label: string;
}[] = [
  { value: "logistics", label: "Logistics" },
  { value: "career", label: "Career" },
  { value: "wellbeing", label: "Wellbeing" },
];

const categoryStyles: Record<ChecklistCategory, string> = {
  logistics: "bg-white text-[#0d5694]",
  career: "bg-white text-[#1a77ab]",
  wellbeing: "bg-white text-[#0b3f78]",
};

function getToday(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatDate(date: string): string {
  if (!date) return "Not set";

  return new Date(`${date}T00:00:00`).toLocaleDateString(undefined, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return "Something went wrong. Please try again.";
}

function getWorkTypeLabel(workType: WorkType): string {
  return workTypes.find((type) => type.value === workType)?.label ?? workType;
}

export default function PlannerPage() {
  const [plan, setPlan] = useState<PlannerPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [workType, setWorkType] = useState<WorkType>("corporate");
  const [returnDate, setReturnDate] = useState("");

  const [newTask, setNewTask] = useState("");
  const [newTaskCategory, setNewTaskCategory] =
    useState<ChecklistCategory>("logistics");

  const [editingTask, setEditingTask] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [editingCategory, setEditingCategory] =
    useState<ChecklistCategory>("logistics");

  const [childcare, setChildcare] = useState({
    primary_caregiver: "",
    backup_plan: "",
    commute_notes: "",
  });

  const [editingChildcare, setEditingChildcare] = useState(false);

  const loadPlan = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const result = await plannerService.getMyPlan();

      setPlan(result);

      if (result) {
        setWorkType(result.work_type);
        setReturnDate(result.return_date);

        const arrangement = result.childcare_arrangement;

        setChildcare({
          primary_caregiver: arrangement?.primary_caregiver ?? "",
          backup_plan: arrangement?.backup_plan ?? "",
          commute_notes: arrangement?.commute_notes ?? "",
        });
      }
    } catch (err) {
      const status = (err as { response?: { status?: number } })?.response
        ?.status;

      if (status === 404) {
        setPlan(null);
        setError("");
      } else {
        setError(getErrorMessage(err));
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void Promise.resolve().then(loadPlan);
  }, [loadPlan]);

  const checklist = plan?.checklist_items ?? [];

  const completedCount = useMemo(
    () => checklist.filter((item) => item.is_completed).length,
    [checklist],
  );

  const progress = checklist.length
    ? Math.round((completedCount / checklist.length) * 100)
    : 0;

  const groupedTasks = useMemo(
    () =>
      categories.map((category) => ({
        ...category,
        items: checklist.filter((item) => item.category === category.value),
      })),
    [checklist],
  );

  async function handleCreatePlan(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!returnDate) {
      setError("Please select your expected return date.");
      return;
    }

    if (returnDate < getToday()) {
      setError("Your return date cannot be in the past.");
      return;
    }

    if (
      plan &&
      !window.confirm(
        "Creating a new plan will replace your current active plan. Continue?",
      )
    ) {
      return;
    }

    setSaving(true);
    setError("");

    try {
      const result = await plannerService.createPlan({
        work_type: workType,
        return_date: returnDate,
      });

      setPlan(result);
      setChildcare({
        primary_caregiver: "",
        backup_plan: "",
        commute_notes: "",
      });
      setEditingChildcare(false);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdatePlan() {
    if (!plan) return;

    if (!returnDate || returnDate < getToday()) {
      setError("Please select a valid return date.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const updated = await plannerService.updatePlan(plan.id, {
        work_type: workType,
        return_date: returnDate,
      });

      setPlan(updated);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleDeletePlan() {
    if (!plan) return;

    const confirmed = window.confirm(
      "Are you sure you want to delete this plan? Its checklist and childcare arrangement will no longer be available.",
    );

    if (!confirmed) return;

    setSaving(true);
    setError("");

    try {
      await plannerService.deletePlan(plan.id);
      setPlan(null);
      setReturnDate("");
      setWorkType("corporate");
      setChildcare({
        primary_caregiver: "",
        backup_plan: "",
        commute_notes: "",
      });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleAddTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!plan || !newTask.trim()) return;

    setSaving(true);
    setError("");

    try {
      const item = await plannerService.addChecklistItem(plan.id, {
        title: newTask.trim(),
        category: newTaskCategory,
      });

      setPlan((current) =>
        current
          ? {
              ...current,
              checklist_items: [...current.checklist_items, item],
            }
          : current,
      );

      setNewTask("");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleTask(item: ChecklistItem) {
    setError("");

    try {
      const updated = await plannerService.updateChecklistItem(item.id, {
        is_completed: !item.is_completed,
      });

      setPlan((current) =>
        current
          ? {
              ...current,
              checklist_items: current.checklist_items.map((task) =>
                task.id === updated.id ? updated : task,
              ),
            }
          : current,
      );
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  function startEditingTask(item: ChecklistItem) {
    setEditingTask(item.id);
    setEditingTitle(item.title);
    setEditingCategory(item.category);
  }

  async function handleSaveTask(itemId: string) {
    if (!editingTitle.trim()) {
      setError("Task title cannot be empty.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const updated = await plannerService.updateChecklistItem(itemId, {
        title: editingTitle.trim(),
        category: editingCategory,
      });

      setPlan((current) =>
        current
          ? {
              ...current,
              checklist_items: current.checklist_items.map((task) =>
                task.id === updated.id ? updated : task,
              ),
            }
          : current,
      );

      setEditingTask(null);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteTask(itemId: string) {
    if (!window.confirm("Delete this checklist item?")) return;

    setError("");

    try {
      await plannerService.deleteChecklistItem(itemId);

      setPlan((current) =>
        current
          ? {
              ...current,
              checklist_items: current.checklist_items.filter(
                (item) => item.id !== itemId,
              ),
            }
          : current,
      );
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  async function handleSaveChildcare(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!plan) return;

    setSaving(true);
    setError("");

    try {
      const result = await plannerService.saveChildcareArrangement(
        plan.id,
        childcare,
      );

      setPlan((current) =>
        current ? { ...current, childcare_arrangement: result } : current,
      );

      setEditingChildcare(false);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex items-center gap-3 text-[#626569]">
          <LoaderCircle className="h-6 w-6 animate-spin text-[#3cc3dd]" />
          <span className="text-sm">
            Loading your return-to-work planner...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8 pb-12">
      <div>
        <p className="text-sm font-semibold text-[#3cc3dd]">
          Your journey, your pace
        </p>

        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-[#626569] sm:text-4xl">
          Return-to-Work Planner
        </h1>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-[#626569]">
          Prepare for your return to work with a practical plan that considers
          your career, childcare, daily responsibilities and wellbeing.
        </p>
      </div>

      {error && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <div className="min-w-0 flex-1">{error}</div>
          <button
            type="button"
            onClick={() => setError("")}
            aria-label="Dismiss error"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {!plan ? (
        <section className={`${card} md:p-8`}>
          <div
            className={`mb-6 flex h-12 w-12 items-center justify-center rounded-xl ${gradientSquare}`}
          >
            <BriefcaseBusiness className="h-6 w-6" />
          </div>

          <h2 className="text-xl font-extrabold text-[#626569]">
            Create your return-to-work plan
          </h2>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#626569]">
            Start by telling us what kind of work you are returning to and when
            you expect to resume. You can then organise your preparation tasks
            and childcare arrangements.
          </p>

          <form onSubmit={handleCreatePlan} className="mt-8 space-y-6">
            <div>
              <p className={labelClass}>
                What type of work are you returning to?
              </p>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {workTypes.map((type) => {
                  const selected = workType === type.value;

                  return (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => setWorkType(type.value)}
                      aria-pressed={selected}
                      className={`rounded-2xl border p-4 text-left transition ${
                        selected
                          ? `border-transparent ${gradientButton}`
                          : "border-[#d3eaf0] bg-[#f3fafc] text-[#626569] hover:border-[#3cc3dd] hover:bg-[#e6f5f8]"
                      }`}
                    >
                      <span className="block font-extrabold">{type.label}</span>
                      <span
                        className={`mt-1 block text-xs leading-5 ${
                          selected ? "text-white/90" : "text-[#626569]"
                        }`}
                      >
                        {type.description}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="max-w-sm">
              <label htmlFor="returnDate" className={labelClass}>
                Expected return date
              </label>

              <div className="relative">
                <CalendarDays className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#0d5694]" />
                <input
                  id="returnDate"
                  type="date"
                  min={getToday()}
                  value={returnDate}
                  onChange={(event) => setReturnDate(event.target.value)}
                  required
                  className={`${fieldClass} py-3 pl-11 pr-4`}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className={`inline-flex items-center gap-2 rounded-lg px-6 py-3 text-sm font-extrabold tracking-wide transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60 ${gradientButton}`}
            >
              {saving ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : (
                <Target className="h-4 w-4" />
              )}
              Create my plan
            </button>
          </form>
        </section>
      ) : (
        <>
          {/* Plan hero */}
          <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#3cc3dd] via-[#1a77ab] to-[#0d5694] p-6 text-white shadow-xl shadow-[#0d5694]/15 md:p-8">
            <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10" />
            <div className="pointer-events-none absolute -bottom-24 left-1/3 h-56 w-56 rounded-full bg-white/10" />
            <div className="pointer-events-none absolute right-1/3 top-6 hidden h-8 w-8 rotate-12 rounded-lg bg-white/25 md:block" />

            <div className="relative flex flex-col justify-between gap-6 md:flex-row md:items-start">
              <div>
                <div className="flex items-center gap-2 text-sm font-semibold text-white/85">
                  <BriefcaseBusiness className="h-4 w-4" />
                  Your return-to-work plan
                </div>

                <h2 className="mt-3 text-2xl font-extrabold sm:text-3xl">
                  Your next chapter starts here.
                </h2>

                <p className="mt-2 text-sm text-white/90">
                  {getWorkTypeLabel(plan.work_type)} work · Returning{" "}
                  {formatDate(plan.return_date)}
                </p>
              </div>

              <div className="w-fit rounded-3xl border border-white/30 bg-white/15 p-4 backdrop-blur-sm">
                <p className="text-sm text-white/85">Weeks remaining</p>
                <p className="mt-1 text-4xl font-extrabold">
                  {Math.max(0, plan.weeks_remaining)}
                </p>
              </div>
            </div>

            <div className="relative mt-8 border-t border-white/25 pt-6">
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="font-semibold">Preparation progress</span>
                <span className="font-extrabold">{progress}%</span>
              </div>

              <div className="h-3 overflow-hidden rounded-full bg-white/25">
                <div
                  className="h-full rounded-full bg-white transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>

              <p className="mt-2 text-xs text-white/85">
                {completedCount} of {checklist.length} preparation tasks
                completed
              </p>
            </div>
          </section>

          {/* Plan details */}
          <section className={card}>
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <h2 className="text-lg font-extrabold text-[#626569]">
                  Plan details
                </h2>
                <p className="mt-1 text-sm text-[#626569]">
                  Update your work arrangement or expected return date.
                </p>
              </div>

              <button
                type="button"
                onClick={handleDeletePlan}
                disabled={saving}
                className="inline-flex items-center gap-2 self-start rounded-lg border border-rose-200 px-3 py-2 text-sm font-semibold text-rose-600 transition hover:bg-rose-50 disabled:opacity-50 sm:self-auto"
              >
                <Trash2 className="h-4 w-4" />
                Delete plan
              </button>
            </div>

            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <div>
                <label htmlFor="editWorkType" className={labelClass}>
                  Work arrangement
                </label>

                <select
                  id="editWorkType"
                  value={workType}
                  onChange={(event) =>
                    setWorkType(event.target.value as WorkType)
                  }
                  className={`${fieldClass} px-4 py-3`}
                >
                  {workTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="editReturnDate" className={labelClass}>
                  Expected return date
                </label>

                <input
                  id="editReturnDate"
                  type="date"
                  min={getToday()}
                  value={returnDate}
                  onChange={(event) => setReturnDate(event.target.value)}
                  className={`${fieldClass} px-4 py-3`}
                />
              </div>
            </div>

            <button
              type="button"
              onClick={handleUpdatePlan}
              disabled={saving}
              className={`mt-5 inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-extrabold tracking-wide transition hover:brightness-110 disabled:opacity-50 ${gradientButton}`}
            >
              {saving ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Save changes
            </button>
          </section>

          {/* Checklist */}
          <section className={`${card} md:p-8`}>
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
              <div>
                <div className="flex items-center gap-2">
                  <div className={`rounded-lg p-1.5 ${gradientSquare}`}>
                    <Target className="h-4 w-4" />
                  </div>
                  <h2 className="text-xl font-extrabold text-[#626569]">
                    Your preparation checklist
                  </h2>
                </div>

                <p className="mt-2 text-sm text-[#626569]">
                  Break your preparation into manageable steps.
                </p>
              </div>

              <div className="w-fit rounded-full bg-[#e6f5f8] px-4 py-2 text-sm font-bold text-[#0d5694]">
                {completedCount}/{checklist.length} completed
              </div>
            </div>

            <form
              onSubmit={handleAddTask}
              className="mt-6 flex flex-col gap-3 md:flex-row"
            >
              <input
                type="text"
                value={newTask}
                onChange={(event) => setNewTask(event.target.value)}
                placeholder="Add a preparation task..."
                maxLength={200}
                className={`${fieldClass} min-w-0 flex-1 px-4 py-3`}
              />

              <select
                value={newTaskCategory}
                onChange={(event) =>
                  setNewTaskCategory(event.target.value as ChecklistCategory)
                }
                aria-label="Task category"
                className={`${fieldClass} px-4 py-3 md:w-auto`}
              >
                {categories.map((category) => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>

              <button
                type="submit"
                disabled={saving || !newTask.trim()}
                className={`inline-flex items-center justify-center gap-2 rounded-lg px-5 py-3 text-sm font-extrabold tracking-wide transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50 ${gradientButton}`}
              >
                <Plus className="h-4 w-4" />
                Add task
              </button>
            </form>

            {checklist.length === 0 ? (
              <div className="mt-8 rounded-2xl border border-dashed border-[#7fd3e3] bg-[#e6f5f8]/60 p-8 text-center">
                <CheckCircle2 className="mx-auto h-9 w-9 text-[#3cc3dd]" />
                <h3 className="mt-3 font-extrabold text-[#626569]">
                  Your checklist is ready
                </h3>
                <p className="mt-1 text-sm text-[#626569]">
                  Add your first preparation task above.
                </p>
              </div>
            ) : (
              <div className="mt-8 space-y-8">
                {groupedTasks.map((group) => (
                  <div key={group.value}>
                    <div className="mb-3 flex items-center justify-between">
                      <h3 className="font-extrabold text-[#0d5694]">
                        {group.label}
                      </h3>
                      <span className="text-xs font-semibold text-[#626569]">
                        {group.items.filter((item) => item.is_completed).length}
                        /{group.items.length}
                      </span>
                    </div>

                    {group.items.length === 0 ? (
                      <p className="rounded-xl bg-[#e6f5f8] px-4 py-3 text-sm text-[#626569]">
                        No tasks in this category yet.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {group.items.map((item) => (
                          <div
                            key={item.id}
                            className="flex flex-col gap-3 rounded-2xl bg-[#e6f5f8] p-4 sm:flex-row sm:items-center"
                          >
                            {editingTask === item.id ? (
                              <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row">
                                <input
                                  value={editingTitle}
                                  onChange={(event) =>
                                    setEditingTitle(event.target.value)
                                  }
                                  maxLength={200}
                                  aria-label="Edit task title"
                                  className={`${fieldClass} min-w-0 flex-1 bg-white px-3 py-2`}
                                />

                                <select
                                  value={editingCategory}
                                  onChange={(event) =>
                                    setEditingCategory(
                                      event.target.value as ChecklistCategory,
                                    )
                                  }
                                  aria-label="Edit task category"
                                  className={`${fieldClass} bg-white px-3 py-2 sm:w-auto`}
                                >
                                  {categories.map((category) => (
                                    <option
                                      key={category.value}
                                      value={category.value}
                                    >
                                      {category.label}
                                    </option>
                                  ))}
                                </select>

                                <div className="flex gap-2">
                                  <button
                                    type="button"
                                    onClick={() => handleSaveTask(item.id)}
                                    disabled={saving}
                                    aria-label="Save task"
                                    className={`rounded-lg p-2 transition hover:brightness-110 ${gradientButton}`}
                                  >
                                    <Save className="h-4 w-4" />
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => setEditingTask(null)}
                                    aria-label="Cancel editing"
                                    className="rounded-lg border border-[#d3eaf0] bg-white p-2 text-[#626569] hover:bg-[#f3fafc]"
                                  >
                                    <X className="h-4 w-4" />
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleToggleTask(item)}
                                  aria-label={
                                    item.is_completed
                                      ? "Mark task incomplete"
                                      : "Mark task complete"
                                  }
                                  className="shrink-0"
                                >
                                  {item.is_completed ? (
                                    <CheckCircle2 className="h-6 w-6 text-[#0d5694]" />
                                  ) : (
                                    <Circle className="h-6 w-6 text-[#7fd3e3]" />
                                  )}
                                </button>

                                <div className="min-w-0 flex-1">
                                  <p
                                    className={`break-words text-sm ${
                                      item.is_completed
                                        ? "text-[#626569]/70 line-through"
                                        : "font-semibold text-[#2a2f33]"
                                    }`}
                                  >
                                    {item.title}
                                  </p>

                                  {item.is_custom && (
                                    <span className="mt-1 inline-block text-xs text-[#626569]">
                                      Custom task
                                    </span>
                                  )}
                                </div>

                                <span
                                  className={`self-start rounded-full px-2.5 py-1 text-xs font-bold capitalize ${
                                    categoryStyles[item.category]
                                  }`}
                                >
                                  {item.category}
                                </span>

                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => startEditingTask(item)}
                                    aria-label="Edit task"
                                    className="rounded-lg p-2 text-[#626569] transition hover:bg-white hover:text-[#0d5694]"
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleDeleteTask(item.id)}
                                    aria-label="Delete task"
                                    className="rounded-lg p-2 text-[#626569] transition hover:bg-white hover:text-rose-600"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Childcare */}
          <section className={`${card} md:p-8`}>
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
              <div>
                <div className="flex items-center gap-2">
                  <div className={`rounded-lg p-1.5 ${gradientSquare}`}>
                    <Baby className="h-4 w-4" />
                  </div>
                  <h2 className="text-xl font-extrabold text-[#626569]">
                    Childcare arrangements
                  </h2>
                </div>

                <p className="mt-2 text-sm text-[#626569]">
                  Think through who will care for your child and what happens
                  when your usual arrangements change.
                </p>
              </div>

              {!editingChildcare && (
                <button
                  type="button"
                  onClick={() => setEditingChildcare(true)}
                  className="inline-flex items-center gap-2 self-start rounded-lg border border-[#d3eaf0] bg-white px-4 py-2 text-sm font-bold text-[#0d5694] transition hover:bg-[#e6f5f8]"
                >
                  <Pencil className="h-4 w-4" />
                  {plan.childcare_arrangement ? "Edit details" : "Add details"}
                </button>
              )}
            </div>

            {editingChildcare ? (
              <form onSubmit={handleSaveChildcare} className="mt-6 space-y-5">
                <div>
                  <label htmlFor="primaryCaregiver" className={labelClass}>
                    Primary caregiver
                  </label>

                  <input
                    id="primaryCaregiver"
                    value={childcare.primary_caregiver}
                    onChange={(event) =>
                      setChildcare((current) => ({
                        ...current,
                        primary_caregiver: event.target.value,
                      }))
                    }
                    required
                    maxLength={200}
                    placeholder="Who will primarily care for your child?"
                    className={`${fieldClass} px-4 py-3`}
                  />
                </div>

                <div>
                  <label htmlFor="backupPlan" className={labelClass}>
                    Backup childcare plan
                  </label>

                  <textarea
                    id="backupPlan"
                    value={childcare.backup_plan}
                    onChange={(event) =>
                      setChildcare((current) => ({
                        ...current,
                        backup_plan: event.target.value,
                      }))
                    }
                    required
                    maxLength={1000}
                    rows={3}
                    placeholder="What happens if your primary caregiver is unavailable?"
                    className={`${fieldClass} resize-y px-4 py-3`}
                  />
                </div>

                <div>
                  <label htmlFor="commuteNotes" className={labelClass}>
                    Commute and daily logistics
                  </label>

                  <textarea
                    id="commuteNotes"
                    value={childcare.commute_notes}
                    onChange={(event) =>
                      setChildcare((current) => ({
                        ...current,
                        commute_notes: event.target.value,
                      }))
                    }
                    required
                    maxLength={1000}
                    rows={3}
                    placeholder="How will drop-offs, pickups and commuting work?"
                    className={`${fieldClass} resize-y px-4 py-3`}
                  />
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    type="submit"
                    disabled={saving}
                    className={`inline-flex items-center gap-2 rounded-lg px-5 py-3 text-sm font-extrabold tracking-wide transition hover:brightness-110 disabled:opacity-50 ${gradientButton}`}
                  >
                    {saving ? (
                      <LoaderCircle className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    Save childcare arrangement
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const arrangement = plan.childcare_arrangement;

                      setChildcare({
                        primary_caregiver: arrangement?.primary_caregiver ?? "",
                        backup_plan: arrangement?.backup_plan ?? "",
                        commute_notes: arrangement?.commute_notes ?? "",
                      });

                      setEditingChildcare(false);
                    }}
                    className="rounded-lg border border-[#d3eaf0] bg-white px-5 py-3 text-sm font-bold text-[#626569] hover:bg-[#e6f5f8]"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : plan.childcare_arrangement ? (
              <div className="mt-6 grid gap-4 md:grid-cols-3">
                <div className="min-w-0 rounded-2xl bg-[#e6f5f8] p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-[#1a77ab]">
                    Primary caregiver
                  </p>
                  <p className="mt-2 break-words text-sm font-semibold text-[#2a2f33]">
                    {plan.childcare_arrangement.primary_caregiver}
                  </p>
                </div>

                <div className="min-w-0 rounded-2xl bg-[#e6f5f8] p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-[#1a77ab]">
                    Backup plan
                  </p>
                  <p className="mt-2 whitespace-pre-wrap break-words text-sm text-[#2a2f33]">
                    {plan.childcare_arrangement.backup_plan}
                  </p>
                </div>

                <div className="min-w-0 rounded-2xl bg-[#e6f5f8] p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-[#1a77ab]">
                    Commute and logistics
                  </p>
                  <p className="mt-2 whitespace-pre-wrap break-words text-sm text-[#2a2f33]">
                    {plan.childcare_arrangement.commute_notes}
                  </p>
                </div>
              </div>
            ) : (
              <div className="mt-6 rounded-2xl border border-dashed border-[#7fd3e3] bg-[#e6f5f8]/60 p-6 text-center">
                <Clock3 className="mx-auto h-8 w-8 text-[#3cc3dd]" />
                <p className="mt-3 text-sm font-bold text-[#626569]">
                  No childcare arrangement saved yet.
                </p>
                <p className="mt-1 text-sm text-[#626569]">
                  Add your arrangements to make your return-to-work plan more
                  practical.
                </p>
              </div>
            )}
          </section>

          {/* Footer bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white/70 p-4 text-sm text-[#626569] ring-1 ring-[#0d5694]/5">
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-[#3cc3dd]" />
              Your changes are saved through your MamaRise account.
            </div>

            <button
              type="button"
              onClick={loadPlan}
              className="inline-flex items-center gap-2 font-bold text-[#0d5694] transition hover:text-[#3cc3dd]"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh plan
            </button>
          </div>
        </>
      )}
    </div>
  );
}
