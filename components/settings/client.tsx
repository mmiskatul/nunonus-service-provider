"use client";

import Image from "next/image";
import { FiEdit2, FiShield, FiUpload } from "react-icons/fi";

type SettingsData = {
  title: string;
  description: string;
  general: {
    platformName: string;
    supportEmail: string;
    brandIdentity: {
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
  return (
    <section className="space-y-4">
      <header className="rounded-2xl border border-[#e6ecf7] bg-white px-5 py-4">
        <h2 className="m-0 text-[18px] font-semibold text-[#1d2a43]">{data.title}</h2>
        <p className="m-0 mt-1 text-[11px] text-[#7d8ba6]">{data.description}</p>
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
                  defaultValue={data.general.platformName}
                  className="mt-2 w-full rounded-xl border border-[#e6ecf7] bg-[#f8fafc] px-3 py-2 text-[11px] text-[#1f2d46] outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] text-[#7d8ba6]">Support Email</label>
                <input
                  type="email"
                  defaultValue={data.general.supportEmail}
                  className="mt-2 w-full rounded-xl border border-[#e6ecf7] bg-[#f8fafc] px-3 py-2 text-[11px] text-[#1f2d46] outline-none"
                />
              </div>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-3 rounded-2xl border border-dashed border-[#dbe2ef] bg-[#f8fafc] px-3 py-3">
              <div className="grid h-10 w-10 place-items-center rounded-2xl bg-white text-[#1f3d8f] shadow-sm">
                <FiUpload size={16} />
              </div>
              <div className="flex-1 text-[10px] text-[#7d8ba6]">
                <p className="m-0 text-[11px] font-semibold text-[#1f2d46]">Brand Identity</p>
                <p className="m-0 mt-1">{data.general.brandIdentity.note}</p>
              </div>
              <button
                type="button"
                className="rounded-full border border-[#e6ecf7] bg-white px-3 py-1.5 text-[10px] font-semibold text-[#1f3d8f]"
              >
                {data.general.brandIdentity.cta}
              </button>
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
                    defaultValue={data.commission.globalRate}
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
                    defaultValue={data.commission.categoryRate}
                    className="w-full border-0 bg-transparent text-[11px] text-[#1f2d46] outline-none"
                  />
                  <span className="text-[10px] text-[#94a3b8]">%</span>
                </div>
              </div>
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
            <p className="m-0 mt-3 text-[12px] font-semibold text-[#1f2d46]">{data.admin.name}</p>
            <p className="m-0 mt-1 text-[10px] text-[#94a3b8]">{data.admin.email}</p>
          </div>
          <div className="mt-4 space-y-3 text-[10px] text-[#7d8ba6]">
            <div>
              <label>Current Password</label>
              <input
                type="password"
                className="mt-2 w-full rounded-xl border border-[#e6ecf7] bg-[#f8fafc] px-3 py-2 text-[11px] text-[#1f2d46] outline-none"
              />
            </div>
            <div>
              <label>New Password</label>
              <input
                type="password"
                className="mt-2 w-full rounded-xl border border-[#e6ecf7] bg-[#f8fafc] px-3 py-2 text-[11px] text-[#1f2d46] outline-none"
              />
            </div>
            <div>
              <label>Confirm New Password</label>
              <input
                type="password"
                className="mt-2 w-full rounded-xl border border-[#e6ecf7] bg-[#f8fafc] px-3 py-2 text-[11px] text-[#1f2d46] outline-none"
              />
            </div>
            <button
              type="button"
              className="mt-3 w-full rounded-full bg-[#1f3d8f] px-4 py-2 text-[11px] font-semibold text-white"
            >
              Update Password
            </button>
          </div>
        </aside>
      </section>
    </section>
  );
}
