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

/*
  Palette (same as the landing page, arbitrary values so no theme tokens needed):
  light #e6f5f8   cyan #3cc3dd   soft #7fd3e3   deep #0d5694
  grey text #626569   dark text #2a2f33
*/

const gradientSquare =
  "bg-gradient-to-br from-[#3cc3dd] to-[#0d5694] text-white shadow-lg shadow-[#0d5694]/25";

const card =
  "rounded-3xl bg-white p-6 shadow-lg shadow-[#0d5694]/5 ring-1 ring-[#0d5694]/5";

const linkClass =
  "inline-flex items-center gap-1.5 text-sm font-bold text-[#0d5694] transition hover:text-[#3cc3dd]";

const services = [
  {
    title: "Wellbeing",
    description: "Take a moment to check in with yourself.",
    icon: Heart,
    link: "/wellbeing",
  },
  {
    title: "Appointments",
    description: "Keep track of your health appointments.",
    icon: CalendarDays,
    link: "/appointments",
  },
  {
    title: "Return-to-work planner",
    description: "Prepare for your next professional chapter.",
    icon: Target,
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
    <div className="flex items-center gap-3 rounded-2xl bg-[#e6f5f8] p-4">
      <div
        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
          task.is_completed
            ? "bg-gradient-to-br from-[#3cc3dd] to-[#0d5694] text-white"
            : "border-2 border-[#7fd3e3] bg-white"
        }`}
      >
        {task.is_completed && <CheckCircle2 size={15} />}
      </div>

      <div className="min-w-0 flex-1">
        <p
          className={`text-sm ${
            task.is_completed
              ? "text-[#626569]/70 line-through"
              : "font-semibold text-[#2a2f33]"
          }`}
        >
          {task.title}
        </p>

        <p className="mt-1 text-xs text-[#626569]">
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
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#e6f5f8] border-t-[#3cc3dd]" />

        <p className="text-sm text-[#626569]">Preparing your dashboard...</p>
      </div>
    );
  }

  if (errorMessage || !dashboard) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className={`${card} w-full max-w-md p-8 text-center`}>
          <div
            className={`mx-auto flex h-14 w-14 items-center justify-center rounded-2xl ${gradientSquare}`}
          >
            <HeartHandshake size={27} />
          </div>

          <h2 className="mt-5 text-lg font-extrabold text-[#626569]">
            We couldn't load your dashboard
          </h2>

          <p className="mt-2 text-sm leading-6 text-[#626569]">
            {errorMessage || "Please try again in a moment."}
          </p>

          <button
            onClick={loadDashboard}
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-gradient-to-b from-[#3cc3dd] to-[#0d5694] px-5 py-3 text-sm font-bold text-white shadow-md shadow-[#0d5694]/25 transition hover:brightness-110"
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
          <p className="text-sm font-semibold text-[#3cc3dd]">{formattedDate}</p>

          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-[#626569] sm:text-4xl">
            {dashboard.greeting || `Welcome back, ${user?.full_name || "Mama"}`}
          </h1>

          <p className="mt-2 max-w-xl text-sm leading-6 text-[#626569]">
            Every step counts. Take today at your own pace. We're here to
            support you along the way.
          </p>
        </div>

        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${gradientSquare}`}
        >
          <HeartHandshake size={25} />
        </div>
      </section>

      {/* Postpartum journey */}
      <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#8fd5e4] via-[#3cc3dd] to-[#0d5694] p-6 text-white shadow-xl shadow-[#0d5694]/15 sm:p-8">
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/15" />
        <div className="pointer-events-none absolute -bottom-24 left-1/3 h-56 w-56 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute right-10 top-6 hidden h-10 w-10 rotate-12 rounded-xl bg-white/30 sm:block" />
        <div className="pointer-events-none absolute bottom-8 right-1/3 hidden h-7 w-7 rotate-12 rounded-lg bg-white/30 sm:block" />

        <div className="relative flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
          <div className="max-w-xl">
            <div className="flex items-center gap-2 text-white/85">
              <Baby size={18} />
              <span className="text-sm font-semibold">
                Your motherhood journey
              </span>
            </div>

            <h2 className="mt-4 text-2xl font-extrabold sm:text-3xl">
              You're doing better than you think.
            </h2>

            <p className="mt-3 text-sm leading-6 text-white/90">
              Recovery, motherhood and returning to work are all important
              journeys. Give yourself the grace to grow through each one.
            </p>

            <Link
              to="/wellbeing"
              className="mt-6 inline-flex h-12 items-center rounded-full bg-white/90 pr-6 text-sm font-bold text-[#626569] transition hover:bg-white"
            >
              <span className="mr-4 flex aspect-square h-full items-center justify-center rounded-full border-2 border-[#3cc3dd] bg-[#e6f5f8] text-[#3cc3dd]">
                <ArrowRight size={18} />
              </span>
              Explore your wellbeing
            </Link>
          </div>

          <div className="flex min-w-48 items-center gap-4 rounded-3xl border border-white/30 bg-white/15 p-5 backdrop-blur-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/25">
              <Sparkles size={25} />
            </div>

            <div>
              <p className="text-sm text-white/85">Postpartum journey</p>

              <p className="mt-1 text-2xl font-extrabold">
                {postpartumWeeks !== null && postpartumWeeks !== undefined
                  ? `Week ${postpartumWeeks}`
                  : "Your journey"}
              </p>

              <p className="mt-1 text-xs text-white/85">One day at a time</p>
            </div>
          </div>
        </div>
      </section>

      {/* Overview cards */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <div className={card}>
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-[#626569]">
              Today's wellbeing
            </span>

            <div className={`rounded-xl p-2 ${gradientSquare}`}>
              <Heart size={19} />
            </div>
          </div>

          <p className="mt-4 text-2xl font-extrabold text-[#2a2f33]">
            {dashboard.has_checked_in_today ? "Completed" : "Not yet"}
          </p>

          <p className="mt-1 text-xs text-[#626569]">
            {dashboard.has_checked_in_today
              ? "You've checked in today."
              : "How are you feeling today?"}
          </p>

          <Link to="/wellbeing" className={`mt-4 ${linkClass}`}>
            {dashboard.has_checked_in_today ? "View wellbeing" : "Check in"}
            <ArrowRight size={15} />
          </Link>
        </div>

        <div className={card}>
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-[#626569]">
              Next milestone
            </span>

            <div className={`rounded-xl p-2 ${gradientSquare}`}>
              <CalendarDays size={19} />
            </div>
          </div>

          <p className="mt-4 text-xl font-extrabold text-[#2a2f33]">
            {milestone ? milestone.title : "No upcoming milestone"}
          </p>

          <p className="mt-1 text-xs text-[#626569]">
            {milestone
              ? `Due ${formatDate(milestone.due_date)}`
              : "Your upcoming milestones will appear here."}
          </p>

          <Link to="/appointments" className={`mt-4 ${linkClass}`}>
            View milestones
            <ArrowRight size={15} />
          </Link>
        </div>

        <div className={card}>
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-[#626569]">
              Return to work
            </span>

            <div className={`rounded-xl p-2 ${gradientSquare}`}>
              <TrendingUp size={19} />
            </div>
          </div>

          <p className="mt-4 text-2xl font-extrabold text-[#2a2f33]">
            {returnToWork?.has_plan
              ? returnToWork.weeks_remaining !== null &&
                returnToWork.weeks_remaining !== undefined
                ? `${returnToWork.weeks_remaining} weeks`
                : "Plan active"
              : "No plan yet"}
          </p>

          <p className="mt-1 text-xs text-[#626569]">
            {returnToWork?.has_plan
              ? "Remaining until your planned return."
              : "Start preparing for your return to work."}
          </p>

          <Link to="/planner" className={`mt-4 ${linkClass}`}>
            Open planner
            <ArrowRight size={15} />
          </Link>
        </div>
      </section>

      {/* Main dashboard content */}
      <section className="grid gap-6 xl:grid-cols-3">
        {/* Return-to-work tasks */}
        <div className={`${card} xl:col-span-2`}>
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-extrabold text-[#626569]">
                Your return-to-work tasks
              </h2>

              <p className="mt-1 text-sm text-[#626569]">
                Keep track of the steps in your preparation.
              </p>
            </div>

            <div className={`rounded-xl p-3 ${gradientSquare}`}>
              <CheckCircle2 size={21} />
            </div>
          </div>

          {!returnToWork?.has_plan ? (
            <div className="mt-6 rounded-2xl bg-[#e6f5f8] p-6 text-center">
              <Target size={30} className="mx-auto text-[#0d5694]" />

              <h3 className="mt-3 font-extrabold text-[#626569]">
                Your plan starts here
              </h3>

              <p className="mt-2 text-sm leading-6 text-[#626569]">
                Create a return-to-work plan to organize your preparation,
                childcare and personal wellbeing goals.
              </p>

              <Link
                to="/planner"
                className="mt-5 inline-flex items-center gap-2 rounded-lg bg-gradient-to-b from-[#3cc3dd] to-[#0d5694] px-5 py-3 text-sm font-bold text-white shadow-md shadow-[#0d5694]/25 transition hover:brightness-110"
              >
                Create your plan
                <ArrowRight size={16} />
              </Link>
            </div>
          ) : tasks.length === 0 ? (
            <div className="mt-6 rounded-2xl bg-[#e6f5f8] p-6 text-center">
              <CheckCircle2 size={30} className="mx-auto text-[#0d5694]" />

              <p className="mt-3 text-sm text-[#626569]">
                No tasks to display right now. Visit your planner to manage your
                return-to-work preparation.
              </p>
            </div>
          ) : (
            <>
              <div className="mt-6 space-y-3">
                {tasks.map((task) => (
                  <TaskItem key={task.id} task={task} />
                ))}
              </div>

              <div className="mt-6 flex items-center justify-between border-t border-[#e6f5f8] pt-5">
                <div>
                  <p className="text-sm font-semibold text-[#2a2f33]">
                    {completedTasks} of {tasks.length} tasks completed
                  </p>

                  <p className="mt-1 text-xs text-[#626569]">
                    Based on the tasks shown above.
                  </p>
                </div>

                <span className="text-sm font-extrabold text-[#0d5694]">
                  {Math.round((completedTasks / tasks.length) * 100)}%
                </span>
              </div>

              <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-[#e6f5f8]">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#3cc3dd] to-[#0d5694] transition-all"
                  style={{
                    width: `${(completedTasks / tasks.length) * 100}%`,
                  }}
                />
              </div>
            </>
          )}

          <div className="mt-6 border-t border-[#e6f5f8] pt-5">
            <Link to="/planner" className={linkClass}>
              Open your planner
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>

        {/* Wellbeing summary */}
        <div className="flex flex-col rounded-3xl bg-[#e6f5f8] p-6 ring-1 ring-[#3cc3dd]/20">
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-xl ${gradientSquare}`}
          >
            <MessageCircleHeart size={23} />
          </div>

          <h2 className="mt-5 text-lg font-extrabold text-[#626569]">
            A moment for you
          </h2>

          {checkin ? (
            <>
              <p className="mt-3 text-sm leading-6 text-[#626569]">
                Your latest check-in was recorded at{" "}
                {formatDateTime(checkin.created_at)}.
              </p>

              <div className="mt-5 space-y-3">
                <div className="rounded-2xl bg-white p-4">
                  <p className="text-xs text-[#626569]">Mood score</p>
                  <p className="mt-1 text-xl font-extrabold text-[#0d5694]">
                    {checkin.mood_score}
                  </p>
                </div>

                <div className="rounded-2xl bg-white p-4">
                  <p className="text-xs text-[#626569]">Stress score</p>
                  <p className="mt-1 text-xl font-extrabold text-[#0d5694]">
                    {checkin.stress_score}
                  </p>
                </div>

                <div className="rounded-2xl bg-white p-4">
                  <p className="text-xs text-[#626569]">Sleep</p>
                  <p className="mt-1 text-xl font-extrabold text-[#0d5694]">
                    {checkin.sleep_hours} hours
                  </p>
                </div>
              </div>

              {checkin.note && (
                <div className="mt-4 rounded-2xl bg-white p-4">
                  <p className="text-xs font-semibold text-[#626569]">
                    Your note
                  </p>

                  <p className="mt-2 text-sm leading-6 text-[#2a2f33]">
                    {checkin.note}
                  </p>
                </div>
              )}
            </>
          ) : (
            <p className="mt-3 text-sm leading-6 text-[#626569]">
              Your wellbeing matters too. Take a moment to check in with
              yourself and reflect on how you're feeling.
            </p>
          )}

          <Link to="/wellbeing" className={`mt-auto pt-6 ${linkClass}`}>
            {dashboard.has_checked_in_today
              ? "Explore wellbeing"
              : "Start a check-in"}
            <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* Next milestone */}
      <section className={card}>
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-lg font-extrabold text-[#626569]">
              Your next milestone
            </h2>

            <p className="mt-1 text-sm text-[#626569]">
              Keep track of important moments in your care journey.
            </p>
          </div>

          <Link to="/appointments" className={linkClass}>
            View all milestones
            <ArrowRight size={16} />
          </Link>
        </div>

        {milestone ? (
          <div className="mt-6 flex flex-col gap-4 rounded-2xl bg-[#e6f5f8] p-4 sm:flex-row sm:items-center">
            <div
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${gradientSquare}`}
            >
              <CalendarDays size={21} />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-sm font-extrabold text-[#2a2f33]">
                  {milestone.title}
                </h3>

                <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-[#0d5694]">
                  {getCategoryLabel(milestone.type)}
                </span>
              </div>

              <div className="mt-2 flex flex-wrap gap-3 text-xs text-[#626569]">
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
                <p className="mt-2 text-sm text-[#626569]">{milestone.notes}</p>
              )}
            </div>
          </div>
        ) : (
          <div className="mt-6 rounded-2xl bg-[#e6f5f8] p-6 text-center">
            <CalendarDays size={30} className="mx-auto text-[#0d5694]" />

            <p className="mt-3 text-sm font-bold text-[#626569]">
              No upcoming milestones
            </p>

            <p className="mt-1 text-sm text-[#626569]">
              Any milestones you add will appear here.
            </p>

            <Link to="/appointments" className={`mt-4 ${linkClass}`}>
              Manage milestones
              <ArrowRight size={15} />
            </Link>
          </div>
        )}
      </section>

      {/* Quick access */}
      <section>
        <div className="mb-5">
          <h2 className="text-lg font-extrabold text-[#626569]">
            Explore MamaRise
          </h2>

          <p className="mt-1 text-sm text-[#626569]">
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
                className={`group ${card} p-5 transition hover:-translate-y-1 hover:shadow-xl hover:shadow-[#0d5694]/10`}
              >
                <div className="flex items-center justify-between">
                  <div className={`rounded-xl p-3 ${gradientSquare}`}>
                    <Icon size={22} />
                  </div>

                  <ArrowRight
                    size={18}
                    className="text-[#626569] transition group-hover:translate-x-1 group-hover:text-[#3cc3dd]"
                  />
                </div>

                <h3 className="mt-5 font-extrabold text-[#626569]">
                  {service.title}
                </h3>

                <p className="mt-2 text-sm leading-6 text-[#626569]">
                  {service.description}
                </p>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Closing encouragement */}
      <section className="flex flex-col gap-4 rounded-3xl bg-gradient-to-br from-[#e6f5f8] to-[#c9ebf3] p-6 sm:flex-row sm:items-center">
        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${gradientSquare}`}
        >
          <Leaf size={23} />
        </div>

        <div>
          <h3 className="font-extrabold text-[#0d5694]">
            Progress isn't always a straight line.
          </h3>

          <p className="mt-1 text-sm leading-6 text-[#626569]">
            Whether today is productive, quiet or challenging, remember that you
            deserve care and support every step of the way.
          </p>
        </div>

        <div className="ml-auto hidden text-[#3cc3dd] sm:block">
          <Smile size={30} />
        </div>
      </section>
    </div>
  );
}