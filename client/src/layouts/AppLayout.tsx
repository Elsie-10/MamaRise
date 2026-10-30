import { useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";

import {
  LayoutDashboard,
  HeartPulse,
  CalendarDays,
  BriefcaseBusiness,
  LogOut,
  Menu,
  X,
  Flower2,
  Sparkles,
} from "lucide-react";

import { useAuth } from "../context/AuthContext";

const motherNavigation = [
  {
    label: "Dashboard",
    path: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Wellbeing",
    path: "/wellbeing",
    icon: HeartPulse,
  },
  {
    label: "Return-to-Work Planner",
    path: "/planner",
    icon: CalendarDays,
  },
  {
    label: "Appointments",
    path: "/appointments",
    icon: CalendarDays,
  },
];

const employerNavigation = [
  {
    label: "Employer Portal",
    path: "/employer",
    icon: BriefcaseBusiness,
  },
];

const pageTitles: Record<string, string> = {
  "/dashboard": "Your Dashboard",
  "/wellbeing": "Your Wellbeing",
  "/planner": "Return-to-Work Planner",
  "/appointments": "Appointments",
  "/employer": "Employer Portal",
};

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

  async function handleLogout() {
    try {
      await logout();
    } finally {
      navigate("/login", { replace: true });
    }
  }

  return (
    <div className="min-h-screen bg-cream">
      {/* Mobile backdrop */}
      {isMenuOpen && (
        <button
          type="button"
          aria-label="Close navigation menu"
          onClick={() => setIsMenuOpen(false)}
          className="fixed inset-0 z-30 bg-black/30 md:hidden"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-border bg-white transition-transform duration-300 md:translate-x-0 ${
          isMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand */}
        <div className="flex h-20 items-center justify-between border-b border-border px-7">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-100 text-primary-700">
              <Flower2 size={24} />
            </div>

            <div>
              <h1 className="text-xl font-bold tracking-tight text-primary-700">
                MamaRise
              </h1>
              <p className="text-xs text-muted">Supporting every journey</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsMenuOpen(false)}
            aria-label="Close menu"
            className="rounded-lg p-2 text-muted hover:bg-cream md:hidden"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto px-5 py-7">
          <p className="mb-4 px-3 text-xs font-semibold uppercase tracking-widest text-muted">
            Main Menu
          </p>

          <nav className="space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon;

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
                      isActive
                        ? "bg-primary-50 text-primary-700"
                        : "text-muted hover:bg-cream hover:text-ink"
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
          <div className="mt-10 rounded-2xl bg-rose-50 p-5">
            <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-white text-rose-500">
              <Sparkles size={19} />
            </div>

            <h3 className="text-sm font-semibold text-ink">
              Every journey matters
            </h3>

            <p className="mt-2 text-xs leading-5 text-muted">
              Your wellbeing, growth and confidence matter. Take things one step
              at a time.
            </p>
          </div>
        </div>

        {/* User profile */}
        <div className="border-t border-border p-5">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 text-sm font-semibold text-primary-700">
              {initials}
            </div>

            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-ink">
                {user?.full_name}
              </p>

              <p className="text-xs capitalize text-muted">{user?.role}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted transition hover:bg-rose-50 hover:text-rose-600"
          >
            <LogOut size={18} />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main application area */}
      <div className="min-h-screen md:pl-72">
        {/* Header */}
        <header className="sticky top-0 z-20 flex h-20 items-center justify-between border-b border-border bg-white/90 px-5 backdrop-blur-md md:px-10">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setIsMenuOpen(true)}
              aria-label="Open navigation menu"
              className="rounded-lg p-2 text-ink hover:bg-cream md:hidden"
            >
              <Menu size={22} />
            </button>

            <div>
              <h2 className="text-lg font-semibold text-ink">{pageTitle}</h2>

              <p className="hidden text-xs text-muted sm:block">
                Welcome to your MamaRise space.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-muted sm:block">
              Welcome, {user?.full_name?.split(" ")[0]}
            </span>

            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 text-sm font-semibold text-primary-700">
              {initials}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="mx-auto w-full max-w-7xl p-5 md:p-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
