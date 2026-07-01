"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { requestReset, verifyCode } from "@/components/auth/auth-client";

const codeLength = 6;
const DEFAULT_BACKEND_BASE_URL = "https://nunos-backend.vercel.app";
const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL?.trim() || DEFAULT_BACKEND_BASE_URL).replace(/\/+$/, "");
const API_V1_BASE_URL = `${API_BASE_URL}/api/v1`;

type PendingVendorRegistration = {
  business_name: string;
  owner_full_name: string;
  email_or_phone: string;
  phone: string | null;
  address: string;
  city: string;
  website: string | null;
  business_description: string;
  trade_license_number: string;
  trade_license_document_url: string;
  owner_manager_id_document_url: string;
  terms_accepted: boolean;
  password: string;
  confirm_password: string;
};

type ApiErrorResponse = {
  detail?: string | { msg?: string }[] | null;
  message?: string;
};

function getErrorMessage(error: unknown, fallback: string) {
  if (!(error instanceof Error)) {
    return fallback;
  }

  try {
    const parsed = JSON.parse(error.message) as ApiErrorResponse;
    if (typeof parsed.detail === "string" && parsed.detail.trim()) {
      return parsed.detail;
    }
    if (Array.isArray(parsed.detail) && parsed.detail[0]?.msg) {
      return parsed.detail[0].msg ?? fallback;
    }
    if (typeof parsed.message === "string" && parsed.message.trim()) {
      return parsed.message;
    }
  } catch {
    return error.message || fallback;
  }

  return fallback;
}

async function postBackendJson<T>(path: string, body: Record<string, unknown>): Promise<T> {
  const response = await fetch(`${API_V1_BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `Request failed with status ${response.status}`);
  }

  return (await response.json()) as T;
}

export function VerifyCodeView() {
  const router = useRouter();
  const params = useSearchParams();
  const email = params.get("email") ?? "";
  const contact = params.get("contact") ?? email;
  const mode = params.get("mode");
  const [values, setValues] = useState<string[]>(Array(codeLength).fill(""));
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);

  const code = useMemo(() => values.join(""), [values]);

  useEffect(() => {
    inputsRef.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (mode !== "register") {
      return;
    }

    const pending = sessionStorage.getItem("pending_vendor_registration");
    if (!pending) {
      router.replace("/register");
      return;
    }

    try {
      JSON.parse(pending) as PendingVendorRegistration;
    } catch {
      sessionStorage.removeItem("pending_vendor_registration");
      router.replace("/register");
    }
  }, [mode, router]);

  const handleChange = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return;
    const next = [...values];
    next[index] = value;
    setValues(next);
    if (value && index < codeLength - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Backspace" && !values[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");

    if (code.length !== codeLength) {
      setError("Enter the full 6-digit code.");
      return;
    }

    if (mode === "register") {
      const pendingRaw = sessionStorage.getItem("pending_vendor_registration");
      if (!pendingRaw) {
        setError("Registration session expired. Please start again.");
        router.push("/register");
        return;
      }

      setLoading(true);
      try {
        const pending = JSON.parse(pendingRaw) as PendingVendorRegistration;
        const verifyResult = await postBackendJson<{ signup_token?: string | null }>(
          "/vendor/auth/register/verify-code",
          {
            email_or_phone: pending.email_or_phone,
            validation_code: code,
          },
        );

        if (!verifyResult.signup_token) {
          throw new Error(JSON.stringify({ detail: "Signup token was not returned." }));
        }

        await postBackendJson("/vendor/auth/register", {
          ...pending,
          signup_token: verifyResult.signup_token,
        });

        sessionStorage.removeItem("pending_vendor_registration");
        router.push("/registration-submitted");
      } catch (registerError) {
        setError(getErrorMessage(registerError, "Verification failed."));
      } finally {
        setLoading(false);
      }
      return;
    }

    setLoading(true);
    const result = await verifyCode(email, code);
    setLoading(false);
    if (!result.ok) {
      setError(result.message ?? "Invalid code.");
      return;
    }
    router.push(`/reset-password?email=${encodeURIComponent(email)}`);
  };

  const resend = async () => {
    setError("");

    if (mode === "register") {
      const pendingRaw = sessionStorage.getItem("pending_vendor_registration");
      if (!pendingRaw) {
        router.push("/register");
        return;
      }

      try {
        setIsResending(true);
        const pending = JSON.parse(pendingRaw) as PendingVendorRegistration;
        const resendResult = await postBackendJson<{ validation_code?: string | null }>(
          "/vendor/auth/register/request-code",
          {
            email_or_phone: pending.email_or_phone,
          },
        );
        sessionStorage.setItem(
          "pending_vendor_registration",
          JSON.stringify({
            ...pending,
            debug_code: resendResult.validation_code ?? null,
          }),
        );
        setValues(Array(codeLength).fill(""));
        inputsRef.current[0]?.focus();
        setError("A new verification code has been sent.");
      } catch (resendError) {
        setError(getErrorMessage(resendError, "Failed to resend the code."));
      } finally {
        setIsResending(false);
      }
      return;
    }

    setIsResending(true);
    try {
      const result = await requestReset(email);
      if (!result.ok) {
        setError(result.message ?? "Failed to resend the code.");
        return;
      }
      setValues(Array(codeLength).fill(""));
      inputsRef.current[0]?.focus();
      setError("A new verification code has been sent.");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full rounded-[28px] bg-white px-8 py-8 text-center shadow-sm">
      <h2 className="m-0 text-[20px] font-bold text-[#1d2a43]">Verify Code</h2>
      <p className="m-0 mt-2 text-[13px] leading-6 text-[#8b96ad]">
        We sent OTP code to your email
        <br />
        <span className="text-[14px] font-semibold text-[#1f2d46]">{contact}</span>
      </p>

      <div className="mt-6 flex items-center justify-center gap-3">
        {values.map((value, index) => (
          <input
            key={index}
            ref={(el) => {
              inputsRef.current[index] = el;
            }}
            value={value}
            onChange={(event) => handleChange(index, event.target.value)}
            onKeyDown={(event) => handleKeyDown(index, event)}
            maxLength={1}
            className={`h-12 w-12 rounded-xl border text-center text-[18px] font-bold ${
              value ? "border-[#1f3d8f]" : "border-[#e6ecf7]"
            }`}
          />
        ))}
      </div>

      {error && <p className="m-0 mt-4 text-[13px] text-[#dc2626]">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="mt-6 w-full rounded-xl bg-[#1f3d8f] py-3.5 text-[15px] font-bold text-white disabled:opacity-60"
      >
        {loading ? "Verifying..." : "Next"}
      </button>

      <p className="m-0 mt-4 text-[12px] text-[#8b96ad]">
        Don&apos;t receive OTP?{" "}
        <button
          type="button"
          onClick={resend}
          disabled={isResending}
          className="font-semibold text-[#d64545] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isResending ? "Sending..." : "Resend again"}
        </button>
      </p>

      <button
        type="button"
        onClick={() => router.push("/login")}
        className="mt-4 flex w-full items-center justify-center gap-2 text-[13px] text-[#1f2d46]"
      >
        <span>&larr;</span> Back to Login
      </button>
    </form>
  );
}
