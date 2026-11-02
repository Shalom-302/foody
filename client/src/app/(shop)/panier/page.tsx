"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowRight, ShoppingBag, Trash2 } from "lucide-react";
import Link from "next/link";
import { QuantityStepper } from "@/components/cart/quantity-stepper";
import { FoodyButton } from "@/components/foody/button";
import { ProductVisual } from "@/components/products/product-visual";
import { useHydrated } from "@/hooks/use-hydrated";
import { formatFCFA } from "@/lib/format";
import { orderApi } from "@/services/foody";
import { useAuthStore } from "@/store/auth";
import { cartSubtotal, useCartStore } from "@/store/cart";

export default function CartPage() {
    const hydrated = useHydrated();
    const { lines, setQuantity, remove } = useCartStore();
    const user = useAuthStore((s) => s.user);
    const { data: options } = useQuery({ queryKey: ["delivery-options"], queryFn: orderApi.deliveryOptions });

    if (!hydrated) return <div className="mx-auto min-h-[50vh] max-w-6xl px-4" />;

    if (lines.length === 0) {
        return (
            <div className="mx-auto flex max-w-md flex-col items-center px-4 py-24 text-center">
                <span className="flex size-20 items-center justify-center rounded-full bg-butter">
                    <ShoppingBag className="size-8" />
                </span>
                <h1 className="mt-6 text-2xl font-bold">Votre panier est vide</h1>
                <p className="mt-2 text-mist">Un petit jus frais ? Quelques mini-cakes ?</p>
                <FoodyButton asChild size="lg" className="mt-8">
                    <Link href="/boutique">Découvrir la boutique</Link>
                </FoodyButton>
            </div>
        );
    }

    const subtotal = cartSubtotal(lines);
    const fee = options?.delivery_fee ?? 0;
    const free = !!options?.free_delivery_threshold && subtotal >= options.free_delivery_threshold;
    const deliveryFee = free ? 0 : fee;

    return (
        <div className="mx-auto max-w-6xl px-4 pt-6 pb-28 md:px-6 md:pt-10 md:pb-12">
            <h1 className="text-3xl font-bold tracking-tight">Mon panier</h1>
            <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_380px]">
                <ul className="space-y-3">
                    {lines.map((l) => (
                        <li key={l.productId} className="flex gap-4 rounded-3xl bg-white p-3 shadow-soft sm:p-4">
                            <Link href={`/produit/${l.slug}`} className="size-24 shrink-0 overflow-hidden rounded-2xl sm:size-28">
                                <ProductVisual imageUrl={l.imageUrl} categorySlug={l.categorySlug} name={l.name} />
                            </Link>
                            <div className="flex min-w-0 flex-1 flex-col">
                                <div className="flex items-start justify-between gap-2">
                                    <div className="min-w-0">
                                        <Link href={`/produit/${l.slug}`} className="block truncate font-display font-semibold">{l.name}</Link>
                                        <p className="text-sm text-mist">
                                            {formatFCFA(l.price)}
                                            {l.volume && ` · ${l.volume}`}
                                        </p>
                                    </div>
                                    <button type="button" onClick={() => remove(l.productId)} aria-label={`Retirer ${l.name}`} className="cursor-pointer rounded-full p-2 text-mist hover:bg-red-50 hover:text-red-600">
                                        <Trash2 className="size-4" />
                                    </button>
                                </div>
                                <div className="mt-auto flex items-center justify-between gap-2 pt-2">
                                    <QuantityStepper size="sm" value={l.quantity} onChange={(q) => setQuantity(l.productId, q)} />
                                    <span className="font-semibold">{formatFCFA(l.price * l.quantity)}</span>
                                </div>
                            </div>
                        </li>
                    ))}
                </ul>

                <aside className="h-max rounded-3xl bg-honey p-6 lg:sticky lg:top-28">
                    <h2 className="font-display text-lg font-semibold">Récapitulatif</h2>
                    <dl className="mt-4 space-y-2 text-sm">
                        <div className="flex justify-between"><dt className="text-cocoa/70">Sous-total</dt><dd className="font-medium">{formatFCFA(subtotal)}</dd></div>
                        <div className="flex justify-between">
                            <dt className="text-cocoa/70">Livraison</dt>
                            <dd className="font-medium">{free ? "Offerte" : formatFCFA(deliveryFee)}</dd>
                        </div>
                        <div className="flex justify-between border-t border-cocoa/10 pt-3 text-base">
                            <dt className="font-semibold">Total estimé</dt>
                            <dd className="font-bold">{formatFCFA(subtotal + deliveryFee)}</dd>
                        </div>
                    </dl>
                    <p className="mt-3 text-xs text-cocoa/60">Le montant final est confirmé à l&apos;étape suivante.</p>
                    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-butter bg-cream/95 p-4 backdrop-blur lg:static lg:mt-6 lg:border-0 lg:bg-transparent lg:p-0">
                        <FoodyButton asChild size="lg" className="w-full">
                            <Link href={user ? "/checkout" : "/auth?next=/checkout"}>
                                Continuer la commande <ArrowRight />
                            </Link>
                        </FoodyButton>
                    </div>
                </aside>
            </div>
        </div>
    );
}
