import { useState } from "react";
import { Link } from "react-router-dom";

import {
  Flower2,
  Heart,
  HeartHandshake,
  CalendarDays,
  BriefcaseBusiness,
  ArrowRight,
  Menu,
  X,
  CheckCircle2,
  Users,
  HandHeart,
  CircleUser,
} from "lucide-react";

/*
  Palette (taken from the reference design)
  light bg  #e6f5f8   cyan #3cc3dd   soft cyan #7fd3e3
  deep blue #0d5694   grey text #626569
  Everything uses arbitrary Tailwind values, so no theme config is needed.
*/

const navLinks = [
  { label: "Home", href: "#top" },
  { label: "About", href: "#about" },
  { label: "Services", href: "#services" },
  { label: "For Mothers", href: "#mothers" },
  { label: "For Employers", href: "#employers" },
];

const services = [
  {
    icon: Heart,
    title: "Maternal Wellbeing",
    description:
      "Access supportive resources that help you navigate the emotional and physical changes of motherhood.",
  },
  {
    icon: CalendarDays,
    title: "Return-to-Work Planning",
    description:
      "Prepare for your professional transition with structured planning and practical guidance.",
  },
  {
    icon: HeartHandshake,
    title: "Support & Guidance",
    description:
      "Find helpful information and resources designed to make your motherhood journey easier.",
  },
  {
    icon: BriefcaseBusiness,
    title: "Workplace Support",
    description:
      "Help organisations create more supportive and inclusive environments for working mothers.",
  },
];

const benefits = [
  "Resources for maternal wellbeing",
  "Practical postpartum guidance",
  "Structured return-to-work planning",
  "A more supportive workplace experience",
];

const gradientSquare =
  "bg-gradient-to-br from-[#3cc3dd] to-[#0d5694] shadow-lg shadow-[#0d5694]/25";

/* ---------- Desktop hero background (matches the reference artboard) ---------- */
function DesktopBackground() {
  return (
    <svg
      viewBox="0 0 1403 790"
      preserveAspectRatio="none"
      className="absolute inset-0 h-full w-full"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="dGradA" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stopColor="#8fd5e4" />
          <stop offset="0.55" stopColor="#3cc3dd" />
          <stop offset="1" stopColor="#1a77ab" />
        </linearGradient>
        <linearGradient id="dGradB" x1="0.15" y1="1" x2="0.95" y2="0.05">
          <stop offset="0" stopColor="#8fd5e4" />
          <stop offset="0.45" stopColor="#3cc3dd" />
          <stop offset="1" stopColor="#0b5191" />
        </linearGradient>
        <linearGradient id="dSq" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#3cc3dd" />
          <stop offset="1" stopColor="#0d5694" />
        </linearGradient>
        <filter id="dShadow" x="-30%" y="-30%" width="170%" height="170%">
          <feDropShadow
            dx="4"
            dy="6"
            stdDeviation="5"
            floodColor="#0d5694"
            floodOpacity="0.3"
          />
        </filter>
      </defs>

      <rect width="1403" height="790" fill="#e6f5f8" />
      <path d="M0 0H175V160Q175 160 155 160H0Z" fill="#b5e2ee" opacity="0.7" />

      {/* Large gradient shape */}
      <path
        d="M448 0 L620 300 C650 350 700 395 760 385 C840 370 905 440 910 500 C920 570 880 590 850 620 C790 680 770 740 840 790 L1403 790 L1403 0 Z"
        fill="url(#dGradA)"
      />

      {/* Darker inner wave */}
      <path
        d="M648 0 L1403 0 L1403 790 L1200 790 L1040 520 C1000 460 1020 410 1070 380 C1160 330 1170 250 1130 190 C1080 120 1000 100 950 140 C920 165 880 275 805 228 Z"
        fill="url(#dGradB)"
        stroke="#fff"
        strokeOpacity="0.55"
        strokeWidth="1.2"
      />

      {/* Dashed accents */}
      <path
        d="M488 0 C490 150 600 270 720 266 C790 262 850 215 885 205 C1000 280 995 380 920 410 C870 430 860 470 880 560"
        fill="none"
        stroke="#fff"
        strokeOpacity="0.6"
        strokeWidth="2"
        strokeDasharray="8 8"
      />

      {/* Floating translucent squares */}
      {[
        [1130, 465, 70, 15],
        [1244, 545, 45, 15],
        [1317, 609, 52, 15],
        [1143, 647, 46, 15],
      ].map(([cx, cy, s, r]) => (
        <rect
          key={`${cx}-${cy}`}
          x={cx - s / 2}
          y={cy - s / 2}
          width={s}
          height={s}
          rx="12"
          fill="#fff"
          opacity="0.4"
          transform={`rotate(${r} ${cx} ${cy})`}
          filter="url(#dShadow)"
        />
      ))}

      {/* Left curve + connectors */}
      <path
        d="M0 246 L135 358 C170 395 175 440 150 480 C120 530 70 560 90 620 C105 690 150 726 195 726 C260 726 290 640 340 618 C380 600 400 615 425 620"
        fill="none"
        stroke="#3aa6c8"
        strokeWidth="1.2"
      />
      <path d="M460 650 L613 790" stroke="#0d5694" strokeWidth="1.2" />

      {[
        [102, 353, 88],
        [218, 512, 57],
        [52, 590, 57],
        [273, 616, 65],
      ].map(([x, y, s]) => (
        <rect
          key={`${x}-${y}`}
          x={x}
          y={y}
          width={s}
          height={s}
          rx="12"
          fill="url(#dSq)"
          filter="url(#dShadow)"
        />
      ))}
    </svg>
  );
}

