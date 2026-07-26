"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, UserCircle2 } from "lucide-react";
import { Header } from "@/components/Header";
import { customerQuery } from "@/lib/vendor-queries";
import { ErrorState, LoadingSkeleton } from "@/components/ui/AsyncState";

export default function CustomerDetailPage() {
  const { customerId } = useParams<{ customerId: string }>();
  const id = decodeURIComponent(String(customerId ?? ""));
  const { data: customer, isLoading, isError, error, refetch } = useQuery(customerQuery(id));
  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <Header title="Customer Details" />
      <main className="w-full space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <Link
          href="/customers"
          className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 transition hover:text-sky-600"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Customers
        </Link>

        {isLoading ? <LoadingSkeleton className="h-40 w-full" /> : null}
        {isError ? (
          <ErrorState
            message={
              error instanceof Error
                ? error.message
                : "Failed to load customer."
            }
            onRetry={() => void refetch()}
          />
        ) : null}

        {customer ? (
          <section className="w-full rounded-3xl border border-slate-100 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-sky-50 text-sky-500">
                <UserCircle2 className="h-8 w-8" />
              </div>
              <div className="min-w-0">
                <h1 className="truncate text-2xl font-black text-slate-800">
                  {String(customer.full_name ?? "Customer")}
                </h1>
                <p className="text-sm text-slate-400">Customer account</p>
              </div>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <div className="min-w-0 rounded-2xl bg-slate-50 p-5">
                <p className="text-xs font-black uppercase tracking-widest text-slate-400">
                  Email
                </p>
                <p className="mt-2 break-words text-sm font-bold text-slate-700">
                  {String(customer.email ?? "Not provided")}
                </p>
              </div>
              <div className="min-w-0 rounded-2xl bg-slate-50 p-5">
                <p className="text-xs font-black uppercase tracking-widest text-slate-400">
                  Phone
                </p>
                <p className="mt-2 break-words text-sm font-bold text-slate-700">
                  {String(customer.phone ?? "Not provided")}
                </p>
              </div>
            </div>
          </section>
        ) : null}
      </main>
    </div>
  );
}
