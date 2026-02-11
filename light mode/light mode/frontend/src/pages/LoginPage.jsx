import React, { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import api from "../services/api"
export default function LoginPage({setUserInfo}) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null);
  const navigate = useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Call backend via api.js
      const response = await api.post("/login", {
        email,
        password,
      });

      // Extract csrf token (backend must return it in JSON)
      const csrfToken = response.data.csrf_token;

      // Store CSRF token in localStorage (persistent across refresh)
      localStorage.setItem("csrf_token", csrfToken);

      // Optionally store user info
      localStorage.setItem("user", JSON.stringify(response.data.user));
      setUserInfo(response.data.user);
      // Navigate to dashboard
      navigate("/dashboard");
    } catch (err) {
      console.error("Login failed:", err);
      setError("Invalid email or password");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    // TODO: Implement Google OAuth
    console.log("Google login clicked - implement OAuth here")
  }

  const handleGithubLogin = () => {
    // TODO: Implement GitHub OAuth
    console.log("GitHub login clicked - implement OAuth here")
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white shadow-lg rounded-xl p-6">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-blue-600">AutoMateU</h1>
          <p className="text-gray-600">Sign in to your account</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-blue-300 transition"
          >
            {isLoading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center my-6">
          <div className="flex-grow border-t border-gray-300"></div>
          <span className="mx-2 text-gray-400 text-sm">OR</span>
          <div className="flex-grow border-t border-gray-300"></div>
        </div>

        {/* Social login buttons */}
        <div className="space-y-2">
          <button
            onClick={handleGoogleLogin}
            className="w-full border border-gray-300 py-2 px-4 rounded-lg bg-white hover:bg-gray-50 transition"
          >
            Continue with Google
          </button>
          <button
            onClick={handleGithubLogin}
            className="w-full border border-gray-300 py-2 px-4 rounded-lg bg-white hover:bg-gray-50 transition"
          >
            Continue with GitHub
          </button>
        </div>

        {/* Sign up link */}
        <div className="text-center text-sm mt-4">
          <span className="text-gray-600">Don't have an account? </span>
          <Link to="/signup" className="text-blue-600 hover:underline">
            Sign up
          </Link>
        </div>
      </div>
    </div>
  )
}
