import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

import {
  Flower2,
  Eye,
  Lock,
  Mail,
  Phone,
  User,
  UserRound,
  BriefcaseBusiness,
  CheckCircle2,
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";
import type { UserRole } from "../../types/api";

type AuthMode = "login" | "register";

const CONSENT_VERSION = "1.0";

/*
  Palette (same as the landing page and dashboard):
  light #e6f5f8 | cyan #3cc3dd | blue #1a77ab | deep #0d5694 | grey #626569
*/

const inputClass =
  "w-full rounded-lg border border-[#d3eaf0] bg-[#f3fafc] px-4 py-3 pr-11 text-sm text-[#2a2f33] outline-none transition placeholder:text-[#8a9399] focus:border-[#3cc3dd] focus:bg-white focus:ring-4 focus:ring-[#3cc3dd]/20";

const gradientButton =
  "bg-gradient-to-b from-[#3cc3dd] to-[#0d5694] text-white shadow-md shadow-[#0d5694]/25";

const panelPoints = [
  "Postpartum wellbeing support",
  "Practical return-to-work planning",
  "Your information handled securely",
];

function Field({
  id,
  label,
  icon,
  children,
}: {
  id: string;
  label: string;
  icon?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <div className="relative">
        {children}
        {icon && (
          <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#0d5694]">
            {icon}
          </span>
        )}
      </div>
    </div>
  );
}

export default function AuthPage() {
  const { login, register, user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState<AuthMode>(() =>
    window.location.pathname === "/register" ? "register" : "login",
  );

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<UserRole>("mother");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [consentGiven, setConsentGiven] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (isAuthenticated && user) {
      navigate(user.role === "employer" ? "/employer" : "/dashboard", {
        replace: true,
      });
    }
  }, [isAuthenticated, user, navigate]);

  function switchMode(nextMode: AuthMode) {
    setMode(nextMode);
    setErrorMessage("");
  }

  function handleSocial(provider: string) {
    // Social sign-in is not wired to the backend yet.
    setErrorMessage(`${provider} sign-in is coming soon.`);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");

    if (mode === "register") {
      if (password !== confirmPassword) {
        setErrorMessage("Your passwords do not match.");
        return;
      }

      if (!consentGiven) {
        setErrorMessage(
          "Please agree to the privacy and data processing terms.",
        );
        return;
      }
    }

    setIsSubmitting(true);

    try {
      if (mode === "login") {
        await login(email.trim(), password);
      } else {
        await register({
          full_name: fullName.trim(),
          email: email.trim(),
          phone_number: phoneNumber.trim(),
          password,
          role,
          consent_given: true,
          consent_version: CONSENT_VERSION,
        });
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.error?.message;

        setErrorMessage(
          message || "The request could not be completed. Please try again.",
        );
      } else if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("Something went wrong. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  const isRegistering = mode === "register";

  return (
    <main className="relative isolate flex min-h-screen items-center justify-center overflow-hidden bg-[#e6f5f8] p-4 font-sans sm:p-8">
      {/* Soft background shapes (same as the landing page and app layout) */}
      <div className="pointer-events-none absolute -right-24 -top-24 -z-10 h-96 w-96 rounded-full bg-[#3cc3dd]/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -left-20 -z-10 h-96 w-96 rounded-full bg-[#0d5694]/15 blur-3xl" />

      <div className="relative w-full max-w-[960px] overflow-hidden rounded-[1.5rem] bg-white shadow-2xl shadow-[#0d5694]/20 md:flex md:min-h-[600px]">
        {/* ---------- Welcome panel (slides sides on desktop) ---------- */}
        <section
          className={`relative overflow-hidden bg-gradient-to-br from-[#3cc3dd] via-[#1a77ab] to-[#0d5694] px-6 pb-14 pt-16 text-center text-white transition-all duration-500 md:absolute md:inset-y-0 md:w-1/2 md:px-12 md:pb-0 md:pt-0 md:text-left ${
            isRegistering ? "md:left-1/2" : "md:left-0"
          }`}
        >
          {/* decoration */}
          <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10" />
          <div className="pointer-events-none absolute -bottom-20 -left-16 h-60 w-60 rounded-full bg-white/10" />
          <div className="pointer-events-none absolute right-10 top-1/3 hidden h-9 w-9 rotate-12 rounded-xl bg-white/20 md:block" />
          <div className="pointer-events-none absolute bottom-16 right-16 hidden h-6 w-6 rotate-12 rounded-lg bg-white/20 md:block" />

          {/* brand */}
          <div className="absolute inset-x-0 top-5 flex items-center justify-center gap-2 text-base font-bold text-white md:top-8 md:justify-start md:px-12">
            <Flower2 size={24} />
            MamaRise
          </div>

          <div className="relative flex h-full flex-col items-center justify-center md:items-start md:pt-10">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/80 md:text-sm">
              {isRegistering ? "Join MamaRise" : "Welcome back"}
            </p>

            <h2 className="mt-3 text-4xl font-extrabold leading-[1.1] tracking-tight md:text-5xl">
              {isRegistering ? "Rise with us." : "Welcome back!"}
            </h2>

            <p className="mt-4 max-w-sm text-base leading-7 text-white/95 md:mt-5 md:text-lg md:leading-8">
              {isRegistering
                ? "Whether you're a mother planning your next chapter or an employer building a more supportive workplace, create your account in minutes."
                : "Sign in to continue your journey. Your wellbeing check-ins, return-to-work plan and appointments are right where you left them."}
            </p>

            <ul className="mt-7 hidden space-y-3 md:block">
              {panelPoints.map((point) => (
                <li
                  key={point}
                  className="flex items-center gap-3 text-sm font-semibold text-white md:text-base"
                >
                  <CheckCircle2 size={20} className="shrink-0 text-white" />
                  {point}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ---------- Mode toggle pill (straddles the panel edge) ---------- */}
        <div className="relative z-20 mx-auto -my-5 flex w-fit flex-row gap-1 rounded-full bg-white p-1.5 shadow-xl shadow-[#0d5694]/20 md:absolute md:left-1/2 md:top-1/2 md:m-0 md:-translate-x-1/2 md:-translate-y-1/2 md:flex-col md:rounded-[1.4rem]">
          {(
            [
              ["login", "LOGIN"],
              ["register", "SIGN UP"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => switchMode(value)}
              aria-pressed={mode === value}
              className={`rounded-full px-5 py-2.5 text-xs font-extrabold tracking-wide transition ${
                mode === value
                  ? gradientButton
                  : "text-[#626569] hover:text-[#0d5694]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* ---------- Form side ---------- */}
        <section
          className={`px-6 pb-8 pt-10 transition-[margin] duration-500 sm:px-10 md:flex md:w-1/2 md:flex-col md:justify-center md:px-12 md:py-10 ${
            isRegistering ? "md:ml-0" : "md:ml-[50%]"
          }`}
        >
          <div className="mx-auto w-full max-w-sm">
            <div className="mb-6 flex flex-col items-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[#3cc3dd] to-[#0d5694] shadow-lg shadow-[#0d5694]/25">
                <UserRound
                  size={26}
                  fill="currentColor"
                  className="text-white"
                />
              </div>

              <h1 className="mt-3 text-lg font-extrabold tracking-wide text-[#626569]">
                {isRegistering ? "SIGN UP" : "LOGIN"}
              </h1>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              {isRegistering && (
                <>
                  <Field
                    id="fullName"
                    label="Full name"
                    icon={<User size={17} />}
                  >
                    <input
                      id="fullName"
                      type="text"
                      value={fullName}
                      onChange={(event) => setFullName(event.target.value)}
                      placeholder="Full name"
                      autoComplete="name"
                      required
                      className={inputClass}
                    />
                  </Field>

                  <Field
                    id="phoneNumber"
                    label="Phone number"
                    icon={<Phone size={17} />}
                  >
                    <input
                      id="phoneNumber"
                      type="tel"
                      value={phoneNumber}
                      onChange={(event) => setPhoneNumber(event.target.value)}
                      placeholder="Phone number (+254 7XX XXX XXX)"
                      autoComplete="tel"
                      required
                      className={inputClass}
                    />
                  </Field>

                  <div>
                    <p className="mb-2 text-xs font-semibold text-[#626569]">
                      I am joining as
                    </p>

                    <div className="grid grid-cols-2 gap-2">
                      {(
                        [
                          ["mother", "Mother", UserRound],
                          ["employer", "Employer", BriefcaseBusiness],
                        ] as const
                      ).map(([value, label, Icon]) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => setRole(value)}
                          aria-pressed={role === value}
                          className={`flex items-center justify-center gap-2 rounded-lg border py-2.5 text-xs font-bold transition ${
                            role === value
                              ? `border-transparent ${gradientButton}`
                              : "border-[#d3eaf0] bg-[#f3fafc] text-[#626569] hover:border-[#3cc3dd]"
                          }`}
                        >
                          <Icon size={16} />
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              <Field id="email" label="Email" icon={<Mail size={17} />}>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="Email"
                  autoComplete="email"
                  required
                  className={inputClass}
                />
              </Field>

              <Field
                id="password"
                label="Password"
                icon={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                    title={showPassword ? "Hide password" : "Show password"}
                    className="hover:text-[#3cc3dd]"
                  >
                    {showPassword ? <Eye size={17} /> : <Lock size={17} />}
                  </button>
                }
              >
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Password"
                  autoComplete={
                    isRegistering ? "new-password" : "current-password"
                  }
                  required
                  className={inputClass}
                />
              </Field>

              {isRegistering && (
                <Field
                  id="confirmPassword"
                  label="Confirm password"
                  icon={
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      aria-label={
                        showConfirmPassword ? "Hide password" : "Show password"
                      }
                      title={
                        showConfirmPassword ? "Hide password" : "Show password"
                      }
                      className="hover:text-[#3cc3dd]"
                    >
                      {showConfirmPassword ? (
                        <Eye size={17} />
                      ) : (
                        <Lock size={17} />
                      )}
                    </button>
                  }
                >
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    placeholder="Confirm password"
                    autoComplete="new-password"
                    required
                    className={inputClass}
                  />
                </Field>
              )}

              {!isRegistering && (
                <div className="text-right">
                  <Link
                    to="/forgot-password"
                    className="text-xs font-semibold text-[#0d5694] underline underline-offset-2 hover:text-[#3cc3dd]"
                  >
                    Forgot Password?
                  </Link>
                </div>
              )}

              {isRegistering && (
                <label className="flex items-start gap-2.5 text-xs leading-5 text-[#626569]">
                  <input
                    type="checkbox"
                    checked={consentGiven}
                    onChange={(event) => setConsentGiven(event.target.checked)}
                    className="mt-0.5 h-4 w-4 shrink-0 accent-[#0d5694]"
                  />
                  <span>
                    I agree to the privacy policy and consent to the processing
                    of my personal information.
                  </span>
                </label>
              )}

              {errorMessage && (
                <div
                  role="alert"
                  className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs text-rose-600"
                >
                  {errorMessage}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full rounded-lg px-5 py-3 text-sm font-extrabold tracking-wide transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60 ${gradientButton}`}
              >
                {isSubmitting
                  ? isRegistering
                    ? "CREATING ACCOUNT..."
                    : "LOGGING IN..."
                  : isRegistering
                    ? "SIGN UP"
                    : "LOGIN"}
              </button>
            </form>

            {/* Social */}
            <p className="mt-5 text-center text-xs text-[#626569]">
              {isRegistering ? "Or sign up with" : "Or login with"}
            </p>

            <div className="mt-3 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => handleSocial("Google")}
                aria-label="Continue with Google"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-[#d44638] text-sm font-bold text-white shadow-md transition hover:-translate-y-0.5"
              >
                G
              </button>

              <button
                type="button"
                onClick={() => handleSocial("Facebook")}
                aria-label="Continue with Facebook"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-[#2f80d6] text-base font-bold text-white shadow-md transition hover:-translate-y-0.5"
              >
                f
              </button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
