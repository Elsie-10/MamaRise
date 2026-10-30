import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Baby,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Heart,
  HeartHandshake,
  Leaf,
  MessageCircleHeart,
  RefreshCw,
  Smile,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";
import {
  getDashboard,
  type DashboardSummary,
  type ReturnToWorkTask,
} from "../../services/dashboardService";

const services = [
  {
    title: "Wellbeing",
    description: "Take a moment to check in with yourself.",
    icon: Heart,
    color: "bg-rose-50 text-rose-500",
    link: "/wellbeing",
  },
  {
    title: "Appointments",
    description: "Keep track of your health appointments.",
    icon: CalendarDays,
    color: "bg-primary-50 text-primary-600",
    link: "/appointments",
  },
  {
    title: "Return-to-work planner",
    description: "Prepare for your next professional chapter.",
    icon: Target,
    color: "bg-amber-50 text-amber-600",
    link: "/planner",
  },
];

function formatDate(date: string) {
  const parsedDate = new Date(`${date}T00:00:00`);

  if (Number.isNaN(parsedDate.getTime())) {
    return date;
  }

  return new Intl.DateTimeFormat("en-KE", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(parsedDate);
}

function formatDateTime(date: string) {
  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return date;
  }

  return new Intl.DateTimeFormat("en-KE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(parsedDate);
}

function getCategoryLabel(category: string) {
  return category
    .replace(/_/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function TaskItem({ task }: { task: ReturnToWorkTask }) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-cream p-4">
      <div
        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
          task.is_completed
            ? "bg-primary-600 text-white"
            : "border-2 border-border bg-white"
        }`}
      >
        {task.is_completed && <CheckCircle2 size={15} />}
      </div>

      <div className="min-w-0 flex-1">
        <p
          className={`text-sm ${
            task.is_completed
              ? "text-muted line-through"
              : "font-medium text-ink"
          }`}
        >
          {task.title}
        </p>

        <p className="mt-1 text-xs text-muted">
          {getCategoryLabel(task.category)}
        </p>
      </div>
    </div>
  );
}

export default function MotherDashboard() {
  const { user } = useAuth();

  const [dashboard, setDashboard] = useState<DashboardSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const formattedDate = new Intl.DateTimeFormat("en-KE", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());

  async function loadDashboard() {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const data = await getDashboard();
      setDashboard(data);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Something went wrong while loading your dashboard.";

      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    let isMounted = true;

    async function fetchDashboard() {
      try {
        const data = await getDashboard();

        if (isMounted) {
          setDashboard(data);
          setErrorMessage("");
        }
      } catch (error) {
        if (isMounted) {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "Something went wrong while loading your dashboard.",
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    fetchDashboard();

    return () => {
      isMounted = false;
    };
  }, []);

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary-100 border-t-primary-600" />

        <p className="text-sm text-muted">Preparing your dashboard...</p>
      </div>
    );
  }

  if (errorMessage || !dashboard) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="w-full max-w-md rounded-2xl border border-border bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-500">
            <HeartHandshake size={27} />
          </div>

          <h2 className="mt-5 text-lg font-semibold text-ink">
            We couldn't load your dashboard
          </h2>

          <p className="mt-2 text-sm leading-6 text-muted">
            {errorMessage || "Please try again in a moment."}
          </p>

          <button
            onClick={loadDashboard}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-primary-700"
          >
            <RefreshCw size={16} />
            Try again
          </button>
        </div>
      </div>
    );
  }

  const postpartumWeeks = dashboard.postpartum_weeks;
  const checkin = dashboard.todays_checkin;
  const milestone = dashboard.next_milestone;
  const returnToWork = dashboard.return_to_work;
  const tasks = returnToWork?.top_tasks ?? [];

  const completedTasks = tasks.filter((task) => task.is_completed).length;

  return (
    <div className="space-y-8 pb-10">
      {/* Welcome section */}
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm font-medium text-muted">{formattedDate}</p>

          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink">
            {dashboard.greeting || `Welcome back, ${user?.full_name || "Mama"}`}
          </h1>

          <p className="mt-2 max-w-xl text-sm leading-6 text-muted">
            Every step counts. Take today at your own pace. We're here to
            support you along the way.
          </p>
        </div>

        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-500">
          <HeartHandshake size={25} />
        </div>
      </section>

      {/* Postpartum journey */}
      <section className="overflow-hidden rounded-3xl bg-primary-700 p-6 text-white shadow-sm sm:p-8">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
          <div className="max-w-xl">
            <div className="flex items-center gap-2 text-primary-100">
              <Baby size={18} />
              <span className="text-sm font-medium">
                Your motherhood journey
              </span>
            </div>

            <h2 className="mt-4 text-2xl font-semibold">
              You're doing better than you think.
            </h2>

            <p className="mt-3 text-sm leading-6 text-primary-100">
              Recovery, motherhood and returning to work are all important
              journeys. Give yourself the grace to grow through each one.
            </p>

            <Link
              to="/wellbeing"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-primary-700 transition hover:bg-primary-50"
            >
              Explore your wellbeing
              <ArrowRight size={16} />
            </Link>
          </div>

          <div className="flex min-w-48 items-center gap-4 rounded-2xl border border-white/15 bg-white/10 p-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/15">
              <Sparkles size={25} />
            </div>

            <div>
              <p className="text-sm text-primary-100">Postpartum journey</p>

              <p className="mt-1 text-2xl font-semibold">
                {postpartumWeeks !== null && postpartumWeeks !== undefined
                  ? `Week ${postpartumWeeks}`
                  : "Your journey"}
              </p>

              <p className="mt-1 text-xs text-primary-100">One day at a time</p>
            </div>
          </div>
        </div>
      </section>

      {/* Overview cards */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted">Today's wellbeing</span>

            <div className="rounded-xl bg-rose-50 p-2 text-rose-500">
              <Heart size={19} />
            </div>
          </div>

          <p className="mt-4 text-2xl font-semibold text-ink">
            {dashboard.has_checked_in_today ? "Completed" : "Not yet"}
          </p>

          <p className="mt-1 text-xs text-muted">
            {dashboard.has_checked_in_today
              ? "You've checked in today."
              : "How are you feeling today?"}
          </p>

          <Link
            to="/wellbeing"
            className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary-600"
          >
            {dashboard.has_checked_in_today ? "View wellbeing" : "Check in"}
            <ArrowRight size={15} />
          </Link>
        </div>

        <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted">Next milestone</span>

            <div className="rounded-xl bg-primary-50 p-2 text-primary-600">
              <CalendarDays size={19} />
            </div>
          </div>

          <p className="mt-4 text-xl font-semibold text-ink">
            {milestone ? milestone.title : "No upcoming milestone"}
          </p>

          <p className="mt-1 text-xs text-muted">
            {milestone
              ? `Due ${formatDate(milestone.due_date)}`
              : "Your upcoming milestones will appear here."}
          </p>

          <Link
            to="/appointments"
            className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary-600"
          >
            View milestones
            <ArrowRight size={15} />
          </Link>
        </div>

        <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted">Return to work</span>

            <div className="rounded-xl bg-amber-50 p-2 text-amber-600">
              <TrendingUp size={19} />
            </div>
          </div>

          <p className="mt-4 text-2xl font-semibold text-ink">
            {returnToWork?.has_plan
              ? returnToWork.weeks_remaining !== null &&
                returnToWork.weeks_remaining !== undefined
                ? `${returnToWork.weeks_remaining} weeks`
                : "Plan active"
              : "No plan yet"}
          </p>

          <p className="mt-1 text-xs text-muted">
            {returnToWork?.has_plan
              ? "Remaining until your planned return."
              : "Start preparing for your return to work."}
          </p>

          <Link
            to="/planner"
            className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary-600"
          >
            Open planner
            <ArrowRight size={15} />
          </Link>
        </div>
      </section>

      {/* Main dashboard content */}
      <section className="grid gap-6 xl:grid-cols-3">
        {/* Return-to-work tasks */}
        <div className="rounded-2xl border border-border bg-white p-6 shadow-sm xl:col-span-2">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-ink">
                Your return-to-work tasks
              </h2>

              <p className="mt-1 text-sm text-muted">
                Keep track of the steps in your preparation.
              </p>
            </div>

            <div className="rounded-xl bg-primary-50 p-3 text-primary-600">
              <CheckCircle2 size={21} />
            </div>
          </div>

          {!returnToWork?.has_plan ? (
            <div className="mt-6 rounded-xl bg-cream p-6 text-center">
              <Target size={30} className="mx-auto text-primary-600" />

              <h3 className="mt-3 font-semibold text-ink">
                Your plan starts here
              </h3>

              <p className="mt-2 text-sm leading-6 text-muted">
                Create a return-to-work plan to organize your preparation,
                childcare and personal wellbeing goals.
              </p>

              <Link
                to="/planner"
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-primary-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-primary-700"
              >
                Create your plan
                <ArrowRight size={16} />
              </Link>
            </div>
          ) : tasks.length === 0 ? (
            <div className="mt-6 rounded-xl bg-cream p-6 text-center">
              <CheckCircle2 size={30} className="mx-auto text-primary-600" />

              <p className="mt-3 text-sm text-muted">
                No tasks to display right now. Visit your planner to manage your
                return-to-work preparation.
              </p>
            </div>
          ) : (
            <>
              <div className="mt-6 space-y-4">
                {tasks.map((task) => (
                  <TaskItem key={task.id} task={task} />
                ))}
              </div>

              <div className="mt-6 flex items-center justify-between border-t border-border pt-5">
                <div>
                  <p className="text-sm font-medium text-ink">
                    {completedTasks} of {tasks.length} tasks completed
                  </p>

                  <p className="mt-1 text-xs text-muted">
                    Based on the tasks shown above.
                  </p>
                </div>

                <span className="text-sm font-semibold text-primary-600">
                  {Math.round((completedTasks / tasks.length) * 100)}%
                </span>
              </div>

              <div className="mt-3 h-2 overflow-hidden rounded-full bg-primary-50">
                <div
                  className="h-full rounded-full bg-primary-500 transition-all"
                  style={{
                    width: `${(completedTasks / tasks.length) * 100}%`,
                  }}
                />
              </div>
            </>
          )}

          <div className="mt-6 border-t border-border pt-5">
            <Link
              to="/planner"
              className="inline-flex items-center gap-2 text-sm font-semibold text-primary-600 hover:text-primary-700"
            >
              Open your planner
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>

        {/* Wellbeing summary */}
        <div className="flex flex-col rounded-2xl border border-rose-100 bg-rose-50 p-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white text-rose-500">
            <MessageCircleHeart size={23} />
          </div>

          <h2 className="mt-5 text-lg font-semibold text-ink">
            A moment for you
          </h2>

          {checkin ? (
            <>
              <p className="mt-3 text-sm leading-6 text-muted">
                Your latest check-in was recorded at{" "}
                {formatDateTime(checkin.created_at)}.
              </p>

              <div className="mt-5 space-y-3">
                <div className="rounded-xl bg-white p-4">
                  <p className="text-xs text-muted">Mood score</p>
                  <p className="mt-1 text-xl font-semibold text-ink">
                    {checkin.mood_score}
                  </p>
                </div>

                <div className="rounded-xl bg-white p-4">
                  <p className="text-xs text-muted">Stress score</p>
                  <p className="mt-1 text-xl font-semibold text-ink">
                    {checkin.stress_score}
                  </p>
                </div>

                <div className="rounded-xl bg-white p-4">
                  <p className="text-xs text-muted">Sleep</p>
                  <p className="mt-1 text-xl font-semibold text-ink">
                    {checkin.sleep_hours} hours
                  </p>
                </div>
              </div>

              {checkin.note && (
                <div className="mt-4 rounded-xl bg-white p-4">
                  <p className="text-xs font-medium text-muted">Your note</p>

                  <p className="mt-2 text-sm leading-6 text-ink">
                    {checkin.note}
                  </p>
                </div>
              )}
            </>
          ) : (
            <p className="mt-3 text-sm leading-6 text-muted">
              Your wellbeing matters too. Take a moment to check in with
              yourself and reflect on how you're feeling.
            </p>
          )}

          <Link
            to="/wellbeing"
            className="mt-auto inline-flex items-center gap-2 pt-6 text-sm font-semibold text-rose-600"
          >
            {dashboard.has_checked_in_today
              ? "Explore wellbeing"
              : "Start a check-in"}
            <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* Next milestone */}
      <section className="rounded-2xl border border-border bg-white p-6 shadow-sm">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-lg font-semibold text-ink">
              Your next milestone
            </h2>

            <p className="mt-1 text-sm text-muted">
              Keep track of important moments in your care journey.
            </p>
          </div>

          <Link
            to="/appointments"
            className="inline-flex items-center gap-2 text-sm font-semibold text-primary-600 hover:text-primary-700"
          >
            View all milestones
            <ArrowRight size={16} />
          </Link>
        </div>

        {milestone ? (
          <div className="mt-6 flex flex-col gap-4 rounded-xl border border-border p-4 sm:flex-row sm:items-center">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
              <CalendarDays size={21} />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-sm font-semibold text-ink">
                  {milestone.title}
                </h3>

                <span className="rounded-full bg-primary-50 px-2 py-1 text-xs text-primary-700">
                  {getCategoryLabel(milestone.type)}
                </span>
              </div>

              <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted">
                <span className="flex items-center gap-1">
                  <CalendarDays size={13} />
                  {formatDate(milestone.due_date)}
                </span>

                <span className="flex items-center gap-1">
                  <Clock3 size={13} />
                  Upcoming
                </span>
              </div>

              {milestone.notes && (
                <p className="mt-2 text-sm text-muted">{milestone.notes}</p>
              )}
            </div>
          </div>
        ) : (
          <div className="mt-6 rounded-xl bg-cream p-6 text-center">
            <CalendarDays size={30} className="mx-auto text-primary-600" />

            <p className="mt-3 text-sm font-medium text-ink">
              No upcoming milestones
            </p>

            <p className="mt-1 text-sm text-muted">
              Any milestones you add will appear here.
            </p>

            <Link
              to="/appointments"
              className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary-600"
            >
              Manage milestones
              <ArrowRight size={15} />
            </Link>
          </div>
        )}
      </section>

      {/* Quick access */}
      <section>
        <div className="mb-5">
          <h2 className="text-lg font-semibold text-ink">Explore MamaRise</h2>

          <p className="mt-1 text-sm text-muted">
            Everything you need, all in one place.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {services.map((service) => {
            const Icon = service.icon;

            return (
              <Link
                key={service.title}
                to={service.link}
                className="group rounded-2xl border border-border bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <div className={`rounded-xl p-3 ${service.color}`}>
                    <Icon size={22} />
                  </div>

                  <ArrowRight
                    size={18}
                    className="text-muted transition group-hover:translate-x-1 group-hover:text-primary-600"
                  />
                </div>

                <h3 className="mt-5 font-semibold text-ink">{service.title}</h3>

                <p className="mt-2 text-sm leading-6 text-muted">
                  {service.description}
                </p>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Closing encouragement */}
      <section className="flex flex-col gap-4 rounded-2xl border border-primary-100 bg-primary-50 p-6 sm:flex-row sm:items-center">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white text-primary-600">
          <Leaf size={23} />
        </div>

        <div>
          <h3 className="font-semibold text-primary-700">
            Progress isn't always a straight line.
          </h3>

          <p className="mt-1 text-sm leading-6 text-primary-700/75">
            Whether today is productive, quiet or challenging, remember that you
            deserve care and support every step of the way.
          </p>
        </div>

        <div className="ml-auto hidden text-primary-600 sm:block">
          <Smile size={30} />
        </div>
      </section>
    </div>
  );
}
