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
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";
import type { UserRole } from "../../types/api";

type AuthMode = "login" | "register";

const CONSENT_VERSION = "1.0";

/*
  Palette taken from the reference design (arbitrary Tailwind values,
  so no theme config is required):
  page bg   #5c0838 -> #860f55     panel   #d874a6 -> #c45f93
  button    #c2437f -> #a02c68     input   #f3f3f3 / border #dcdcdc
*/

const inputClass =
  "w-full rounded-lg border border-[#dcdcdc] bg-[#f3f3f3] px-4 py-3 pr-11 text-sm text-[#333] outline-none transition placeholder:text-[#8a8a8a] focus:border-[#c2437f] focus:bg-white focus:ring-4 focus:ring-[#c2437f]/15";

const gradientButton =
  "bg-gradient-to-b from-[#c2437f] to-[#a02c68] text-white shadow-md shadow-[#a02c68]/30";

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
          <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#4a4a4a]">
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
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(ellipse_at_top,#860f55_0%,#5c0838_100%)] p-4 font-sans sm:p-8">
      <div className="relative w-full max-w-[920px] overflow-hidden rounded-[1.25rem] bg-white shadow-2xl shadow-black/40 md:flex md:min-h-[520px]">
        {/* ---------- Pink welcome panel (slides sides on desktop) ---------- */}
        <section
          className={`relative overflow-hidden bg-gradient-to-br from-[#dc7aab] to-[#c45f93] px-6 pb-12 pt-16 text-center text-white transition-all duration-500 md:absolute md:inset-y-0 md:w-1/2 md:px-10 md:py-0 ${
            isRegistering ? "md:left-1/2" : "md:left-0"
          }`}
        >
          <div className="pointer-events-none absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-white/15 blur-2xl" />

          <div className="absolute inset-x-0 top-5 flex items-center justify-center gap-2 text-sm font-semibold text-white/90">
            <Flower2 size={20} />
            MamaRise
          </div>

          <div className="relative flex h-full flex-col items-center justify-center md:px-4">
            <h2 className="text-3xl font-extrabold tracking-wide md:text-4xl">
              WELCOME!
            </h2>

            <p className="mt-3 max-w-[260px] text-xs leading-5 text-white/95 md:text-sm md:leading-6">
              {isRegistering ? (
                <>
                  <b>SIGN UP</b> to join a supportive community, or <b>LOGIN</b>{" "}
                  if you already have an account.
                </>
              ) : (
                <>
                  <b>LOGIN</b> and <b>SIGN UP</b> to securely access your
                  account.
                </>
              )}
            </p>
          </div>
        </section>

        {/* ---------- Mode toggle pill (straddles the panel edge) ---------- */}
        <div className="relative z-20 mx-auto -my-5 flex w-fit flex-row gap-1 rounded-full bg-white p-1.5 shadow-xl shadow-black/20 md:absolute md:left-1/2 md:top-1/2 md:m-0 md:-translate-x-1/2 md:-translate-y-1/2 md:flex-col md:rounded-[1.4rem]">
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
              className={`rounded-full px-4 py-2 text-[11px] font-extrabold tracking-wide transition ${
                mode === value
                  ? gradientButton
                  : "text-[#333] hover:text-[#a02c68]"
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
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[#ec7fab] to-[#b83f7e] shadow-md shadow-[#b83f7e]/30">
                <UserRound
                  size={26}
                  fill="currentColor"
                  className="text-[#5b1038]"
                />
              </div>

              <h1 className="mt-3 text-sm font-extrabold tracking-wide text-[#333]">
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
                    <p className="mb-2 text-xs font-semibold text-[#555]">
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
                              : "border-[#dcdcdc] bg-[#f3f3f3] text-[#555] hover:border-[#c2437f]"
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
                    className="hover:text-[#a02c68]"
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
                      className="hover:text-[#a02c68]"
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
                    className="text-[11px] text-[#444] underline underline-offset-2 hover:text-[#a02c68]"
                  >
                    Forgot Password?
                  </Link>
                </div>
              )}

              {isRegistering && (
                <label className="flex items-start gap-2.5 text-xs leading-5 text-[#666]">
                  <input
                    type="checkbox"
                    checked={consentGiven}
                    onChange={(event) => setConsentGiven(event.target.checked)}
                    className="mt-0.5 h-4 w-4 shrink-0 accent-[#a02c68]"
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
                  className="rounded-lg border border-[#f5c2d8] bg-[#fdecf3] px-4 py-2.5 text-xs text-[#a02c68]"
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
            <p className="mt-5 text-center text-xs text-[#777]">
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
