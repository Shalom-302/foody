"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bike, Lock, Store } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { FoodyButton } from "@/components/foody/button";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { apiErrorMessage } from "@/lib/api/client";
import { formatFCFA, formatPhone, PAYMENT_METHOD_LABEL } from "@/lib/format";
import { cn } from "@/lib/utils/cn";
import { orderApi } from "@/services/foody";
import { cartSubtotal, useCartStore } from "@/store/cart";
import type { DeliveryMethod, PaymentMethod } from "@/types/foody";

const field =
    "mt-2 h-12 w-full rounded-2xl border border-cocoa/15 bg-white px-4 text-base outline-none focus:border-sun focus:ring-2 focus:ring-sun/30";

export default function CheckoutPage() {
    const { ready, user } = useRequireAuth();
    const router = useRouter();
    const queryClient = useQueryClient();
    const { lines, clear } = useCartStore();
    const { data: options } = useQuery({ queryKey: ["delivery-options"], queryFn: orderApi.deliveryOptions });

    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [method, setMethod] = useState<DeliveryMethod>("delivery");
    const [address, setAddress] = useState("");
    const [commune, setCommune] = useState("");
    const [instructions, setInstructions] = useState("");
    const [payment, setPayment] = useState<PaymentMethod>("cash");
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!name && (user?.full_name || user?.pseudo)) setName(user.full_name || user.pseudo || "");
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);

    const placeOrder = useMutation({
        mutationFn: () =>
            orderApi.create({
                items: lines.map((l) => ({ product_id: l.productId, quantity: l.quantity })),
                customer_name: name.trim(),
                customer_phone: phone.trim() || undefined,
                delivery_method: method,
                delivery_address: method === "delivery" ? address.trim() : undefined,
                delivery_commune: method === "delivery" ? commune : undefined,
                delivery_instructions: instructions.trim() || undefined,
                payment_method: payment,
            }),
        onSuccess: (order) => {
            clear();
            queryClient.invalidateQueries({ queryKey: ["my-orders"] });
            queryClient.invalidateQueries({ queryKey: ["products"] });
            toast.success("Commande confirmée, merci !");
            router.replace(`/mon-compte/commandes/${order.id}?nouvelle=1`);
        },
        onError: (e) => setError(apiErrorMessage(e, "La commande n'a pas pu être enregistrée. Réessayez.")),
    });

    if (!ready) return <div className="min-h-[50vh]" />;

    if (lines.length === 0 && !placeOrder.isSuccess) {
        return (
            <div className="mx-auto max-w-md px-4 py-24 text-center">
                <h1 className="text-2xl font-bold">Votre panier est vide</h1>
                <FoodyButton asChild className="mt-6"><Link href="/boutique">Aller à la boutique</Link></FoodyButton>
            </div>
        );
    }

    const subtotal = cartSubtotal(lines);
    const freeFrom = options?.free_delivery_threshold ?? 0;
    const deliveryFee = method === "pickup" || (freeFrom && subtotal >= freeFrom) ? 0 : options?.delivery_fee ?? 0;
    const canSubmit =
        name.trim().length >= 2 && (method === "pickup" || (address.trim().length > 0 && commune.length > 0));

    return (
        <div className="mx-auto max-w-6xl px-4 pt-6 pb-10 md:px-6 md:pt-10">
            <h1 className="text-3xl font-bold tracking-tight">Finaliser ma commande</h1>
            <form
                className="mt-6 grid gap-8 lg:grid-cols-[1fr_380px]"
                onSubmit={(e) => {
                    e.preventDefault();
                    setError(null);
                    placeOrder.mutate();
                }}
            >
                <div className="space-y-6">
                    <section className="rounded-3xl bg-white p-5 shadow-soft sm:p-6">
                        <h2 className="font-display text-lg font-semibold">Vos coordonnées</h2>
                        <div className="mt-4 grid gap-4 sm:grid-cols-2">
                            <label className="block text-sm font-medium">
                                Nom pour la livraison
                                <input required minLength={2} maxLength={120} value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" className={field} />
                            </label>
                            <label className="block text-sm font-medium">
                                Numéro WhatsApp
                                <input type="tel" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder={formatPhone(user?.phone)} className={field} />
                                <span className="mt-1 block text-xs font-normal text-mist">Laissez vide pour utiliser {formatPhone(user?.phone)}.</span>
                            </label>
                        </div>
                    </section>

                    <section className="rounded-3xl bg-white p-5 shadow-soft sm:p-6">
                        <h2 className="font-display text-lg font-semibold">Mode de récupération</h2>
                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                            <Choice active={method === "delivery"} onClick={() => setMethod("delivery")} icon={<Bike className="size-5" />} title="Livraison" text={`À Abidjan · ${formatFCFA(options?.delivery_fee ?? 0)}`} />
                            <Choice active={method === "pickup"} onClick={() => setMethod("pickup")} icon={<Store className="size-5" />} title="Retrait" text={options?.pickup_address ?? "Gratuit, adresse envoyée sur WhatsApp"} />
                        </div>
                        {method === "delivery" && (
                            <div className="mt-5 grid gap-4 sm:grid-cols-2">
                                <label className="block text-sm font-medium">
                                    Commune
                                    <select required value={commune} onChange={(e) => setCommune(e.target.value)} className={cn(field, "cursor-pointer")}>
                                        <option value="" disabled>Choisir…</option>
                                        {options?.communes.map((c) => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </label>
                                <label className="block text-sm font-medium sm:col-span-2">
                                    Adresse de livraison
                                    <input required maxLength={300} value={address} onChange={(e) => setAddress(e.target.value)} autoComplete="street-address" placeholder="Quartier, rue, repère…" className={field} />
                                </label>
                            </div>
                        )}
                        <label className="mt-4 block text-sm font-medium">
                            Instructions <span className="font-normal text-mist">(facultatif)</span>
                            <textarea maxLength={500} rows={3} value={instructions} onChange={(e) => setInstructions(e.target.value)} placeholder="Code portail, horaire préféré…" className={cn(field, "h-auto py-3")} />
                        </label>
                    </section>

                    <section className="rounded-3xl bg-white p-5 shadow-soft sm:p-6">
                        <h2 className="font-display text-lg font-semibold">Paiement</h2>
                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                            {(options?.payment_methods ?? ["cash"]).map((m) => (
                                <Choice key={m} active={payment === m} onClick={() => setPayment(m)} title={PAYMENT_METHOD_LABEL[m]} text={m === "cash" ? "Espèces ou Mobile Money à la remise" : "Paiement en ligne"} />
                            ))}
                        </div>
                    </section>
                </div>

                <aside className="h-max rounded-3xl bg-honey p-6 lg:sticky lg:top-28">
                    <h2 className="font-display text-lg font-semibold">Récapitulatif</h2>
                    <ul className="mt-4 space-y-2 text-sm">
                        {lines.map((l) => (
                            <li key={l.productId} className="flex justify-between gap-3">
                                <span className="min-w-0 truncate"><span className="font-semibold">{l.quantity}×</span> {l.name}</span>
                                <span className="shrink-0">{formatFCFA(l.price * l.quantity)}</span>
                            </li>
                        ))}
                    </ul>
                    <dl className="mt-4 space-y-2 border-t border-cocoa/10 pt-4 text-sm">
                        <div className="flex justify-between"><dt className="text-cocoa/70">Sous-total</dt><dd>{formatFCFA(subtotal)}</dd></div>
                        <div className="flex justify-between"><dt className="text-cocoa/70">Livraison</dt><dd>{deliveryFee ? formatFCFA(deliveryFee) : "Gratuite"}</dd></div>
                        <div className="flex justify-between pt-2 text-base"><dt className="font-semibold">Total</dt><dd className="font-bold">{formatFCFA(subtotal + deliveryFee)}</dd></div>
                    </dl>
                    {error && <p role="alert" className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
                    <FoodyButton type="submit" size="lg" className="mt-6 w-full" loading={placeOrder.isPending} disabled={!canSubmit}>
                        <Lock /> Confirmer la commande
                    </FoodyButton>
                    <p className="mt-3 text-center text-xs text-cocoa/60">Nous vous confirmons la commande sur WhatsApp.</p>
                </aside>
            </form>
        </div>
    );
}

function Choice({ active, onClick, icon, title, text }: { active: boolean; onClick: () => void; icon?: React.ReactNode; title: string; text: string }) {
    return (
        <button
            type="button"
            onClick={onClick}
            aria-pressed={active}
            className={cn(
                "flex cursor-pointer items-start gap-3 rounded-2xl border-2 p-4 text-left transition",
                active ? "border-sun bg-honey" : "border-cocoa/10 hover:border-sun/60",
            )}
        >
            {icon && <span className="mt-0.5 text-cocoa">{icon}</span>}
            <span>
                <span className="block font-semibold">{title}</span>
                <span className="mt-0.5 block text-sm text-mist">{text}</span>
            </span>
        </button>
    );
}