/* ---------- Mobile hero background ---------- */
function MobileBackground() {
  return (
    <>
      {/* top-right corner shape */}
      <svg
        viewBox="0 0 200 180"
        className="absolute right-0 top-0 h-[170px] w-[190px]"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="mTop" x1="0" y1="1" x2="1" y2="0">
            <stop offset="0" stopColor="#8fd5e4" />
            <stop offset="0.5" stopColor="#3cc3dd" />
            <stop offset="1" stopColor="#0b5191" />
          </linearGradient>
        </defs>
        <path
          d="M70 0 H200 V150 C160 175 110 150 125 105 C135 70 85 50 70 0Z"
          fill="url(#mTop)"
        />
      </svg>

      {/* bottom waves */}
      <svg
        viewBox="0 0 400 300"
        preserveAspectRatio="none"
        className="absolute bottom-0 left-0 h-[300px] w-full"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="mA" x1="0" y1="1" x2="1" y2="0">
            <stop offset="0" stopColor="#8fd5e4" />
            <stop offset="1" stopColor="#3cc3dd" />
          </linearGradient>
          <linearGradient id="mB" x1="0" y1="1" x2="1" y2="0">
            <stop offset="0" stopColor="#3cc3dd" />
            <stop offset="1" stopColor="#0b5191" />
          </linearGradient>
        </defs>
        <path
          d="M0 130 C60 70 120 150 190 110 C250 75 310 30 400 70 L400 300 L0 300Z"
          fill="url(#mA)"
        />
        <path
          d="M110 300 C150 210 230 200 270 140 C300 95 350 80 400 100 L400 300Z"
          fill="url(#mB)"
          stroke="#fff"
          strokeOpacity="0.5"
        />
        {[
          [300, 200, 34, 15],
          [350, 245, 24, 15],
          [250, 255, 26, 15],
        ].map(([cx, cy, s, r]) => (
          <rect
            key={`${cx}-${cy}`}
            x={cx - s / 2}
            y={cy - s / 2}
            width={s}
            height={s}
            rx="7"
            fill="#fff"
            opacity="0.4"
            transform={`rotate(${r} ${cx} ${cy})`}
          />
        ))}
      </svg>

      {/* little gradient squares */}
      <div
        className={`absolute left-[5%] top-[44%] h-9 w-9 rounded-xl ${gradientSquare}`}
      />
      <div
        className={`absolute left-[78%] top-[52%] h-7 w-7 rounded-lg ${gradientSquare}`}
      />
    </>
  );
}

