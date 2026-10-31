import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";

import { useFeatureAccess } from "../../hooks/useFeatureAccess";

import {
  getAdvancedWellbeingInsights,
  type AdvancedWellbeingInsights,
  type InsightsPeriod,
} from "../../services/wellbeingService";

import {
  Activity,
  ArrowRight,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Heart,
  HeartPulse,
  History,
  Leaf,
  LoaderCircle,
  MessageCircleHeart,
  Moon,
  Pause,
  Play,
  RefreshCw,
  RotateCcw,
  Sparkles,
  Wind,
} from "lucide-react";

import {
  createCheckin,
  getBreathingExercise,
  getCheckinHistory,
  getTodayCheckin,
  getWellbeingSummary,
  type BreathingExercise,
  type CheckinHistoryResponse,
  type TodayCheckinResponse,
  type WellbeingSummary,
} from "../../services/wellbeingService";

/*
  Palette (shared with the landing page, auth page, dashboard and layout):
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

const moodOptions = [
  { value: 1, label: "Very low" },
  { value: 2, label: "Low" },
  { value: 3, label: "Okay" },
  { value: 4, label: "Good" },
  { value: 5, label: "Very good" },
];

const stressOptions = [
  { value: 1, label: "Very relaxed" },
  { value: 2, label: "Relaxed" },
  { value: 3, label: "Moderate" },
  { value: 4, label: "Stressed" },
  { value: 5, label: "Very stressed" },
];

function formatDate(date: string) {
  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return date;
  }

  return new Intl.DateTimeFormat("en-KE", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(parsedDate);
}

function formatTime(date: string) {
  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("en-KE", {
    hour: "numeric",
    minute: "2-digit",
  }).format(parsedDate);
}

function formatDuration(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
}

function MetricCard({
  title,
  value,
  description,
  icon: Icon,
}: {
  title: string;
  value: string;
  description: string;
  icon: typeof Heart;
}) {
  return (
    <div className={card}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-[#626569]">{title}</span>

        <div className={`rounded-xl p-2 ${gradientSquare}`}>
          <Icon size={20} />
        </div>
      </div>

      <p className="mt-4 text-2xl font-extrabold text-[#2a2f33]">{value}</p>

      <p className="mt-1 text-xs text-[#626569]">{description}</p>
    </div>
  );
}

function ScoreSelector({
  title,
  description,
  options,
  value,
  onChange,
}: {
  title: string;
  description: string;
  options: { value: number; label: string }[];
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div>
      <div className="mb-4">
        <h3 className="font-extrabold text-[#626569]">{title}</h3>
        <p className="mt-1 text-sm text-[#626569]">{description}</p>
      </div>

      <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
        {options.map((option) => {
          const selected = value === option.value;

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              aria-pressed={selected}
              className={`flex min-h-16 min-w-0 flex-col items-center justify-center gap-1 rounded-xl border p-1.5 transition sm:p-2 ${
                selected
                  ? `border-transparent ${gradientButton}`
                  : "border-[#d3eaf0] bg-[#f3fafc] text-[#626569] hover:border-[#3cc3dd] hover:bg-[#e6f5f8]"
              }`}
            >
              <span className="text-lg font-extrabold">{option.value}</span>

              <span className="break-words text-center text-[10px] leading-tight sm:text-xs">
                {option.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function WellbeingPage() {
  // Keep period state above callbacks that depend on it.
  const [selectedPeriod, setSelectedPeriod] = useState(7);
  const [historyPage, setHistoryPage] = useState(1);

  const navigate = useNavigate();

  const {
    hasAccess: hasAdvancedInsightsAccess,
    isLoading: isEntitlementsLoading,
    error: entitlementError,
    refreshEntitlements,
  } = useFeatureAccess("advanced_wellbeing_insights");

  const [advancedInsights, setAdvancedInsights] =
    useState<AdvancedWellbeingInsights | null>(null);

  const [isInsightsLoading, setIsInsightsLoading] = useState(false);
  const [insightsError, setInsightsError] = useState("");

  const [today, setToday] = useState<TodayCheckinResponse | null>(null);
  const [summary, setSummary] = useState<WellbeingSummary | null>(null);
  const [history, setHistory] = useState<CheckinHistoryResponse | null>(null);
  const [exercise, setExercise] = useState<BreathingExercise | null>(null);

  const [moodScore, setMoodScore] = useState(3);
  const [stressScore, setStressScore] = useState(3);
  const [sleepHours, setSleepHours] = useState("");
  const [note, setNote] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [suggestBreathing, setSuggestBreathing] = useState(false);

  const [isBreathing, setIsBreathing] = useState(false);
  const [breathingStep, setBreathingStep] = useState(0);
  const [secondsRemaining, setSecondsRemaining] = useState(0);
  const [completedCycles, setCompletedCycles] = useState(0);

  // Load advanced insights only when the user has active Premium access.
  const loadAdvancedInsights = useCallback(async () => {
    if (!hasAdvancedInsightsAccess) {
      setAdvancedInsights(null);
      return;
    }

    setIsInsightsLoading(true);
    setInsightsError("");

    try {
      const result = await getAdvancedWellbeingInsights(
        selectedPeriod as InsightsPeriod,
      );

      setAdvancedInsights(result);
    } catch (error) {
      setInsightsError(
        error instanceof Error
          ? error.message
          : "Unable to load your advanced wellbeing insights.",
      );
    } finally {
      setIsInsightsLoading(false);
    }
  }, [hasAdvancedInsightsAccess, selectedPeriod]);

  useEffect(() => {
    if (isEntitlementsLoading || !hasAdvancedInsightsAccess) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      void loadAdvancedInsights();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [isEntitlementsLoading, hasAdvancedInsightsAccess, loadAdvancedInsights]);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const [todayData, summaryData, historyData, exerciseData] =
        await Promise.all([
          getTodayCheckin(),
          getWellbeingSummary(selectedPeriod),
          getCheckinHistory(historyPage, 5),
          getBreathingExercise(),
        ]);

      setToday(todayData);
      setSummary(summaryData);
      setHistory(historyData);
      setExercise(exerciseData);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to load your wellbeing information.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [selectedPeriod, historyPage]);

  useEffect(() => {
    void Promise.resolve().then(() => {
      loadData();
    });
  }, [loadData]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setFormError("");
    setSuccessMessage("");
    setSuggestBreathing(false);

    if (today?.has_checked_in_today) {
      setFormError("You have already completed today's check-in.");
      return;
    }

    if (!Number.isInteger(moodScore) || moodScore < 1 || moodScore > 5) {
      setFormError("Please select a valid mood score.");
      return;
    }

    if (!Number.isInteger(stressScore) || stressScore < 1 || stressScore > 5) {
      setFormError("Please select a valid stress score.");
      return;
    }

    if (sleepHours.trim() !== "") {
      const hours = Number(sleepHours);

      if (!Number.isFinite(hours) || hours < 0 || hours > 24) {
        setFormError("Sleep hours must be between 0 and 24.");
        return;
      }
    }

    if (note.length > 1000) {
      setFormError("Your note cannot exceed 1,000 characters.");
      return;
    }

    const payload = {
      mood_score: moodScore,
      stress_score: stressScore,
      ...(sleepHours.trim() !== "" ? { sleep_hours: Number(sleepHours) } : {}),
      ...(note.trim() ? { note: note.trim() } : {}),
    };

    setIsSubmitting(true);

    try {
      const result = await createCheckin(payload);

      setSuccessMessage("Your wellbeing check-in has been saved.");
      setSuggestBreathing(result.suggest_breathing_exercise);

      setNote("");
      setSleepHours("");

      await loadData();
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : "Unable to save your check-in. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  function startBreathing() {
    if (!exercise || exercise.steps.length === 0) {
      return;
    }

    setBreathingStep(0);
    setCompletedCycles(0);
    setSecondsRemaining(exercise.steps[0].seconds);
    setIsBreathing(true);
  }

  function resetBreathing() {
    setIsBreathing(false);
    setBreathingStep(0);
    setCompletedCycles(0);
    setSecondsRemaining(0);
  }

  useEffect(() => {
    if (!isBreathing || !exercise || exercise.steps.length === 0) {
      return;
    }

    const timer = window.setInterval(() => {
      setSecondsRemaining((current) => {
        if (current > 1) {
          return current - 1;
        }

        const nextStep = breathingStep + 1;

        if (nextStep >= exercise.steps.length) {
          const nextCycle = completedCycles + 1;

          if (nextCycle >= exercise.repeat) {
            setIsBreathing(false);
            setCompletedCycles(exercise.repeat);
            return 0;
          }

          setCompletedCycles(nextCycle);
          setBreathingStep(0);
          return exercise.steps[0].seconds;
        }

        setBreathingStep(nextStep);
        return exercise.steps[nextStep].seconds;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [isBreathing, exercise, breathingStep, completedCycles]);

  const averageMood = summary?.average_mood;
  const averageStress = summary?.average_stress;
  const averageSleep = summary?.average_sleep_hours;

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4">
        <LoaderCircle size={38} className="animate-spin text-[#3cc3dd]" />

        <p className="text-sm text-[#626569]">
          Loading your wellbeing space...
        </p>
      </div>
    );
  }

  if (errorMessage && !today && !summary && !history && !exercise) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className={`${card} w-full max-w-md p-8 text-center`}>
          <div
            className={`mx-auto flex h-14 w-14 items-center justify-center rounded-2xl ${gradientSquare}`}
          >
            <HeartPulse size={27} />
          </div>

          <h2 className="mt-5 text-lg font-extrabold text-[#626569]">
            We couldn't load your wellbeing information
          </h2>

          <p className="mt-2 text-sm text-[#626569]">{errorMessage}</p>

          <button
            onClick={loadData}
            className={`mt-6 inline-flex items-center gap-2 rounded-lg px-5 py-3 text-sm font-bold transition hover:brightness-110 ${gradientButton}`}
          >
            <RefreshCw size={16} />
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10">
      {/* Page heading */}
      <section>
        <div className="flex items-center gap-2 text-[#3cc3dd]">
          <HeartPulse size={19} />
          <span className="text-sm font-semibold">
            Your personal wellbeing space
          </span>
        </div>

        <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-[#626569] sm:text-4xl">
          Your wellbeing
        </h1>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-[#626569]">
          Take a moment for yourself. Your wellbeing matters just as much as
          everything else you're taking care of.
        </p>
      </section>

      {errorMessage && (
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm text-amber-800">{errorMessage}</p>

          <button
            onClick={loadData}
            className="shrink-0 text-sm font-bold text-amber-800"
          >
            Retry
          </button>
        </div>
      )}

      {/* Check-in status */}
      {today?.has_checked_in_today ? (
        <section className={`${card} p-5 sm:p-6`}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${gradientSquare}`}
            >
              <CheckCircle2 size={25} />
            </div>

            <div className="flex-1">
              <h2 className="font-extrabold text-[#626569]">
                You've checked in today.
              </h2>

              <p className="mt-1 text-sm leading-6 text-[#626569]">
                Thank you for taking a moment to look after yourself. Your
                check-in has been recorded.
              </p>
            </div>

            <span className="inline-flex w-fit items-center gap-2 rounded-full bg-[#e6f5f8] px-4 py-2 text-xs font-bold text-[#0d5694]">
              <CheckCircle2 size={15} />
              Completed
            </span>
          </div>
        </section>
      ) : (
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#3cc3dd] via-[#1a77ab] to-[#0d5694] p-5 text-white shadow-xl shadow-[#0d5694]/15 sm:p-6">
          <div className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full bg-white/10" />
          <div className="pointer-events-none absolute bottom-4 right-10 hidden h-7 w-7 rotate-12 rounded-lg bg-white/25 sm:block" />

          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/25">
              <Heart size={25} />
            </div>

            <div className="flex-1">
              <h2 className="text-lg font-extrabold">
                How are you feeling today?
              </h2>

              <p className="mt-1 text-sm leading-6 text-white/90">
                A few moments of reflection can help you stay connected with how
                you're doing.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Check-in form */}
      {!today?.has_checked_in_today && (
        <section className={`${card} sm:p-8`}>
          <div className="mb-7">
            <h2 className="text-xl font-extrabold text-[#626569]">
              Daily wellbeing check-in
            </h2>

            <p className="mt-2 text-sm leading-6 text-[#626569]">
              There are no right or wrong answers. Be honest about how you're
              feeling.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <ScoreSelector
              title="How has your mood been?"
              description="Select the option that best describes your mood."
              options={moodOptions}
              value={moodScore}
              onChange={setMoodScore}
            />

            <div className="border-t border-[#e6f5f8]" />

            <ScoreSelector
              title="How stressed have you felt?"
              description="Choose the level that best represents your stress."
              options={stressOptions}
              value={stressScore}
              onChange={setStressScore}
            />

            <div className="border-t border-[#e6f5f8]" />

            <div>
              <label
                htmlFor="sleepHours"
                className="font-extrabold text-[#626569]"
              >
                How many hours did you sleep?
              </label>

              <p className="mt-1 text-sm text-[#626569]">
                This is optional. You can enter a value between 0 and 24.
              </p>

              <div className="relative mt-3 max-w-xs">
                <Moon
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[#0d5694]"
                />

                <input
                  id="sleepHours"
                  type="number"
                  min="0"
                  max="24"
                  step="0.5"
                  value={sleepHours}
                  onChange={(event) => setSleepHours(event.target.value)}
                  placeholder="e.g. 7.5"
                  className={`${fieldClass} py-3 pl-10 pr-14`}
                />

                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-[#626569]">
                  hours
                </span>
              </div>
            </div>

            <div className="border-t border-[#e6f5f8]" />

            <div>
              <label
                htmlFor="wellbeingNote"
                className="font-extrabold text-[#626569]"
              >
                Anything you'd like to share?
              </label>

              <p className="mt-1 text-sm text-[#626569]">
                Write down what's on your mind. This is optional.
              </p>

              <textarea
                id="wellbeingNote"
                rows={4}
                maxLength={1000}
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder="Today I'm feeling..."
                className={`${fieldClass} mt-3 resize-y p-4`}
              />

              <p className="mt-1 text-right text-xs text-[#626569]">
                {note.length}/1000 characters
              </p>
            </div>

            {formError && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                {formError}
              </div>
            )}

            {successMessage && (
              <div className="flex items-center gap-2 rounded-xl bg-[#e6f5f8] p-4 text-sm font-semibold text-[#0d5694]">
                <CheckCircle2 size={18} />
                {successMessage}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className={`inline-flex w-full items-center justify-center gap-2 rounded-lg px-6 py-3.5 text-sm font-extrabold tracking-wide transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto ${gradientButton}`}
            >
              {isSubmitting ? (
                <>
                  <LoaderCircle size={18} className="animate-spin" />
                  Saving check-in...
                </>
              ) : (
                <>
                  Save my check-in
                  <ArrowRight size={17} />
                </>
              )}
            </button>
          </form>
        </section>
      )}

      {/* Submission feedback */}
      {successMessage && (
        <section className={card}>
          <div className="flex items-start gap-3">
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${gradientSquare}`}
            >
              <CheckCircle2 size={21} />
            </div>

            <div>
              <h3 className="font-extrabold text-[#0d5694]">
                Check-in saved successfully
              </h3>

              <p className="mt-1 text-sm leading-6 text-[#626569]">
                Thank you for taking time for yourself today.
              </p>
            </div>
          </div>
        </section>
      )}

      {suggestBreathing && (
        <section className={card}>
          <div className="flex items-start gap-3">
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${gradientSquare}`}
            >
              <Wind size={21} />
            </div>

            <div>
              <h3 className="font-extrabold text-[#626569]">
                Consider taking a breathing break
              </h3>

              <p className="mt-1 text-sm leading-6 text-[#626569]">
                Your check-in suggests that a breathing exercise may be helpful.
                You can try the guided exercise below whenever you're ready.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Wellbeing summary */}
      <section>
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <div className="flex items-center gap-2 text-[#3cc3dd]">
              <Activity size={18} />
              <span className="text-sm font-semibold">
                Your wellbeing overview
              </span>
            </div>

            <h2 className="mt-2 text-xl font-extrabold text-[#626569]">
              Your recent patterns
            </h2>

            <p className="mt-1 text-sm text-[#626569]">
              A summary of your recorded check-ins.
            </p>
          </div>

          <select
            value={selectedPeriod}
            onChange={(event) => setSelectedPeriod(Number(event.target.value))}
            className="w-full rounded-lg border border-[#d3eaf0] bg-white px-4 py-2.5 text-sm font-semibold text-[#626569] outline-none focus:border-[#3cc3dd] focus:ring-4 focus:ring-[#3cc3dd]/20 sm:w-auto"
            aria-label="Select wellbeing summary period"
          >
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
          </select>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            title="Check-ins"
            value={String(summary?.checkin_count ?? 0)}
            description={`Recorded in the last ${summary?.period_days ?? selectedPeriod} days`}
            icon={History}
          />

          <MetricCard
            title="Average mood"
            value={
              averageMood !== null && averageMood !== undefined
                ? `${averageMood.toFixed(1)} / 5`
                : "No data"
            }
            description="Your recorded mood average"
            icon={Heart}
          />

          <MetricCard
            title="Average stress"
            value={
              averageStress !== null && averageStress !== undefined
                ? `${averageStress.toFixed(1)} / 5`
                : "No data"
            }
            description="Your recorded stress average"
            icon={Activity}
          />

          <MetricCard
            title="Average sleep"
            value={
              averageSleep !== null && averageSleep !== undefined
                ? `${averageSleep.toFixed(1)} hrs`
                : "No data"
            }
            description="Your recorded sleep average"
            icon={Moon}
          />
        </div>

        {summary?.checkin_count === 0 && (
          <div className="mt-4 rounded-2xl bg-white/70 p-5 text-center ring-1 ring-[#0d5694]/5">
            <p className="text-sm text-[#626569]">
              Your wellbeing trends will appear here as you complete check-ins.
            </p>
          </div>
        )}
      </section>

      {/* Advanced wellbeing insights */}
      <section className={card}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-cyan-600" />
              <h2 className="text-lg font-semibold text-slate-900">
                Advanced wellbeing insights
              </h2>
            </div>
            <p className="mt-1 text-sm text-slate-500">
              Understand patterns in your mood, stress, sleep, and check-in
              consistency.
            </p>
          </div>
        </div>

        {isEntitlementsLoading ? (
          <div className="mt-6 flex items-center gap-3 text-sm text-slate-500">
            <LoaderCircle className="h-5 w-5 animate-spin" />
            Checking your feature access...
          </div>
        ) : entitlementError ? (
          <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm text-amber-800">
              We couldn't verify your Premium access.
            </p>
            <button
              type="button"
              onClick={() => void refreshEntitlements()}
              className="mt-3 text-sm font-semibold text-amber-900 underline"
            >
              Try again
            </button>
          </div>
        ) : !hasAdvancedInsightsAccess ? (
          <div className="mt-5 rounded-xl border border-cyan-100 bg-cyan-50/70 p-5">
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-white p-2">
                <Sparkles className="h-6 w-6 text-cyan-600" />
              </div>

              <div className="flex-1">
                <span className="text-xs font-semibold uppercase tracking-wide text-cyan-700">
                  Mother Premium
                </span>

                <h3 className="mt-1 font-semibold text-slate-900">
                  Discover more about your wellbeing patterns
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Get detailed wellbeing averages, consistency tracking, trend
                  analysis, and observations based on your check-ins.
                </p>

                <button
                  type="button"
                  onClick={() => navigate("/billing")}
                  className="inline-flex h-12 items-center rounded-full bg-white/90 pr-6 text-sm font-bold text-[#626569] transition hover:bg-white"
                >
                  <span className="mr-3 flex aspect-square h-full items-center justify-center rounded-full border-2 border-[#3cc3dd] bg-[#e6f5f8] text-[#3cc3dd]">
                    <Sparkles size={18} />
                  </span>
                  Explore Premium
                </button>
              </div>
            </div>
          </div>
        ) : isInsightsLoading ? (
          <div className="mt-6 flex items-center gap-3 text-sm text-slate-500">
            <LoaderCircle className="h-5 w-5 animate-spin" />
            Analysing your wellbeing check-ins...
          </div>
        ) : insightsError ? (
          <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm text-amber-800">{insightsError}</p>
            <button
              type="button"
              onClick={() => void loadAdvancedInsights()}
              className="mt-3 text-sm font-semibold text-amber-900 underline"
            >
              Retry insights
            </button>
          </div>
        ) : !advancedInsights ? (
          <p className="mt-5 text-sm text-slate-500">
            Your insights are currently unavailable. Please try again.
          </p>
        ) : advancedInsights.checkin_count === 0 ? (
          <div className="mt-5 rounded-xl bg-slate-50 p-5">
            <p className="font-medium text-slate-800">
              Not enough check-in data yet
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Keep recording your daily wellbeing check-ins. Your insights will
              appear as more data becomes available.
            </p>
          </div>
        ) : (
          <>
            <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <MetricCard
                icon={Activity}
                title="Total check-ins"
                value={String(advancedInsights.checkin_count)}
                description={`Across the last ${advancedInsights.period_days} days`}
              />

              <MetricCard
                icon={CheckCircle2}
                title="Consistency"
                value={`${advancedInsights.consistency_percentage}%`}
                description={`${advancedInsights.checkin_days} days with check-ins`}
              />

              <MetricCard
                icon={Heart}
                title="Average mood"
                value={
                  advancedInsights.averages.mood !== null
                    ? `${advancedInsights.averages.mood}/5`
                    : "Not enough data"
                }
                description="Based on recorded mood scores"
              />

              <MetricCard
                icon={Moon}
                title="Average sleep"
                value={
                  advancedInsights.averages.sleep_hours !== null
                    ? `${advancedInsights.averages.sleep_hours} hrs`
                    : "Not enough data"
                }
                description="Based on recorded sleep hours"
              />
            </div>

            <div className="mt-6">
              <h3 className="font-semibold text-slate-900">Wellbeing trends</h3>

              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                {[
                  ["Mood", advancedInsights.trends.mood.direction],
                  ["Stress", advancedInsights.trends.stress.direction],
                  ["Sleep", advancedInsights.trends.sleep.direction],
                ].map(([label, direction]) => (
                  <div
                    key={label}
                    className="rounded-xl border border-slate-200 p-4"
                  >
                    <p className="text-sm text-slate-500">{label}</p>
                    <p className="mt-2 font-semibold capitalize text-slate-800">
                      {direction.replaceAll("_", " ")}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6">
              <h3 className="font-semibold text-slate-900">
                Personal observations
              </h3>

              {advancedInsights.observations.length > 0 ? (
                <ul className="mt-3 space-y-3">
                  {advancedInsights.observations.map((observation, index) => (
                    <li
                      key={index}
                      className="flex gap-3 rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-700"
                    >
                      <Sparkles className="mt-1 h-4 w-4 shrink-0 text-cyan-600" />
                      {observation}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-slate-500">
                  More check-ins are needed before we can identify useful
                  patterns.
                </p>
              )}
            </div>

            <p className="mt-5 border-t border-slate-100 pt-4 text-xs leading-5 text-slate-500">
              {advancedInsights.disclaimer}
            </p>
          </>
        )}
      </section>

      {/* Check-in history */}
      <section className={card}>
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center gap-2 text-[#3cc3dd]">
              <History size={18} />
              <span className="text-sm font-semibold">Your journey</span>
            </div>

            <h2 className="mt-2 text-xl font-extrabold text-[#626569]">
              Check-in history
            </h2>

            <p className="mt-1 text-sm text-[#626569]">
              Look back at your previous wellbeing check-ins.
            </p>
          </div>

          <span className="text-sm font-semibold text-[#0d5694]">
            {history?.total ?? 0} total check-ins
          </span>
        </div>

        {!history || history.items.length === 0 ? (
          <div className="mt-6 rounded-2xl bg-[#e6f5f8] p-8 text-center">
            <History size={30} className="mx-auto text-[#0d5694]" />

            <p className="mt-3 font-bold text-[#626569]">
              No check-ins recorded yet
            </p>

            <p className="mt-1 text-sm text-[#626569]">
              Your previous check-ins will appear here.
            </p>
          </div>
        ) : (
          <>
            <div className="mt-6 space-y-3">
              {history.items.map((item) => (
                <div key={item.id} className="rounded-2xl bg-[#e6f5f8] p-4">
                  <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                    <div>
                      <p className="font-extrabold text-[#2a2f33]">
                        {formatDate(item.created_at)}
                      </p>

                      <p className="mt-1 text-xs text-[#626569]">
                        {formatTime(item.created_at)}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full bg-white px-3 py-1.5 text-xs font-bold text-[#0d5694]">
                        Mood: {item.mood_score}/5
                      </span>

                      <span className="rounded-full bg-white px-3 py-1.5 text-xs font-bold text-[#1a77ab]">
                        Stress: {item.stress_score}/5
                      </span>

                      {item.sleep_hours !== null &&
                        item.sleep_hours !== undefined && (
                          <span className="rounded-full bg-white px-3 py-1.5 text-xs font-bold text-[#0b3f78]">
                            Sleep: {item.sleep_hours} hrs
                          </span>
                        )}
                    </div>
                  </div>

                  {item.note && (
                    <p className="mt-3 border-t border-white pt-3 text-sm leading-6 text-[#626569]">
                      {item.note}
                    </p>
                  )}
                </div>
              ))}
            </div>

            {history.total_pages > 1 && (
              <div className="mt-6 flex items-center justify-between gap-3 border-t border-[#e6f5f8] pt-5">
                <p className="text-xs text-[#626569]">
                  Page {history.page} of {history.total_pages}
                </p>

                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={history.page <= 1}
                    onClick={() => setHistoryPage((page) => page - 1)}
                    className="inline-flex items-center gap-1 rounded-lg border border-[#d3eaf0] bg-white px-3 py-2 text-sm font-semibold text-[#0d5694] transition hover:bg-[#e6f5f8] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronLeft size={16} />
                    Previous
                  </button>

                  <button
                    type="button"
                    disabled={history.page >= history.total_pages}
                    onClick={() => setHistoryPage((page) => page + 1)}
                    className="inline-flex items-center gap-1 rounded-lg border border-[#d3eaf0] bg-white px-3 py-2 text-sm font-semibold text-[#0d5694] transition hover:bg-[#e6f5f8] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Next
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </section>

      {/* Guided breathing exercise */}
      <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#3cc3dd] via-[#1a77ab] to-[#0d5694] p-6 text-white shadow-xl shadow-[#0d5694]/15 sm:p-8">
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute -bottom-24 left-1/3 h-56 w-56 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute right-10 top-6 hidden h-10 w-10 rotate-12 rounded-xl bg-white/25 sm:block" />

        <div className="relative grid gap-8 lg:grid-cols-2 lg:items-center">
          <div>
            <div className="flex items-center gap-2 text-white/85">
              <Wind size={19} />
              <span className="text-sm font-semibold">
                Take a moment to breathe
              </span>
            </div>

            <h2 className="mt-3 text-2xl font-extrabold sm:text-3xl">
              {exercise?.title ?? "Guided breathing"}
            </h2>

            <p className="mt-3 max-w-lg text-sm leading-6 text-white/90">
              Give yourself a little space to slow down. Follow the instructions
              and breathe at a comfortable pace.
            </p>

            {exercise && (
              <div className="mt-5 flex flex-wrap gap-3 text-xs font-semibold text-[#0d5694]">
                <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-2">
                  <Clock3 size={14} />
                  {formatDuration(exercise.duration_seconds)}
                </span>

                <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-2">
                  <RefreshCw size={14} />
                  {exercise.repeat} cycles
                </span>
              </div>
            )}

            <div className="mt-7 flex flex-wrap gap-3">
              {!isBreathing ? (
                <button
                  type="button"
                  disabled={!exercise || exercise.steps.length === 0}
                  onClick={startBreathing}
                  className="inline-flex h-12 items-center rounded-full bg-white/90 pr-6 text-sm font-bold text-[#626569] transition hover:bg-white disabled:opacity-50"
                >
                  <span className="mr-3 flex aspect-square h-full items-center justify-center rounded-full border-2 border-[#3cc3dd] bg-[#e6f5f8] text-[#3cc3dd]">
                    <Play size={18} />
                  </span>
                  {completedCycles > 0 ? "Start again" : "Begin exercise"}
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setIsBreathing(false)}
                    className="inline-flex items-center gap-2 rounded-lg bg-white px-5 py-3 text-sm font-bold text-[#0d5694] shadow-md transition hover:bg-[#e6f5f8]"
                  >
                    <Pause size={17} />
                    Pause
                  </button>

                  <button
                    type="button"
                    onClick={resetBreathing}
                    className="inline-flex items-center gap-2 rounded-lg border border-white/60 bg-white/10 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/20"
                  >
                    <RotateCcw size={17} />
                    Reset
                  </button>
                </>
              )}

              {!isBreathing && completedCycles === exercise?.repeat && (
                <span className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-3 text-sm font-bold text-[#0d5694]">
                  <CheckCircle2 size={17} />
                  Exercise completed
                </span>
              )}
            </div>
          </div>

          {/* Breathing exercise visual */}
          <div className="flex min-h-64 flex-col items-center justify-center rounded-3xl bg-white p-6 text-center shadow-lg shadow-black/10">
            {isBreathing && exercise ? (
              <>
                <div className="relative flex h-36 w-36 items-center justify-center">
                  <div className="absolute inset-0 animate-pulse rounded-full bg-[#c9ebf3]" />

                  <div
                    className={`relative flex h-28 w-28 items-center justify-center rounded-full ${gradientSquare}`}
                  >
                    <Wind size={38} />
                  </div>
                </div>

                <h3 className="mt-5 text-lg font-extrabold text-[#626569]">
                  {exercise.steps[breathingStep].instruction}
                </h3>

                <p className="mt-2 text-3xl font-extrabold text-[#0d5694]">
                  {secondsRemaining}
                </p>

                <p className="mt-2 text-xs text-[#626569]">
                  Cycle {completedCycles + 1} of {exercise.repeat}
                </p>
              </>
            ) : completedCycles > 0 &&
              exercise &&
              completedCycles >= exercise.repeat ? (
              <>
                <div
                  className={`flex h-20 w-20 items-center justify-center rounded-full ${gradientSquare}`}
                >
                  <CheckCircle2 size={42} />
                </div>

                <h3 className="mt-5 text-lg font-extrabold text-[#626569]">
                  Well done!
                </h3>

                <p className="mt-2 max-w-xs text-sm leading-6 text-[#626569]">
                  You've completed the breathing exercise. Take this moment of
                  calm with you.
                </p>
              </>
            ) : exercise ? (
              <>
                <div
                  className={`flex h-20 w-20 items-center justify-center rounded-full ${gradientSquare}`}
                >
                  <Leaf size={39} />
                </div>

                <h3 className="mt-5 text-lg font-extrabold text-[#626569]">
                  Ready when you are
                </h3>

                <p className="mt-2 max-w-xs text-sm leading-6 text-[#626569]">
                  Find a comfortable position, relax your shoulders and begin
                  when you're ready.
                </p>
              </>
            ) : (
              <p className="text-sm text-[#626569]">
                The breathing exercise is currently unavailable.
              </p>
            )}
          </div>
        </div>

        {exercise && (
          <div className="relative mt-8 border-t border-white/25 pt-6">
            <h3 className="text-sm font-extrabold">Exercise instructions</h3>

            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {exercise.steps.map((step, index) => (
                <div
                  key={`${step.instruction}-${index}`}
                  className={`rounded-2xl p-4 transition ${
                    isBreathing && breathingStep === index
                      ? "bg-white text-[#2a2f33] shadow-lg"
                      : "bg-white/15 text-white"
                  }`}
                >
                  <p
                    className={`text-xs font-bold ${
                      isBreathing && breathingStep === index
                        ? "text-[#3cc3dd]"
                        : "text-white/80"
                    }`}
                  >
                    STEP {index + 1}
                  </p>

                  <p className="mt-2 text-sm font-semibold">
                    {step.instruction}
                  </p>

                  <p
                    className={`mt-2 text-xs ${
                      isBreathing && breathingStep === index
                        ? "text-[#626569]"
                        : "text-white/80"
                    }`}
                  >
                    {step.seconds} seconds
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Closing message */}
      <section className="flex flex-col gap-4 rounded-3xl bg-gradient-to-br from-[#e6f5f8] to-[#c9ebf3] p-6 sm:flex-row sm:items-center">
        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${gradientSquare}`}
        >
          <MessageCircleHeart size={24} />
        </div>

        <div>
          <h3 className="font-extrabold text-[#0d5694]">
            You deserve care, too.
          </h3>

          <p className="mt-1 text-sm leading-6 text-[#626569]">
            Taking care of yourself isn't selfish. Your feelings matter, your
            rest matters, and asking for support is always okay.
          </p>
        </div>

        <div className="ml-auto hidden text-[#3cc3dd] sm:block">
          <Sparkles size={29} />
        </div>
      </section>
    </div>
  );
}
