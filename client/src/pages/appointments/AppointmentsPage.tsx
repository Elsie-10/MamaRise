import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";
import {
  Activity,
  Bell,
  CalendarDays,
  Check,
  CheckCircle2,
  Circle,
  Clock3,
  Edit3,
  Plus,
  RefreshCw,
  Stethoscope,
  Trash2,
  X,
} from "lucide-react";

import {
  createMilestone,
  deleteMilestone,
  getMilestones,
  getNotificationPreferences,
  getUpcomingMilestone,
  updateMilestone,
  updateNotificationPreferences,
  type Milestone,
  type MilestoneType,
  type NotificationPreferences,
} from "../../services/appointmentService";

type FilterType = "all" | "pending" | "completed";

interface MilestoneForm {
  title: string;
  type: MilestoneType;
  due_date: string;
  notes: string;
}

const milestoneTypes: {
  value: MilestoneType;
  label: string;
}[] = [
  { value: "pediatric_checkup", label: "Pediatric checkup" },
  { value: "family_planning", label: "Family planning" },
  { value: "postpartum_checkup", label: "Postpartum checkup" },
  { value: "vaccination", label: "Vaccination" },
  { value: "other", label: "Other" },
];

const preferenceOptions: {
  key: keyof Pick<
    NotificationPreferences,
    "daily_wellbeing_nudges" | "vitamin_reminders" | "milestone_reminders"
  >;
  title: string;
  description: string;
}[] = [
  {
    key: "daily_wellbeing_nudges",
    title: "Daily wellbeing nudges",
    description: "Receive reminders to check in on your wellbeing.",
  },
  {
    key: "vitamin_reminders",
    title: "Vitamin reminders",
    description: "Keep track of your daily vitamin routine.",
  },
  {
    key: "milestone_reminders",
    title: "Milestone reminders",
    description: "Stay aware of your upcoming health milestones.",
  },
];

const emptyForm: MilestoneForm = {
  title: "",
  type: "pediatric_checkup",
  due_date: "",
  notes: "",
};

