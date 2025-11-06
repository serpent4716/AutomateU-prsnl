import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
// 1. Import your api instance
import api from "../services/api";

export default function SignupPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  // 2. Add an error state to display feedback to the user
  const [error, setError] = useState(null);
  const navigate = useNavigate();

 const handleSignup = async (e) => {
   e.preventDefault();
   setIsLoading(true);
   setError(null); // Clear previous errors
   // setSuccess(null); // You might want to add a success state as well

   // Check for minimum password length
   if (formData.password.length < 8) {
     setError("Password must be at least 8 characters long");
     setIsLoading(false);
     return;
   }
   
   // UPGRADE: Add check for maximum password length
   if (formData.password.length > 72) {
     setError("Password cannot be longer than 72 characters");
     setIsLoading(false);
     return;
   }

   // Password match check
   if (formData.password !== formData.confirmPassword) {
     setError("Passwords don't match");
     setIsLoading(false);
     return;
   }

   try {
     const payload = {
       name: formData.name,
       email: formData.email,
       password: formData.password,
     };

     await api.post("/users", payload);

     // UPGRADE: Replace alert() with a non-blocking UI update.
     // For example, you could set a success message and then navigate.
     // setSuccess("Account created successfully! Redirecting to login...");
     // Using setTimeout to let the user see the message before redirecting.
     setTimeout(() => {
        navigate("/login");
     }, 2000); // Redirect after 2 seconds

   } catch (err) {
     console.error("Registration failed:", err);
     setError(err.response?.data?.detail || "Registration failed. Please try again.");
   } finally {
     setIsLoading(false);
   }
 };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white shadow-lg rounded-xl p-6">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-blue-600">AutoMateU</h1>
          <p className="text-gray-600">Create your account</p>
        </div>

        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Full Name
            </label>
            <input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              placeholder="Enter your full name"
              required
              className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
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
              value={formData.password}
              onChange={(e) => handleInputChange("password", e.target.value)}
              placeholder="Create a password"
              required
              className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
              placeholder="Confirm your password"
              required
              className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
          
          {/* 4. Display the error message right above the button */}
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-blue-300 transition"
          >
            {isLoading ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <div className="flex items-center my-6">
          <div className="flex-grow border-t border-gray-300"></div>
          <span className="mx-2 text-gray-400 text-sm">OR</span>
          <div className="flex-grow border-t border-gray-300"></div>
        </div>

        <div className="space-y-2">
          <button className="w-full border border-gray-300 py-2 px-4 rounded-lg bg-white hover:bg-gray-50 transition">
            Continue with Google
          </button>
          <button className="w-full border border-gray-300 py-2 px-4 rounded-lg bg-white hover:bg-gray-50 transition">
            Continue with GitHub
          </button>
        </div>

        <div className="text-center text-sm mt-4">
          <span className="text-gray-600">Already have an account? </span>
          <Link to="/login" className="text-blue-600 hover:underline">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