export default function LandingPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const closeMenu = () => setIsMenuOpen(false);

  return (
    <div
      id="top"
      className="min-h-screen overflow-hidden bg-[#e6f5f8] font-sans"
    >
      {/* ===================== HERO – DESKTOP ===================== */}
      <section
        className="relative hidden w-full lg:block"
        style={{ aspectRatio: "1403 / 790", containerType: "inline-size" }}
      >
        <DesktopBackground />

        {/* Logo */}
        <Link
          to="/"
          className="absolute flex items-center text-[#626569]"
          style={{ left: "5%", top: "5.5%", gap: "1cqw" }}
        >
          
          <span
            className="font-bold tracking-tight"
            style={{ fontSize: "3.1cqw" }}
          >
            MamaRise
          </span>
        </Link>

        {/* Nav */}
        <nav
          className="absolute flex items-center font-semibold text-white"
          style={{
            left: "46%",
            top: "6.4%",
            gap: "2.2cqw",
            fontSize: "1.3cqw",
          }}
        >
          {navLinks.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="transition hover:opacity-75"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <Link
          to="/login"
          className="absolute flex items-center justify-center rounded-lg bg-white font-bold text-[#0d5694] shadow-lg shadow-black/10 transition hover:-translate-y-0.5"
          style={{
            left: "84.5%",
            top: "7.6%",
            width: "7.6%",
            height: "4.6%",
            fontSize: "1.75cqw",
          }}
        >
          Log In
        </Link>
        <Link
          to="/login"
          aria-label="Account"
          className="absolute text-white transition hover:opacity-80"
          style={{ left: "92.9%", top: "7.7%" }}
        >
          <CircleUser
            style={{ width: "2.6cqw", height: "2.6cqw" }}
            strokeWidth={1.6}
          />
        </Link>

        {/* Hero copy */}
        <div
          className="absolute"
          style={{ left: "14.8%", top: "37%", width: "42%" }}
        >
          <p
            className="font-semibold text-[#626569]"
            style={{ fontSize: "1.9cqw" }}
          >
            A new chapter deserves support
          </p>
          <h1
            className="font-extrabold leading-[1.02] tracking-tight text-[#626569]"
            style={{ fontSize: "3.6cqw", marginTop: "0.5cqw" }}
          >
            Motherhood changes everything.
          </h1>
          <p
            className="leading-[1.5] text-[#2a2f33]"
            style={{ fontSize: "1.15cqw", marginTop: "1cqw", width: "72%" }}
          >
            Your opportunities shouldn&apos;t. MamaRise empowers mothers through
            postpartum wellbeing resources, practical return-to-work planning
            and supportive workplace experiences.
          </p>
        </div>

        {/* Decorative squares need no content; CTA pill */}
        <Link
          to="/register"
          className="group absolute flex items-center rounded-full bg-[#7fd3e3] transition hover:bg-[#6cc9db]"
          style={{
            left: "30.2%",
            top: "75.3%",
            width: "21.5%",
            height: "6.8%",
          }}
        >
          <span className="flex aspect-square h-full items-center justify-center rounded-full border-2 border-[#3cc3dd] bg-[#e6f5f8] text-[#3cc3dd]">
            <ArrowRight style={{ width: "55%", height: "55%" }} />
          </span>
          <span
            className="flex-1 text-center font-medium text-[#626569]"
            style={{ fontSize: "2.2cqw" }}
          >
            Get started
          </span>
        </Link>
      </section>

      {/* ===================== HERO – MOBILE / TABLET ===================== */}
      <section className="relative min-h-[780px] overflow-hidden px-6 pb-[300px] pt-6 lg:hidden">
        <MobileBackground />

        <header className="relative z-20 flex items-center justify-between">
          <Link
            to="/"
            onClick={closeMenu}
            className="flex items-center gap-2 text-[#626569]"
          >
            <Flower2 size={30} />
            <span className="text-2xl font-bold tracking-tight">MamaRise</span>
          </Link>

          <button
            type="button"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label={isMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={isMenuOpen}
            className="rounded-lg bg-white p-2 text-[#0d5694] shadow-lg shadow-black/10"
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </header>

        {isMenuOpen && (
          <div className="absolute inset-x-5 top-20 z-30 rounded-2xl bg-white p-5 shadow-2xl shadow-[#0d5694]/20">
            <div className="flex flex-col gap-4">
              {navLinks.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  onClick={closeMenu}
                  className="text-sm font-semibold text-[#0d5694]"
                >
                  {l.label}
                </a>
              ))}
              <div className="flex gap-3 border-t border-[#e6f5f8] pt-4">
                <Link
                  to="/login"
                  onClick={closeMenu}
                  className="flex-1 rounded-lg border border-[#3cc3dd] py-3 text-center text-sm font-bold text-[#0d5694]"
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  onClick={closeMenu}
                  className="flex-1 rounded-lg bg-[#0d5694] py-3 text-center text-sm font-bold text-white"
                >
                  Get started
                </Link>
              </div>
            </div>
          </div>
        )}

        <div className="relative z-10 mt-20 max-w-md sm:mt-28 sm:max-w-lg">
          <p className="text-base font-semibold text-[#626569]">
            A new chapter deserves support
          </p>
          <h1 className="mt-1 text-4xl font-extrabold leading-[1.05] tracking-tight text-[#626569] sm:text-5xl">
            Motherhood changes everything.
          </h1>
          <p className="mt-4 text-sm leading-6 text-[#2a2f33] sm:text-base">
            Your opportunities shouldn&apos;t. MamaRise empowers mothers through
            postpartum wellbeing resources, practical return-to-work planning
            and supportive workplace experiences.
          </p>

          <Link
            to="/register"
            className="mt-8 inline-flex h-14 w-full max-w-[290px] items-center rounded-full bg-[#7fd3e3]"
          >
            <span className="flex aspect-square h-full items-center justify-center rounded-full border-2 border-[#3cc3dd] bg-[#e6f5f8] text-[#3cc3dd]">
              <ArrowRight size={24} />
            </span>
            <span className="flex-1 text-center text-lg font-medium text-[#626569]">
              Get started
            </span>
          </Link>

          <Link
            to="/login"
            className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-[#0d5694]"
          >
            <CircleUser size={20} /> Log In
          </Link>
        </div>
      </section>

      {/* ===================== ABOUT ===================== */}
      <section
        id="about"
        className="scroll-mt-6 bg-white px-5 py-20 md:px-8 md:py-28"
      >
        <div className="mx-auto grid max-w-7xl gap-14 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="mb-4 text-sm font-semibold text-[#3cc3dd]">
              Why MamaRise exists
            </p>
            <h2 className="max-w-xl text-3xl font-extrabold leading-tight tracking-tight text-[#626569] md:text-4xl">
              Supporting mothers beyond the maternity leave period.
            </h2>
            <p className="mt-6 text-base leading-8 text-[#626569]">
              The journey into motherhood comes with significant changes.
              Physical recovery, emotional wellbeing, childcare responsibilities
              and returning to work can create challenges that deserve more
              attention.
            </p>
            <p className="mt-4 text-base leading-8 text-[#626569]">
              MamaRise brings together practical resources and supportive
              experiences to help mothers navigate these transitions while
              helping employers build more inclusive workplaces.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {[
              {
                i: Heart,
                t: "Wellbeing",
                d: "Encouraging maternal care and personal wellbeing.",
                off: false,
              },
              {
                i: Users,
                t: "Community",
                d: "Promoting understanding and supportive experiences.",
                off: true,
              },
              {
                i: CalendarDays,
                t: "Planning",
                d: "Making transitions easier through preparation.",
                off: false,
              },
              {
                i: BriefcaseBusiness,
                t: "Opportunity",
                d: "Supporting mothers in their professional journeys.",
                off: true,
              },
            ].map(({ i: Icon, t, d, off }) => (
              <div
                key={t}
                className={`rounded-3xl bg-[#e6f5f8] p-6 ${off ? "mt-8" : ""}`}
              >
                <div
                  className={`mb-5 flex h-12 w-12 items-center justify-center rounded-xl text-white ${gradientSquare}`}
                >
                  <Icon size={24} />
                </div>
                <h3 className="text-lg font-bold text-[#626569]">{t}</h3>
                <p className="mt-2 text-sm leading-6 text-[#626569]">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===================== SERVICES ===================== */}
      <section
        id="services"
        className="scroll-mt-6 px-5 py-20 md:px-8 md:py-28"
      >
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto mb-14 max-w-2xl text-center">
            <p className="mb-4 text-sm font-semibold text-[#3cc3dd]">
              What we offer
            </p>
            <h2 className="text-3xl font-extrabold tracking-tight text-[#626569] md:text-4xl">
              Support designed around your journey.
            </h2>
            <p className="mt-5 text-base leading-7 text-[#626569]">
              From personal wellbeing to professional development, MamaRise
              brings important aspects of maternal support into one accessible
              space.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {services.map((service) => {
              const Icon = service.icon;
              return (
                <article
                  key={service.title}
                  className="rounded-3xl bg-white p-7 transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-[#0d5694]/10"
                >
                  <div
                    className={`mb-6 flex h-14 w-14 items-center justify-center rounded-2xl text-white ${gradientSquare}`}
                  >
                    <Icon size={27} />
                  </div>
                  <h3 className="text-lg font-bold text-[#626569]">
                    {service.title}
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-[#626569]">
                    {service.description}
                  </p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===================== FOR MOTHERS ===================== */}
      <section
        id="mothers"
        className="scroll-mt-6 bg-white px-5 py-20 md:px-8 md:py-24"
      >
        <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-2">
          <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#8fd5e4] via-[#3cc3dd] to-[#0d5694] p-8 text-white md:p-12">
            <div className="absolute -right-10 -top-10 h-44 w-44 rounded-full bg-white/15" />
            <div className="relative">
              <div className="mb-7 flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-[#0d5694] shadow-sm">
                <HandHeart size={34} />
              </div>
              <p className="text-sm font-semibold text-white/80">For mothers</p>
              <h2 className="mt-4 text-3xl font-extrabold leading-tight">
                Your motherhood journey matters. So does your future.
              </h2>
              <p className="mt-5 text-sm leading-7 text-white/90">
                Take meaningful steps towards your wellbeing, personal growth
                and professional goals with resources designed to support your
                journey.
              </p>
              <Link
                to="/register"
                className="mt-8 inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3.5 text-sm font-bold text-[#0d5694] shadow-lg shadow-black/10 transition hover:-translate-y-0.5"
              >
                Join MamaRise
                <ArrowRight size={18} />
              </Link>
            </div>
          </div>

          <div>
            <p className="mb-4 text-sm font-semibold text-[#3cc3dd]">
              Your space, your journey
            </p>
            <h2 className="text-3xl font-extrabold leading-tight text-[#626569] md:text-4xl">
              Take care of yourself while building the future you want.
            </h2>
            <p className="mt-5 text-base leading-8 text-[#626569]">
              MamaRise is designed to help you access useful information,
              organise your next steps and approach motherhood and work with
              greater confidence.
            </p>
            <div className="mt-8 space-y-5">
              {benefits.map((benefit) => (
                <div key={benefit} className="flex items-center gap-3">
                  <CheckCircle2 size={21} className="shrink-0 text-[#3cc3dd]" />
                  <span className="text-sm font-semibold text-[#626569]">
                    {benefit}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===================== FOR EMPLOYERS ===================== */}
      <section
        id="employers"
        className="scroll-mt-6 px-5 py-20 md:px-8 md:py-28"
      >
        <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#1a77ab] to-[#0b3f78] px-7 py-14 text-white md:px-14 md:py-16">
          <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-[#3cc3dd]/25" />
          <div className="absolute -bottom-24 left-1/3 h-56 w-56 rounded-full bg-white/10" />
          <div className="relative grid items-center gap-10 lg:grid-cols-2">
            <div>
              <p className="mb-4 text-sm font-semibold text-white/70">
                For employers
              </p>
              <h2 className="text-3xl font-extrabold leading-tight md:text-4xl">
                Build a workplace where motherhood and opportunity coexist.
              </h2>
              <p className="mt-6 max-w-xl text-base leading-8 text-white/80">
                Supporting employees through maternity leave and their return to
                work contributes to a more understanding, inclusive and
                sustainable workplace.
              </p>
              <Link
                to="/register"
                className="mt-9 inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3.5 text-sm font-bold text-[#0d5694] transition hover:bg-[#e6f5f8]"
              >
                Explore employer access
                <ArrowRight size={18} />
              </Link>
            </div>

            <div className="rounded-3xl border border-white/20 bg-white/10 p-8 backdrop-blur-sm">
              <div className="mb-7 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20">
                <BriefcaseBusiness size={29} />
              </div>
              <h3 className="text-xl font-bold">A more supportive workplace</h3>
              <p className="mt-3 text-sm leading-7 text-white/75">
                Give your organisation a better way to approach maternal support
                and employee transitions.
              </p>
              <div className="mt-7 space-y-4">
                {[
                  "Supportive return-to-work experiences",
                  "Better awareness of maternal wellbeing",
                  "A more inclusive workplace culture",
                ].map((item) => (
                  <div
                    key={item}
                    className="flex items-center gap-3 text-sm text-white/90"
                  >
                    <CheckCircle2
                      size={18}
                      className="shrink-0 text-[#7fd3e3]"
                    />
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===================== FINAL CTA ===================== */}
      <section className="bg-white px-5 py-20 text-center md:px-8 md:py-24">
        <div className="mx-auto max-w-2xl">
          <div
            className={`mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl text-white ${gradientSquare}`}
          >
            <Flower2 size={34} />
          </div>
          <p className="mb-4 text-sm font-semibold text-[#3cc3dd]">
            Your next chapter starts here
          </p>
          <h2 className="text-3xl font-extrabold leading-tight text-[#626569] md:text-4xl">
            You deserve support at every stage of your journey.
          </h2>
          <p className="mt-5 text-base leading-7 text-[#626569]">
            Join MamaRise and take your next step towards a healthier, more
            supported and confident future.
          </p>
          <Link
            to="/register"
            className="mt-8 inline-flex h-14 items-center rounded-full bg-[#7fd3e3] pr-8 transition hover:bg-[#6cc9db]"
          >
            <span className="flex aspect-square h-full items-center justify-center rounded-full border-2 border-[#3cc3dd] bg-[#e6f5f8] text-[#3cc3dd]">
              <ArrowRight size={24} />
            </span>
            <span className="pl-5 text-lg font-medium text-[#626569]">
              Get started today
            </span>
          </Link>
        </div>
      </section>

      {/* ===================== FOOTER ===================== */}
      <footer className="bg-[#0b3f78] px-5 py-12 text-white md:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-10 border-b border-white/10 pb-10 md:grid-cols-2 lg:grid-cols-4">
            <div className="lg:col-span-2">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10">
                  <Flower2 size={25} />
                </div>
                <div>
                  <h3 className="text-xl font-bold">MamaRise</h3>
                  <p className="text-xs text-white/60">
                    Supporting every journey
                  </p>
                </div>
              </div>
              <p className="mt-5 max-w-sm text-sm leading-7 text-white/65">
                Empowering mothers, supporting wellbeing and encouraging
                workplaces where every journey matters.
              </p>
            </div>

            <div>
              <h4 className="mb-5 text-sm font-semibold">Explore</h4>
              <div className="space-y-4 text-sm text-white/65">
                <a href="#about" className="block transition hover:text-white">
                  About MamaRise
                </a>
                <a
                  href="#services"
                  className="block transition hover:text-white"
                >
                  Our Services
                </a>
                <a
                  href="#mothers"
                  className="block transition hover:text-white"
                >
                  For Mothers
                </a>
                <a
                  href="#employers"
                  className="block transition hover:text-white"
                >
                  For Employers
                </a>
              </div>
            </div>

            <div>
              <h4 className="mb-5 text-sm font-semibold">Your Account</h4>
              <div className="space-y-4 text-sm text-white/65">
                <Link to="/login" className="block transition hover:text-white">
                  Sign in
                </Link>
                <Link
                  to="/register"
                  className="block transition hover:text-white"
                >
                  Create account
                </Link>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4 pt-7 text-xs text-white/50 sm:flex-row sm:items-center sm:justify-between">
            <p>© {new Date().getFullYear()} MamaRise. All rights reserved.</p>
            <p>Built with care for every mother&apos;s journey.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
