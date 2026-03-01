"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { FiEdit2, FiShield, FiUpload } from "react-icons/fi";

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

export function SettingsView({ data }: { data: SettingsData }) {
  const [platformName, setPlatformName] = useState(data.general.platformName);
  const [supportEmail, setSupportEmail] = useState(data.general.supportEmail);
  const [brandLogoData, setBrandLogoData] = useState(data.general.brandIdentity.logoData ?? "");
  const [globalRate, setGlobalRate] = useState(data.commission.globalRate);
  const [categoryRate, setCategoryRate] = useState(data.commission.categoryRate);
  const [adminName, setAdminName] = useState(data.admin.name);
  const [adminEmail, setAdminEmail] = useState(data.admin.email);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [passwordStatus, setPasswordStatus] = useState<string | null>(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<{
    title: string;
    description: string;
    onConfirm: () => void;
  } | null>(null);
  const logoInputRef = useRef<HTMLInputElement | null>(null);

  const persistSettings = async (payload: Partial<SettingsData>) => {
    setSaveStatus("Saving...");
    const response = await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (!response.ok) {
      setSaveStatus("Save failed");
      return;
    }
    setSaveStatus("Saved");
    setTimeout(() => setSaveStatus(null), 1500);
  };

  const handleLogoUpload = async (file?: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      setBrandLogoData(result);
      persistSettings({
        general: {
          platformName,
          supportEmail,
          brandIdentity: {
            logoData: result,
            note: data.general.brandIdentity.note,
            cta: data.general.brandIdentity.cta
          }
        }
      });
    };
    reader.readAsDataURL(file);
  };
  return (
    <section className="space-y-4">
      <header className="rounded-2xl border border-[#e6ecf7] bg-white px-5 py-4">
        <h2 className="m-0 text-[18px] font-semibold text-[#1d2a43]">{data.title}</h2>
        <p className="m-0 mt-1 text-[11px] text-[#7d8ba6]">{data.description}</p>
        {saveStatus && <p className="m-0 mt-2 text-[10px] text-[#1f3d8f]">{saveStatus}</p>}
      </header>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-[1.2fr_0.7fr]">
        <div className="space-y-4">
          <section className="rounded-2xl border border-[#e6ecf7] bg-white p-4">
            <div className="flex items-center gap-2 text-[11px] font-semibold text-[#1f2d46]">
              <span className="grid h-6 w-6 place-items-center rounded-full bg-[#eef2ff] text-[#1f3d8f]">
                <FiShield size={12} />
              </span>
              General Settings
            </div>
            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="text-[10px] text-[#7d8ba6]">Platform Name</label>
                <input
                  type="text"
                  value={platformName}
                  onChange={(event) => setPlatformName(event.target.value)}
                  className="mt-2 w-full rounded-xl border border-[#e6ecf7] bg-[#f8fafc] px-3 py-2 text-[11px] text-[#1f2d46] outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] text-[#7d8ba6]">Support Email</label>
                <input
                  type="email"
                  value={supportEmail}
                  onChange={(event) => setSupportEmail(event.target.value)}
                  className="mt-2 w-full rounded-xl border border-[#e6ecf7] bg-[#f8fafc] px-3 py-2 text-[11px] text-[#1f2d46] outline-none"
                />
              </div>
            </div>
            <div className="mt-3 flex justify-end">
              <button
                type="button"
                onClick={() =>
                  setConfirmAction({
                    title: "Save General Settings",
                    description: "Apply platform name and support email changes?",
                    onConfirm: () =>
                      persistSettings({
                        general: {
                          platformName,
                          supportEmail,
                          brandIdentity: {
                            logoData: brandLogoData,
                            note: data.general.brandIdentity.note,
                            cta: data.general.brandIdentity.cta
                          }
                        }
                      })
                  })
                }
                className="rounded-full border border-[#e6ecf7] bg-white px-3 py-1.5 text-[10px] font-semibold text-[#1f3d8f]"
              >
                Save Changes
              </button>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-3 rounded-2xl border border-dashed border-[#dbe2ef] bg-[#f8fafc] px-3 py-3">
              <div className="grid h-10 w-10 place-items-center overflow-hidden rounded-2xl bg-white text-[#1f3d8f] shadow-sm">
                {brandLogoData ? (
                  <Image src={brandLogoData} alt="Brand Logo" width={40} height={40} />
                ) : (
                  <FiUpload size={16} />
                )}
              </div>
              <div className="flex-1 text-[10px] text-[#7d8ba6]">
                <p className="m-0 text-[11px] font-semibold text-[#1f2d46]">Brand Identity</p>
                <p className="m-0 mt-1">{data.general.brandIdentity.note}</p>
              </div>
              <button
                type="button"
                onClick={() => logoInputRef.current?.click()}
                className="rounded-full border border-[#e6ecf7] bg-white px-3 py-1.5 text-[10px] font-semibold text-[#1f3d8f]"
              >
                {data.general.brandIdentity.cta}
              </button>
              <input
                ref={logoInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) => handleLogoUpload(event.target.files?.[0])}
              />
            </div>
          </section>

          <section className="rounded-2xl border border-[#e6ecf7] bg-white p-4">
            <div className="flex items-center gap-2 text-[11px] font-semibold text-[#1f2d46]">
              <span className="grid h-6 w-6 place-items-center rounded-full bg-[#eef2ff] text-[#1f3d8f]">
                %
              </span>
              Commission & Revenue
            </div>
            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="text-[10px] text-[#7d8ba6]">Global Service Commission (%)</label>
                <div className="mt-2 flex items-center rounded-xl border border-[#e6ecf7] bg-[#f8fafc] px-3 py-2">
                  <input
                    type="number"
                    value={globalRate}
                    onChange={(event) => setGlobalRate(event.target.value)}
                    className="w-full border-0 bg-transparent text-[11px] text-[#1f2d46] outline-none"
                  />
                  <span className="text-[10px] text-[#94a3b8]">%</span>
                </div>
                <p className="m-0 mt-2 text-[9px] text-[#94a3b8]">
                  Default rate applied to all categories unless specified.
                </p>
              </div>
              <div>
                <label className="text-[10px] text-[#7d8ba6]">
                  Category-Specific Rate ({data.commission.categoryLabel})
                </label>
                <div className="mt-2 flex items-center rounded-xl border border-[#e6ecf7] bg-[#f8fafc] px-3 py-2">
                  <input
                    type="number"
                    value={categoryRate}
                    onChange={(event) => setCategoryRate(event.target.value)}
                    className="w-full border-0 bg-transparent text-[11px] text-[#1f2d46] outline-none"
                  />
                  <span className="text-[10px] text-[#94a3b8]">%</span>
                </div>
              </div>
            </div>
            <div className="mt-3 flex justify-end">
              <button
                type="button"
                onClick={() =>
                  setConfirmAction({
                    title: "Save Commission Rates",
                    description: "Apply updated commission rates?",
                    onConfirm: () =>
                      persistSettings({
                        commission: {
                          globalRate,
                          categoryRate,
                          categoryLabel: data.commission.categoryLabel
                        }
                      })
                  })
                }
                className="rounded-full border border-[#e6ecf7] bg-white px-3 py-1.5 text-[10px] font-semibold text-[#1f3d8f]"
              >
                Save Rates
              </button>
            </div>
          </section>

          <section className="rounded-2xl border border-[#e6ecf7] bg-white p-4">
            <div className="flex items-center gap-2 text-[11px] font-semibold text-[#1f2d46]">
              <span className="grid h-6 w-6 place-items-center rounded-full bg-[#eef2ff] text-[#1f3d8f]">
                <FiEdit2 size={12} />
              </span>
              Legal & Compliance
            </div>
            <div className="mt-4 space-y-3 text-[11px] text-[#1f2d46]">
              <div className="flex items-center justify-between">
                <span>{data.legal.terms}</span>
                <button className="text-[10px] font-semibold text-[#1f3d8f]">Edit</button>
              </div>
              <div className="flex items-center justify-between">
                <span>{data.legal.privacy}</span>
                <button className="text-[10px] font-semibold text-[#1f3d8f]">Edit</button>
              </div>
              <div className="flex items-center justify-between">
                <span>{data.legal.gdpr}</span>
                <span className="rounded-full bg-[#dcfce7] px-2 py-0.5 text-[9px] font-semibold text-[#15803d]">
                  {data.legal.gdprStatus}
                </span>
              </div>
            </div>
          </section>
        </div>

        <aside className="rounded-2xl border border-[#e6ecf7] bg-white p-4">
          <h3 className="m-0 text-[12px] font-semibold text-[#1f2d46]">Admin Profile</h3>
          <div className="mt-4 flex flex-col items-center text-center">
            <div className="relative h-16 w-16 overflow-hidden rounded-full bg-gradient-to-br from-[#1f3d8f] to-[#60a5fa]">
              {data.admin.avatar && (
                <Image src={data.admin.avatar} alt={data.admin.name} fill className="object-cover" />
              )}
            </div>
            <input
              type="text"
              value={adminName}
              onChange={(event) => setAdminName(event.target.value)}
              className="mt-3 w-full rounded-xl border border-[#e6ecf7] bg-[#f8fafc] px-3 py-2 text-center text-[11px] text-[#1f2d46] outline-none"
            />
            <input
              type="email"
              value={adminEmail}
              onChange={(event) => setAdminEmail(event.target.value)}
              className="mt-2 w-full rounded-xl border border-[#e6ecf7] bg-[#f8fafc] px-3 py-2 text-center text-[11px] text-[#1f2d46] outline-none"
            />
          </div>
          <div className="mt-4 space-y-3 text-[10px] text-[#7d8ba6]">
            <div>
              <label>Current Password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                className="mt-2 w-full rounded-xl border border-[#e6ecf7] bg-[#f8fafc] px-3 py-2 text-[11px] text-[#1f2d46] outline-none"
              />
            </div>
            <div>
              <label>New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                className="mt-2 w-full rounded-xl border border-[#e6ecf7] bg-[#f8fafc] px-3 py-2 text-[11px] text-[#1f2d46] outline-none"
              />
            </div>
            <div>
              <label>Confirm New Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className="mt-2 w-full rounded-xl border border-[#e6ecf7] bg-[#f8fafc] px-3 py-2 text-[11px] text-[#1f2d46] outline-none"
              />
            </div>
            <button
              type="button"
              onClick={() => {
                setPasswordStatus(null);
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
                setPasswordError(null);
                setPasswordStatus("Password updated");
                setCurrentPassword("");
                setNewPassword("");
                setConfirmPassword("");
                setTimeout(() => setPasswordStatus(null), 1500);
              }}
              className="mt-3 w-full rounded-full bg-[#1f3d8f] px-4 py-2 text-[11px] font-semibold text-white"
            >
              Update Password
            </button>
            {passwordError && (
              <p className="m-0 text-[10px] text-[#ef4444]">{passwordError}</p>
            )}
            {passwordStatus && (
              <p className="m-0 text-[10px] text-[#1f3d8f]">{passwordStatus}</p>
            )}
            <button
              type="button"
              onClick={() =>
                persistSettings({
                  admin: {
                    name: adminName,
                    email: adminEmail,
                    avatar: data.admin.avatar
                  }
                })
              }
              className="w-full rounded-full border border-[#e6ecf7] bg-white px-4 py-2 text-[11px] font-semibold text-[#1f3d8f]"
            >
              Save Profile
            </button>
          </div>
        </aside>
      </section>
      {confirmAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div
            className="fixed inset-0 bg-[#0f172a]/40"
            onClick={() => setConfirmAction(null)}
          />
          <div className="relative z-10 w-full max-w-[420px] rounded-2xl border border-[#e6ecf7] bg-white p-5 shadow-2xl">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="m-0 text-[14px] font-semibold text-[#1f2d46]">
                  {confirmAction.title}
                </h4>
                <p className="m-0 mt-2 text-[11px] text-[#64748b]">
                  {confirmAction.description}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setConfirmAction(null)}
                className="text-[#94a3b8]"
                aria-label="Close confirmation"
              >
                ✕
              </button>
            </div>
            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmAction(null)}
                className="rounded-full border border-[#e6ecf7] bg-white px-4 py-2 text-[11px] font-semibold text-[#1f2d46]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const run = confirmAction.onConfirm;
                  setConfirmAction(null);
                  run();
                }}
                className="rounded-full bg-[#1f3d8f] px-4 py-2 text-[11px] font-semibold text-white shadow-md shadow-[#1f3d8f]/20"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
