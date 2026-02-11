"use client"

import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import api from "../services/api"
import { Github, Chrome } from 'lucide-react'

import PrismaticBurst from "../components/LiquidEther/LiquidEther.jsx"
import "../components/LiquidEther/LiquidEther.css"

import GradientText from "../components/GradientText/GradientText.jsx"
import "../components/GradientText/GradientText.css"
import SplitText from "../components/SplitText/SplitText.jsx"

export default function SignupPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  const handleSignup = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords don't match")
      setIsLoading(false)
      return
    }

    try {
      const payload = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
      }

      await api.post("/users", payload)
      alert("Account created successfully! Please proceed to login.")
      navigate("/login")
    } catch (err) {
      console.error("Registration failed:", err)
      setError(err.response?.data?.detail || "Registration failed. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <div
      data-theme="dark"
      className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-black via-slate-900 to-black text-white font-figtree p-4"
    >
      {/* 🌈 Animated background */}
      <div className="absolute inset-0 z-0">
        <PrismaticBurst />
      </div>

      {/* <CHANGE> Compact header with smaller font and reduced spacing */}
      <div className="relative z-10 mb-4 text-center w-full max-w-2xl">
        <GradientText
          className="text-3xl sm:text-4xl font-extrabold italic leading-none"
          colors={["#f49817ff", "#f0499aff", "#A78BFA", "#6d0ed2ff"]}
          animationSpeed={8}
          showBorder={false}
        >
          <b className="inline-block">AutoMateU</b>
        </GradientText>

        {/* <CHANGE> Reduced subtitle spacing */}
        <div className="mt-1 text-xs sm:text-sm text-gray-400 font-light tracking-wide text-center">
          <SplitText text="Create your account" />
        </div>
      </div>

      {/* <CHANGE> Main form container - more compact layout */}
      <div className="relative z-10 w-full max-w-sm mx-auto">
        <form onSubmit={handleSignup} className="w-full space-y-3">
          {/* <CHANGE> Reduced field spacing */}
          {/* Full Name */}
          <div>
            <label
              htmlFor="name"
              className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1"
            >
              Full Name
            </label>
            <input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              placeholder="Enter your full name"
              required
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400/50 focus:border-orange-400/30 focus:bg-white/10 transition-all duration-200 backdrop-blur-sm font-figtree"
            />
          </div>

          {/* ... existing code ... */}

          {/* Email */}
          <div>
            <label
              htmlFor="email"
              className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              placeholder="Enter your email"
              required
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400/50 focus:border-orange-400/30 focus:bg-white/10 transition-all duration-200 backdrop-blur-sm font-figtree"
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
              value={formData.password}
              onChange={(e) => handleInputChange("password", e.target.value)}
              placeholder="Create a password"
              required
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400/50 focus:border-orange-400/30 focus:bg-white/10 transition-all duration-200 backdrop-blur-sm font-figtree"
            />
          </div>

          {/* Confirm Password */}
          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1"
            >
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
              placeholder="Confirm your password"
              required
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400/50 focus:border-orange-400/30 focus:bg-white/10 transition-all duration-200 backdrop-blur-sm font-figtree"
            />
          </div>

          {/* ... existing code ... */}

          {/* <CHANGE> Error message with compact spacing */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-2 text-red-200 text-xs backdrop-blur-sm text-center">
              {error}
            </div>
          )}

          {/* <CHANGE> Submit button with updated colors matching dashboard theme */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-orange-400 via-orange-500 to-pink-500 text-white font-semibold py-2.5 rounded-xl hover:from-orange-300 hover:to-pink-400 disabled:from-orange-200 disabled:to-pink-300 transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 text-sm"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="inline-block w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                Creating account...
              </span>
            ) : (
              "Create Account"
            )}
          </button>

          {/* <CHANGE> Divider with label */}
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

          {/* <CHANGE> OAuth buttons - Google and GitHub */}
          <div className="grid grid-cols-2 gap-3">
            {/* Google Sign In */}
            <button
              type="button"
              className="flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-xl px-4 py-2.5 text-white text-sm font-medium transition-all duration-200 backdrop-blur-sm"
            >
              <Chrome className="w-4 h-4" />
              <span className="hidden sm:inline">Google</span>
            </button>

            {/* GitHub Sign In */}
            <button
              type="button"
              className="flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-xl px-4 py-2.5 text-white text-sm font-medium transition-all duration-200 backdrop-blur-sm"
            >
              <Github className="w-4 h-4" />
              <span className="hidden sm:inline">GitHub</span>
            </button>
          </div>
        </form>

        {/* <CHANGE> Sign in link - compact spacing */}
        <div className="text-center text-xs mt-4">
          <span className="text-gray-400">Already have an account? </span>
          <Link
            to="/login"
            className="text-orange-400 hover:text-orange-300 font-semibold transition-colors duration-200"
          >
            Sign in
          </Link>
        </div>
      </div>
    </div>
  )
}