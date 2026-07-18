"use client";

import { useEffect, useRef } from "react";
import { AlertTriangle, X } from "lucide-react";

export function ConfirmDialog({ open, title, message, confirmLabel = "Confirm", destructive = false, busy = false, onConfirm, onClose }: { open: boolean; title: string; message: string; confirmLabel?: string; destructive?: boolean; busy?: boolean; onConfirm: () => void; onClose: () => void }) {
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => { if (open) closeRef.current?.focus(); }, [open]);
  if (!open) return null;
  return <div className="fixed inset-0 z-[180] flex items-center justify-center p-4" role="presentation"><button type="button" aria-label="Close dialog" className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm" onClick={onClose} /><div role="dialog" aria-modal="true" aria-labelledby="confirm-title" className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl"><button ref={closeRef} type="button" aria-label="Close dialog" onClick={onClose} className="absolute right-4 top-4 rounded-lg p-2 text-slate-400 hover:bg-slate-100"><X className="h-5 w-5" /></button><AlertTriangle className={`h-8 w-8 ${destructive ? "text-rose-500" : "text-amber-500"}`} /><h2 id="confirm-title" className="mt-4 text-xl font-black text-slate-800">{title}</h2><p className="mt-2 text-sm leading-6 text-slate-500">{message}</p><div className="mt-6 flex justify-end gap-3"><button type="button" onClick={onClose} className="rounded-xl px-4 py-3 text-sm font-bold text-slate-500 hover:bg-slate-100">Cancel</button><button type="button" disabled={busy} onClick={onConfirm} className={`rounded-xl px-4 py-3 text-sm font-bold text-white disabled:opacity-50 ${destructive ? "bg-rose-500 hover:bg-rose-600" : "bg-[#1e2a5e] hover:bg-[#17204b]"}`}>{busy ? "Working…" : confirmLabel}</button></div></div></div>;
}
