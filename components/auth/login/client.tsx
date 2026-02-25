"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FiEye, FiEyeOff, FiLock, FiMail } from "react-icons/fi";
import { login } from "@/components/auth/auth-client";

export function LoginView() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    const result = await login(email, password);
    setLoading(false);
    if (!result.ok) {
      setError(result.message ?? "Login failed.");
      return;
    }
    router.push("/");
  };

  return (
    <form onSubmit={handleSubmit} className="w-full rounded-2xl bg-white px-6 py-6 shadow-sm">
      <div className="text-center">
        <h2 className="m-0 text-[18px] font-semibold text-[#1d2a43]">Welcome Back!</h2>
        <p className="m-0 mt-1 text-[11px] text-[#8b96ad]">To login, enter your email address</p>
      </div>

      <div className="mt-5 space-y-4">
        <div>
          <label className="text-[11px] font-semibold text-[#1f2d46]">Email</label>
          <div className="mt-1 flex items-center gap-2 rounded-lg border border-[#f0e4e8] bg-[#fff7f7] px-3 py-2">
            <FiMail size={14} className="text-[#8b96ad]" />
            <input
              type="email"
              placeholder="Enter email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full border-0 bg-transparent text-[12px] text-[#1f2d46] outline-none"
              required
            />
          </div>
        </div>

        <div>
          <label className="text-[11px] font-semibold text-[#1f2d46]">Password</label>
          <div className="mt-1 flex items-center gap-2 rounded-lg border border-[#f0e4e8] bg-[#fff7f7] px-3 py-2">
            <FiLock size={14} className="text-[#8b96ad]" />
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Enter password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full border-0 bg-transparent text-[12px] text-[#1f2d46] outline-none"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="text-[#8b96ad]"
              aria-label="Toggle password visibility"
            >
              {showPassword ? <FiEyeOff size={14} /> : <FiEye size={14} />}
            </button>
          </div>
        </div>

        <div className="flex justify-end">
          <button type="button" onClick={() => router.push("/forgot-password")} className="text-[11px] text-[#d64545]">
            Forgot Password?
          </button>
        </div>

        {error && <p className="m-0 text-[11px] text-[#dc2626]">{error}</p>}
      </div>

      <button
        type="submit"
        disabled={loading}
        className="mt-4 w-full rounded-lg bg-[#1f3d8f] py-2 text-[12px] font-semibold text-white disabled:opacity-60"
      >
        {loading ? "Logging in..." : "Login"}
      </button>
    </form>
  );
}
