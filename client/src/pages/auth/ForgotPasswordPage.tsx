import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type FormEvent,
} from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Check,
  Eye,
  EyeOff,
  Mail,
  Phone,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";

import {
  forgotPassword,
  verifyResetCode,
  resetPassword,
} from "../../services/authService";

type RecoveryStage = "contact" | "code" | "password" | "success";
type ContactMethod = "phone" | "email";
type BunnyMood =
  | "sad"
  | "thinking"
  | "happy"
  | "confused"
  | "excited"
  | "celebrating"
  | "shy"
  | "loved";

type ArmMotion = "wave" | "tap" | "pump" | "pump-fast";

/*
  Palette (shared with every other page):
  light #e6f5f8 | cyan #3cc3dd | blue #1a77ab | deep #0d5694 | grey #626569
*/

const gradientButton =
  "bg-gradient-to-b from-[#3cc3dd] to-[#0d5694] text-white shadow-md shadow-[#0d5694]/25";

const inputClass =
  "w-full rounded-lg border border-[#d3eaf0] bg-[#f3fafc] px-4 py-3 text-sm text-[#2a2f33] outline-none transition placeholder:text-[#8a9399] focus:border-[#3cc3dd] focus:bg-white focus:ring-4 focus:ring-[#3cc3dd]/20";

const buttonClass = `flex w-full items-center justify-center gap-2 rounded-lg px-5 py-3 text-sm font-extrabold tracking-wide transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60 ${gradientButton}`;

const labelClass = "mb-2 block text-xs font-bold text-[#626569]";

const alertClass =
  "rounded-lg border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs text-rose-600";

const passwordRules = [
  {
    label: "At least 10 characters",
    test: (value: string) => value.length >= 10,
  },
  {
    label: "One uppercase letter",
    test: (value: string) => /[A-Z]/.test(value),
  },
  {
    label: "One lowercase letter",
    test: (value: string) => /[a-z]/.test(value),
  },
  { label: "One number", test: (value: string) => /\d/.test(value) },
  {
    label: "One special character",
    test: (value: string) => /[^A-Za-z0-9]/.test(value),
  },
];

/* How far the ears lean outwards for each mood (degrees) */
const earTilt: Record<BunnyMood, number> = {
  sad: 26,
  shy: 22,
  thinking: 9,
  happy: 10,
  confused: 15,
  excited: 4,
  celebrating: 3,
  loved: 6,
};

/*
  Arm poses: [shoulder angle, elbow angle] in degrees.
  Positive moves the hand towards the viewer's left.
*/
const armPoses: Record<
  BunnyMood,
  {
    l: [number, number];
    r: [number, number];
    lMotion?: ArmMotion;
    rMotion?: ArmMotion;
  }
> = {
  sad: { l: [5, -75], r: [-5, 75] }, // hands clasped, worried
  thinking: { l: [5, -75], r: [-112, -117], rMotion: "tap" }, // finger on cheek
  happy: { l: [10, -60], r: [-140, -40], rMotion: "wave" }, // waving hello
  confused: { l: [45, 75], r: [-45, -75] }, // shrug
  excited: { l: [150, -10], r: [-150, 10], lMotion: "pump", rMotion: "pump" },
  celebrating: {
    l: [135, 25],
    r: [-135, -25],
    lMotion: "pump-fast",
    rMotion: "pump-fast",
  },
  shy: { l: [-155, -20], r: [155, 20] }, // hands over the eyes
  loved: { l: [5, -75], r: [-5, 75] }, // hugging itself
};

const confetti = [
  { x: 30, delay: 0, color: "#f6c85f" },
  { x: 62, delay: 0.5, color: "#ffffff" },
  { x: 96, delay: 1.1, color: "#f4b8c9" },
  { x: 128, delay: 0.3, color: "#f6c85f" },
  { x: 160, delay: 0.8, color: "#ffffff" },
  { x: 190, delay: 1.4, color: "#f4b8c9" },
];

const sparklePath = (s: number) =>
  `M0 ${-s} L${s * 0.3} ${-s * 0.3} L${s} 0 L${s * 0.3} ${s * 0.3} L0 ${s} L${-s * 0.3} ${s * 0.3} L${-s} 0 L${-s * 0.3} ${-s * 0.3} Z`;

const heartPath = (s: number) =>
  `M0 ${3 * s} C${-6 * s} ${-3 * s} ${-6 * s} ${-8 * s} 0 ${-5 * s} C${6 * s} ${-8 * s} ${6 * s} ${-3 * s} 0 ${3 * s} Z`;

