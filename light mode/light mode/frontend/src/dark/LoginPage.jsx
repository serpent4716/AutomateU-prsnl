"use client"

import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import api from "../services/api"
import { Github, Chrome } from "lucide-react"

import PrismaticBurst from "../components/LiquidEther/LiquidEther.jsx"


import GradientText from "../components/GradientText/GradientText.jsx"

import SplitText from "../components/SplitText/SplitText.jsx"

export default function LoginPage({ setUserInfo }) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const response = await api.post("/login", { email, password })
      const csrfToken = response.data.csrf_token
      localStorage.setItem("csrf_token", csrfToken)
      localStorage.setItem("user", JSON.stringify(response.data.user))
      setUserInfo(response.data.user)
      navigate("/dashboard")
    } catch (err) {
      console.error("Login failed:", err)
      setError("Invalid email or password")
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleLogin = () => console.log("Google login clicked - implement OAuth here")
  const handleGithubLogin = () => console.log("GitHub login clicked - implement OAuth here")

  return (
    <div
      data-theme="dark"
      style={{ fontFamily: "'Figtree', sans-serif" }}
      className="relative min-h-screen flex flex-col items-center justify-center overflow-visible bg-gradient-to-br from-black via-slate-900 to-black text-white px-4"
    >
      {/* 🌈 Animated background */}
      <div className="absolute inset-0 z-0">
        <PrismaticBurst />
      </div>

      <div className="relative z-10 mb-4 text-center w-full max-w-2xl">
        <GradientText
          className="text-3xl sm:text-4xl font-extrabold italic leading-none"
          colors={["#f49817ff", "#f0499aff", "#A78BFA", "#6d0ed2ff"]}
          animationSpeed={8}
          showBorder={false}
        >
          <b className="inline-block">AutoMateU</b>
        </GradientText>

        <div className="mt-1 text-xs sm:text-sm text-gray-400 font-light tracking-wide text-center">
          <SplitText text="Sign in to your account" />
        </div>
      </div>

      <div className="relative z-10 w-full max-w-sm mx-auto">
        <form onSubmit={handleLogin} className="w-full space-y-3">
          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              style={{ fontFamily: "'Figtree', sans-serif" }}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400/50 focus:border-orange-400/30 focus:bg-white/10 transition-all duration-200 backdrop-blur-sm"
            />
          </div>

          {/* Password */}
          <div>
            <label
              htmlFor="password"
              className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              style={{ fontFamily: "'Figtree', sans-serif" }}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400/50 focus:border-orange-400/30 focus:bg-white/10 transition-all duration-200 backdrop-blur-sm"
            />
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-2 text-red-200 text-xs backdrop-blur-sm text-center">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            style={{ fontFamily: "'Figtree', sans-serif" }}
            className="w-full bg-gradient-to-r from-orange-400 via-orange-500 to-pink-500 text-white font-semibold py-2.5 rounded-xl hover:from-orange-300 hover:to-pink-400 disabled:from-orange-200 disabled:to-pink-300 transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 text-sm"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="inline-block w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                Signing in...
              </span>
            ) : (
              "Sign In"
            )}
          </button>

          <div className="relative my-3">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-2 bg-gradient-to-br from-black via-slate-900 to-black text-gray-400">
                Or continue with
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Google Sign In */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              className="flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-xl px-4 py-2.5 text-white text-sm font-medium transition-all duration-200 backdrop-blur-sm"
            >
              <Chrome className="w-4 h-4" />
              <span className="hidden sm:inline">Google</span>
            </button>

            {/* GitHub Sign In */}
            <button
              type="button"
              onClick={handleGithubLogin}
              className="flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-xl px-4 py-2.5 text-white text-sm font-medium transition-all duration-200 backdrop-blur-sm"
            >
              <Github className="w-4 h-4" />
              <span className="hidden sm:inline">GitHub</span>
            </button>
          </div>
        </form>

        <div className="text-center text-xs mt-4">
          <span className="text-gray-400">Don't have an account? </span>
          <Link
            to="/signup"
            className="text-orange-400 hover:text-orange-300 font-semibold transition-colors duration-200"
          >
            Sign up
          </Link>
        </div>
      </div>
    </div>
  )
}
