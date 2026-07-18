"use client";

import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Trash2 } from "lucide-react";
import { Header } from "@/components/Header";
import {
  vendorDeletePromotion,
  vendorUpdatePromotion,
} from "@/lib/vendor-api";
import { promotionQuery, vendorQueryKeys } from "@/lib/vendor-queries";

export default function PromotionDetailPage({
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const params = useParams<{ promotionId: string }>();
  const promotionId = decodeURIComponent(String(params.promotionId ?? ""));
  const [form, setForm] = useState({ name: "", description: "", value: "", startDate: "", endDate: "", active: true });
  const { data: promotion, isLoading: loading, error: queryError } = useQuery(promotionQuery(promotionId));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (promotion) {
      setForm({
        name: String(promotion.promotion_name ?? promotion.name ?? promotion.title ?? ""),
        description: String(promotion.internal_description ?? promotion.description ?? ""),
        value: String(promotion.discount_value ?? promotion.value ?? ""),
        startDate: String(promotion.start_date ?? "").slice(0, 10),
        endDate: String(promotion.end_date ?? "").slice(0, 10),
        active: Boolean(promotion.active ?? promotion.is_active ?? true),
      });
      setError("");
    } else if (queryError) setError(queryError instanceof Error ? queryError.message : "Failed to load promotion.");
  }, [promotion, queryError]);

  const update = (key: keyof typeof form, value: string | boolean) => setForm((current) => ({ ...current, [key]: value }));

  const save = async () => {
    setSaving(true);
    setError("");
    try {
      await vendorUpdatePromotion(promotionId, {
        promotion_name: form.name.trim(),
        internal_description: form.description.trim(),
        discount_value: Number(form.value),
        start_date: form.startDate,
        end_date: form.endDate,
        active: form.active,
      });
      await queryClient.invalidateQueries({ queryKey: vendorQueryKeys.promotion(promotionId) });
      router.push("/promotions");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Failed to save promotion.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    setConfirmDelete(true);
  };

  const confirmDeletePromotion = async () => {
    setSaving(true);
    try {
      await vendorDeletePromotion(promotionId);
      await queryClient.invalidateQueries({ queryKey: ["vendor", "promotions"] });
      setConfirmDelete(false);
      router.push("/promotions");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Failed to delete promotion.");
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <Header title="Promotion Details" />
      <main className="mx-auto max-w-[900px] space-y-6 p-6 md:p-10">
        <Link href="/promotions" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-[#1e2a5e]"><ArrowLeft className="h-4 w-4" /> Back to Promotions</Link>
        {loading ? <p className="font-bold text-slate-400">Loading promotion...</p> : null}
        {error ? <p className="rounded-xl bg-red-50 p-4 text-sm font-bold text-red-700">{error}</p> : null}
        {!loading ? <section className="space-y-6 rounded-[32px] border border-slate-100 bg-white p-8 shadow-sm">
          <div><label className="text-xs font-black uppercase tracking-widest text-slate-400">Promotion Name</label><input value={form.name} onChange={(event) => update("name", event.target.value)} className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-bold outline-none focus:border-sky-500" /></div>
          <div><label className="text-xs font-black uppercase tracking-widest text-slate-400">Description</label><textarea value={form.description} onChange={(event) => update("description", event.target.value)} rows={4} className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm outline-none focus:border-sky-500" /></div>
          <div className="grid gap-4 md:grid-cols-3"><div><label className="text-xs font-black uppercase tracking-widest text-slate-400">Discount</label><input type="number" value={form.value} onChange={(event) => update("value", event.target.value)} className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm outline-none focus:border-sky-500" /></div><div><label className="text-xs font-black uppercase tracking-widest text-slate-400">Start</label><input type="date" value={form.startDate} onChange={(event) => update("startDate", event.target.value)} className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm outline-none focus:border-sky-500" /></div><div><label className="text-xs font-black uppercase tracking-widest text-slate-400">End</label><input type="date" value={form.endDate} onChange={(event) => update("endDate", event.target.value)} className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm outline-none focus:border-sky-500" /></div></div>
          <label className="flex items-center gap-3 text-sm font-bold text-slate-700"><input type="checkbox" checked={form.active} onChange={(event) => update("active", event.target.checked)} /> Active promotion</label>
          <div className="flex flex-wrap justify-between gap-3 pt-3"><button type="button" onClick={remove} disabled={saving} className="inline-flex items-center gap-2 rounded-2xl border border-red-100 px-5 py-3 text-sm font-black text-red-600 disabled:opacity-50"><Trash2 className="h-4 w-4" /> Delete</button><button type="button" onClick={save} disabled={saving} className="inline-flex items-center gap-2 rounded-2xl bg-[#1e2a5e] px-6 py-3 text-sm font-black text-white disabled:opacity-50"><Save className="h-4 w-4" /> {saving ? "Saving..." : "Save Changes"}</button></div>
        </section> : null}
      </main>
      <ConfirmDialog open={confirmDelete} title="Delete this promotion?" message="This action cannot be undone." confirmLabel="Delete promotion" destructive busy={saving} onClose={() => setConfirmDelete(false)} onConfirm={() => void confirmDeletePromotion()} />
    </div>
  );
}