/* All bunny animations live here, so no change to index.css is needed. */
const bunnyStyles = `
.bunny-float{animation:bunny-float 3.4s ease-in-out infinite}
@keyframes bunny-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-3px)}}

.bunny-shadow{transform-box:fill-box;transform-origin:50% 50%;animation:bunny-shadow 3.4s ease-in-out infinite}
@keyframes bunny-shadow{0%,100%{transform:scaleX(1)}50%{transform:scaleX(.92)}}

.bunny-breathe{transform-box:fill-box;transform-origin:50% 100%;animation:bunny-breathe 3.4s ease-in-out infinite}
@keyframes bunny-breathe{0%,100%{transform:scale(1,1)}50%{transform:scale(1.012,1.02)}}

.bunny-look{transition:transform .25s ease-out;transform:translate(calc((var(--tw,0) * var(--tx,0) + (1 - var(--tw,0)) * var(--cx,0)) * 4px),calc((var(--tw,0) * var(--ty,0) + (1 - var(--tw,0)) * var(--cy,0)) * 3px))}
.bunny-lid{transform-box:fill-box;transform-origin:50% 50%}
.bunny-blink{transform-box:fill-box;transform-origin:50% 50%;animation:bunny-blink 4.6s infinite}
@keyframes bunny-blink{0%,90%,100%{transform:scaleY(1)}93%{transform:scaleY(.08)}96%{transform:scaleY(1)}}

.bunny-ear{transform-box:fill-box;transform-origin:50% 100%}
.bunny-twitch-l{animation:bunny-twitch-l 6.5s ease-in-out infinite}
.bunny-twitch-r{animation:bunny-twitch-r 8.5s ease-in-out 2s infinite}
@keyframes bunny-twitch-l{0%,88%,100%{transform:rotate(0)}91%{transform:rotate(-9deg)}94%{transform:rotate(3deg)}97%{transform:rotate(-4deg)}}
@keyframes bunny-twitch-r{0%,88%,100%{transform:rotate(0)}91%{transform:rotate(9deg)}94%{transform:rotate(-3deg)}97%{transform:rotate(4deg)}}

.bunny-whisker-l{transform-box:fill-box;transform-origin:100% 50%;animation:bunny-whisker-l 2.8s ease-in-out infinite}
.bunny-whisker-r{transform-box:fill-box;transform-origin:0% 50%;animation:bunny-whisker-r 2.8s ease-in-out infinite}
@keyframes bunny-whisker-l{0%,100%{transform:rotate(0)}50%{transform:rotate(4deg)}}
@keyframes bunny-whisker-r{0%,100%{transform:rotate(0)}50%{transform:rotate(-4deg)}}

.bunny-nose{transform-box:fill-box;transform-origin:50% 50%;animation:bunny-nose 3.2s infinite}
@keyframes bunny-nose{0%,70%,100%{transform:scale(1)}74%,82%{transform:scale(1.18,.9)}78%,86%{transform:scale(1)}}

.bunny-joint{transition:transform .6s cubic-bezier(.34,1.4,.64,1)}
.bunny-idle-l{animation:bunny-idle-l 3.4s ease-in-out infinite}
.bunny-idle-r{animation:bunny-idle-r 3.4s ease-in-out infinite}
@keyframes bunny-idle-l{0%,100%{transform:rotate(0)}50%{transform:rotate(2.5deg)}}
@keyframes bunny-idle-r{0%,100%{transform:rotate(0)}50%{transform:rotate(-2.5deg)}}
.bunny-pump-l{animation:bunny-pump-l .5s ease-in-out infinite alternate}
.bunny-pump-r{animation:bunny-pump-r .5s ease-in-out infinite alternate}
.bunny-pump-l.bunny-fast,.bunny-pump-r.bunny-fast{animation-duration:.3s}
@keyframes bunny-pump-l{0%{transform:rotate(-9deg)}100%{transform:rotate(9deg)}}
@keyframes bunny-pump-r{0%{transform:rotate(9deg)}100%{transform:rotate(-9deg)}}
.bunny-wave{animation:bunny-wave .55s ease-in-out infinite alternate}
@keyframes bunny-wave{0%{transform:rotate(-22deg)}100%{transform:rotate(22deg)}}
.bunny-tap{animation:bunny-tap .9s ease-in-out infinite alternate}
@keyframes bunny-tap{0%{transform:rotate(-4deg)}100%{transform:rotate(5deg)}}

.bunny-mood{transform-box:fill-box;transform-origin:50% 100%}
.bunny-mood-sad{animation:bunny-sway 4s ease-in-out infinite}
.bunny-mood-thinking{animation:bunny-tilt 3s ease-in-out infinite}
.bunny-mood-happy{animation:bunny-bob 1.8s ease-in-out infinite}
.bunny-mood-confused{animation:bunny-shake .7s ease-in-out 1}
.bunny-mood-excited{animation:bunny-hop .7s ease-in-out infinite}
.bunny-mood-celebrating{animation:bunny-hop .55s ease-in-out infinite}
.bunny-mood-loved{animation:bunny-wiggle .5s ease-in-out 3}
@keyframes bunny-sway{0%,100%{transform:rotate(-1.5deg)}50%{transform:rotate(1.5deg)}}
@keyframes bunny-tilt{0%,100%{transform:rotate(0)}40%,70%{transform:rotate(-6deg)}}
@keyframes bunny-bob{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}
@keyframes bunny-shake{0%,100%{transform:rotate(0)}20%{transform:rotate(-7deg)}40%{transform:rotate(6deg)}60%{transform:rotate(-4deg)}80%{transform:rotate(3deg)}}
@keyframes bunny-hop{0%,100%{transform:translateY(0) scale(1.03,.96)}45%{transform:translateY(-13px) scale(.97,1.04)}}
@keyframes bunny-wiggle{0%,100%{transform:rotate(0) scale(1)}25%{transform:rotate(-6deg) scale(1.04)}75%{transform:rotate(6deg) scale(1.04)}}

.bunny-twinkle{transform-box:fill-box;transform-origin:50% 50%;animation:bunny-twinkle 1.3s ease-in-out infinite}
@keyframes bunny-twinkle{0%,100%{transform:scale(.6);opacity:.55}50%{transform:scale(1.1);opacity:1}}

.bunny-dot{animation:bunny-dot 1.2s ease-in-out infinite}
@keyframes bunny-dot{0%,80%,100%{opacity:.25;transform:translateY(0)}40%{opacity:1;transform:translateY(-3px)}}

.bunny-tear{animation:bunny-tear 3s ease-in infinite}
@keyframes bunny-tear{0%,8%{opacity:0;transform:translateY(0)}18%{opacity:1}80%{opacity:.9;transform:translateY(22px)}100%{opacity:0;transform:translateY(26px)}}

.bunny-heart{animation:bunny-heart 1.8s ease-out infinite}
@keyframes bunny-heart{0%{opacity:0;transform:translateY(20px) scale(.5)}20%{opacity:1}100%{opacity:0;transform:translateY(-38px) scale(1.15)}}

.bunny-confetti{transform-box:fill-box;transform-origin:50% 50%;animation:bunny-fall 2.2s linear infinite}
@keyframes bunny-fall{0%{transform:translateY(0) rotate(0);opacity:0}10%{opacity:1}100%{transform:translateY(190px) rotate(360deg);opacity:0}}

.bunny-bubble{animation:bunny-pop .35s ease-out}
@keyframes bunny-pop{0%{opacity:0;transform:translateY(6px) scale(.97)}100%{opacity:1;transform:translateY(0) scale(1)}}

@media (prefers-reduced-motion:reduce){[class*="bunny-"]{animation:none !important}}
`;

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

