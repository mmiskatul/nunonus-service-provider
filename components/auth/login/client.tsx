"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FiEye, FiEyeOff, FiLock, FiMail } from "react-icons/fi";
import { login } from "@/components/auth/auth-client";

export function LoginView() {
  const router = useRouter();
  const params = useSearchParams();
  const nextUrl = params.get("next") || "/";
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
    router.push(nextUrl);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full rounded-[36px] border border-white/80 bg-white/90 p-7 shadow-[0_24px_80px_rgba(148,64,36,0.12)] backdrop-blur sm:p-10"
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#c85b3b] text-white shadow-lg shadow-[#c85b3b]/20">
            <FiLock size={18} />
          </div>
          <div>
            <p className="m-0 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#9b6b56]">Service Partner Portal</p>
            <h2 className="m-0 text-[28px] font-black tracking-tight text-[#2e1e19]">Welcome Back!</h2>
          </div>
        </div>
        <div className="hidden rounded-full bg-[#fff3ea] px-3 py-1 text-[11px] font-semibold text-[#a56244] sm:block">
          Warm access
        </div>
      </div>

      <p className="mt-3 max-w-[38ch] text-sm leading-6 text-[#866c62]">
        Log in to manage bookings, services, and daily operations from one place.
      </p>

      <p className="mt-3 text-sm text-[#866c62]">
        New partner?{" "}
        <Link href="/register" className="font-semibold text-[#c85b3b] transition hover:text-[#a94729]">
          Create your business account
        </Link>
      </p>

      <div className="mt-7 space-y-5">
        <div>
          <label className="ml-1 text-[11px] font-bold uppercase tracking-[0.2em] text-[#5c433a]">Email</label>
          <div className="mt-2 flex items-center gap-3 rounded-2xl border border-[#f2ded3] bg-[#fffaf7] px-4 py-3 transition focus-within:border-[#c85b3b]/25 focus-within:bg-white focus-within:shadow-[0_0_0_4px_rgba(200,91,59,0.08)]">
            <FiMail size={16} className="text-[#b38a76]" />
            <input
              type="email"
              placeholder="Enter email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full border-0 bg-transparent text-sm font-medium text-[#3a2923] outline-none placeholder:text-[#b79c90]"
              required
            />
          </div>
        </div>

        <div>
          <label className="ml-1 text-[11px] font-bold uppercase tracking-[0.2em] text-[#5c433a]">Password</label>
          <div className="mt-2 flex items-center gap-3 rounded-2xl border border-[#f2ded3] bg-[#fffaf7] px-4 py-3 transition focus-within:border-[#c85b3b]/25 focus-within:bg-white focus-within:shadow-[0_0_0_4px_rgba(200,91,59,0.08)]">
            <FiLock size={16} className="text-[#b38a76]" />
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Enter password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full border-0 bg-transparent text-sm font-medium text-[#3a2923] outline-none placeholder:text-[#b79c90]"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="rounded-full p-1 text-[#b38a76] transition hover:bg-[#fff0e8] hover:text-[#6a4a3f]"
              aria-label="Toggle password visibility"
            >
              {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
            </button>
          </div>
        </div>

        <div className="flex justify-end">
          <Link href="/forgot-password" className="text-sm font-semibold text-[#c85b3b] transition hover:text-[#a94729]">
            Forgot Password?
          </Link>
        </div>

        {error && <p className="m-0 rounded-xl bg-red-50 px-4 py-3 text-sm text-[#b91c1c]">{error}</p>}
      </div>

      <button
        type="submit"
        disabled={loading}
        className="mt-7 flex w-full items-center justify-center rounded-full bg-[#c85b3b] py-3.5 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(200,91,59,0.26)] transition hover:bg-[#b24d30] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Logging in..." : "Login"}
      </button>
    </form>
  );
}
