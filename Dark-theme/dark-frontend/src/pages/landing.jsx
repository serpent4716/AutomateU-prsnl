"use client"
import { useMemo, useState } from "react"
import Spline from "@splinetool/react-spline"
import GradientText from "../components/GradientText/GradientText.jsx"
import "../components/GradientText/GradientText.css"
import BlurText from "../components/BlurText/BlurText.jsx"

export default function Hero() {
  const [darkMode, setDarkMode] = useState(true)

  // Reflection tune per theme
  const reflectionOpacity = useMemo(() => (darkMode ? 0.22 : 0.12), [darkMode])

  return (
    <div
      data-theme={darkMode ? "dark" : "light"}
      className={`relative flex min-h-screen w-full items-center justify-center overflow-hidden transition-colors duration-500 ${
        darkMode ? "bg-[#0B0D12] text-white" : "bg-[#F6F8FC] text-[#0B1220]"
      }`}
    >
      {/* ===== Gradient Overlays ===== */}
      <div className="pointer-events-none absolute inset-0 -z-20">
        <div
          className="absolute inset-0 animate-gradient-slow"
          style={{
            background: darkMode
              ? "linear-gradient(-45deg, rgba(255,158,74,0.06), rgba(248,60,189,0.06), rgba(31,126,251,0.08), rgba(126,215,255,0.06))"
              : "linear-gradient(-45deg, rgba(255,158,74,0.10), rgba(248,60,189,0.07), rgba(31,126,251,0.07), rgba(126,215,255,0.06))",
            backgroundSize: "400% 400%",
          }}
        />
      </div>

      {/* ===== Navbar (Simplified) ===== */}
      <header className="absolute left-0 right-0 top-0 z-30 flex items-center justify-between px-6 py-4 md:px-8">
        <div className="flex items-center gap-2.5">
          <div
            className={`flex items-center justify-center h-9 w-9 rounded-xl font-bold text-base ${
              darkMode
                ? "bg-gradient-to-br from-[#FF9E4A] via-[#F83CBD] to-[#1f7efb] text-white shadow-lg shadow-purple-500/20"
                : "bg-gradient-to-br from-[#FF8D3A] via-[#F254B6] to-[#2D7FF7] text-white shadow-lg shadow-blue-500/15"
            }`}
          >
            A
          </div>
          <span
            className={`select-none text-lg font-bold tracking-tight bg-clip-text ${
              darkMode
                ? "text-transparent bg-gradient-to-r from-white to-white/70"
                : "text-transparent bg-gradient-to-r from-[#0B1220] to-[#0B1220]/70"
            }`}
          >
            AutomateU
          </span>
        </div>

        <button
          aria-label="Toggle theme"
          onClick={() => setDarkMode((v) => !v)}
          className={`group inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all duration-300 ${
            darkMode
              ? "bg-white/10 text-white/80 hover:bg-white/15 border border-white/10"
              : "bg-black/5 text-[#0B1220]/80 hover:bg-black/10 border border-black/5"
          } backdrop-blur-sm shadow-[0_4px_16px_rgba(0,0,0,0.12)]`}
        >
          <span className="inline-block h-4 w-4 rounded-full bg-gradient-to-tr from-[#FF9E4A] via-[#F83CBD] to-[#1f7efb]" />
          {darkMode ? "Light" : "Dark"}
        </button>
      </header>

      {/* ===== Foreground Content ===== */}
      <div className="relative z-30 mt-8 flex flex-col items-center justify-center px-6 w-full">
        {/* 3D Stage with floor */}
        <div className="relative w-full max-w-5xl pt-20 pb-20 perspective-1200">
          {/* Floor */}
          <div
            aria-hidden
            className={`absolute left-1/2 top-[58%] -translate-x-1/2 w-[120%] max-w-[1200px] h-[46vh] floor-plane ${
              darkMode ? "floor-dark" : "floor-light"
            }`}
            style={{
              transform: "translateZ(0) rotateX(62deg)",
              transformOrigin: "50% 0%",
              willChange: "transform, opacity",
              opacity: darkMode ? 1 : 1,
            }}
          />

          <div className="relative flex items-center justify-center leading-none whitespace-nowrap mt-20 select-none">
            {/* Left Title */}
            <div style={{ perspective: 900 }} className="shrink-0 relative z-[9999]">
              <GradientText
                className="text-[70px] sm:text-[100px] md:text-[120px] font-extrabold leading-none tracking-tighter text-3d"
                colors={["#D1A9FF", "#F05A6E", "#FF9E4A"]}
                animationSpeed={6}
              >
                Aut
              </GradientText>
            </div>

            {/* Orb */}
            <div className="relative inline-block w-[110px] h-[110px] sm:w-[140px] sm:h-[140px] md:w-[160px] md:h-[160px] -mx-[40px] shrink-0 z-10 orb-wrapper">
              <div aria-hidden className="absolute inset-[-10%] rounded-full orb-halo" />
              <div
                aria-hidden
                className="absolute left-1/2 bottom-[-26%] -translate-x-1/2 h-[26px] w-[68%] rounded-full blur-[10px] opacity-60 orb-shadow"
              />
              <div aria-hidden className="pointer-events-none absolute inset-0 orb-ambient" />
              <div className="absolute inset-0 flex items-center justify-center spline-orb" style={{ zIndex: 10 }}>
                <Spline scene="https://prod.spline.design/sFVNZmY5tr8VKMry/scene.splinecode" />
              </div>
            </div>

            {/* Right Title */}
            <div style={{ perspective: 900 }} className="shrink-0 pr-2">
              <GradientText
                className="pr-2 text-[70px] sm:text-[100px] md:text-[120px] font-extrabold leading-none tracking-tighter"
                colors={["#FF9E4A", "rgba(248,60,189,1)", "#1f7efbff"]}
                animationSpeed={6}
              >
                mate<span className="italic">U</span>
              </GradientText>
            </div>
          </div>

          {/* Reflection */}
          <div
            aria-hidden
            className="pointer-events-none -mt-0 flex items-center justify-center leading-none whitespace-nowrap reflection-mask"
            style={{
              transform: "translateZ(0) rotateX(0.0001deg)",
              opacity: reflectionOpacity,
            }}
          >
            <div className="shrink-0 scale-y-[-1] -translate-y-[20px]">
              <GradientText
                className="text-[70px] sm:text-[100px] md:text-[120px] font-extrabold leading-none tracking-tighter"
                colors={["#D1A9FF", "#F05A6E", "#FF9E4A"]}
                animationSpeed={6}
              >
                Aut
              </GradientText>
            </div>
            <div className="relative inline-block -mx-[25px] shrink-0 h-[36px] w-[120px] sm:w-[160px] md:w-[180px]">
              <div className="absolute left-1/2 top-0 -translate-x-1/2 h-full w-[70%] rounded-full blur-[12px] bg-white/30" />
            </div>
            <div className="shrink-0 pr-2 scale-y-[-1] -translate-y-[20px]">
              <GradientText
                className="pr-2 text-[70px] sm:text-[100px] md:text-[120px] font-extrabold leading-none tracking-tighter"
                colors={["#FF9E4A", "rgba(248,60,189,1)", "#1f7efbff"]}
                animationSpeed={6}
              >
                mate<span className="italic">U</span>
              </GradientText>
            </div>
          </div>

          <div className="relative z-20 -mt-120 sm:-mt-24 md:-mt-28 flex flex-col items-center">
            <BlurText
              text="Automate your college life and beyond."
              className={`select-none text-[16px] sm:text-[20px] md:text-[22px] font-medium ${
                darkMode ? "text-white/85" : "text-[#0B1220]/80"
              }`}
              delay={220}
              animateBy="words"
              direction="top"
            />

            <button
              onClick={() => alert("Get Started clicked!")}
              className={`relative mt-8 sm:mt-7 overflow-hidden rounded-2xl px-10 py-3.5 font-bold transition-all duration-300 ease-out group focus:outline-none text-base sm:text-lg ${
                darkMode
                  ? "text-white bg-gradient-to-r from-[#FF9E4A] via-[#F83CBD] to-[#1f7efb] shadow-lg shadow-purple-500/30"
                  : "text-white bg-gradient-to-r from-[#FF8D3A] via-[#F254B6] to-[#2D7FF7] shadow-lg shadow-blue-500/20"
              }`}
            >
              <span className="relative z-10 flex items-center gap-2">
                Get Started
                <svg
                  className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </span>
            </button>

            <p className={`mt-6 text-sm ${darkMode ? "text-white/60" : "text-[#0B1220]/60"}`}>
              Join thousands of students automating their success
            </p>
          </div>
        </div>
      </div>

      {/* ===== Animations & Styles ===== */}
      <style>{`
        /* Import Figtree and enforce it across this component */
        @import url('https://fonts.googleapis.com/css2?family=Figtree:wght@300;400;600;800&display=swap');

        /* Enforce figtree as the app font inside this component */
        [data-theme] { font-family: 'Figtree', system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; }

        /* Utilities */
        .perspective-1200 { perspective: 1200px; }

        /* Subtle faux-3D depth for title glyphs */
        .text-3d { position: relative; }
        .text-3d::after {
          content: '';
          position: absolute;
          inset: 0;
          transform: translate3d(0, 0.08em, -1px);
          filter: blur(6px);
          opacity: 0.28;
          pointer-events: none;
          mix-blend-mode: multiply;
        }
        [data-theme="light"] .text-3d::after { opacity: 0.18; filter: blur(4px); }

        /* Reflection mask */
        .reflection-mask {
          -webkit-mask-image: linear-gradient(to bottom, rgba(0,0,0,0.85), rgba(0,0,0,0.35) 35%, transparent);
                  mask-image: linear-gradient(to bottom, rgba(0,0,0,0.85), rgba(0,0,0,0.35) 35%, transparent);
          filter: saturate(115%);
        }
        [data-theme="light"] .reflection-mask {
          -webkit-mask-image: linear-gradient(to bottom, rgba(0,0,0,0.6), rgba(0,0,0,0.25) 30%, transparent);
                  mask-image: linear-gradient(to bottom, rgba(0,0,0,0.6), rgba(0,0,0,0.25) 30%, transparent);
          filter: saturate(110%);
        }

        /* Button shadow tuned per theme */
        .shadow-button { box-shadow: 0 10px 40px rgba(248,60,189,0.18); }
        [data-theme="light"] .shadow-button { box-shadow: 0 8px 28px rgba(45,127,247,0.14); }

        @keyframes shine { to { background-position: 200% center; } }
        .animate-shine { animation-name: shine; animation-timing-function: linear; animation-iteration-count: infinite; }
        @keyframes gradient-slow {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-gradient-slow { animation: gradient-slow 22s ease-in-out infinite; }
        @keyframes blurReveal {
          0% { opacity: 0; filter: blur(6px); transform: translateY(8px); }
          60% { opacity: 1; filter: blur(1px); transform: translateY(2px); }
          100% { opacity: 1; filter: blur(0px); transform: translateY(0); }
        }

        /* Realistic orb bounce with squash & shadow coupling */
        @keyframes bounceOrb {
          0%, 100% { transform: translateY(0) scale(1, 1); }
          20% { transform: translateY(-18px) scale(1.02, 0.98); }
          40% { transform: translateY(0) scale(0.985, 1.02); }
          55% { transform: translateY(-8px) scale(1.01, 0.99); }
          70% { transform: translateY(0) scale(0.997, 1.005); }
          85% { transform: translateY(-4px) scale(1.005, 0.997); }
        }
        .spline-orb { animation: bounceOrb 4.8s cubic-bezier(.25, .6, .35, .98) infinite; will-change: transform; }
        .orb-wrapper { transform: translateZ(0); }

        /* Orb shadow sizing synced to bounce */
        @keyframes orbShadowPulse {
          0%, 100% { transform: translateX(-50%) scaleX(1) scaleY(1); opacity: 0.62; }
          20% { transform: translateX(-50%) scaleX(0.8) scaleY(0.9); opacity: 0.42; }
          40% { transform: translateX(-50%) scaleX(1.15) scaleY(1.05); opacity: 0.68; }
          55% { transform: translateX(-50%) scaleX(0.92) scaleY(0.95); opacity: 0.52; }
          70% { transform: translateX(-50%) scaleX(1.06) scaleY(1.02); opacity: 0.58; }
          85% { transform: translateX(-50%) scaleX(0.96) scaleY(0.98); opacity: 0.56; }
        }
        .orb-shadow {
          background: radial-gradient(60% 60% at 50% 50%, rgba(0,0,0,0.55), rgba(0,0,0,0.08) 70%, transparent);
          animation: orbShadowPulse 4.8s cubic-bezier(.25, .6, .35, .98) infinite;
          pointer-events: none;
        }
        /* Make orb shadow switch to a soft light/white glow in dark theme so orb pops */
        [data-theme="dark"] .orb-shadow {
          background: radial-gradient(60% 60% at 50% 50%, rgba(255,255,255,0.18), rgba(255,255,255,0.04) 70%, transparent);
          mix-blend-mode: screen;
        }

        /* Orb white halo */
        .orb-halo {
          background: radial-gradient(closest-side, rgba(255,255,255,0.95), rgba(255,255,255,0.55) 30%, rgba(255,255,255,0.2) 55%, transparent 75%);
          filter: blur(14px);
          mix-blend-mode: screen;
          opacity: 0.9;
          pointer-events: none;
          animation: haloPulse 3.6s ease-in-out infinite;
        }
        @keyframes haloPulse {
          0%, 100% { transform: scale(0.98); opacity: 0.88; }
          50% { transform: scale(1.02); opacity: 1; }
        }

        /* Ambient glow placed behind the orb and behind the title text so it doesn't overlap the glyphs */
        .orb-ambient {
          z-index: -12;
          border-radius: 9999px;
          position: absolute;
          left: 110px;
          top: 37px;
          transform: translate(-50%, -28%);
          width: 310px;
          height: 200px;
          filter: blur(28px) saturate(120%);
          pointer-events: none;
          opacity: 0.95;
        }
        /* Light theme: vibrant blended rainbow glow */
        [data-theme="light"] .orb-ambient {
          position: absolute;
          top: -20px;
          left: 70px;
          transform: translateX(-50%);
          width: 150px;
          height: 150px;
          background: conic-gradient(
            from 0deg,
            rgba(255, 99, 172, 0.55) 0deg,
            rgba(255, 165, 60, 0.55) 90deg,
            rgba(0, 200, 255, 0.55) 180deg,
            rgba(70, 120, 255, 0.55) 270deg,
            rgba(255, 99, 172, 0.55) 360deg
          );
          border-radius: 50%;
          filter: blur(60px) saturate(450%);
          mix-blend-mode: screen;
          opacity: 50;
          z-index: 0;
          pointer-events: none;
        }

        /* Dark theme: soft white glow so the orb pops against the dark background */
        [data-theme="dark"] .orb-ambient {
          background: radial-gradient(circle at 40% 40%, rgba(255,255,255,0.92) 0%, rgba(255,255,255,0.45) 22%, rgba(255,255,255,0.12) 50%, transparent 78%);
          mix-blend-mode: screen;
          filter: blur(22px) saturate(110%);
          opacity: 0.9;
        }

        /* Micro 3D helpers */
        .hero-3d-wrap > * { transform-style: preserve-3d; }
        button:active { transform: scale(0.985); }

        /* Professional button styling without glow effect */
        button:hover { 
          transform: translateY(-4px);
          box-shadow: 0 16px 48px rgba(248, 60, 189, 0.28);
        }
        button:focus { 
          outline: 2px solid rgba(255, 255, 255, 0.15);
          outline-offset: 3px;
        }
        button:active { 
          transform: translateY(-1px);
        }
      `}</style>
    </div>
  )
}
