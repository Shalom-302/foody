"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { QuantityStepper } from "@/components/cart/quantity-stepper";
import { FoodyButton } from "@/components/foody/button";
import { apiErrorMessage } from "@/lib/api/client";
import { formatFCFA } from "@/lib/format";
import { cn } from "@/lib/utils/cn";
import { catalogApi, orderApi } from "@/services/foody";
import type { Order } from "@/types/foody";

const field =
    "mt-1.5 h-11 w-full rounded-xl border border-cocoa/15 bg-white px-3 text-sm outline-none focus:border-sun focus:ring-2 focus:ring-sun/30";

type Line = { productId: number; name: string; price: number; quantity: number };

/** Inline editor for a pending order. The API recomputes prices, stock and fees. */
export function EditOrder({ order, onDone }: { order: Order; onDone: () => void }) {
    const queryClient = useQueryClient();
    const { data: catalog } = useQuery({ queryKey: ["products", { size: 100 }], queryFn: () => catalogApi.products({ size: 100 }) });
    const { data: options } = useQuery({ queryKey: ["delivery-options"], queryFn: orderApi.deliveryOptions });

    const [lines, setLines] = useState<Line[]>(() =>
        order.items
            .filter((i) => i.product_id !== null)
            .map((i) => ({ productId: i.product_id!, name: i.product_name, price: i.unit_price, quantity: i.quantity })),
    );
    const [adding, setAdding] = useState("");
    const [name, setName] = useState(order.customer_name);
    const [phone, setPhone] = useState("");
    const [commune, setCommune] = useState(order.delivery_commune ?? "");
    const [address, setAddress] = useState(order.delivery_address ?? "");
    const [instructions, setInstructions] = useState(order.delivery_instructions ?? "");

    const subtotal = lines.reduce((n, l) => n + l.price * l.quantity, 0);
    const free = !!options?.free_delivery_threshold && subtotal >= options.free_delivery_threshold;
    const fee = free ? 0 : options?.delivery_fee ?? order.delivery_fee;
    const available = catalog?.items.filter((p) => p.is_available && !lines.some((l) => l.productId === p.id)) ?? [];

    const save = useMutation({
        mutationFn: () =>
            orderApi.update(order.id, {
                items: lines.map((l) => ({ product_id: l.productId, quantity: l.quantity })),
                customer_name: name.trim(),
                customer_phone: phone.trim() || undefined,
                delivery_method: "delivery",
                delivery_address: address.trim(),
                delivery_commune: commune,
                delivery_instructions: instructions.trim() || undefined,
                payment_method: order.payment_method,
            }),
        onSuccess: (updated) => {
            queryClient.setQueryData(["my-order", String(order.id)], updated);
            queryClient.invalidateQueries({ queryKey: ["my-orders"] });
            queryClient.invalidateQueries({ queryKey: ["products"] });
            toast.success("Commande modifiée, nous sommes prévenus.");
            onDone();
        },
        onError: (e) => toast.error(apiErrorMessage(e, "La modification n'a pas pu être enregistrée.")),
    });

    const canSave = lines.length > 0 && name.trim().length >= 2 && address.trim().length > 0 && commune.length > 0;

    return (
        <form
            className="mt-6 space-y-4"
            onSubmit={(e) => {
                e.preventDefault();
                save.mutate();
            }}
        >
            <section className="rounded-3xl bg-white p-5 shadow-soft">
                <h2 className="font-display font-semibold">Articles</h2>
                <ul className="mt-3 divide-y divide-cocoa/5">
                    {lines.map((l) => (
                        <li key={l.productId} className="flex items-center gap-3 py-3">
                            <div className="min-w-0 flex-1">
                                <p className="truncate font-medium">{l.name}</p>
                                <p className="text-xs text-mist">{formatFCFA(l.price)}</p>
                            </div>
                            <QuantityStepper
                                size="sm"
                                value={l.quantity}
                                onChange={(q) => setLines(lines.map((x) => (x.productId === l.productId ? { ...x, quantity: Math.max(1, Math.min(q, 50)) } : x)))}
                            />
                            <button
                                type="button"
                                aria-label={`Retirer ${l.name}`}
                                onClick={() => setLines(lines.filter((x) => x.productId !== l.productId))}
                                className="cursor-pointer rounded-full p-2 text-mist hover:bg-red-50 hover:text-red-600"
                            >
                                <Trash2 className="size-4" />
                            </button>
                        </li>
                    ))}
                </ul>
                {available.length > 0 && (
                    <div className="mt-3 flex gap-2">
                        <select value={adding} onChange={(e) => setAdding(e.target.value)} aria-label="Ajouter un article" className={cn(field, "mt-0 cursor-pointer")}>
                            <option value="">Ajouter un article…</option>
                            {available.map((p) => (
                                <option key={p.id} value={p.id}>
                                    {p.name} — {formatFCFA(p.price)}
                                </option>
                            ))}
                        </select>
                        <FoodyButton
                            type="button"
                            variant="outline"
                            disabled={!adding}
                            onClick={() => {
                                const p = catalog?.items.find((x) => x.id === Number(adding));
                                if (p) setLines([...lines, { productId: p.id, name: p.name, price: p.price, quantity: 1 }]);
                                setAdding("");
                            }}
                        >
                            <Plus /> Ajouter
                        </FoodyButton>
                    </div>
                )}
                {lines.length === 0 && <p className="mt-2 text-sm text-hibiscus">Gardez au moins un article, ou annulez la commande.</p>}
                <dl className="mt-4 space-y-1.5 border-t border-cocoa/10 pt-3 text-sm">
                    <div className="flex justify-between"><dt className="text-mist">Sous-total</dt><dd>{formatFCFA(subtotal)}</dd></div>
                    <div className="flex justify-between"><dt className="text-mist">Livraison</dt><dd>{fee ? formatFCFA(fee) : "Offerte"}</dd></div>
                    <div className="flex justify-between text-base font-bold"><dt>Nouveau total</dt><dd>{formatFCFA(subtotal + fee)}</dd></div>
                </dl>
            </section>

            <section className="rounded-3xl bg-white p-5 shadow-soft">
                <h2 className="font-display font-semibold">Livraison</h2>
                <div className="mt-3 grid gap-4 sm:grid-cols-2">
                    <label className="block text-sm font-medium">
                        Nom pour la livraison
                        <input required minLength={2} maxLength={120} value={name} onChange={(e) => setName(e.target.value)} className={field} />
                    </label>
                    <label className="block text-sm font-medium">
                        Autre numéro WhatsApp <span className="font-normal text-mist">(facultatif)</span>
                        <input type="tel" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className={field} />
                    </label>
                    <label className="block text-sm font-medium">
                        Commune
                        <select required value={commune} onChange={(e) => setCommune(e.target.value)} className={cn(field, "cursor-pointer")}>
                            <option value="" disabled>Choisir…</option>
                            {options?.communes.map((c) => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </label>
                    <label className="block text-sm font-medium sm:col-span-2">
                        Adresse
                        <input required maxLength={300} value={address} onChange={(e) => setAddress(e.target.value)} className={field} />
                    </label>
                    <label className="block text-sm font-medium sm:col-span-2">
                        Instructions <span className="font-normal text-mist">(facultatif)</span>
                        <textarea rows={2} maxLength={500} value={instructions} onChange={(e) => setInstructions(e.target.value)} className={cn(field, "h-auto py-2.5")} />
                    </label>
                </div>
            </section>

            <div className="flex justify-end gap-2">
                <FoodyButton type="button" variant="ghost" onClick={onDone}>Abandonner</FoodyButton>
                <FoodyButton type="submit" loading={save.isPending} disabled={!canSave}>Enregistrer les modifications</FoodyButton>
            </div>
        </form>
    );
}
