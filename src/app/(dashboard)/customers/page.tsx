"use client";

import Link from "next/link";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Eye, Search, Users } from "lucide-react";
import { useState } from "react";
import { Header } from "@/components/Header";
import { Pagination } from "@/components/Pagination";
import { vendorListUsers } from "@/lib/vendor-api";
import { useDebouncedValue } from "@/lib/use-debounced-value";

type Customer = { id: string; full_name?: string; email?: string; phone?: string; latest_booking_at?: string };
const PAGE_SIZE = 20;

export default function CustomersPage() {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const search = useDebouncedValue(query.trim());
  const customersQuery = useQuery({
    queryKey: ["vendor", "customers", page, search],
    queryFn: () => vendorListUsers({ limit: PAGE_SIZE, skip: (page - 1) * PAGE_SIZE, search: search || undefined }),
    placeholderData: keepPreviousData,
  });
  const payload = customersQuery.data as { users?: Customer[]; total?: number } | undefined;
  const customers = payload?.users ?? [];
  const total = payload?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="min-h-screen bg-[#f8fafc]"><Header title="Customers" /><main className="mx-auto max-w-[1200px] space-y-8 p-4 sm:p-6 md:p-10">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><div><h1 className="text-3xl font-black text-slate-800">Your Customers</h1><p className="mt-1 text-sm text-slate-400">Guests who have booked with your business.</p></div><div className="flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-black text-slate-600 shadow-sm"><Users className="h-4 w-4 text-sky-500" /> {total} customers</div></div>
      <div className="relative"><Search className="absolute left-5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input aria-label="Search customers" value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} placeholder="Search customers by name, email, or phone" className="w-full rounded-2xl border border-slate-100 bg-white py-4 pl-12 pr-5 text-sm font-bold text-slate-700 shadow-sm outline-none focus:border-sky-400" /></div>
      {customersQuery.isFetching && !customersQuery.isPending ? <p className="text-right text-xs font-bold text-sky-600">Updating results…</p> : null}
      <div className="overflow-hidden rounded-[32px] border border-slate-100 bg-white shadow-sm">{customersQuery.isPending ? <div className="h-48 animate-pulse bg-slate-50" /> : customersQuery.isError ? <div className="p-10 text-center"><p className="text-sm text-red-600">Customers could not be loaded.</p><button type="button" onClick={() => customersQuery.refetch()} className="mt-4 rounded-xl bg-slate-100 px-4 py-2 text-sm font-bold">Try again</button></div> : customers.length === 0 ? <p className="p-10 text-center text-sm font-bold text-slate-400">No customers found.</p> : <div className="overflow-x-auto"><table className="w-full min-w-[700px] text-left"><thead className="bg-slate-50"><tr><th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-slate-400">Customer</th><th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-slate-400">Contact</th><th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-slate-400">Latest Booking</th><th className="px-6 py-4"><span className="sr-only">Actions</span></th></tr></thead><tbody className="divide-y divide-slate-50">{customers.map((customer) => <tr key={customer.id} className="hover:bg-slate-50"><td className="px-6 py-5"><p className="font-black text-slate-800">{customer.full_name || "Customer"}</p><p className="mt-1 text-xs text-slate-400">{customer.id}</p></td><td className="px-6 py-5 text-sm text-slate-600"><p>{customer.email || "No email"}</p><p className="mt-1 text-xs text-slate-400">{customer.phone || "No phone"}</p></td><td className="px-6 py-5 text-sm text-slate-500">{customer.latest_booking_at ? new Date(customer.latest_booking_at).toLocaleDateString() : "No booking date"}</td><td className="px-6 py-5 text-right"><Link prefetch={false} href={`/customers/${encodeURIComponent(customer.id)}`} className="inline-flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-xs font-black text-slate-600 hover:bg-sky-50 hover:text-sky-600"><Eye className="h-4 w-4" /> View</Link></td></tr>)}</tbody></table></div>}</div>
      <Pagination currentPage={page} totalPages={totalPages} totalItems={total} itemsPerPage={PAGE_SIZE} itemLabel="customers" onPageChange={setPage} />
    </main></div>
  );
}