function Arm({
  side,
  pose,
  motion,
}: {
  side: "l" | "r";
  pose: [number, number];
  motion?: ArmMotion;
}) {
  const [shoulderAngle, elbowAngle] = pose;
  const x = side === "l" ? 78 : 142;

  const shoulderClass =
    motion === "pump" || motion === "pump-fast"
      ? `bunny-pump-${side}${motion === "pump-fast" ? " bunny-fast" : ""}`
      : `bunny-idle-${side}`;

  const elbowClass =
    motion === "wave" ? "bunny-wave" : motion === "tap" ? "bunny-tap" : "";

  return (
    <g transform={`translate(${x} 188)`}>
      <g
        className="bunny-joint"
        style={{ transform: `rotate(${shoulderAngle}deg)` }}
      >
        <g className={shoulderClass}>
          {/* Upper arm */}
          <rect
            x="-7.5"
            y="-6"
            width="15"
            height="44"
            rx="7.5"
            fill="#fff"
            stroke="#c5e8ef"
            strokeWidth="3"
          />

          <g transform="translate(0 38)">
            <g
              className="bunny-joint"
              style={{ transform: `rotate(${elbowAngle}deg)` }}
            >
              <g className={elbowClass}>
                {/* Forearm */}
                <rect
                  x="-7"
                  y="-6"
                  width="14"
                  height="44"
                  rx="7"
                  fill="#fff"
                  stroke="#c5e8ef"
                  strokeWidth="3"
                />

                {/* Hand */}
                <g transform="translate(0 36)">
                  <circle r="12" fill="#fff" stroke="#c5e8ef" strokeWidth="3" />
                  <ellipse cy="3" rx="5" ry="4" fill="#f4b8c9" opacity=".85" />
                  <circle cx="-5" cy="-4.5" r="1.8" fill="#f4b8c9" />
                  <circle cx="0" cy="-6.5" r="1.8" fill="#f4b8c9" />
                  <circle cx="5" cy="-4.5" r="1.8" fill="#f4b8c9" />
                </g>
              </g>
            </g>
          </g>
        </g>
      </g>
    </g>
  );
}

