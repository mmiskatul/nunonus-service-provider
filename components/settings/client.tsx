"use client";

import Image from "next/image";
import Link from "next/link";
import { ChangeEvent, ReactNode, useRef, useState } from "react";
import {
  FiCheck,
  FiCreditCard,
  FiExternalLink,
  FiGlobe,
  FiUploadCloud
} from "react-icons/fi";

type SettingsData = {
  title: string;
  description: string;
  general: {
    platformName: string;
    supportEmail: string;
    brandIdentity: {
      logoData?: string;
      note: string;
      cta: string;
    };
  };
  commission: {
    globalRate: string;
    categoryRate: string;
    categoryLabel: string;
  };
  legal: {
    terms: string;
    privacy: string;
    gdpr: string;
    gdprStatus: string;
  };
  admin: {
    name: string;
    email: string;
    avatar?: string;
  };
};

const panelClass =
  "rounded-[18px] border border-[#dfe4ee] bg-white px-4 py-4 shadow-[0_8px_26px_rgba(15,23,42,0.04)] sm:px-5";
const inputClass =
  "h-11 w-full rounded-[10px] border border-[#d6dce8] bg-white px-3 text-[13px] text-[#27324a] outline-none transition focus:border-[#25408f]";

function SectionBadge({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <div className="flex items-center gap-2 text-[13px] font-semibold text-[#18233c]">
      <span className="grid h-4 w-4 place-items-center text-[#24408d]">{icon}</span>
      <span>{children}</span>
    </div>
  );
}

function FieldLabel({ children }: { children: ReactNode }) {
  return <label className="mb-1.5 block text-[11px] font-medium text-[#56647f]">{children}</label>;
}

