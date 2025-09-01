"use client";

import Image from "next/image";
import LoginImage from "@/public/images/loginAdmin.jpg";

import { useState } from "react";
import { motion } from "framer-motion";
import { useDispatch } from "react-redux";
import { login } from "@/app/redux/authSlice";
import { AppDispatch } from "@/app/redux/store";
import { useRouter } from "next/navigation"; 

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const dispatch = useDispatch<AppDispatch>();
  const [loading, setLoading] = useState(false);
  const router = useRouter(); 

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("https://beglam.superbstore.in/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) throw new Error("Login failed. Please check credentials.");

      const data = await res.json();
      
      // Dispatch to Redux (which will also handle localStorage sync)
      if (data.token) {
        dispatch(login({ user: email, token: data.token }));
      } else {
        throw new Error("No token received from server.");
      }

      // Redirect to dashboard page (which contains DateWiseDashboard)
      router.push("/dashboard");
    } catch (error) {
      console.log("Something went wrong!", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-gradient-to-r from-indigo-200 via-white to-teal-200 px-4">
      <div className="flex w-full max-w-6xl overflow-hidden rounded-3xl shadow-2xl bg-white/90 backdrop-blur-lg">
        {/* Left - Login Form */}
        <div className="w-full lg:w-1/2 flex flex-col justify-center px-10 py-12">
          <motion.h1
            className="text-3xl font-bold text-gray-900 mb-2"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
          >
            Welcome Back 👋
          </motion.h1>
          <p className="text-gray-600 mb-8">
            Sign in to your admin account to access the dashboard.
          </p>

          <motion.form
            onSubmit={handleSubmit}
            className="space-y-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Email Address
              </label>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-400 shadow-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-400 shadow-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                required
              />
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2">
                <input type="checkbox" className="rounded border-gray-300" />
                Remember me
              </label>
              <a
                href="/forgot-password"
                className="text-indigo-600 hover:underline"
              >
                Forgot password?
              </a>
            </div>

            <motion.button
              type="submit"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={loading}
              className="w-full bg-indigo-600 text-white py-3 rounded-lg font-medium shadow-md hover:bg-indigo-700 transition"
            >
              {loading ? "Signing in..." : "Sign In"}
            </motion.button>
          </motion.form>

          <p className="mt-6 text-center text-sm text-gray-600">
            Don’t have an account?{" "}
            <a
              href="/signup"
              className="text-indigo-600 hover:underline font-medium"
            >
              Sign Up
            </a>
          </p>
        </div>

        {/* Right - Illustration */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-indigo-500 to-indigo-700 items-center justify-center relative">
          <div className="relative z-10 text-center px-10">
            <Image
              src={LoginImage}
              alt="Admin Login Illustration"
              className="w-80 rounded-2xl mx-auto drop-shadow-lg"
            />
            <h2 className="mt-6 text-3xl font-semibold text-white">
              Secure Admin Dashboard
            </h2>
            <p className="mt-2 text-gray-200">
              Manage your business operations safely and effectively.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
