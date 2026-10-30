import { useCallback, useEffect, useState } from "react";
import {
  CheckCircle2,
  CreditCard,
  Crown,
  RefreshCw,
  ShieldCheck,
  Clock3,
  AlertCircle,
} from "lucide-react";

import {
  getSubscription,
  requestPremiumUpgrade,
  type Subscription,
} from "../../services/billingService";

const card =
  "rounded-3xl bg-white p-6 shadow-lg shadow-[#0d5694]/5 ring-1 ring-[#0d5694]/5";

function formatDate(date: string) {
  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return date;
  }

  return new Intl.DateTimeFormat("en-KE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(parsedDate);
}

function getStatusLabel(status: Subscription["status"]) {
  switch (status) {
    case "active":
      return "Active";
    case "pending_payment":
      return "Pending payment";
    case "cancelled":
      return "Cancelled";
  }
}


export default function BillingPage() {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const loadSubscription = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const data = await getSubscription();
      setSubscription(data);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to load your subscription details.",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadSubscription();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadSubscription]);

  async function handleUpgrade() {
    setIsUpgrading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const result = await requestPremiumUpgrade();

      setSubscription(result.subscription);
      setSuccessMessage(result.message);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to submit your upgrade request.",
      );
    } finally {
      setIsUpgrading(false);
    }
  }

  const isPremium = subscription?.tier === "premium";
  const isActivePremium = isPremium && subscription?.status === "active";
  const isPendingPremium =
    isPremium && subscription?.status === "pending_payment";

  if (isLoading) {
    return (
      <div className={`${card} flex min-h-64 items-center justify-center`}>
        <div className="text-center">
          <RefreshCw
            size={28}
            className="mx-auto animate-spin text-[#0d5694]"
          />
          <p className="mt-3 text-sm text-[#626569]">
            Loading your subscription...
          </p>
        </div>
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className={card}>
        <div className="text-center">
          <AlertCircle size={32} className="mx-auto text-red-500" />
          <h2 className="mt-3 text-lg font-bold text-[#2a2f33]">
            Unable to load billing information
          </h2>
          <p className="mt-2 text-sm text-[#626569]">{errorMessage}</p>

          <button
            type="button"
            onClick={() => void loadSubscription()}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#0d5694] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#1a77ab]"
          >
            <RefreshCw size={16} />
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page heading */}
      <section>
        <p className="text-sm font-semibold text-[#3cc3dd]">
          ACCOUNT MANAGEMENT
        </p>

        <h1 className="mt-2 text-3xl font-bold text-[#2a2f33]">
          Subscription & Billing
        </h1>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-[#626569]">
          Manage your MamaRise subscription and view your current billing
          status.
        </p>
      </section>

      {/* Feedback messages */}
      {errorMessage && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          <AlertCircle size={19} className="mt-0.5 shrink-0" />
          <p>{errorMessage}</p>
        </div>
      )}

      {successMessage && (
        <div
          role="status"
          className="flex items-start gap-3 rounded-2xl border border-green-200 bg-green-50 p-4 text-sm text-green-700"
        >
          <CheckCircle2 size={19} className="mt-0.5 shrink-0" />
          <p>{successMessage}</p>
        </div>
      )}

      {/* Current subscription */}
      <section className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#3cc3dd] to-[#0d5694] p-7 text-white shadow-lg shadow-[#0d5694]/20">
          <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full border-[25px] border-white/10" />

          <div className="relative">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20">
                {isPremium ? <Crown size={25} /> : <CreditCard size={25} />}
              </div>

              <div>
                <p className="text-sm text-white/80">Your current plan</p>
                <h2 className="text-2xl font-bold capitalize">
                  {subscription.tier}
                </h2>
              </div>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <span
                className={`rounded-full px-4 py-1.5 text-xs font-bold ${
                  subscription.status === "active"
                    ? "bg-green-100 text-green-700"
                    : subscription.status === "pending_payment"
                      ? "bg-amber-100 text-amber-700"
                      : "bg-red-100 text-red-700"
                }`}
              >
                {getStatusLabel(subscription.status)}
              </span>

              {isPremium && (
                <span className="rounded-full bg-white/20 px-4 py-1.5 text-xs font-semibold">
                  Premium subscription
                </span>
              )}
            </div>

            <p className="mt-5 text-sm text-white/80">
              Last updated: {formatDate(subscription.updated_at)}
            </p>
          </div>
        </div>

        <div className={`${card} flex flex-col justify-between`}>
          <div>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#e6f5f8] text-[#0d5694]">
              <ShieldCheck size={23} />
            </div>

            <h3 className="mt-4 text-lg font-bold text-[#2a2f33]">
              Subscription overview
            </h3>

            <p className="mt-2 text-sm leading-6 text-[#626569]">
              Your subscription information is retrieved securely from your
              MamaRise account.
            </p>
          </div>

          <div className="mt-6 border-t border-[#e6f5f8] pt-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#626569]">
              Account status
            </p>

            <p className="mt-1 font-bold text-[#0d5694]">
              {getStatusLabel(subscription.status)}
            </p>
          </div>
        </div>
      </section>

      {/* Available plans */}
      <section>
        <div className="mb-5">
          <h2 className="text-xl font-bold text-[#2a2f33]">Available plans</h2>

          <p className="mt-1 text-sm text-[#626569]">
            Choose the subscription option that works for you.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Free plan */}
          <div
            className={`${card} ${!isPremium ? "ring-2 ring-[#3cc3dd]" : ""}`}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-[#2a2f33]">Free</h3>

              {!isPremium && (
                <span className="rounded-full bg-[#e6f5f8] px-3 py-1 text-xs font-bold text-[#0d5694]">
                  Current plan
                </span>
              )}
            </div>

            <p className="mt-3 text-sm leading-6 text-[#626569]">
              The free subscription option for MamaRise users.
            </p>

            <div className="mt-6 flex items-center gap-2 text-sm font-semibold text-green-700">
              <CheckCircle2 size={17} />
              Available
            </div>
          </div>

          {/* Premium plan */}
          <div
            className={`relative overflow-hidden ${card} ${
              isPremium ? "ring-2 ring-[#3cc3dd]" : ""
            }`}
          >
            <div className="absolute right-0 top-0 rounded-bl-2xl bg-gradient-to-r from-[#3cc3dd] to-[#0d5694] px-4 py-2 text-xs font-bold text-white">
              PREMIUM
            </div>

            <div className="flex items-center gap-2">
              <Crown size={22} className="text-[#0d5694]" />

              <h3 className="text-xl font-bold text-[#2a2f33]">Premium</h3>
            </div>

            <p className="mt-3 text-sm leading-6 text-[#626569]">
              Request an upgrade to the MamaRise Premium subscription.
            </p>

            <div className="mt-6 flex items-center gap-2 text-sm font-semibold text-[#0d5694]">
              <Clock3 size={17} />
              Manual payment confirmation
            </div>

            <button
              type="button"
              onClick={handleUpgrade}
              disabled={isUpgrading || isActivePremium || isPendingPremium}
              className="mt-7 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#3cc3dd] to-[#0d5694] px-5 py-3.5 text-sm font-bold text-white shadow-md shadow-[#0d5694]/15 transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isUpgrading ? (
                <>
                  <RefreshCw size={17} className="animate-spin" />
                  Submitting request...
                </>
              ) : isActivePremium ? (
                <>
                  <CheckCircle2 size={17} />
                  Premium active
                </>
              ) : isPendingPremium ? (
                <>
                  <Clock3 size={17} />
                  Upgrade pending
                </>
              ) : (
                <>
                  <Crown size={17} />
                  Request Premium upgrade
                </>
              )}
            </button>
          </div>
        </div>
      </section>

      {/* Payment information */}
      <section className="rounded-3xl border border-[#7fd3e3]/50 bg-[#e6f5f8] p-6">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-[#0d5694]">
            <CreditCard size={22} />
          </div>

          <div>
            <h3 className="font-bold text-[#2a2f33]">Payment information</h3>

            <p className="mt-2 text-sm leading-6 text-[#626569]">
              Premium upgrade requests are currently recorded for manual
              confirmation. Automated payments, including M-Pesa integration,
              are not yet available.
            </p>

            {isPendingPremium && (
              <p className="mt-3 text-sm font-semibold text-amber-700">
                Your upgrade request has been recorded and is awaiting payment
                confirmation.
              </p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