export function SettingsView({ data }: { data: SettingsData }) {
  const [platformName, setPlatformName] = useState(data.general.platformName);
  const [supportEmail, setSupportEmail] = useState(data.general.supportEmail);
  const [brandLogoData, setBrandLogoData] = useState(data.general.brandIdentity.logoData ?? "");
  const [globalRate, setGlobalRate] = useState(data.commission.globalRate);
  const [categoryRate, setCategoryRate] = useState(data.commission.categoryRate);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [passwordStatus, setPasswordStatus] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [avatarBroken, setAvatarBroken] = useState(false);
  const logoInputRef = useRef<HTMLInputElement | null>(null);
  const generalSnapshot = useRef({
    platformName: data.general.platformName,
    supportEmail: data.general.supportEmail,
    logoData: data.general.brandIdentity.logoData ?? ""
  });
  const commissionSnapshot = useRef({
    globalRate: data.commission.globalRate,
    categoryRate: data.commission.categoryRate
  });

  const persistSettings = async (payload: Partial<SettingsData>, successMessage: string) => {
    setSaveStatus("Saving...");
    const response = await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      setSaveStatus("Update failed");
      setTimeout(() => setSaveStatus(null), 2200);
      return false;
    }

    setSaveStatus(successMessage);
    setTimeout(() => setSaveStatus(null), 1800);
    return true;
  };

  const commitGeneralSettings = async () => {
    if (
      platformName === generalSnapshot.current.platformName &&
      supportEmail === generalSnapshot.current.supportEmail &&
      brandLogoData === generalSnapshot.current.logoData
    ) {
      return;
    }

    const ok = await persistSettings(
      {
        general: {
          platformName,
          supportEmail,
          brandIdentity: {
            logoData: brandLogoData,
            note: data.general.brandIdentity.note,
            cta: data.general.brandIdentity.cta
          }
        }
      },
      "General settings updated"
    );

    if (ok) {
      generalSnapshot.current = {
        platformName,
        supportEmail,
        logoData: brandLogoData
      };
    }
  };

  const commitCommissionSettings = async () => {
    if (
      globalRate === commissionSnapshot.current.globalRate &&
      categoryRate === commissionSnapshot.current.categoryRate
    ) {
      return;
    }

    const ok = await persistSettings(
      {
        commission: {
          globalRate,
          categoryRate,
          categoryLabel: data.commission.categoryLabel
        }
      },
      "Commission settings updated"
    );

    if (ok) {
      commissionSnapshot.current = {
        globalRate,
        categoryRate
      };
    }
  };

  const handleLogoUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      setBrandLogoData(result);
      const ok = await persistSettings(
        {
          general: {
            platformName,
            supportEmail,
            brandIdentity: {
              logoData: result,
              note: data.general.brandIdentity.note,
              cta: data.general.brandIdentity.cta
            }
          }
        },
        "Brand identity updated"
      );

      if (ok) {
        generalSnapshot.current = {
          platformName,
          supportEmail,
          logoData: result
        };
      }
    };
    reader.readAsDataURL(file);
  };

  const handlePasswordUpdate = async () => {
    setPasswordStatus(null);
    setPasswordError(null);

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError("All password fields are required.");
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError("New password must be at least 8 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("New password and confirmation do not match.");
      return;
    }

    const response = await fetch("/api/auth/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: data.admin.email,
        currentPassword,
        newPassword
      })
    });

    if (!response.ok) {
      setPasswordError("Current password is incorrect.");
      return;
    }

    setPasswordError(null);
    setPasswordStatus("Password updated");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setTimeout(() => setPasswordStatus(null), 1800);
  };

  const initials = data.admin.name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return (
    <section className="space-y-5 pb-6 pt-2">
      <header className="flex flex-col gap-2">
        <div>
          <h2 className="m-0 text-[28px] font-semibold tracking-[-0.03em] text-[#18233c] sm:text-[32px]">
            {data.title}
          </h2>
          <p className="m-0 mt-1 text-[13px] text-[#74819a]">{data.description}</p>
        </div>
        {saveStatus && <p className="m-0 text-[12px] font-medium text-[#24408d]">{saveStatus}</p>}
      </header>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.75fr)_290px]">
        <div className="space-y-4">
          <section className={panelClass}>
            <SectionBadge icon={<FiGlobe size={13} />}>General Settings</SectionBadge>
            <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
              <div className="space-y-3">
                <div>
                  <FieldLabel>Platform Name</FieldLabel>
                  <input
                    type="text"
                    value={platformName}
                    onChange={(event) => setPlatformName(event.target.value)}
                    onBlur={commitGeneralSettings}
                    className={inputClass}
                  />
                </div>
                <div>
                  <FieldLabel>Support Email</FieldLabel>
                  <input
                    type="email"
                    value={supportEmail}
                    onChange={(event) => setSupportEmail(event.target.value)}
                    onBlur={commitGeneralSettings}
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <FieldLabel>Brand Identity</FieldLabel>
                <div className="flex min-h-[124px] gap-3 rounded-[14px] border border-dashed border-[#cfd7e5] bg-[#fafbfd] px-3 py-3">
                  <div className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-[14px] border border-[#d8e0eb] bg-white">
                    {brandLogoData ? (
                      <Image src={brandLogoData} alt="Brand mark" width={48} height={48} className="h-12 w-12 object-contain" />
                    ) : (
                      <FiUploadCloud size={18} className="text-[#24408d]" />
                    )}
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col justify-center">
                    <p className="m-0 text-[11px] leading-5 text-[#8a96ad]">{data.general.brandIdentity.note}</p>
                    <button
                      type="button"
                      onClick={() => logoInputRef.current?.click()}
                      className="mt-3 w-fit bg-transparent p-0 text-[12px] font-semibold text-[#24408d]"
                    >
                      {data.general.brandIdentity.cta}
                    </button>
                  </div>
                </div>
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleLogoUpload}
                />
              </div>
            </div>
          </section>

          <section className={panelClass}>
            <SectionBadge icon={<FiCreditCard size={13} />}>Commission &amp; Revenue</SectionBadge>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div>
                <FieldLabel>Global Service Commission (%)</FieldLabel>
                <div className="relative">
                  <input
                    type="number"
                    value={globalRate}
                    onChange={(event) => setGlobalRate(event.target.value)}
                    onBlur={commitCommissionSettings}
                    className={`${inputClass} pr-10`}
                  />
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[12px] text-[#9aa5ba]">
                    %
                  </span>
                </div>
                <p className="m-0 mt-2 text-[11px] text-[#97a1b4]">
                  Default rate applied to all categories unless specified.
                </p>
              </div>
              <div>
                <FieldLabel>Category-Specific Rate ({data.commission.categoryLabel})</FieldLabel>
                <div className="relative">
                  <input
                    type="number"
                    value={categoryRate}
                    onChange={(event) => setCategoryRate(event.target.value)}
                    onBlur={commitCommissionSettings}
                    className={`${inputClass} pr-10`}
                  />
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[12px] text-[#9aa5ba]">
                    %
                  </span>
                </div>
              </div>
            </div>
          </section>

          <section className={panelClass}>
            <h3 className="m-0 text-[22px] font-medium text-[#1e2b43]">Legal &amp; Compliance</h3>
            <div className="mt-4 overflow-hidden rounded-[14px] border border-[#edf1f6] bg-white">
              <div className="flex items-center justify-between px-3 py-3 text-[13px] text-[#1f2b42]">
                <span>{data.legal.terms}</span>
                <Link
                  href="/settings/legal-content?tab=terms"
                  className="inline-flex items-center gap-1 text-[12px] font-semibold text-[#24408d]"
                >
                  Edit <FiExternalLink size={12} />
                </Link>
              </div>
              <div className="h-px bg-[#edf1f6]" />
              <div className="flex items-center justify-between px-3 py-3 text-[13px] text-[#1f2b42]">
                <span>{data.legal.privacy}</span>
                <Link
                  href="/settings/legal-content?tab=privacy"
                  className="inline-flex items-center gap-1 text-[12px] font-semibold text-[#24408d]"
                >
                  Edit <FiExternalLink size={12} />
                </Link>
              </div>
              <div className="h-px bg-[#edf1f6]" />
              <div className="flex items-center justify-between px-3 py-3 text-[13px] text-[#1f2b42]">
                <span>{data.legal.gdpr}</span>
                <span className="inline-flex items-center gap-1 rounded-full bg-[#dff7e8] px-3 py-1 text-[11px] font-semibold text-[#24895a]">
                  <FiCheck size={11} />
                  {data.legal.gdprStatus}
                </span>
              </div>
            </div>
          </section>
        </div>

        <aside className={`${panelClass} h-fit`}>
          <h3 className="m-0 text-[24px] font-medium text-[#1e2b43]">Admin Profile</h3>
          <div className="mt-5 flex flex-col items-center text-center">
            <div className="relative grid h-[74px] w-[74px] place-items-center overflow-hidden rounded-full bg-[radial-gradient(circle_at_top,#49a2ff_0%,#1f4db6_55%,#14306b_100%)] text-[24px] font-semibold text-white">
              {data.admin.avatar && !avatarBroken ? (
                <Image
                  src={data.admin.avatar}
                  alt={data.admin.name}
                  fill
                  unoptimized
                  className="object-cover"
                  onError={() => setAvatarBroken(true)}
                />
              ) : (
                initials
              )}
            </div>
            <p className="m-0 mt-4 text-[16px] font-semibold text-[#1e2b43]">{data.admin.name}</p>
            <p className="m-0 mt-1 text-[12px] text-[#7e8aa1]">{data.admin.email}</p>
          </div>

          <div className="mt-5 space-y-3">
            <div>
              <FieldLabel>Current Password</FieldLabel>
              <input
                type="password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <FieldLabel>New Password</FieldLabel>
              <input
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <FieldLabel>Confirm New Password</FieldLabel>
              <input
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          {(passwordError || passwordStatus) && (
            <p className={`m-0 mt-3 text-[12px] ${passwordError ? "text-[#d44a4a]" : "text-[#24408d]"}`}>
              {passwordError ?? passwordStatus}
            </p>
          )}

          <button
            type="button"
            onClick={handlePasswordUpdate}
            className="mt-4 h-11 w-full rounded-[8px] bg-[#24408d] text-[13px] font-semibold text-white shadow-[0_12px_28px_rgba(36,64,141,0.2)]"
          >
            Update Password
          </button>
        </aside>
      </div>
    </section>
  );
}
