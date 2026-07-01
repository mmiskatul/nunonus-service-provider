"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Header } from "@/components/Header";
import Link from "next/link";
import {
  TrendingUp,
  Users,
  MousePointer2,
  Plus,
  Tag,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PromotionsTable, Promotion } from "@/components/PromotionsTable";
import { CampaignCard } from "@/components/CampaignCard";
import {
  vendorListPromotions,
  vendorJoinPlatformCampaign,
} from "@/lib/vendor-api";

type PromotionSummary = {
  totalPromotions: number;
  activePromotions: number;
  campaignReach: number;
  averageConversionPercent: number | null;
  totalPromoRevenue: string | null;
};

type PlatformCampaign = {
  id: string;
  title: string;
  description: string;
  requirement: string;
  requirementValue: string;
  duration: string;
  durationValue: string;
  boostType: "visibility" | "acquisition" | "premium";
  boostText: string;
  boostSubtext: string;
  commission: string;
  isActive: boolean;
};

type PromotionsResponse = {
  items?: Record<string, unknown>[];
  summary?: Record<string, unknown>;
  business_promotions?: Record<string, unknown>[];
  platform_campaigns?: Record<string, unknown>[];
};

function toNumber(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string") {
    const parsed = Number(value.replace(/[^\d.-]/g, ""));
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function formatCompactNumber(value: number): string {
  return new Intl.NumberFormat("en", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

function formatPercent(value: number | null): string {
  return value === null ? "--" : `${value}%`;
}

function formatMoney(value: unknown): string | null {
  if (typeof value === "string" && value.trim()) {
    return value;
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(value);
  }
  return null;
}

function normalizeBoostType(value: unknown): PlatformCampaign["boostType"] {
  if (typeof value === "string") {
    const normalized = value.toLowerCase();
    if (normalized === "acquisition" || normalized === "premium") {
      return normalized;
    }
  }
  return "visibility";
}

function normalizePlatformCampaign(
  campaign: Record<string, unknown>,
): PlatformCampaign {
  const requirementValue =
    (campaign.requirement_value ??
      campaign.requirementValue ??
      campaign.min_discount ??
      campaign.discount ??
      campaign.offer_value) as string | number | undefined;
  const durationValue =
    (campaign.duration_value ??
      campaign.durationValue ??
      campaign.duration ??
      campaign.validity ??
      campaign.date_range) as string | undefined;
  const commissionPercent = campaign.commission_percent ?? campaign.commission;

  return {
    id: String(campaign.id ?? campaign._id ?? ""),
    title: String(campaign.campaign_name ?? campaign.title ?? campaign.name ?? "Campaign"),
    description: String(campaign.description ?? ""),
    requirement: "Requirement",
    requirementValue:
      requirementValue !== undefined && requirementValue !== null && `${requirementValue}`.trim()
        ? `${requirementValue}`
        : "--",
    duration: "Duration",
    durationValue: durationValue && durationValue.trim() ? durationValue : "--",
    boostType: normalizeBoostType(campaign.boost_type ?? campaign.type),
    boostText: String(campaign.boost_text ?? campaign.boost_label ?? "PLATFORM BOOST"),
    boostSubtext: String(campaign.boost_subtext ?? campaign.boost_description ?? "Live campaign visibility from the platform."),
    commission:
      commissionPercent !== undefined && commissionPercent !== null && `${commissionPercent}`.trim()
        ? `${commissionPercent}${typeof commissionPercent === "number" ? "%" : ""}`
        : "--",
    isActive: Boolean(campaign.joined ?? campaign.is_active ?? campaign.active),
  };
}

const EMPTY_SUMMARY: PromotionSummary = {
  totalPromotions: 0,
  activePromotions: 0,
  campaignReach: 0,
  averageConversionPercent: null,
  totalPromoRevenue: null,
};

export default function PromotionsPage() {
  const [businessPromotions, setBusinessPromotions] = useState<Promotion[]>([]);
  const [summary, setSummary] = useState<PromotionSummary>(EMPTY_SUMMARY);
  const [platformCampaigns, setPlatformCampaigns] = useState<PlatformCampaign[]>([]);
  const [campaignStates, setCampaignStates] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  const fetchPromotions = useCallback(async () => {
    try {
      const raw = (await vendorListPromotions()) as PromotionsResponse;
      const items = raw?.business_promotions ?? raw?.items ?? [];
      const normalized: Promotion[] = items.map((p) => ({
        id: (p.id ?? p._id ?? "") as string,
        name: (p.name ?? p.title ?? "") as string,
        description: (p.description ?? "") as string,
        type: (p.type ?? "PERCENTAGE") as string,
        value: (p.value ?? "") as string,
        schedule: (p.schedule ?? "") as string,
        usageCount: (p.usage_count ?? p.usageCount ?? 0) as number,
        usageMax: (p.usage_max ?? p.usageMax ?? 100) as number,
        isActive: (p.is_active ?? p.isActive ?? false) as boolean,
      }));
      const rawSummary = raw.summary ?? {};
      const normalizedCampaigns = (raw.platform_campaigns ?? []).map(normalizePlatformCampaign);

      setSummary({
        totalPromotions: toNumber(rawSummary.total_promotions),
        activePromotions: toNumber(rawSummary.active_promotions),
        campaignReach: toNumber(rawSummary.campaign_reach),
        averageConversionPercent:
          rawSummary.avg_conversion_percent === undefined ||
          rawSummary.avg_conversion_percent === null
            ? null
            : toNumber(rawSummary.avg_conversion_percent),
        totalPromoRevenue: formatMoney(
          rawSummary.total_promo_revenue ?? rawSummary.promo_revenue,
        ),
      });
      setBusinessPromotions(normalized);
      setPlatformCampaigns(normalizedCampaigns);
      setCampaignStates(
        Object.fromEntries(
          normalizedCampaigns.map((campaign) => [campaign.id, campaign.isActive]),
        ),
      );
    } catch (err) {
      console.warn("Failed to load promotions:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPromotions(); }, [fetchPromotions]);

  const toggleCampaign = async (id: string) => {
    const newState = !campaignStates[id];
    setCampaignStates((prev) => ({ ...prev, [id]: newState }));
    try {
      await vendorJoinPlatformCampaign(id, newState);
    } catch (err) {
      console.warn("Failed to update campaign state:", err);
      // Revert on failure
      setCampaignStates((prev) => ({ ...prev, [id]: !newState }));
    }
  };
  const stats = [
    {
      label: "TOTAL PROMO REVENUE",
      value: summary.totalPromoRevenue ?? "--",
      icon: TrendingUp,
    },
    {
      label: "ACTIVE PROMOTIONS",
      value: `${summary.activePromotions}`,
      subtext: `${summary.totalPromotions} total promotions`,
      icon: Tag,
    },
    {
      label: "CAMPAIGN REACH",
      value: formatCompactNumber(summary.campaignReach),
      icon: Users,
    },
    {
      label: "AVG. CONVERSION",
      value: formatPercent(summary.averageConversionPercent),
      icon: MousePointer2,
    },
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col pb-10">
      <Header title="Promotions" />

      <main className="flex-1 p-6 md:p-10 space-y-10">
        <div className="max-w-[1400px] mx-auto space-y-10">
          {/* Page Title & Add Button */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div>
              <h1 className="text-3xl font-bold text-slate-800">
                Marketing Overview
              </h1>
              <p className="text-sm text-slate-400 mt-1">
                Manage your internal offers and discover platform growth
                opportunities.
              </p>
            </div>
            <Link
              href="/promotions/new"
              className="px-6 py-3 bg-[#1e2a5e] hover:bg-[#1a2552] text-white rounded-xl text-sm font-bold flex items-center gap-2 shadow-xl shadow-slate-900/10 transition-all"
            >
              <Plus className="h-4 w-4" />
              Add Promotion
            </Link>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, idx) => (
              <div
                key={idx}
                className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 relative overflow-hidden group hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col gap-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    {stat.label}
                  </p>
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-2xl font-bold text-slate-800">
                      {stat.value}
                    </span>
                  </div>
                  {stat.subtext && (
                    <p className="text-[10px] font-medium text-slate-400 mt-1">
                      {stat.subtext}
                    </p>
                  )}
                </div>
                <div className="absolute top-6 right-6 h-10 w-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:text-sky-500 transition-colors">
                  <stat.icon className="h-5 w-5" />
                </div>
              </div>
            ))}
          </div>

          {/* Business Promotions Table */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-6 h-6 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <PromotionsTable promotions={businessPromotions} />
          )}

          {/* Platform Campaigns */}
          <section className="space-y-6 pt-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-800">
                  Platform Campaigns
                </h2>
                <p className="text-sm text-slate-400 mt-1">
                  Join network-wide events to boost your visibility.
                </p>
              </div>
              <button className="text-sm font-bold text-sky-600 hover:text-sky-700 flex items-center gap-1 group">
                View All Opportunities
                <ChevronRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {platformCampaigns.length > 0 ? (
                platformCampaigns.map((campaign) => (
                  <CampaignCard
                    key={campaign.id}
                    {...campaign}
                    isActive={campaignStates[campaign.id] ?? campaign.isActive}
                    onToggle={() => toggleCampaign(campaign.id)}
                  />
                ))
              ) : (
                <div className="md:col-span-2 lg:col-span-3 rounded-[32px] border border-dashed border-slate-200 bg-white p-8 text-sm text-slate-500">
                  No platform campaigns available.
                </div>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
