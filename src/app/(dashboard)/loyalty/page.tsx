"use client";

import React, { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { useToast } from "@/components/ui/ToastProvider";
import {
  Trophy,
  Zap,
  Gift,
  Users,
  History,
  CircleDot,
  RotateCcw,
  Sparkles,
  ChevronDown,
  Save,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { vendorGetLoyaltySettings, vendorUpdateLoyaltySettings } from "@/lib/vendor-api";

interface LoyaltySettings {
  enable_loyalty_program?: boolean;
  points_rule_type?: string;
  points_earned?: number;
  currency_unit?: number;
  percentage_value?: number;
  first_booking_bonus?: number;
  review_bonus_points?: number;
  points_expiry_policy?: string;
  total_points_issued?: number;
  active_members?: number;
  repeat_booking_rate?: number;
}

export default function LoyaltyPage() {
  const { toast } = useToast();
  const [settings, setSettings] = useState<LoyaltySettings>({
    enable_loyalty_program: true,
    points_rule_type: "points_per_currency",
    points_earned: 5,
    currency_unit: 1,
    percentage_value: 10,
    first_booking_bonus: 100,
    review_bonus_points: 25,
    points_expiry_policy: "1 Year",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    vendorGetLoyaltySettings()
      .then((data) => {
        const d = data as LoyaltySettings;
        if (d && Object.keys(d).length > 0) setSettings(d);
      })
      .catch(() => {/* keep defaults */})
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await vendorUpdateLoyaltySettings({
        enable_loyalty_program: settings.enable_loyalty_program ?? true,
        points_rule_type: settings.points_rule_type ?? "points_per_currency",
        points_earned: settings.points_earned ?? 5,
        currency_unit: settings.currency_unit ?? 1,
        percentage_value: settings.percentage_value ?? 0,
        first_booking_bonus: settings.first_booking_bonus ?? 0,
        review_bonus_points: settings.review_bonus_points ?? 0,
        points_expiry_policy: settings.points_expiry_policy ?? "1 Year",
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      toast("Failed to save: " + (err instanceof Error ? err.message : String(err)), "error");
    } finally {
      setSaving(false);
    }
  };

  const statsItems = [
    {
      label: "TOTAL POINTS ISSUED",
      value: settings.total_points_issued != null ? Number(settings.total_points_issued).toLocaleString() : "—",
      trend: "",
      icon: CircleDot,
      color: "text-[#1e2a5e]",
    },
    {
      label: "ACTIVE MEMBERS",
      value: settings.active_members != null ? Number(settings.active_members).toLocaleString() : "—",
      trend: "",
      icon: Users,
      color: "text-[#1e2a5e]",
    },
    {
      label: "REPEAT BOOKING RATE",
      value: settings.repeat_booking_rate != null ? `${settings.repeat_booking_rate}%` : "—",
      trend: "",
      icon: History,
      color: "text-[#1e2a5e]",
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex flex-col">
        <Header title="Loyalty Program" />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col pb-10">
      <Header title="Loyalty Program" />

      <main className="flex-1 p-6 md:p-10 space-y-8">
        <div className="max-w-[1400px] mx-auto space-y-8">
          {/* Page Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div>
              <h1 className="text-3xl font-bold text-slate-800">Loyalty Points Settings</h1>
              <p className="text-sm text-slate-400 mt-1">Configure how your customers earn and spend rewards</p>
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 bg-[#1e2a5e] hover:bg-[#1a2552] text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-xl shadow-slate-900/10 transition-all disabled:opacity-60"
            >
              <Save className="h-4 w-4" />
              {saving ? "Saving…" : saved ? "Saved!" : "Save Changes"}
            </button>
          </div>

          {/* Master Enable Toggle */}
          <div className="bg-white rounded-[32px] p-8 shadow-sm border border-slate-100 flex items-center justify-between">
            <div className="flex gap-6 items-center">
              <div className="h-14 w-14 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-500 shadow-sm border border-amber-100/50">
                <Trophy className="h-7 w-7" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-3">
                  Enable Loyalty Program
                  <span className={cn(
                    "text-[10px] font-black px-3 py-1 rounded-lg uppercase tracking-wider",
                    settings.enable_loyalty_program ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-500",
                  )}>
                    {settings.enable_loyalty_program ? "Active" : "Inactive"}
                  </span>
                </h3>
                <p className="text-sm text-slate-400 mt-1">
                  Allow customers to accumulate points on their bookings and reviews.
                </p>
              </div>
            </div>
            <button
              onClick={() => setSettings((s) => ({ ...s, enable_loyalty_program: !s.enable_loyalty_program }))}
              className={cn(
                "relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none",
                settings.enable_loyalty_program ? "bg-[#1e2a5e]" : "bg-slate-200",
              )}
            >
              <span className={cn(
                "inline-block h-6 w-6 transform rounded-full bg-white transition-transform",
                settings.enable_loyalty_program ? "translate-x-7" : "translate-x-1",
              )} />
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Earning Rules */}
            <div className="lg:col-span-7 bg-white rounded-[40px] p-10 shadow-sm border border-slate-100">
              <div className="flex items-center gap-3 mb-10">
                <Zap className="h-5 w-5 text-sky-500" />
                <h3 className="text-xl font-bold text-slate-800">Points Earning Rule</h3>
              </div>
              <div className="space-y-6">
                {/* Currency Rule */}
                <div
                  onClick={() => setSettings((s) => ({ ...s, points_rule_type: "points_per_currency" }))}
                  className={cn(
                    "p-8 rounded-[32px] border-2 transition-all cursor-pointer",
                    settings.points_rule_type === "points_per_currency"
                      ? "border-sky-500 bg-sky-50/20"
                      : "border-slate-100 hover:border-slate-200",
                  )}
                >
                  <div className="flex items-start gap-4">
                    <div className={cn(
                      "h-6 w-6 rounded-full border-2 flex items-center justify-center mt-1 transition-colors",
                      settings.points_rule_type === "points_per_currency" ? "border-sky-500 bg-sky-500" : "border-slate-300",
                    )}>
                      {settings.points_rule_type === "points_per_currency" && <div className="h-2 w-2 rounded-full bg-white" />}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800">Points per Currency</h4>
                      <p className="text-sm text-slate-400 mt-1">Reward a fixed amount of points for every unit of currency spent.</p>
                      <div className="mt-6 flex items-center gap-4">
                        <div className="flex-1">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">POINTS EARNED</label>
                          <input
                            type="number"
                            value={settings.points_earned ?? 5}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => setSettings((s) => ({ ...s, points_earned: Number(e.target.value) }))}
                            className="w-full bg-white border border-slate-100 rounded-xl py-2.5 px-4 text-sm font-bold text-slate-700"
                          />
                        </div>
                        <span className="text-sm font-bold text-slate-400 mt-6">per</span>
                        <div className="flex-1">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">CURRENCY ($)</label>
                          <input
                            type="number"
                            value={settings.currency_unit ?? 1}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => setSettings((s) => ({ ...s, currency_unit: Number(e.target.value) }))}
                            className="w-full bg-white border border-slate-100 rounded-xl py-2.5 px-4 text-sm font-bold text-slate-700"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Percentage Rule */}
                <div
                  onClick={() => setSettings((s) => ({ ...s, points_rule_type: "percentage_based" }))}
                  className={cn(
                    "p-8 rounded-[32px] border-2 transition-all cursor-pointer",
                    settings.points_rule_type === "percentage_based"
                      ? "border-sky-500 bg-sky-50/20"
                      : "border-slate-100 hover:border-slate-200",
                  )}
                >
                  <div className="flex items-start gap-4">
                    <div className={cn(
                      "h-6 w-6 rounded-full border-2 flex items-center justify-center mt-1 transition-colors",
                      settings.points_rule_type === "percentage_based" ? "border-sky-500 bg-sky-500" : "border-slate-300",
                    )}>
                      {settings.points_rule_type === "percentage_based" && <div className="h-2 w-2 rounded-full bg-white" />}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-slate-800">Percentage-based</h4>
                      <p className="text-sm text-slate-400 mt-1">Earn points equal to a percentage of the total booking value.</p>
                      <div className="mt-6">
                        <div className="relative w-32">
                          <input
                            type="number"
                            value={settings.percentage_value ?? 10}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => setSettings((s) => ({ ...s, percentage_value: Number(e.target.value) }))}
                            className="w-full bg-white border border-slate-100 rounded-xl py-2.5 px-4 text-sm font-bold text-slate-700"
                          />
                          <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-slate-300">%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bonus Rules */}
            <div className="lg:col-span-5 space-y-8 flex flex-col">
              <div className="bg-white rounded-[40px] p-10 shadow-sm border border-slate-100 flex-1">
                <div className="flex items-center gap-3 mb-10">
                  <Gift className="h-5 w-5 text-indigo-500" />
                  <h3 className="text-xl font-bold text-slate-800">Bonus Rules</h3>
                </div>
                <div className="space-y-10">
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-bold text-slate-800">First Booking Bonus</h4>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">Points awarded when a customer completes their first appointment.</p>
                    </div>
                    <div className="relative">
                      <input
                        type="number"
                        value={settings.first_booking_bonus ?? 100}
                        onChange={(e) => setSettings((s) => ({ ...s, first_booking_bonus: Number(e.target.value) }))}
                        className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 px-12 text-sm font-bold text-slate-700"
                      />
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 bg-amber-100 rounded-full flex items-center justify-center text-amber-600">
                        <Sparkles className="h-3 w-3" />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-bold text-slate-800">Review Bonus Points</h4>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">Points awarded for each verified review submitted by the customer.</p>
                    </div>
                    <div className="relative">
                      <input
                        type="number"
                        value={settings.review_bonus_points ?? 25}
                        onChange={(e) => setSettings((s) => ({ ...s, review_bonus_points: Number(e.target.value) }))}
                        className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 px-12 text-sm font-bold text-slate-700"
                      />
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 bg-sky-100 rounded-full flex items-center justify-center text-sky-600">
                        <RotateCcw className="h-3 w-3" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Expiry Policy */}
          <div className="bg-white rounded-[32px] p-8 shadow-sm border border-slate-100 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex gap-6 items-center">
              <div className="h-12 w-12 bg-slate-50 rounded-2xl flex items-center justify-center text-[#1e293b]">
                <RotateCcw className="h-6 w-6" />
              </div>
              <div className="max-w-md">
                <h3 className="text-base font-bold text-slate-800">Points Expiry Policy</h3>
                <p className="text-sm text-slate-400 mt-1">Determine how long points remain valid before they are automatically removed.</p>
              </div>
            </div>
            <div className="relative w-full md:w-64">
              <select
                value={settings.points_expiry_policy ?? "1 Year"}
                onChange={(e) => setSettings((s) => ({ ...s, points_expiry_policy: e.target.value }))}
                className="appearance-none w-full bg-white border border-slate-100 rounded-xl py-3 px-6 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500/10 cursor-pointer"
              >
                <option>1 Year</option>
                <option>2 Years</option>
                <option>No Expiry</option>
              </select>
              <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* Analytics Overview */}
          <section className="pt-10 space-y-8">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-6 w-6 text-emerald-500" />
              <h2 className="text-2xl font-bold text-slate-800">Analytics Overview</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {statsItems.map((stat, i) => (
                <div key={i} className="bg-white rounded-[32px] p-8 shadow-sm border border-slate-100 group hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-8">
                    <div className={cn("h-10 w-10 bg-slate-50 rounded-xl flex items-center justify-center", stat.color)}>
                      <stat.icon className="h-5 w-5" />
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
                    <h3 className="text-3xl font-black text-[#cca352] mt-2 tracking-tight">{stat.value}</h3>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
