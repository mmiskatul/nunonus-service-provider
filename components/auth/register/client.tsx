"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FileText, MapPin, Upload, User } from "lucide-react";

type RegisterFormData = {
  businessName: string;
  ownerFullName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  address: string;
  city: string;
  website: string;
  description: string;
  tradeLicenseNumber: string;
  agreeToTerms: boolean;
};

type ApiErrorResponse = {
  detail?: string | { msg?: string }[] | null;
  message?: string;
};

const DEFAULT_BACKEND_BASE_URL = "https://nunos-backend.vercel.app";
const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL?.trim() || DEFAULT_BACKEND_BASE_URL).replace(/\/+$/, "");
const API_V1_BASE_URL = `${API_BASE_URL}/api/v1`;

const initialFormData: RegisterFormData = {
  businessName: "",
  ownerFullName: "",
  email: "",
  phone: "",
  password: "",
  confirmPassword: "",
  address: "",
  city: "",
  website: "",
  description: "",
  tradeLicenseNumber: "",
  agreeToTerms: false,
};

const textFieldNames = new Set<keyof Omit<RegisterFormData, "agreeToTerms">>([
  "businessName",
  "ownerFullName",
  "email",
  "phone",
  "password",
  "confirmPassword",
  "address",
  "city",
  "website",
  "description",
  "tradeLicenseNumber",
]);

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

function validateRegisterForm(formData: RegisterFormData) {
  if (formData.businessName.trim().length < 2) return "Business name must be at least 2 characters.";
  if (formData.ownerFullName.trim().length < 2) return "Owner full name must be at least 2 characters.";
  if (!formData.email.trim()) return "Email address is required.";
  if (formData.password.length < 8) return "Password must be at least 8 characters.";
  if (formData.address.trim().length < 5) return "Address must be at least 5 characters.";
  if (formData.city.trim().length < 2) return "City must be at least 2 characters.";
  if (formData.description.trim().length < 10) return "Business description must be at least 10 characters.";
  if (formData.tradeLicenseNumber.trim().length < 4) return "Trade license number must be at least 4 characters.";
  return null;
}

