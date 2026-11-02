"use client";

import { useQuery } from "@tanstack/react-query";
import { Banknote, Clock, Package, ReceiptText } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { OrderStatusBadge } from "@/components/orders/order-status";
import { formatDate, formatFCFA } from "@/lib/format";
import { cn } from "@/lib/utils/cn";
import { adminApi } from "@/services/foody";

const iso = (d: Date) => d.toISOString().slice(0, 10);

const PERIODS = [
    { key: "today", label: "Aujourd'hui", from: () => iso(new Date()) },
    { key: "7d", label: "7 jours", from: () => iso(new Date(Date.now() - 6 * 864e5)) },
    { key: "30d", label: "30 jours", from: () => iso(new Date(Date.now() - 29 * 864e5)) },
    { key: "all", label: "Tout", from: () => undefined },
] as const;

export default function AdminDashboard() {
    const [period, setPeriod] = useState<(typeof PERIODS)[number]["key"]>("30d");
    const from = PERIODS.find((p) => p.key === period)!.from();

    const { data } = useQuery({ queryKey: ["admin-dashboard", from], queryFn: () => adminApi.dashboard(from) });
    const { data: pending } = useQuery({
        queryKey: ["admin-orders", { status: "pending" }],
        queryFn: () => adminApi.orders({ status: "pending" }),
    });

    const stats = [
        { label: "Commandes", value: data?.orders_count, icon: ReceiptText },
        { label: "Chiffre d'affaires", value: data ? formatFCFA(data.revenue) : undefined, icon: Banknote },
        { label: "En attente", value: data?.pending_orders, icon: Clock },
        { label: "Produits disponibles", value: data?.available_products, icon: Package },
    ];

    return (
        <div className="space-y-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <h1 className="text-2xl font-bold">Tableau de bord</h1>
                <div className="flex rounded-full bg-white p-1 shadow-soft">
                    {PERIODS.map((p) => (
                        <button
                            key={p.key}
                            type="button"
                            onClick={() => setPeriod(p.key)}
                            className={cn("cursor-pointer rounded-full px-3 py-1.5 text-xs font-semibold", period === p.key ? "bg-cocoa text-cream" : "text-cocoa/70 hover:text-cocoa")}
                        >
                            {p.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                {stats.map((s) => (
                    <div key={s.label} className="rounded-3xl bg-white p-5 shadow-soft">
                        <s.icon className="size-5 text-sun-dark" />
                        <p className="mt-3 text-sm text-mist">{s.label}</p>
                        <p className="mt-1 font-display text-2xl font-bold tabular-nums">{s.value ?? "—"}</p>
                    </div>
                ))}
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                <section className="rounded-3xl bg-white p-5 shadow-soft">
                    <h2 className="font-display font-semibold">Produits les plus vendus</h2>
                    {data && data.top_products.length === 0 && <p className="mt-4 text-sm text-mist">Aucune vente sur la période.</p>}
                    <ol className="mt-4 space-y-3">
                        {data?.top_products.map((p, i) => {
                            const max = data.top_products[0].quantity || 1;
                            return (
                                <li key={`${p.product_id}-${p.name}`}>
                                    <div className="flex justify-between gap-3 text-sm">
                                        <span className="truncate"><span className="font-semibold">{i + 1}.</span> {p.name}</span>
                                        <span className="shrink-0 text-mist tabular-nums">{p.quantity} vendus · {formatFCFA(p.revenue)}</span>
                                    </div>
                                    <div className="mt-1.5 h-2 rounded-full bg-honey">
                                        <div className="h-2 rounded-full bg-sun" style={{ width: `${(p.quantity / max) * 100}%` }} />
                                    </div>
                                </li>
                            );
                        })}
                    </ol>
                </section>

                <section className="rounded-3xl bg-white p-5 shadow-soft">
                    <div className="flex items-center justify-between">
                        <h2 className="font-display font-semibold">À traiter</h2>
                        <Link href="/admin/commandes?status=pending" className="text-sm font-semibold underline">Tout voir</Link>
                    </div>
                    {pending && pending.items.length === 0 && <p className="mt-4 text-sm text-mist">Aucune commande en attente. 🎉</p>}
                    <ul className="mt-3 divide-y divide-cocoa/5">
                        {pending?.items.slice(0, 6).map((o) => (
                            <li key={o.id}>
                                <Link href={`/admin/commandes/${o.id}`} className="flex items-center justify-between gap-3 py-3 text-sm hover:text-sun-dark">
                                    <span className="min-w-0">
                                        <span className="font-semibold">{o.order_number}</span>
                                        <span className="block truncate text-mist">{o.customer_pseudo ?? o.customer_name} · {formatDate(o.created_time)}</span>
                                    </span>
                                    <span className="flex shrink-0 items-center gap-2">
                                        <span className="font-semibold">{formatFCFA(o.total)}</span>
                                        <OrderStatusBadge status={o.status} />
                                    </span>
                                </Link>
                            </li>
                        ))}
                    </ul>
                </section>
            </div>
        </div>
    );
}
