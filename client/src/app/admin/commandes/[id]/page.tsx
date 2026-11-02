"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, MessageCircle } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { FoodyButton } from "@/components/foody/button";
import { OrderStatusBadge } from "@/components/orders/order-status";
import { apiErrorMessage } from "@/lib/api/client";
import {
    formatDate,
    formatFCFA,
    formatPhone,
    ORDER_NEXT_STATUSES,
    ORDER_STATUS_LABEL,
    PAYMENT_METHOD_LABEL,
    PAYMENT_STATUS_LABEL,
} from "@/lib/format";
import { adminApi } from "@/services/foody";
import type { OrderStatus, PaymentStatus } from "@/types/foody";

export default function AdminOrderPage() {
    const { id } = useParams<{ id: string }>();
    const queryClient = useQueryClient();
    const { data: order, isLoading } = useQuery({ queryKey: ["admin-order", id], queryFn: () => adminApi.order(Number(id)) });

    const update = useMutation({
        mutationFn: ({ status, payment }: { status: OrderStatus; payment?: PaymentStatus }) =>
            adminApi.updateOrderStatus(Number(id), status, payment),
        onSuccess: (o) => {
            queryClient.setQueryData(["admin-order", id], o);
            queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
            queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] });
            toast.success(`Commande : ${ORDER_STATUS_LABEL[o.status]}`);
        },
        onError: (e) => toast.error(apiErrorMessage(e)),
    });

    if (isLoading || !order) return <div className="h-64 animate-pulse rounded-3xl bg-honey" />;

    const next = ORDER_NEXT_STATUSES[order.status];
    const wa = `https://wa.me/${order.customer_phone}?text=${encodeURIComponent(`Bonjour ${order.customer_name}, ici FOODY Miniardise à propos de votre commande ${order.order_number}.`)}`;

    return (
        <div className="max-w-4xl">
            <Link href="/admin/commandes" className="inline-flex items-center gap-1.5 text-sm font-medium text-mist hover:text-cocoa">
                <ArrowLeft className="size-4" /> Commandes
            </Link>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-bold">{order.order_number}</h1>
                    <p className="text-sm text-mist">{formatDate(order.created_time)}</p>
                </div>
                <OrderStatusBadge status={order.status} className="text-sm" />
            </div>

            {next.length > 0 && (
                <section className="mt-6 rounded-3xl bg-white p-5 shadow-soft">
                    <h2 className="font-display font-semibold">Faire avancer la commande</h2>
                    <div className="mt-4 flex flex-wrap gap-2">
                        {next.map((s) => (
                            <FoodyButton
                                key={s}
                                variant={s === "cancelled" ? "danger" : "primary"}
                                loading={update.isPending && update.variables?.status === s}
                                disabled={update.isPending}
                                onClick={() => {
                                    if (s === "cancelled" && !window.confirm("Annuler cette commande ? Le stock sera restitué.")) return;
                                    update.mutate({ status: s });
                                }}
                            >
                                {ORDER_STATUS_LABEL[s]}
                            </FoodyButton>
                        ))}
                    </div>
                </section>
            )}

            <div className="mt-4 grid gap-4 md:grid-cols-2">
                <section className="rounded-3xl bg-white p-5 shadow-soft text-sm">
                    <h2 className="font-display font-semibold">Client</h2>
                    <p className="mt-2 text-base font-semibold">{order.customer_pseudo ?? order.customer_name}</p>
                    {order.customer_pseudo && <p className="text-mist">Livraison : {order.customer_name}</p>}
                    <p className="text-mist">{formatPhone(order.customer_phone)}</p>
                    <a href={wa} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-2 rounded-full bg-[#25D366]/15 px-4 py-2 font-semibold text-[#128C7E] hover:bg-[#25D366]/25">
                        <MessageCircle className="size-4" /> Écrire sur WhatsApp
                    </a>
                </section>
                <section className="rounded-3xl bg-white p-5 shadow-soft text-sm">
                    <h2 className="font-display font-semibold">{order.delivery_method === "pickup" ? "Retrait en boutique" : "Livraison"}</h2>
                    {order.delivery_method === "delivery" && <p className="mt-2">{order.delivery_address}<span className="block text-mist">{order.delivery_commune}</span></p>}
                    {order.delivery_instructions && <p className="mt-2 rounded-xl bg-honey p-3">{order.delivery_instructions}</p>}
                    <p className="mt-3">
                        {PAYMENT_METHOD_LABEL[order.payment_method]} · <span className="font-semibold">{PAYMENT_STATUS_LABEL[order.payment_status]}</span>
                    </p>
                    {order.payment_status !== "paid" && order.status !== "cancelled" && (
                        <button type="button" disabled={update.isPending} onClick={() => update.mutate({ status: order.status, payment: "paid" })} className="mt-2 cursor-pointer text-sm font-semibold underline">
                            Marquer comme payée
                        </button>
                    )}
                </section>
            </div>

            <section className="mt-4 rounded-3xl bg-white p-5 shadow-soft">
                <h2 className="font-display font-semibold">Articles</h2>
                <ul className="mt-3 divide-y divide-cocoa/5 text-sm">
                    {order.items.map((i) => (
                        <li key={i.id} className="flex justify-between gap-3 py-2.5">
                            <span><span className="font-semibold">{i.quantity}×</span> {i.product_name} <span className="text-mist">({formatFCFA(i.unit_price)})</span></span>
                            <span>{formatFCFA(i.subtotal)}</span>
                        </li>
                    ))}
                </ul>
                <dl className="mt-3 space-y-1.5 border-t border-cocoa/10 pt-3 text-sm">
                    <div className="flex justify-between"><dt className="text-mist">Sous-total</dt><dd>{formatFCFA(order.subtotal)}</dd></div>
                    <div className="flex justify-between"><dt className="text-mist">Livraison</dt><dd>{formatFCFA(order.delivery_fee)}</dd></div>
                    <div className="flex justify-between text-base font-bold"><dt>Total</dt><dd>{formatFCFA(order.total)}</dd></div>
                </dl>
                {order.notes && <p className="mt-3 rounded-xl bg-honey p-3 text-sm">{order.notes}</p>}
            </section>
        </div>
    );
}