async function postJson<T>(path: string, body: Record<string, unknown>): Promise<T> {
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

async function uploadRegistrationDocument(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_V1_BASE_URL}/vendor/auth/upload-document`, {
    method: "POST",
    body: formData,
  });

  const result = (await response.json()) as {
    url?: string;
    detail?: string | { msg?: string }[];
    message?: string;
  };

  if (!response.ok || !result.url) {
    throw new Error(JSON.stringify({ detail: typeof result.detail === "string" ? result.detail : result.message || "Failed to upload file." }));
  }

  return result.url;
}

export function RegisterView() {
  const router = useRouter();
  const [formData, setFormData] = useState(initialFormData);
  const [submitMessage, setSubmitMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tradeLicenseDocumentName, setTradeLicenseDocumentName] = useState("");
  const [ownerIdDocumentName, setOwnerIdDocumentName] = useState("");
  const [tradeLicenseDocumentUrl, setTradeLicenseDocumentUrl] = useState("");
  const [ownerIdDocumentUrl, setOwnerIdDocumentUrl] = useState("");
  const [isUploadingTradeLicense, setIsUploadingTradeLicense] = useState(false);
  const [isUploadingOwnerId, setIsUploadingOwnerId] = useState(false);

  const handleInputChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name } = event.target;
    setSubmitMessage("");

    if (name === "agreeToTerms" && event.target instanceof HTMLInputElement) {
      const inputElement = event.target as HTMLInputElement;
      setFormData((prev) => ({ ...prev, agreeToTerms: inputElement.checked }));
      return;
    }

    if (!textFieldNames.has(name as keyof Omit<RegisterFormData, "agreeToTerms">)) {
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: event.target.value }));
  };

  const handleFileChange =
    (field: "tradeLicenseDocument" | "ownerIdDocument") =>
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      setSubmitMessage("");

      if (field === "tradeLicenseDocument") {
        setTradeLicenseDocumentName(file.name);
        setTradeLicenseDocumentUrl("");
        setIsUploadingTradeLicense(true);
      } else {
        setOwnerIdDocumentName(file.name);
        setOwnerIdDocumentUrl("");
        setIsUploadingOwnerId(true);
      }

      try {
        const uploadedUrl = await uploadRegistrationDocument(file);
        if (field === "tradeLicenseDocument") {
          setTradeLicenseDocumentUrl(uploadedUrl);
        } else {
          setOwnerIdDocumentUrl(uploadedUrl);
        }
      } catch (error) {
        if (field === "tradeLicenseDocument") {
          setTradeLicenseDocumentName("");
        } else {
          setOwnerIdDocumentName("");
        }
        setSubmitMessage(getErrorMessage(error, "Failed to upload the selected file."));
      } finally {
        if (field === "tradeLicenseDocument") {
          setIsUploadingTradeLicense(false);
        } else {
          setIsUploadingOwnerId(false);
        }
      }
    };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const validationError = validateRegisterForm(formData);
    if (validationError) {
      setSubmitMessage(validationError);
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setSubmitMessage("Passwords do not match.");
      return;
    }
    if (!formData.agreeToTerms) {
      setSubmitMessage("You must accept the terms to continue.");
      return;
    }
    if (isUploadingTradeLicense || isUploadingOwnerId) {
      setSubmitMessage("Please wait for the document uploads to finish.");
      return;
    }
    if (!tradeLicenseDocumentUrl || !ownerIdDocumentUrl) {
      setSubmitMessage("Upload both verification documents before continuing.");
      return;
    }

    setIsSubmitting(true);
    setSubmitMessage("");

    try {
      const requestCodeResult = await postJson<{ validation_code?: string | null }>("/vendor/auth/register/request-code", {
        email_or_phone: formData.email.trim(),
      });

      sessionStorage.setItem(
        "pending_vendor_registration",
        JSON.stringify({
          business_name: formData.businessName.trim(),
          owner_full_name: formData.ownerFullName.trim(),
          email_or_phone: formData.email.trim(),
          phone: formData.phone.trim() || null,
          address: formData.address.trim(),
          city: formData.city.trim(),
          website: formData.website.trim() || null,
          business_description: formData.description.trim(),
          trade_license_number: formData.tradeLicenseNumber.trim(),
          trade_license_document_url: tradeLicenseDocumentUrl,
          owner_manager_id_document_url: ownerIdDocumentUrl,
          terms_accepted: formData.agreeToTerms,
          password: formData.password,
          confirm_password: formData.confirmPassword,
          debug_code: requestCodeResult.validation_code ?? null,
        }),
      );

      router.push(`/verify-code?mode=register&contact=${encodeURIComponent(formData.email.trim())}`);
    } catch (error) {
      setSubmitMessage(getErrorMessage(error, "Registration failed."));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-[800px] space-y-10">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-slate-800">Register Your Business</h1>
          <p className="mt-2 text-base font-medium text-slate-400">
            Join the service partner portal and manage bookings, services, and operations in one place.
          </p>
        </div>
        <p className="text-sm font-medium text-slate-500">
          Already have an account?{" "}
          <Link href="/login" className="font-bold text-[#c85b3b] hover:underline">
            Log in
          </Link>
        </p>
      </div>

      <form className="space-y-8" onSubmit={handleSubmit}>
        <div className="rounded-[32px] border border-slate-50 bg-white p-8 shadow-xl shadow-slate-200/40 md:p-10">
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#fff3ea] text-[#c85b3b]">
              <User className="h-5 w-5" />
            </div>
            <h2 className="text-xl font-bold text-slate-800">Basic Information</h2>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <InputField name="businessName" label="Business Name" value={formData.businessName} onChange={handleInputChange} placeholder="e.g. Acme Services" />
            <InputField
              name="ownerFullName"
              label="Owner Full Name"
              value={formData.ownerFullName}
              onChange={handleInputChange}
              placeholder="e.g. Alex Morgan"
            />
            <InputField name="email" label="Email Address" value={formData.email} onChange={handleInputChange} placeholder="business@example.com" type="email" />
            <InputField name="phone" label="Phone Number" value={formData.phone} onChange={handleInputChange} placeholder="+8801XXXXXXXXX" type="tel" />
            <InputField name="password" label="Password" value={formData.password} onChange={handleInputChange} placeholder="********" type="password" />
            <InputField name="confirmPassword" label="Confirm Password" value={formData.confirmPassword} onChange={handleInputChange} placeholder="********" type="password" />
          </div>
        </div>

        <div className="rounded-[32px] border border-slate-50 bg-white p-8 shadow-xl shadow-slate-200/40 md:p-10">
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#fff3ea] text-[#c85b3b]">
              <MapPin className="h-5 w-5" />
            </div>
            <h2 className="text-xl font-bold text-slate-800">Business Details</h2>
          </div>

          <div className="space-y-6">
            <InputField name="address" label="Address" value={formData.address} onChange={handleInputChange} placeholder="123 Business Way" />
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <InputField name="city" label="City" value={formData.city} onChange={handleInputChange} placeholder="Dhaka" />
              <InputField name="website" label="Website" value={formData.website} onChange={handleInputChange} placeholder="https://www.yourbusiness.com" type="url" />
            </div>
            <div className="space-y-2">
              <label className="ml-1 block text-xs font-black uppercase tracking-widest text-slate-800">Business Description</label>
              <textarea
                rows={4}
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Tell us about your services..."
                className="w-full resize-none rounded-2xl border border-slate-100 bg-[#fdf8f8] px-6 py-4 text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:border-[#c85b3b]/20 focus:outline-none focus:ring-4 focus:ring-[#c85b3b]/5"
              />
            </div>
          </div>
        </div>

        <div className="rounded-[32px] border border-slate-50 bg-white p-8 shadow-xl shadow-slate-200/40 md:p-10">
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#fff3ea] text-[#c85b3b]">
              <FileText className="h-5 w-5" />
            </div>
            <h2 className="text-xl font-bold text-slate-800">Verification</h2>
          </div>

          <div className="space-y-8">
            <InputField name="tradeLicenseNumber" label="Trade License Number" value={formData.tradeLicenseNumber} onChange={handleInputChange} placeholder="TX-12345678" />
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
              <UploadCard label="Trade License Document" status={isUploadingTradeLicense ? "Uploading..." : tradeLicenseDocumentUrl ? tradeLicenseDocumentName || "Uploaded" : "Upload PDF or JPG"} onChange={handleFileChange("tradeLicenseDocument")} />
              <UploadCard label="Owner/Manager ID" status={isUploadingOwnerId ? "Uploading..." : ownerIdDocumentUrl ? ownerIdDocumentName || "Uploaded" : "Upload Passport/ID"} onChange={handleFileChange("ownerIdDocument")} />
            </div>
          </div>
        </div>

        <div className="space-y-6 pt-2">
          <label className="flex items-center gap-3 px-2">
            <input
              type="checkbox"
              name="agreeToTerms"
              checked={formData.agreeToTerms}
              onChange={handleInputChange}
              className="h-5 w-5 rounded-lg border-2 border-slate-200 text-[#c85b3b] focus:ring-[#c85b3b]"
            />
            <span className="text-sm font-bold text-slate-500">
              I agree to the{" "}
              <Link href="/auth/legal/terms" className="text-[#c85b3b] transition hover:underline">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link href="/auth/legal/privacy" className="text-[#c85b3b] transition hover:underline">
                Privacy Policy
              </Link>
              .
            </span>
          </label>

          {submitMessage ? <p className="px-2 text-sm font-bold text-[#b24d30]">{submitMessage}</p> : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-[24px] bg-[#c85b3b] py-5 text-lg font-bold text-white shadow-2xl shadow-[#c85b3b]/30 transition-all hover:bg-[#b24d30] disabled:opacity-60"
          >
            {isSubmitting ? "Creating Account..." : "Create Account"}
          </button>
        </div>
      </form>
    </div>
  );
}

function InputField({
  name,
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  name: string;
  label: string;
  value: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder: string;
  type?: string;
}) {
  return (
    <div className="space-y-2">
      <label className="ml-1 block text-xs font-black uppercase tracking-widest text-slate-800">{label}</label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-slate-100 bg-[#fdf8f8] px-6 py-4 text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:border-[#c85b3b]/20 focus:outline-none focus:ring-4 focus:ring-[#c85b3b]/5"
      />
    </div>
  );
}

function UploadCard({
  label,
  status,
  onChange,
}: {
  label: string;
  status: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <label className="block space-y-4">
      <span className="ml-1 block text-xs font-black uppercase tracking-widest text-slate-800">{label}</span>
      <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={onChange} className="sr-only" />
      <span className="group flex cursor-pointer flex-col items-center justify-center gap-3 rounded-[28px] border-2 border-dashed border-slate-100 bg-slate-50/30 p-8 transition-colors hover:bg-slate-50/50">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-slate-400 shadow-sm transition-colors group-hover:text-[#c85b3b]">
          <Upload className="h-5 w-5" />
        </span>
        <span className="text-xs font-bold text-slate-400 transition-colors group-hover:text-slate-600">{status}</span>
      </span>
    </label>
  );
}
