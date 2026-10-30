import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";

import {
  LayoutDashboard,
  HeartPulse,
  CalendarDays,
  ClipboardList,
  BriefcaseBusiness,
  LogOut,
  Menu,
  X,
  Sparkles,
} from "lucide-react";

import { useAuth } from "../context/AuthContext";

const motherNavigation = [
  { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { label: "Wellbeing", path: "/wellbeing", icon: HeartPulse },
  { label: "Return-to-Work Planner", path: "/planner", icon: ClipboardList },
  { label: "Appointments", path: "/appointments", icon: CalendarDays },
];

const employerNavigation = [
  { label: "Employer Portal", path: "/employer", icon: BriefcaseBusiness },
];

const pageTitles: Record<string, string> = {
  "/dashboard": "Your Dashboard",
  "/wellbeing": "Your Wellbeing",
  "/planner": "Return-to-Work Planner",
  "/appointments": "Appointments",
  "/employer": "Employer Portal",
};

/* Palette: light #e6f5f8 | cyan #3cc3dd | deep #0d5694 | grey #626569 */
const gradientSquare =
  "bg-gradient-to-br from-[#3cc3dd] to-[#0d5694] text-white shadow-lg shadow-[#0d5694]/25";

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navigation =
    user?.role === "employer" ? employerNavigation : motherNavigation;

  const pageTitle = pageTitles[location.pathname] ?? "MamaRise";

  const initials = user?.full_name
    ? user.full_name
        .split(" ")
        .map((part) => part[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "U";

  // Lock page scroll behind the mobile drawer and close it with Escape.
  useEffect(() => {
    if (!isMenuOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setIsMenuOpen(false);
    }

    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isMenuOpen]);

  async function handleLogout() {
    try {
      await logout();
    } finally {
      navigate("/login", { replace: true });
    }
  }

  return (
    <div className="relative isolate min-h-screen bg-[#e6f5f8]">
      {/* Soft background shapes (echo the landing page) */}
      <div className="pointer-events-none fixed -right-24 -top-24 -z-10 h-96 w-96 rounded-full bg-[#3cc3dd]/15 blur-3xl" />
      <div className="pointer-events-none fixed -bottom-32 left-1/3 -z-10 h-96 w-96 rounded-full bg-[#0d5694]/10 blur-3xl" />

      {/* Mobile backdrop */}
      {isMenuOpen && (
        <button
          type="button"
          aria-label="Close navigation menu"
          onClick={() => setIsMenuOpen(false)}
          className="fixed inset-0 z-30 bg-[#082f5c]/40 backdrop-blur-[2px] lg:hidden"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-[18rem] max-w-[85vw] flex-col bg-white shadow-2xl shadow-[#0d5694]/10 transition-transform duration-300 lg:translate-x-0 lg:shadow-xl ${
          isMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand */}
        <div className="flex h-20 shrink-0 items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-xl font-extrabold tracking-tight text-[#626569]">
                MamaRise
              </h1>
              <p className="text-[11px] text-[#626569]/80">
                Supporting every journey
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsMenuOpen(false)}
            aria-label="Close menu"
            className="rounded-lg p-2 text-[#626569] hover:bg-[#e6f5f8] lg:hidden"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          <p className="mb-3 px-3 text-xs font-bold uppercase tracking-widest text-[#3cc3dd]">
            Main Menu
          </p>

          <nav className="space-y-1.5">
            {navigation.map((item) => {
              const Icon = item.icon;

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition ${
                      isActive
                        ? "bg-gradient-to-r from-[#3cc3dd] to-[#0d5694] text-white shadow-md shadow-[#0d5694]/25"
                        : "text-[#626569] hover:bg-[#e6f5f8] hover:text-[#0d5694]"
                    }`
                  }
                >
                  <Icon size={19} />
                  {item.label}
                </NavLink>
              );
            })}
          </nav>

          {/* Support card */}
          <div className="relative mt-8 overflow-hidden rounded-3xl bg-gradient-to-br from-[#8fd5e4] via-[#3cc3dd] to-[#0d5694] p-5 text-white">
            <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-white/20" />
            <div className="pointer-events-none absolute bottom-3 right-4 h-6 w-6 rotate-12 rounded-md bg-white/30" />

            <div className="relative">
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-white/25">
                <Sparkles size={19} />
              </div>

              <h3 className="text-sm font-extrabold">Every journey matters</h3>

              <p className="mt-2 text-xs leading-5 text-white/90">
                Your wellbeing, growth and confidence matter. Take things one
                step at a time.
              </p>
            </div>
          </div>
        </div>

        {/* User profile */}
        <div className="shrink-0 border-t border-[#e6f5f8] p-4">
          <div className="mb-3 flex items-center gap-3 px-1">
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold ${gradientSquare}`}
            >
              {initials}
            </div>

            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-[#2a2f33]">
                {user?.full_name}
              </p>

              <p className="text-xs capitalize text-[#626569]">{user?.role}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-semibold text-[#626569] transition hover:bg-[#e6f5f8] hover:text-[#0d5694]"
          >
            <LogOut size={18} />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main application area */}
      <div className="min-h-screen min-w-0 lg:pl-[18rem]">
        {/* Header */}
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between bg-white/80 px-4 shadow-sm shadow-[#0d5694]/5 backdrop-blur-lg sm:h-20 sm:px-6 lg:px-10">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setIsMenuOpen(true)}
              aria-label="Open navigation menu"
              aria-expanded={isMenuOpen}
              className="rounded-lg bg-white p-2 text-[#0d5694] shadow-md shadow-[#0d5694]/10 lg:hidden"
            >
              <Menu size={22} />
            </button>

            <div className="min-w-0">
              <h2 className="truncate text-base font-extrabold text-[#626569] sm:text-lg">
                {pageTitle}
              </h2>

              <p className="hidden text-xs text-[#626569]/80 sm:block">
                Welcome to your MamaRise space.
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-3">
            <span className="hidden text-sm font-semibold text-[#626569] sm:block">
              Welcome, {user?.full_name?.split(" ")[0]}
            </span>

            <div
              className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold ${gradientSquare}`}
            >
              {initials}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="mx-auto w-full min-w-0 max-w-7xl p-4 sm:p-6 lg:p-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