function formatDate(dateString: string): string {
  const date = new Date(`${dateString}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return dateString;
  }

  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

function getTypeLabel(type: MilestoneType): string {
  return milestoneTypes.find((item) => item.value === type)?.label ?? "Other";
}

function AppointmentsPage() {
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [upcoming, setUpcoming] = useState<Milestone | null>(null);
  const [preferences, setPreferences] =
    useState<NotificationPreferences | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [filter, setFilter] = useState<FilterType>("all");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<MilestoneForm>(emptyForm);
  const [saving, setSaving] = useState(false);

  const [actionId, setActionId] = useState<string | null>(null);
  const [preferenceSaving, setPreferenceSaving] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [milestoneData, upcomingData, preferenceData] = await Promise.all([
        getMilestones(true),
        getUpcomingMilestone(),
        getNotificationPreferences(),
      ]);

      setMilestones(milestoneData.items);
      setUpcoming(upcomingData.milestone);
      setPreferences(preferenceData);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load your appointment information.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadData();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadData]);

  const pendingCount = useMemo(
    () => milestones.filter((item) => !item.is_completed).length,
    [milestones],
  );

  const completedCount = useMemo(
    () => milestones.filter((item) => item.is_completed).length,
    [milestones],
  );

  const filteredMilestones = useMemo(() => {
    if (filter === "pending") {
      return milestones.filter((item) => !item.is_completed);
    }

    if (filter === "completed") {
      return milestones.filter((item) => item.is_completed);
    }

    return milestones;
  }, [filter, milestones]);

  function openCreateModal() {
    setEditingId(null);
    setForm(emptyForm);
    setError("");
    setSuccess("");
    setModalOpen(true);
  }

  function openEditModal(milestone: Milestone) {
    setEditingId(milestone.id);
    setForm({
      title: milestone.title,
      type: milestone.type,
      due_date: milestone.due_date,
      notes: milestone.notes ?? "",
    });
    setError("");
    setSuccess("");
    setModalOpen(true);
  }

  function closeModal() {
    if (saving) return;

    setModalOpen(false);
    setEditingId(null);
    setForm(emptyForm);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.title.trim() || !form.due_date) {
      setError("Please provide a title and due date.");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    const payload = {
      title: form.title.trim(),
      type: form.type,
      due_date: form.due_date,
      notes: form.notes.trim() || undefined,
    };

    try {
      if (editingId) {
        await updateMilestone(editingId, payload);
        setSuccess("Milestone updated successfully.");
      } else {
        await createMilestone(payload);
        setSuccess("Milestone added successfully.");
      }

      setModalOpen(false);
      setEditingId(null);
      setForm(emptyForm);

      await loadData();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to save this milestone.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleCompletion(milestone: Milestone) {
    setActionId(milestone.id);
    setError("");
    setSuccess("");

    try {
      await updateMilestone(milestone.id, {
        is_completed: !milestone.is_completed,
      });

      setSuccess(
        milestone.is_completed
          ? "Milestone marked as pending."
          : "Milestone marked as completed.",
      );

      await loadData();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to update this milestone.",
      );
    } finally {
      setActionId(null);
    }
  }

  async function handleDelete(milestone: Milestone) {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${milestone.title}"?`,
    );

    if (!confirmed) return;

    setActionId(milestone.id);
    setError("");
    setSuccess("");

    try {
      await deleteMilestone(milestone.id);
      setSuccess("Milestone deleted successfully.");
      await loadData();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to delete this milestone.",
      );
    } finally {
      setActionId(null);
    }
  }

  async function handlePreferenceToggle(
    key: keyof Pick<
      NotificationPreferences,
      "daily_wellbeing_nudges" | "vitamin_reminders" | "milestone_reminders"
    >,
  ) {
    if (!preferences || preferenceSaving) return;

    setPreferenceSaving(true);
    setError("");
    setSuccess("");

    try {
      const updated = await updateNotificationPreferences({
        [key]: !preferences[key],
      });

      setPreferences(updated);
      setSuccess("Notification preference updated.");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to update notification preferences.",
      );
    } finally {
      setPreferenceSaving(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8 pb-10">
      {/* Page heading */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm font-medium text-[#1a77ab]">
            <CalendarDays size={17} />
            <span>Health planning</span>
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-[#0d5694]">
            Appointments & Milestones
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#626569]">
            Keep track of important health milestones, upcoming checkups,
            vaccinations and your personal reminders.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-[#3cc3dd] to-[#0d5694] px-5 py-3 text-sm font-semibold text-white shadow-md shadow-[#0d5694]/25 transition hover:brightness-105"
        >
          <Plus size={18} />
          Add milestone
        </button>
      </div>

      {/* Feedback messages */}
      {error && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          <Activity size={18} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div
          role="status"
          className="flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700"
        >
          <CheckCircle2 size={18} />
          <span>{success}</span>
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-3xl bg-white p-6 shadow-lg shadow-[#0d5694]/5 ring-1 ring-[#0d5694]/5">
          <div className="flex items-center justify-between">
            <div className="rounded-xl bg-[#e6f5f8] p-3 text-[#1a77ab]">
              <CalendarDays size={22} />
            </div>
            <span className="text-xs font-medium text-[#8a9399]">
              All milestones
            </span>
          </div>

          <p className="mt-5 text-3xl font-bold text-[#0d5694]">
            {milestones.length}
          </p>
          <p className="mt-1 text-sm text-[#626569]">
            Total recorded milestones
          </p>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-lg shadow-[#0d5694]/5 ring-1 ring-[#0d5694]/5">
          <div className="flex items-center justify-between">
            <div className="rounded-xl bg-amber-50 p-3 text-amber-600">
              <Clock3 size={22} />
            </div>
            <span className="text-xs font-medium text-[#8a9399]">Pending</span>
          </div>

          <p className="mt-5 text-3xl font-bold text-[#0d5694]">
            {pendingCount}
          </p>
          <p className="mt-1 text-sm text-[#626569]">Milestones to follow up</p>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-lg shadow-[#0d5694]/5 ring-1 ring-[#0d5694]/5">
          <div className="flex items-center justify-between">
            <div className="rounded-xl bg-green-50 p-3 text-green-600">
              <CheckCircle2 size={22} />
            </div>
            <span className="text-xs font-medium text-[#8a9399]">
              Completed
            </span>
          </div>

          <p className="mt-5 text-3xl font-bold text-[#0d5694]">
            {completedCount}
          </p>
          <p className="mt-1 text-sm text-[#626569]">Milestones completed</p>
        </div>
      </div>

      {/* Upcoming milestone */}
      <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-[#0d5694] to-[#1a77ab] p-6 text-white shadow-lg shadow-[#0d5694]/10 sm:p-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-xl">
            <div className="mb-4 flex items-center gap-2 text-sm font-medium text-white/80">
              <Clock3 size={17} />
              Upcoming milestone
            </div>

            {loading ? (
              <p className="text-white/80">Loading your next milestone...</p>
            ) : upcoming ? (
              <>
                <h2 className="text-2xl font-bold sm:text-3xl">
                  {upcoming.title}
                </h2>

                <p className="mt-2 text-sm text-white/80">
                  {getTypeLabel(upcoming.type)}
                </p>

                <div className="mt-5 inline-flex items-center gap-2 rounded-xl bg-white/15 px-4 py-2 text-sm font-medium">
                  <CalendarDays size={17} />
                  {formatDate(upcoming.due_date)}
                </div>

                {upcoming.notes && (
                  <p className="mt-4 max-w-lg text-sm leading-6 text-white/80">
                    {upcoming.notes}
                  </p>
                )}
              </>
            ) : (
              <>
                <h2 className="text-2xl font-bold">Nothing scheduled yet</h2>
                <p className="mt-2 text-sm leading-6 text-white/80">
                  Add a milestone to keep track of your next important health
                  event.
                </p>
              </>
            )}
          </div>

          <div className="flex h-24 w-24 shrink-0 items-center justify-center self-center rounded-3xl bg-white/15 sm:h-32 sm:w-32">
            <Stethoscope size={54} strokeWidth={1.4} />
          </div>
        </div>
      </section>

      {/* Milestone management */}
      <section className="rounded-3xl bg-white p-6 shadow-lg shadow-[#0d5694]/5 ring-1 ring-[#0d5694]/5 sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-bold text-[#0d5694]">
              Your milestones
            </h2>
            <p className="mt-1 text-sm text-[#626569]">
              Manage your health-related dates and progress.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void loadData()}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#d3eaf0] px-4 py-2.5 text-sm font-medium text-[#1a77ab] transition hover:bg-[#f3fafc] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>

        {/* Filters */}
        <div className="mt-6 flex flex-wrap gap-2 border-b border-[#e6f0f3] pb-5">
          {(
            [
              ["all", "All", milestones.length],
              ["pending", "Pending", pendingCount],
              ["completed", "Completed", completedCount],
            ] as const
          ).map(([value, label, count]) => (
            <button
              key={value}
              type="button"
              onClick={() => setFilter(value)}
              className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                filter === value
                  ? "bg-[#e6f5f8] text-[#0d5694]"
                  : "text-[#626569] hover:bg-[#f3fafc]"
              }`}
            >
              {label}
              <span className="ml-2 text-xs opacity-70">{count}</span>
            </button>
          ))}
        </div>

        {/* Milestone list */}
        <div className="mt-5 space-y-3">
          {loading ? (
            <div className="flex items-center justify-center gap-3 py-12 text-sm text-[#626569]">
              <RefreshCw size={18} className="animate-spin" />
              Loading milestones...
            </div>
          ) : filteredMilestones.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#d3eaf0] bg-[#f8fcfd] px-6 py-12 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#e6f5f8] text-[#1a77ab]">
                <CalendarDays size={26} />
              </div>

              <h3 className="mt-4 font-semibold text-[#0d5694]">
                {filter === "completed"
                  ? "No completed milestones"
                  : filter === "pending"
                    ? "No pending milestones"
                    : "No milestones yet"}
              </h3>

              <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[#626569]">
                {filter === "completed"
                  ? "Completed milestones will appear here."
                  : "Start by adding a health milestone you want to keep track of."}
              </p>

              {filter !== "completed" && (
                <button
                  type="button"
                  onClick={openCreateModal}
                  className="mt-5 inline-flex items-center gap-2 rounded-xl bg-gradient-to-b from-[#3cc3dd] to-[#0d5694] px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-[#0d5694]/20"
                >
                  <Plus size={17} />
                  Add milestone
                </button>
              )}
            </div>
          ) : (
            filteredMilestones.map((milestone) => (
              <article
                key={milestone.id}
                className="flex flex-col gap-4 rounded-2xl border border-[#e6f0f3] p-4 transition hover:border-[#b9e2eb] sm:flex-row sm:items-center sm:justify-between sm:p-5"
              >
                <div className="flex min-w-0 items-start gap-3">
                  <button
                    type="button"
                    onClick={() => void handleCompletion(milestone)}
                    disabled={actionId === milestone.id}
                    aria-label={
                      milestone.is_completed
                        ? "Mark milestone as pending"
                        : "Mark milestone as completed"
                    }
                    className="mt-1 shrink-0 text-[#1a77ab] transition hover:scale-110 disabled:opacity-50"
                  >
                    {milestone.is_completed ? (
                      <CheckCircle2 size={23} className="text-green-600" />
                    ) : (
                      <Circle size={23} />
                    )}
                  </button>

                  <div className="min-w-0">
                    <h3
                      className={`font-semibold ${
                        milestone.is_completed
                          ? "text-[#8a9399] line-through"
                          : "text-[#0d5694]"
                      }`}
                    >
                      {milestone.title}
                    </h3>

                    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#626569]">
                      <span>{getTypeLabel(milestone.type)}</span>
                      <span className="hidden text-[#c3d4d9] sm:inline">·</span>
                      <span className="inline-flex items-center gap-1">
                        <CalendarDays size={13} />
                        {formatDate(milestone.due_date)}
                      </span>
                    </div>

                    {milestone.notes && (
                      <p className="mt-2 break-words text-sm leading-5 text-[#626569]">
                        {milestone.notes}
                      </p>
                    )}

                    <span
                      className={`mt-3 inline-flex rounded-full px-3 py-1 text-xs font-medium ${
                        milestone.is_completed
                          ? "bg-green-50 text-green-700"
                          : "bg-amber-50 text-amber-700"
                      }`}
                    >
                      {milestone.is_completed ? "Completed" : "Pending"}
                    </span>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-2 self-end sm:self-center">
                  <button
                    type="button"
                    onClick={() => openEditModal(milestone)}
                    disabled={actionId === milestone.id}
                    aria-label="Edit milestone"
                    className="rounded-xl border border-[#d3eaf0] p-2.5 text-[#1a77ab] transition hover:bg-[#e6f5f8] disabled:opacity-50"
                  >
                    <Edit3 size={17} />
                  </button>

                  <button
                    type="button"
                    onClick={() => void handleDelete(milestone)}
                    disabled={actionId === milestone.id}
                    aria-label="Delete milestone"
                    className="rounded-xl border border-red-100 p-2.5 text-red-500 transition hover:bg-red-50 disabled:opacity-50"
                  >
                    <Trash2 size={17} />
                  </button>
                </div>
              </article>
            ))
          )}
        </div>
      </section>

      {/* Notification preferences */}
      <section className="rounded-3xl bg-white p-6 shadow-lg shadow-[#0d5694]/5 ring-1 ring-[#0d5694]/5 sm:p-8">
        <div className="flex items-start gap-4">
          <div className="rounded-xl bg-[#e6f5f8] p-3 text-[#1a77ab]">
            <Bell size={23} />
          </div>

          <div>
            <h2 className="text-xl font-bold text-[#0d5694]">
              Notification preferences
            </h2>
            <p className="mt-1 text-sm leading-6 text-[#626569]">
              Choose which reminder preferences you want enabled.
            </p>
          </div>
        </div>

        <div className="mt-6 divide-y divide-[#e6f0f3]">
          {preferences ? (
            preferenceOptions.map((option) => (
              <div
                key={option.key}
                className="flex items-center justify-between gap-4 py-5 first:pt-0 last:pb-0"
              >
                <div>
                  <h3 className="font-semibold text-[#2a2f33]">
                    {option.title}
                  </h3>
                  <p className="mt-1 text-sm leading-5 text-[#626569]">
                    {option.description}
                  </p>
                </div>

                <button
                  type="button"
                  role="switch"
                  aria-checked={preferences[option.key]}
                  aria-label={option.title}
                  disabled={preferenceSaving}
                  onClick={() => void handlePreferenceToggle(option.key)}
                  className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition disabled:cursor-not-allowed disabled:opacity-60 ${
                    preferences[option.key] ? "bg-[#1a77ab]" : "bg-[#cbd5d9]"
                  }`}
                >
                  <span
                    className={`inline-flex h-5 w-5 transform items-center justify-center rounded-full bg-white shadow-sm transition ${
                      preferences[option.key]
                        ? "translate-x-6"
                        : "translate-x-1"
                    }`}
                  >
                    {preferences[option.key] && (
                      <Check size={12} className="text-[#1a77ab]" />
                    )}
                  </span>
                </button>
              </div>
            ))
          ) : (
            <p className="py-6 text-sm text-[#626569]">
              {loading
                ? "Loading notification preferences..."
                : "Notification preferences are currently unavailable."}
            </p>
          )}
        </div>

        <p className="mt-6 border-t border-[#e6f0f3] pt-4 text-xs leading-5 text-[#8a9399]">
          These settings store your reminder preferences. Actual delivery
          depends on the notification functionality supported by the
          application.
        </p>
      </section>

      {/* Create/edit modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-[#102c40]/50 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeModal();
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="milestone-modal-title"
            className="my-auto w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl sm:p-8"
          >
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h2
                  id="milestone-modal-title"
                  className="text-xl font-bold text-[#0d5694]"
                >
                  {editingId ? "Edit milestone" : "Add a milestone"}
                </h2>

                <p className="mt-1 text-sm text-[#626569]">
                  Record an important health-related date.
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                aria-label="Close modal"
                className="rounded-xl p-2 text-[#626569] transition hover:bg-[#f3fafc]"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label
                  htmlFor="milestone-title"
                  className="mb-2 block text-sm font-medium text-[#2a2f33]"
                >
                  Milestone title
                </label>

                <input
                  id="milestone-title"
                  type="text"
                  required
                  maxLength={150}
                  value={form.title}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      title: event.target.value,
                    }))
                  }
                  placeholder="e.g. Postpartum checkup"
                  className="w-full rounded-lg border border-[#d3eaf0] bg-[#f3fafc] px-4 py-3 text-sm text-[#2a2f33] outline-none transition placeholder:text-[#8a9399] focus:border-[#3cc3dd] focus:bg-white focus:ring-4 focus:ring-[#3cc3dd]/20"
                />
              </div>

              <div>
                <label
                  htmlFor="milestone-type"
                  className="mb-2 block text-sm font-medium text-[#2a2f33]"
                >
                  Milestone category
                </label>

                <select
                  id="milestone-type"
                  value={form.type}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      type: event.target.value as MilestoneType,
                    }))
                  }
                  className="w-full rounded-lg border border-[#d3eaf0] bg-[#f3fafc] px-4 py-3 text-sm text-[#2a2f33] outline-none transition focus:border-[#3cc3dd] focus:bg-white focus:ring-4 focus:ring-[#3cc3dd]/20"
                >
                  {milestoneTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="milestone-date"
                  className="mb-2 block text-sm font-medium text-[#2a2f33]"
                >
                  Due date
                </label>

                <input
                  id="milestone-date"
                  type="date"
                  required
                  value={form.due_date}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      due_date: event.target.value,
                    }))
                  }
                  className="w-full rounded-lg border border-[#d3eaf0] bg-[#f3fafc] px-4 py-3 text-sm text-[#2a2f33] outline-none transition focus:border-[#3cc3dd] focus:bg-white focus:ring-4 focus:ring-[#3cc3dd]/20"
                />
              </div>

              <div>
                <label
                  htmlFor="milestone-notes"
                  className="mb-2 block text-sm font-medium text-[#2a2f33]"
                >
                  Notes <span className="text-[#8a9399]">(optional)</span>
                </label>

                <textarea
                  id="milestone-notes"
                  rows={3}
                  maxLength={1000}
                  value={form.notes}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      notes: event.target.value,
                    }))
                  }
                  placeholder="Add any details you want to remember..."
                  className="w-full resize-none rounded-lg border border-[#d3eaf0] bg-[#f3fafc] px-4 py-3 text-sm text-[#2a2f33] outline-none transition placeholder:text-[#8a9399] focus:border-[#3cc3dd] focus:bg-white focus:ring-4 focus:ring-[#3cc3dd]/20"
                />
              </div>

              {error && (
                <p role="alert" className="text-sm text-red-600">
                  {error}
                </p>
              )}

              <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="rounded-xl border border-[#d3eaf0] px-5 py-3 text-sm font-semibold text-[#626569] transition hover:bg-[#f3fafc] disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-[#3cc3dd] to-[#0d5694] px-5 py-3 text-sm font-semibold text-white shadow-md shadow-[#0d5694]/25 transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving && <RefreshCw size={16} className="animate-spin" />}
                  {saving
                    ? "Saving..."
                    : editingId
                      ? "Save changes"
                      : "Add milestone"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AppointmentsPage;