function Bunny({
  mood,
  look,
  energy = 0,
  onPoke,
}: {
  mood: BunnyMood;
  look?: { x: number; y: number };
  energy?: number;
  onPoke?: () => void;
}) {
  const svgRef = useRef<SVGSVGElement>(null);

  /* The eyes follow your cursor whenever you're not typing */
  useEffect(() => {
    function onMove(event: PointerEvent) {
      const svg = svgRef.current;

      if (!svg) return;

      const box = svg.getBoundingClientRect();
      const dx =
        (event.clientX - (box.left + box.width / 2)) /
        Math.max(window.innerWidth / 2, 300);
      const dy =
        (event.clientY - (box.top + box.height * 0.4)) /
        Math.max(window.innerHeight / 2, 300);

      svg.style.setProperty("--cx", String(clamp(dx * 1.6, -1, 1)));
      svg.style.setProperty("--cy", String(clamp(dy * 1.6, -1, 1)));
    }

    window.addEventListener("pointermove", onMove);

    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  const arms = armPoses[mood];
  const tilt = mood === "shy" ? earTilt.shy - energy * 14 : earTilt[mood];

  const eyesClosed = mood === "shy";
  const happyEyes = mood === "celebrating" || mood === "loved";
  const bigEyes = mood === "excited";
  const openMouth =
    mood === "excited" || mood === "celebrating" || mood === "loved";
  const proudShy = mood === "shy" && energy >= 1;

  const blush =
    mood === "loved"
      ? 1
      : mood === "celebrating"
        ? 0.9
        : mood === "shy"
          ? 0.65 + energy * 0.35
          : 0.65;

  const ink = "#35434b";

  const svgStyle = {
    "--tw": look ? 1 : 0,
    "--tx": look ? look.x : 0,
    "--ty": look ? look.y : 0,
  } as CSSProperties;

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label="MamaRise bunny. Press to pet it."
      onClick={onPoke}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onPoke?.();
        }
      }}
      className="relative mx-auto aspect-[220/290] w-36 cursor-pointer rounded-3xl outline-none focus-visible:ring-2 focus-visible:ring-white sm:w-40"
    >
      <style>{bunnyStyles}</style>

      <svg
        ref={svgRef}
        viewBox="0 -16 220 290"
        aria-hidden="true"
        style={svgStyle}
        className="h-full w-full overflow-visible"
      >
        <defs>
          <radialGradient id="bunnyFaceGrad" cx="50%" cy="38%" r="68%">
            <stop offset="0" stopColor="#ffffff" />
            <stop offset="1" stopColor="#e9f7fa" />
          </radialGradient>
          <radialGradient id="bunnyBodyGrad" cx="50%" cy="30%" r="75%">
            <stop offset="0" stopColor="#ffffff" />
            <stop offset="1" stopColor="#e4f4f8" />
          </radialGradient>
          <linearGradient id="bunnyEarGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#f9ccda" />
            <stop offset="1" stopColor="#f0a6bd" />
          </linearGradient>
        </defs>

        <ellipse
          className="bunny-shadow"
          cx="110"
          cy="270"
          rx="62"
          ry="8"
          fill="#082f5c"
          opacity=".25"
        />

        <g className="bunny-float">
          <g className={`bunny-mood bunny-mood-${mood}`}>
            {/* Feet */}
            <ellipse
              cx="88"
              cy="260"
              rx="19"
              ry="10"
              fill="url(#bunnyBodyGrad)"
              stroke="#c5e8ef"
              strokeWidth="3"
            />
            <ellipse
              cx="132"
              cy="260"
              rx="19"
              ry="10"
              fill="url(#bunnyBodyGrad)"
              stroke="#c5e8ef"
              strokeWidth="3"
            />
            <ellipse cx="88" cy="263" rx="8" ry="4" fill="#f4b8c9" />
            <ellipse cx="132" cy="263" rx="8" ry="4" fill="#f4b8c9" />

            {/* Body with a little heart */}
            <ellipse
              cx="110"
              cy="222"
              rx="50"
              ry="40"
              fill="url(#bunnyBodyGrad)"
              stroke="#c5e8ef"
              strokeWidth="3"
            />
            <g transform="translate(110 228)">
              <path d={heartPath(1.7)} fill="#f4b8c9" />
            </g>

            {/* Left ear */}
            <g
              className="bunny-ear"
              style={{
                transform: `rotate(${-tilt}deg)`,
                transition: "transform .5s ease",
              }}
            >
              <g className="bunny-ear bunny-twitch-l">
                <ellipse
                  cx="80"
                  cy="48"
                  rx="21"
                  ry="52"
                  fill="#fff"
                  stroke="#c5e8ef"
                  strokeWidth="3"
                />
                <ellipse
                  cx="80"
                  cy="52"
                  rx="9"
                  ry="37"
                  fill="url(#bunnyEarGrad)"
                />
              </g>
            </g>

            {/* Right ear with a bow */}
            <g
              className="bunny-ear"
              style={{
                transform: `rotate(${tilt}deg)`,
                transition: "transform .5s ease",
              }}
            >
              <g className="bunny-ear bunny-twitch-r">
                <ellipse
                  cx="140"
                  cy="48"
                  rx="21"
                  ry="52"
                  fill="#fff"
                  stroke="#c5e8ef"
                  strokeWidth="3"
                />
                <ellipse
                  cx="140"
                  cy="52"
                  rx="9"
                  ry="37"
                  fill="url(#bunnyEarGrad)"
                />
                <g transform="translate(149 30)">
                  <path
                    d="M0 0 C-6 -11 -20 -9 -19 0 C-20 9 -6 11 0 0Z"
                    fill="#ed8ca9"
                    stroke="#d46f90"
                    strokeWidth="1.5"
                  />
                  <path
                    d="M0 0 C6 -11 20 -9 19 0 C20 9 6 11 0 0Z"
                    fill="#ed8ca9"
                    stroke="#d46f90"
                    strokeWidth="1.5"
                  />
                  <circle
                    r="4.5"
                    fill="#f4b8c9"
                    stroke="#d46f90"
                    strokeWidth="1.5"
                  />
                </g>
              </g>
            </g>

            {/* Face */}
            <g className="bunny-breathe">
              <circle
                cx="110"
                cy="123"
                r="66"
                fill="url(#bunnyFaceGrad)"
                stroke="#c5e8ef"
                strokeWidth="3"
              />

              {/* Cheeks */}
              <ellipse
                cx="67"
                cy="135"
                rx="13"
                ry="8"
                fill="#f4b8c9"
                opacity={blush}
                style={{ transition: "opacity .4s ease" }}
              />
              <ellipse
                cx="153"
                cy="135"
                rx="13"
                ry="8"
                fill="#f4b8c9"
                opacity={blush}
                style={{ transition: "opacity .4s ease" }}
              />

              {/* Whiskers */}
              <g
                className="bunny-whisker-l"
                stroke="#c5e8ef"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <path d="M62 138 L36 132" />
                <path d="M62 144 L34 146" />
                <path d="M63 150 L38 159" />
              </g>
              <g
                className="bunny-whisker-r"
                stroke="#c5e8ef"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <path d="M158 138 L184 132" />
                <path d="M158 144 L186 146" />
                <path d="M157 150 L182 159" />
              </g>

              {/* Brows */}
              <g
                fill="none"
                stroke={ink}
                strokeWidth="3.5"
                strokeLinecap="round"
              >
                {mood === "sad" && (
                  <>
                    <path d="M80 96 L101 88" />
                    <path d="M119 88 L140 96" />
                  </>
                )}
                {mood === "confused" && (
                  <>
                    <path d="M81 90 Q91 83 101 90" />
                    <path d="M119 96 L139 93" />
                  </>
                )}
                {mood === "thinking" && <path d="M119 91 Q129 83 139 91" />}
              </g>

              {/* Eyes */}
              {happyEyes ? (
                <g
                  fill="none"
                  stroke={ink}
                  strokeWidth="4"
                  strokeLinecap="round"
                >
                  <path d="M83 108 Q92 94 101 108" />
                  <path d="M119 108 Q128 94 137 108" />
                </g>
              ) : (
                <g className="bunny-look">
                  <g
                    className="bunny-lid"
                    style={{
                      transform: `scaleY(${eyesClosed ? 0.1 : 1})`,
                      transition: "transform .25s ease",
                    }}
                  >
                    <g className="bunny-blink">
                      <ellipse
                        cx="92"
                        cy="108"
                        rx={bigEyes ? 5.5 : 4.5}
                        ry={bigEyes ? 9 : 7.5}
                        fill={ink}
                        stroke={ink}
                        strokeWidth="2"
                        vectorEffect="non-scaling-stroke"
                      />
                      <ellipse
                        cx="128"
                        cy="108"
                        rx={bigEyes ? 5.5 : 4.5}
                        ry={bigEyes ? 9 : 7.5}
                        fill={ink}
                        stroke={ink}
                        strokeWidth="2"
                        vectorEffect="non-scaling-stroke"
                      />
                      <circle cx="94" cy="105" r="2" fill="#fff" />
                      <circle cx="130" cy="105" r="2" fill="#fff" />
                      {bigEyes && (
                        <>
                          <circle cx="90" cy="111" r="1.4" fill="#fff" />
                          <circle cx="126" cy="111" r="1.4" fill="#fff" />
                        </>
                      )}
                    </g>
                  </g>
                </g>
              )}

              {/* Nose */}
              <path
                className="bunny-nose"
                d="M105 126 Q110 121 115 126 Q110 134 105 126"
                fill="#ed8ca9"
              />

              {/* Mouth */}
              {mood === "sad" ? (
                <path
                  d="M100 148 Q110 137 120 148"
                  fill="none"
                  stroke={ink}
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              ) : mood === "confused" ? (
                <path
                  d="M102 145 Q107 141 111 145 T120 145"
                  fill="none"
                  stroke={ink}
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              ) : mood === "thinking" ? (
                <ellipse
                  cx="110"
                  cy="146"
                  rx="4"
                  ry="5"
                  fill="#ed8ca9"
                  stroke={ink}
                  strokeWidth="2.5"
                />
              ) : openMouth ? (
                <path
                  d="M97 140 Q110 164 123 140 Z"
                  fill="#ed8ca9"
                  stroke={ink}
                  strokeWidth="3"
                  strokeLinejoin="round"
                />
              ) : mood === "shy" && !proudShy ? (
                <path
                  d="M101 143 Q110 150 119 143"
                  fill="none"
                  stroke={ink}
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              ) : (
                <path
                  d="M98 141 Q110 158 122 141"
                  fill="none"
                  stroke={ink}
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              )}
            </g>

            {/* Arms and hands */}
            <Arm side="l" pose={arms.l} motion={arms.lMotion} />
            <Arm side="r" pose={arms.r} motion={arms.rMotion} />

            {/* Tear while sad */}
            {mood === "sad" && (
              <path
                className="bunny-tear"
                d="M86 120 q-5 8 0 11 q5 -3 0 -11 Z"
                fill="#7fd3e3"
              />
            )}
          </g>

          {/* Mood decorations */}
          {mood === "thinking" && (
            <g fill="#fff">
              <circle
                className="bunny-dot"
                cx="176"
                cy="64"
                r="4"
                style={{ animationDelay: "0s" }}
              />
              <circle
                className="bunny-dot"
                cx="190"
                cy="48"
                r="5"
                style={{ animationDelay: ".2s" }}
              />
              <circle
                className="bunny-dot"
                cx="205"
                cy="28"
                r="6.5"
                style={{ animationDelay: ".4s" }}
              />
            </g>
          )}

          {mood === "confused" && (
            <text
              className="bunny-twinkle"
              x="170"
              y="50"
              fontSize="34"
              fontWeight="800"
              fill="#fff"
            >
              ?
            </text>
          )}

          {(mood === "excited" || mood === "celebrating") && (
            <g fill="#f6c85f">
              <g transform="translate(26 96)">
                <path className="bunny-twinkle" d={sparklePath(13)} />
              </g>
              <g transform="translate(196 92)">
                <path
                  className="bunny-twinkle"
                  d={sparklePath(11)}
                  style={{ animationDelay: ".4s" }}
                />
              </g>
              <g transform="translate(200 160)">
                <path
                  className="bunny-twinkle"
                  d={sparklePath(8)}
                  style={{ animationDelay: ".8s" }}
                />
              </g>
            </g>
          )}

          {mood === "loved" && (
            <g fill="#f4a0b8">
              <g transform="translate(58 40)">
                <path
                  className="bunny-heart"
                  d={heartPath(2.2)}
                  style={{ animationDelay: "0s" }}
                />
              </g>
              <g transform="translate(112 14)">
                <path
                  className="bunny-heart"
                  d={heartPath(2.8)}
                  style={{ animationDelay: ".5s" }}
                />
              </g>
              <g transform="translate(164 42)">
                <path
                  className="bunny-heart"
                  d={heartPath(2)}
                  style={{ animationDelay: "1s" }}
                />
              </g>
            </g>
          )}

          {mood === "celebrating" &&
            confetti.map((piece) => (
              <rect
                key={piece.x}
                className="bunny-confetti"
                x={piece.x}
                y="-12"
                width="7"
                height="11"
                rx="2"
                fill={piece.color}
                style={{ animationDelay: `${piece.delay}s` }}
              />
            ))}
        </g>
      </svg>
    </div>
  );
}

