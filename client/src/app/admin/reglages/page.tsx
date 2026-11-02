"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { field, PageHeader } from "@/components/admin/ui";
import { FoodyButton } from "@/components/foody/button";
import { apiErrorMessage } from "@/lib/api/client";
import { formatFCFA } from "@/lib/format";
import { cn } from "@/lib/utils/cn";
import { adminApi } from "@/services/foody";
import type { ShopSettings } from "@/types/foody";

const digits = (v: string) => Number(v.replace(/\D/g, "")) || 0;

export default function AdminSettingsPage() {
    const queryClient = useQueryClient();
    const { data } = useQuery({ queryKey: ["admin-settings"], queryFn: adminApi.settings });
    const [form, setForm] = useState<ShopSettings | null>(null);
    const [commune, setCommune] = useState("");

    useEffect(() => {
        if (data && !form) setForm(data);
    }, [data, form]);

    const save = useMutation({
        mutationFn: (values: ShopSettings) => adminApi.saveSettings(values),
        onSuccess: (saved) => {
            setForm(saved);
            queryClient.setQueryData(["admin-settings"], saved);
            queryClient.invalidateQueries({ queryKey: ["delivery-options"] });
            toast.success("Réglages enregistrés");
        },
        onError: (e) => toast.error(apiErrorMessage(e)),
    });

    if (!form) return <div className="h-64 animate-pulse rounded-3xl bg-honey" />;

    const addCommune = () => {
        const name = commune.trim().replace(/\s+/g, " ");
        if (!name || form.communes.some((c) => c.toLowerCase() === name.toLowerCase())) return setCommune("");
        setForm({ ...form, communes: [...form.communes, name] });
        setCommune("");
    };

    return (
        <form
            className="max-w-3xl"
            onSubmit={(e) => {
                e.preventDefault();
                save.mutate(form);
            }}
        >
            <PageHeader title="Réglages" hint="Ces réglages s'appliquent tout de suite aux nouvelles commandes.">
                <FoodyButton type="submit" loading={save.isPending}>Enregistrer</FoodyButton>
            </PageHeader>

            <section className="mt-6 rounded-3xl bg-white p-5 shadow-soft sm:p-6">
                <h2 className="font-display text-lg font-semibold">Livraison</h2>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <label className="block text-sm font-medium">
                        Frais de livraison (FCFA)
                        <input inputMode="numeric" value={form.delivery_fee} onChange={(e) => setForm({ ...form, delivery_fee: digits(e.target.value) })} className={field} />
                        <span className="mt-1 block text-xs font-normal text-mist">Affiché : {formatFCFA(form.delivery_fee)}</span>
                    </label>
                    <label className="block text-sm font-medium">
                        Livraison offerte dès (FCFA)
                        <input inputMode="numeric" value={form.free_delivery_threshold} onChange={(e) => setForm({ ...form, free_delivery_threshold: digits(e.target.value) })} className={field} />
                        <span className="mt-1 block text-xs font-normal text-mist">
                            {form.free_delivery_threshold ? `Offerte à partir de ${formatFCFA(form.free_delivery_threshold)} d'achats` : "0 = jamais offerte"}
                        </span>
                    </label>
                </div>
            </section>

            <section className="mt-4 rounded-3xl bg-white p-5 shadow-soft sm:p-6">
                <h2 className="font-display text-lg font-semibold">Communes livrées</h2>
                <p className="mt-1 text-sm text-mist">Le client ne peut choisir que ces communes. Une commande dans une autre commune est refusée.</p>
                <div className="mt-4 flex flex-wrap gap-2">
                    {form.communes.map((c) => (
                        <span key={c} className="inline-flex items-center gap-1 rounded-full bg-honey py-1.5 pr-1.5 pl-3 text-sm font-medium">
                            {c}
                            <button
                                type="button"
                                aria-label={`Retirer ${c}`}
                                disabled={form.communes.length === 1}
                                onClick={() => setForm({ ...form, communes: form.communes.filter((x) => x !== c) })}
                                className="cursor-pointer rounded-full p-0.5 hover:bg-butter disabled:opacity-30"
                            >
                                <X className="size-3.5" />
                            </button>
                        </span>
                    ))}
                </div>
                <div className="mt-3 flex gap-2">
                    <input
                        value={commune}
                        onChange={(e) => setCommune(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                e.preventDefault();
                                addCommune();
                            }
                        }}
                        maxLength={60}
                        placeholder="Ajouter une commune (ex. Grand-Bassam)"
                        className={cn(field, "mt-0 max-w-sm")}
                    />
                    <FoodyButton type="button" variant="outline" onClick={addCommune}>
                        <Plus /> Ajouter
                    </FoodyButton>
                </div>
            </section>

            <section className="mt-4 rounded-3xl bg-white p-5 shadow-soft sm:p-6">
                <h2 className="font-display text-lg font-semibold">Retrait sur place</h2>
                <label className="mt-4 block text-sm font-medium">
                    Adresse de retrait <span className="font-normal text-mist">(montrée au client qui choisit le retrait)</span>
                    <input
                        maxLength={300}
                        value={form.pickup_address ?? ""}
                        onChange={(e) => setForm({ ...form, pickup_address: e.target.value })}
                        placeholder="Riviera 2, à côté de la pharmacie…"
                        className={field}
                    />
                </label>
            </section>
        </form>
    );
}
