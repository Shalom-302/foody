"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, PartyPopper } from "lucide-react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { OrderStatusBadge, OrderTimeline } from "@/components/orders/order-status";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { formatDate, formatFCFA, formatPhone, PAYMENT_METHOD_LABEL, PAYMENT_STATUS_LABEL } from "@/lib/format";
import { orderApi } from "@/services/foody";

function OrderDetail() {
    const { ready } = useRequireAuth();
    const { id } = useParams<{ id: string }>();
    const isNew = useSearchParams().get("nouvelle") === "1";
    const { data: order, isLoading, isError } = useQuery({
        queryKey: ["my-order", id],
        queryFn: () => orderApi.get(Number(id)),
        enabled: ready && Number.isFinite(Number(id)),
        refetchInterval: 60_000, // status moves while the customer waits
    });

    if (!ready || isLoading) return <div className="mx-auto mt-10 h-64 max-w-3xl animate-pulse rounded-3xl bg-honey" />;
    if (isError || !order) {
        return <p className="mx-auto max-w-3xl px-4 py-24 text-center text-mist">Commande introuvable.</p>;
    }

    return (
        <div className="mx-auto max-w-3xl px-4 pt-6 pb-10 md:px-6 md:pt-10">
            <Link href="/mon-compte" className="inline-flex items-center gap-1.5 text-sm font-medium text-mist hover:text-cocoa">
                <ArrowLeft className="size-4" /> Mon compte
            </Link>

            {isNew && (
                <div className="mt-4 flex items-start gap-4 rounded-3xl bg-sun p-5">
                    <PartyPopper className="mt-0.5 size-6 shrink-0" />
                    <div>
                        <p className="font-display text-lg font-semibold">Merci pour votre commande !</p>
                        <p className="text-sm text-cocoa/80">Nous vous contactons sur WhatsApp pour la confirmer.</p>
                    </div>
                </div>
            )}

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-bold">Commande {order.order_number}</h1>
                    <p className="text-sm text-mist">{formatDate(order.created_time)}</p>
                </div>
                <OrderStatusBadge status={order.status} className="text-sm" />
            </div>

            <section className="mt-6 rounded-3xl bg-white p-5 shadow-soft">
                <OrderTimeline status={order.status} method={order.delivery_method} />
            </section>

            <section className="mt-4 rounded-3xl bg-white p-5 shadow-soft">
                <h2 className="font-display font-semibold">Articles</h2>
                <ul className="mt-3 divide-y divide-cocoa/5 text-sm">
                    {order.items.map((i) => (
                        <li key={i.id} className="flex justify-between gap-3 py-2.5">
                            <span><span className="font-semibold">{i.quantity}×</span> {i.product_name}</span>
                            <span>{formatFCFA(i.subtotal)}</span>
                        </li>
                    ))}
                </ul>
                <dl className="mt-3 space-y-1.5 border-t border-cocoa/10 pt-3 text-sm">
                    <div className="flex justify-between"><dt className="text-mist">Sous-total</dt><dd>{formatFCFA(order.subtotal)}</dd></div>
                    <div className="flex justify-between"><dt className="text-mist">Livraison</dt><dd>{order.delivery_fee ? formatFCFA(order.delivery_fee) : "Gratuite"}</dd></div>
                    <div className="flex justify-between text-base font-bold"><dt>Total</dt><dd>{formatFCFA(order.total)}</dd></div>
                </dl>
            </section>

            <section className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="rounded-3xl bg-honey p-5 text-sm">
                    <h2 className="font-display font-semibold">{order.delivery_method === "pickup" ? "Retrait" : "Livraison"}</h2>
                    <p className="mt-2"><span className="font-semibold">{order.customer_pseudo ?? order.customer_name}</span> · {formatPhone(order.customer_phone)}</p>
                    {order.customer_pseudo && order.customer_name !== order.customer_pseudo && <p className="text-cocoa/75">Livraison au nom de {order.customer_name}</p>}
                    {order.delivery_method === "delivery" && (
                        <p className="mt-1 text-cocoa/75">{order.delivery_address}, {order.delivery_commune}</p>
                    )}
                    {order.delivery_instructions && <p className="mt-1 text-cocoa/75">« {order.delivery_instructions} »</p>}
                </div>
                <div className="rounded-3xl bg-honey p-5 text-sm">
                    <h2 className="font-display font-semibold">Paiement</h2>
                    <p className="mt-2">{PAYMENT_METHOD_LABEL[order.payment_method]}</p>
                    <p className="mt-1 text-cocoa/75">{PAYMENT_STATUS_LABEL[order.payment_status]}</p>
                </div>
            </section>
        </div>
    );
}

export default function OrderPage() {
    return (
        <Suspense>
            <OrderDetail />
        </Suspense>
    );
}