function BunnyMessage({ message }: { message: string }) {
  return (
    <div
      key={message}
      role="status"
      aria-live="polite"
      className="bunny-bubble relative mt-4 rounded-2xl bg-white px-4 py-3 text-center text-sm font-semibold leading-6 text-[#0d5694] shadow-lg shadow-[#082f5c]/20"
    >
      <div className="absolute -top-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 bg-white" />
      {message}
    </div>
  );
}

export default function ForgotPasswordPage() {
  const navigate = useNavigate();

  const [stage, setStage] = useState<RecoveryStage>("contact");
  const [contactMethod, setContactMethod] = useState<ContactMethod>("phone");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [resetToken, setResetToken] = useState("");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [isPoked, setIsPoked] = useState(false);
  const pokeTimer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(pokeTimer.current), []);

  const passwordStrength = passwordRules.filter((rule) =>
    rule.test(newPassword),
  ).length;

  const contactLength =
    contactMethod === "phone" ? phoneNumber.length : email.length;

  const baseMood: BunnyMood =
    stage === "success"
      ? "celebrating"
      : isSubmitting
        ? "thinking"
        : stage === "password"
          ? isPasswordFocused
            ? "shy"
            : errorMessage
              ? "confused"
              : "excited"
          : stage === "code"
            ? errorMessage
              ? "confused"
              : "happy"
            : errorMessage
              ? "confused"
              : "sad";

  /* Pet the bunny and it melts. It won't be interrupted while hiding its eyes. */
  const mood: BunnyMood =
    isPoked &&
    baseMood !== "shy" &&
    baseMood !== "thinking" &&
    baseMood !== "celebrating"
      ? "loved"
      : baseMood;

  function handlePoke() {
    setIsPoked(true);
    window.clearTimeout(pokeTimer.current);
    pokeTimer.current = window.setTimeout(() => setIsPoked(false), 2200);
  }

  /* Where the bunny looks while you type. Undefined means it follows the cursor. */
  let look: { x: number; y: number } | undefined;

  if (mood === "thinking") {
    look = { x: 0.9, y: -0.9 };
  } else if (stage === "contact" && contactLength > 0) {
    look = { x: Math.min(contactLength / 24, 1) * 2 - 1, y: 0.7 };
  } else if (stage === "code" && otpCode.length > 0) {
    look = { x: (otpCode.length / 6) * 2 - 1, y: 0.7 };
  }

  const passwordsMatch =
    confirmPassword.length > 0 && confirmPassword === newPassword;

  /* The bunny reacts to how you're feeling and what you're doing */
  let bunnyMessage: string;

  switch (mood) {
    case "celebrating":
      bunnyMessage = "Yaaay! You're back in control. Welcome back to MamaRise!";
      break;
    case "loved":
      bunnyMessage = "Hehe, that tickles! Thank you, I really needed that.";
      break;
    case "thinking":
      bunnyMessage = "Mmmmmh... hang on, I'm taking care of that for you!";
      break;
    case "shy":
      bunnyMessage =
        passwordStrength === 5
          ? "I'm not peeking... but that sounds like a strong one!"
          : "Shhh... I'm not looking! Type your new password in private.";
      break;
    case "excited":
      bunnyMessage =
        passwordStrength === 5 && passwordsMatch
          ? "Strong and matching! You're ready to reset it."
          : "Perfect! Let's get your account secured again!";
      break;
    case "confused":
      bunnyMessage =
        stage === "code"
          ? "That code didn't match. No worries, it happens. Check it and try again!"
          : stage === "contact"
            ? "I couldn't send that one. Let's double-check your details together."
            : "Hmm, something's off. Take your time, we'll fix it together.";
      break;
    case "happy":
      bunnyMessage =
        otpCode.length === 6
          ? "All six digits! Let's see if that's the one."
          : "Check your phone or email! Your code might be waiting for you.";
      break;
    default:
      bunnyMessage =
        contactLength > 0
          ? "Take your time, I'm right here with you."
          : "Oooh, you've forgotten your password? Don't worry. I'll help you!";
  }

  async function handleRequestCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setIsSubmitting(true);

    try {
      if (contactMethod === "phone") {
        await forgotPassword({ phone_number: phoneNumber.trim() });
      } else {
        await forgotPassword({ email: email.trim() });
      }
      setStage("code");
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "We couldn't process your request. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleVerifyCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setIsSubmitting(true);

    try {
      const token =
        contactMethod === "phone"
          ? await verifyResetCode({
              phone_number: phoneNumber.trim(),
              otp_code: otpCode.trim(),
            })
          : await verifyResetCode({
              email: email.trim(),
              otp_code: otpCode.trim(),
            });

      setResetToken(token);
      setStage("password");
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "That code is incorrect or has expired.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleResetPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");

    if (newPassword !== confirmPassword) {
      setErrorMessage("Your passwords don't match. Try again!");
      return;
    }

    if (passwordStrength !== passwordRules.length) {
      setErrorMessage("Please meet all the password requirements.");
      return;
    }

    setIsSubmitting(true);

    try {
      await resetPassword({
        reset_token: resetToken,
        new_password: newPassword,
      });

      setResetToken("");
      setNewPassword("");
      setConfirmPassword("");
      setStage("success");
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "We couldn't reset your password. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  function changeContactMethod(method: ContactMethod) {
    setContactMethod(method);
    setErrorMessage("");
  }

  return (
    <main className="relative isolate flex min-h-screen items-center justify-center overflow-hidden bg-[#e6f5f8] p-4 font-sans sm:p-8">
      <div className="pointer-events-none absolute -right-24 -top-24 -z-10 h-96 w-96 rounded-full bg-[#3cc3dd]/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -left-20 -z-10 h-96 w-96 rounded-full bg-[#0d5694]/15 blur-3xl" />

      <section className="relative w-full max-w-md rounded-[1.75rem] bg-white p-5 shadow-2xl shadow-[#0d5694]/20 sm:p-8">
        <div className="mb-5 flex items-center justify-between">
          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-xs font-bold text-[#626569] transition hover:text-[#0d5694]"
          >
            <ArrowLeft size={16} />
            Back to login
          </Link>

          <span className="text-lg font-extrabold tracking-tight text-[#626569]">
            MamaRise
          </span>
        </div>

        {/* Bunny stage */}
        <div className="relative mb-7 overflow-hidden rounded-3xl bg-gradient-to-br from-[#3cc3dd] via-[#1a77ab] to-[#0d5694] px-5 pb-5 pt-6 shadow-lg shadow-[#0d5694]/20">
          <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10" />
          <div className="pointer-events-none absolute -bottom-14 -left-10 h-40 w-40 rounded-full bg-white/10" />
          <div className="pointer-events-none absolute left-6 top-8 h-6 w-6 rotate-12 rounded-lg bg-white/20" />
          <div className="pointer-events-none absolute bottom-28 right-6 h-5 w-5 rotate-12 rounded-md bg-white/20" />
          <div className="pointer-events-none absolute left-1/2 top-6 h-48 w-48 -translate-x-1/2 rounded-full bg-white/15 blur-2xl" />
          <div className="pointer-events-none absolute left-10 top-24 h-1.5 w-1.5 animate-pulse rounded-full bg-white/70" />
          <div
            className="pointer-events-none absolute right-12 top-14 h-1.5 w-1.5 animate-pulse rounded-full bg-white/70"
            style={{ animationDelay: "0.8s" }}
          />
          <div
            className="pointer-events-none absolute bottom-40 left-5 h-1 w-1 animate-pulse rounded-full bg-white/70"
            style={{ animationDelay: "1.4s" }}
          />

          <div className="relative">
            <Bunny
              mood={mood}
              look={look}
              energy={stage === "password" ? passwordStrength / 5 : 0}
              onPoke={handlePoke}
            />
            <BunnyMessage message={bunnyMessage} />
          </div>
        </div>

        {stage === "contact" && (
          <>
            <div className="mb-6 text-center">
              <h1 className="text-2xl font-extrabold text-[#626569]">
                Reset your password
              </h1>
              <p className="mt-2 text-sm leading-6 text-[#626569]">
                Choose where you'd like us to send your verification code.
              </p>
            </div>

            <div className="mb-5 grid grid-cols-2 gap-2">
              {(
                [
                  ["phone", "Phone", Phone],
                  ["email", "Email", Mail],
                ] as const
              ).map(([value, label, Icon]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => changeContactMethod(value)}
                  aria-pressed={contactMethod === value}
                  className={`flex items-center justify-center gap-2 rounded-lg border py-3 text-sm font-bold transition ${
                    contactMethod === value
                      ? `border-transparent ${gradientButton}`
                      : "border-[#d3eaf0] bg-[#f3fafc] text-[#626569] hover:border-[#3cc3dd]"
                  }`}
                >
                  <Icon size={17} />
                  {label}
                </button>
              ))}
            </div>

            <form onSubmit={handleRequestCode} className="space-y-4">
              {contactMethod === "phone" ? (
                <div>
                  <label htmlFor="phone" className={labelClass}>
                    Phone number
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    value={phoneNumber}
                    onChange={(event) => setPhoneNumber(event.target.value)}
                    placeholder="+254 7XX XXX XXX"
                    autoComplete="tel"
                    required
                    className={inputClass}
                  />
                </div>
              ) : (
                <div>
                  <label htmlFor="email" className={labelClass}>
                    Email address
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@example.com"
                    autoComplete="email"
                    required
                    className={inputClass}
                  />
                </div>
              )}

              {errorMessage && (
                <p role="alert" className={alertClass}>
                  {errorMessage}
                </p>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className={buttonClass}
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw size={17} className="animate-spin" />
                    Sending code...
                  </>
                ) : (
                  "Send verification code"
                )}
              </button>
            </form>
          </>
        )}

        {stage === "code" && (
          <>
            <div className="mb-6 text-center">
              <h1 className="text-2xl font-extrabold text-[#626569]">
                Verify your code
              </h1>
              <p className="mt-2 text-sm leading-6 text-[#626569]">
                If an account is linked to that contact, a verification code is
                on its way. Check your messages!
              </p>
            </div>

            <form onSubmit={handleVerifyCode} className="space-y-4">
              <div>
                <label htmlFor="otp" className={labelClass}>
                  Six-digit verification code
                </label>
                <input
                  id="otp"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  pattern="[0-9]{6}"
                  value={otpCode}
                  onChange={(event) =>
                    setOtpCode(
                      event.target.value.replace(/\D/g, "").slice(0, 6),
                    )
                  }
                  placeholder="000000"
                  required
                  className={`${inputClass} text-center text-2xl font-extrabold tracking-[0.5em]`}
                />
              </div>

              {errorMessage && (
                <p role="alert" className={alertClass}>
                  {errorMessage}
                </p>
              )}

              <button
                type="submit"
                disabled={isSubmitting || otpCode.length !== 6}
                className={buttonClass}
              >
                {isSubmitting ? "Checking code..." : "Verify code"}
              </button>

              <button
                type="button"
                onClick={() => {
                  setStage("contact");
                  setOtpCode("");
                  setErrorMessage("");
                }}
                className="w-full text-center text-xs font-bold text-[#0d5694] hover:underline"
              >
                Change phone number or email
              </button>
            </form>
          </>
        )}

        {stage === "password" && (
          <>
            <div className="mb-6 text-center">
              <h1 className="text-2xl font-extrabold text-[#626569]">
                Create a new password
              </h1>
              <p className="mt-2 text-sm leading-6 text-[#626569]">
                Choose a strong password to protect your MamaRise account.
              </p>
            </div>

            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label htmlFor="newPassword" className={labelClass}>
                  New password
                </label>
                <div className="relative">
                  <input
                    id="newPassword"
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    onFocus={() => setIsPasswordFocused(true)}
                    onBlur={() => setIsPasswordFocused(false)}
                    autoComplete="new-password"
                    placeholder="Enter new password"
                    required
                    className={`${inputClass} pr-12`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#0d5694] hover:text-[#3cc3dd]"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="space-y-2 rounded-2xl bg-[#e6f5f8] p-4">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-bold text-[#626569]">
                    Password strength
                  </span>
                  <span className="text-xs font-extrabold text-[#0d5694]">
                    {passwordStrength}/5
                  </span>
                </div>

                <div className="flex gap-1">
                  {passwordRules.map((rule, index) => (
                    <div
                      key={rule.label}
                      className={`h-1.5 flex-1 rounded-full transition-colors ${
                        index < passwordStrength
                          ? "bg-gradient-to-r from-[#3cc3dd] to-[#0d5694]"
                          : "bg-white"
                      }`}
                    />
                  ))}
                </div>

                {passwordRules.map((rule) => {
                  const passed = rule.test(newPassword);

                  return (
                    <div
                      key={rule.label}
                      className="flex items-center gap-2 text-xs"
                    >
                      <Check
                        size={14}
                        className={passed ? "text-[#0d5694]" : "text-[#aab5ba]"}
                      />
                      <span
                        className={
                          passed
                            ? "font-semibold text-[#0d5694]"
                            : "text-[#626569]"
                        }
                      >
                        {rule.label}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div>
                <label htmlFor="confirmPassword" className={labelClass}>
                  Confirm new password
                </label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    onFocus={() => setIsPasswordFocused(true)}
                    onBlur={() => setIsPasswordFocused(false)}
                    autoComplete="new-password"
                    placeholder="Confirm new password"
                    required
                    className={`${inputClass} pr-12`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label={
                      showConfirmPassword ? "Hide password" : "Show password"
                    }
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#0d5694] hover:text-[#3cc3dd]"
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}
                  </button>
                </div>
              </div>

              {errorMessage && (
                <p role="alert" className={alertClass}>
                  {errorMessage}
                </p>
              )}

              <button
                type="submit"
                disabled={
                  isSubmitting || passwordStrength !== 5 || !confirmPassword
                }
                className={buttonClass}
              >
                {isSubmitting ? "Resetting password..." : "Reset password"}
              </button>
            </form>
          </>
        )}

        {stage === "success" && (
          <div className="text-center">
            <div className="mb-4 flex justify-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[#3cc3dd] to-[#0d5694] text-white shadow-lg shadow-[#0d5694]/25">
                <ShieldCheck size={30} />
              </div>
            </div>

            <h1 className="text-2xl font-extrabold text-[#626569]">
              Password changed!
            </h1>

            <p className="mt-3 text-sm leading-6 text-[#626569]">
              Your password has been successfully updated. You can now sign in
              using your new password.
            </p>

            <button
              type="button"
              onClick={() => navigate("/login", { replace: true })}
              className={`${buttonClass} mt-7`}
            >
              Continue to login
            </button>
          </div>
        )}

        {stage !== "success" && (
          <div className="mt-7 flex items-center justify-center gap-2 border-t border-[#e6f5f8] pt-5 text-xs text-[#626569]">
            <ShieldCheck size={15} className="text-[#3cc3dd]" />
            Your account recovery is protected.
          </div>
        )}
      </section>
    </main>
  );
}
