"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { OrderStatusBadge } from "@/components/orders/order-status";
import { useDebounce } from "@/lib/hooks/use-debounce";
import { formatDate, formatFCFA, formatPhone, ORDER_STATUS_LABEL } from "@/lib/format";
import { adminApi } from "@/services/foody";
import type { OrderStatus } from "@/types/foody";

const input = "h-10 rounded-xl border border-cocoa/10 bg-white px-3 text-sm outline-none focus:border-sun";

function AdminOrders() {
    const router = useRouter();
    const params = useSearchParams();
    const status = (params.get("status") ?? "") as OrderStatus | "";
    const [q, setQ] = useState("");
    const [from, setFrom] = useState("");
    const [to, setTo] = useState("");
    const [page, setPage] = useState(1);
    const search = useDebounce(q, 350);

    const query = { status: status || undefined, q: search || undefined, date_from: from || undefined, date_to: to || undefined, page };
    const { data, isLoading } = useQuery({
        queryKey: ["admin-orders", query],
        queryFn: () => adminApi.orders(query),
        placeholderData: keepPreviousData,
        refetchInterval: 30_000,
    });

    return (
        <div>
            <h1 className="text-2xl font-bold">Commandes</h1>
            <div className="mt-5 flex flex-wrap gap-2">
                <input className={`${input} min-w-48 flex-1`} placeholder="N°, pseudo, nom ou téléphone" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} />
                <select
                    className={`${input} cursor-pointer`}
                    value={status}
                    onChange={(e) => { router.replace(e.target.value ? `/admin/commandes?status=${e.target.value}` : "/admin/commandes"); setPage(1); }}
                    aria-label="Statut"
                >
                    <option value="">Tous les statuts</option>
                    {Object.entries(ORDER_STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
                <input type="date" className={input} value={from} onChange={(e) => { setFrom(e.target.value); setPage(1); }} aria-label="Du" />
                <input type="date" className={input} value={to} onChange={(e) => { setTo(e.target.value); setPage(1); }} aria-label="Au" />
            </div>

            <div className="mt-5 overflow-hidden rounded-3xl bg-white shadow-soft">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[720px] text-left text-sm">
                        <thead className="bg-honey text-xs tracking-wide text-cocoa/70 uppercase">
                            <tr>
                                <th className="px-4 py-3 font-semibold">Commande</th>
                                <th className="px-4 py-3 font-semibold">Client</th>
                                <th className="px-4 py-3 font-semibold">Récupération</th>
                                <th className="px-4 py-3 font-semibold">Total</th>
                                <th className="px-4 py-3 font-semibold">Statut</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-cocoa/5">
                            {data?.items.map((o) => (
                                <tr key={o.id} className="cursor-pointer hover:bg-cream" onClick={() => router.push(`/admin/commandes/${o.id}`)}>
                                    <td className="px-4 py-3">
                                        <Link href={`/admin/commandes/${o.id}`} className="font-semibold" onClick={(e) => e.stopPropagation()}>{o.order_number}</Link>
                                        <span className="block text-xs text-mist">{formatDate(o.created_time)}</span>
                                    </td>
                                    <td className="px-4 py-3"><span className="font-semibold">{o.customer_pseudo ?? o.customer_name}</span><span className="block text-xs text-mist">{o.customer_pseudo && o.customer_name !== o.customer_pseudo ? `${o.customer_name} · ` : ""}{formatPhone(o.customer_phone)}</span></td>
                                    <td className="px-4 py-3">{o.delivery_method === "pickup" ? "Retrait" : o.delivery_commune}</td>
                                    <td className="px-4 py-3 font-semibold tabular-nums">{formatFCFA(o.total)}</td>
                                    <td className="px-4 py-3"><OrderStatusBadge status={o.status} /></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {isLoading && <div className="h-32 animate-pulse bg-cream" />}
                {data && data.items.length === 0 && <p className="p-8 text-center text-mist">Aucune commande.</p>}
            </div>

            {data && data.total_pages > 1 && (
                <div className="mt-4 flex items-center justify-end gap-3 text-sm">
                    <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="cursor-pointer rounded-full bg-white px-4 py-2 shadow-soft disabled:opacity-40">Précédent</button>
                    <span className="text-mist">{page} / {data.total_pages}</span>
                    <button type="button" disabled={page >= data.total_pages} onClick={() => setPage((p) => p + 1)} className="cursor-pointer rounded-full bg-white px-4 py-2 shadow-soft disabled:opacity-40">Suivant</button>
                </div>
            )}
        </div>
    );
}

export default function AdminOrdersPage() {
    return (
        <Suspense>
            <AdminOrders />
        </Suspense>
    );
}
