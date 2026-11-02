"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Camera, ImagePlus, Loader2, Pencil, Plus, Trash2, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Drawer, field, Toggle } from "@/components/admin/ui";
import { FoodyButton, foodyButton } from "@/components/foody/button";
import { ProductVisual } from "@/components/products/product-visual";
import { apiErrorMessage } from "@/lib/api/client";
import { useDebounce } from "@/lib/hooks/use-debounce";
import { formatFCFA } from "@/lib/format";
import { cn } from "@/lib/utils/cn";
import { adminApi } from "@/services/foody";
import type { Category, Product, ProductInput } from "@/types/foody";

const EMPTY: ProductInput = {
    category_id: 0,
    name: "",
    description: "",
    price: 0,
    stock: 0,
    image_url: null,
    gallery: [],
    model_3d_url: null,
    volume: "",
    ingredients: "",
    is_active: true,
    is_featured: false,
};

export default function AdminProductsPage() {
    const queryClient = useQueryClient();
    const [q, setQ] = useState("");
    const search = useDebounce(q, 300);
    const [editing, setEditing] = useState<Product | "new" | null>(null);

    const { data: categories } = useQuery({ queryKey: ["admin-categories"], queryFn: adminApi.categories });
    const { data, isLoading } = useQuery({ queryKey: ["admin-products", search], queryFn: () => adminApi.products({ q: search || undefined }) });

    const refresh = () => {
        queryClient.invalidateQueries({ queryKey: ["admin-products"] });
        queryClient.invalidateQueries({ queryKey: ["products"] });
        queryClient.invalidateQueries({ queryKey: ["product"] });
    };

    const quickUpdate = useMutation({
        mutationFn: ({ id, input }: { id: number; input: Partial<ProductInput> }) => adminApi.updateProduct(id, input),
        onSuccess: refresh,
        onError: (e) => toast.error(apiErrorMessage(e)),
    });

    return (
        <div>
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-bold">Produits</h1>
                    <p className="mt-1 text-sm text-mist">
                        Cliquez sur une photo pour la remplacer. Tapez un prix ou un stock puis Entrée : c&apos;est enregistré.
                    </p>
                </div>
                <div className="flex gap-2">
                    <FoodyButton asChild variant="outline"><Link href="/admin/categories">Catégories</Link></FoodyButton>
                    <FoodyButton onClick={() => setEditing("new")} disabled={!categories?.length}>
                        <Plus /> Nouveau produit
                    </FoodyButton>
                </div>
            </div>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher…" className={cn(field, "mt-5 max-w-sm")} />

            <div className="mt-5 overflow-hidden rounded-3xl bg-white shadow-soft">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[760px] text-left text-sm">
                        <thead className="bg-honey text-xs tracking-wide text-cocoa/70 uppercase">
                            <tr>
                                <th className="px-4 py-3 font-semibold">Produit</th>
                                <th className="px-4 py-3 font-semibold">Prix</th>
                                <th className="px-4 py-3 font-semibold">Stock</th>
                                <th className="px-4 py-3 font-semibold">En ligne</th>
                                <th className="px-4 py-3 font-semibold">Populaire</th>
                                <th className="px-4 py-3" />
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-cocoa/5">
                            {data?.items.map((p) => (
                                <tr key={p.id} className={cn(!p.is_active && "opacity-60")}>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-3">
                                            <PhotoCell product={p} onChanged={refresh} />
                                            <div>
                                                <p className="font-semibold">{p.name}</p>
                                                <p className="text-xs text-mist">{p.category?.name} {p.volume && `· ${p.volume}`}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <NumberCell
                                            value={p.price}
                                            suffix="FCFA"
                                            label={`Prix de ${p.name}`}
                                            onCommit={(price) =>
                                                quickUpdate.mutate(
                                                    { id: p.id, input: { price } },
                                                    { onSuccess: () => toast.success(`${p.name} : ${formatFCFA(price)}`) },
                                                )
                                            }
                                        />
                                    </td>
                                    <td className="px-4 py-3">
                                        <NumberCell value={p.stock} label={`Stock de ${p.name}`} warnZero onCommit={(stock) => quickUpdate.mutate({ id: p.id, input: { stock } })} />
                                    </td>
                                    <td className="px-4 py-3">
                                        <Toggle checked={p.is_active} label="En ligne" onChange={(is_active) => quickUpdate.mutate({ id: p.id, input: { is_active } })} />
                                    </td>
                                    <td className="px-4 py-3">
                                        <Toggle checked={p.is_featured} label="Populaire" onChange={(is_featured) => quickUpdate.mutate({ id: p.id, input: { is_featured } })} />
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <FoodyButton size="sm" variant="outline" onClick={() => setEditing(p)} aria-label={`Modifier ${p.name}`}>
                                            <Pencil /> Modifier
                                        </FoodyButton>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {isLoading && <div className="h-32 animate-pulse bg-cream" />}
                {data && data.items.length === 0 && <p className="p-8 text-center text-mist">Aucun produit.</p>}
            </div>

            {editing && categories && (
                <ProductForm
                    product={editing === "new" ? null : editing}
                    categories={categories}
                    onClose={() => setEditing(null)}
                    onSaved={() => {
                        refresh();
                        setEditing(null);
                    }}
                />
            )}
        </div>
    );
}

/** Inline number edit: type, then Enter or click away to save. */
function NumberCell({
    value,
    onCommit,
    label,
    suffix,
    warnZero,
}: {
    value: number;
    onCommit: (v: number) => void;
    label: string;
    suffix?: string;
    warnZero?: boolean;
}) {
    const [v, setV] = useState(String(value));
    useEffect(() => setV(String(value)), [value]);
    const commit = () => {
        const n = Math.max(0, Math.floor(Number(v || 0)));
        if (Number.isFinite(n) && n !== value) onCommit(n);
        else setV(String(value));
    };
    return (
        <label className={cn("inline-flex h-9 items-center rounded-lg border bg-white pr-2 focus-within:border-sun", warnZero && value === 0 ? "border-red-200 bg-red-50" : "border-cocoa/10")}>
            <input
                inputMode="numeric"
                value={v}
                onChange={(e) => setV(e.target.value.replace(/\D/g, ""))}
                onBlur={commit}
                onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
                aria-label={label}
                className={cn("h-full bg-transparent px-2 text-sm tabular-nums outline-none", suffix ? "w-20" : "w-16")}
            />
            {suffix && <span className="text-xs text-mist">{suffix}</span>}
        </label>
    );
}

/** Thumbnail that replaces the main photo in one click. */
function PhotoCell({ product, onChanged }: { product: Product; onChanged: () => void }) {
    const input = useRef<HTMLInputElement>(null);
    const [busy, setBusy] = useState(false);
    const change = async (file: File) => {
        setBusy(true);
        try {
            const { url } = await adminApi.upload(file);
            await adminApi.updateProduct(product.id, { image_url: url });
            toast.success(`Photo de ${product.name} mise à jour`);
            onChanged();
        } catch (e) {
            toast.error(apiErrorMessage(e, "Envoi de la photo impossible."));
        } finally {
            setBusy(false);
        }
    };
    return (
        <button
            type="button"
            onClick={() => input.current?.click()}
            disabled={busy}
            title="Changer la photo"
            aria-label={`Changer la photo de ${product.name}`}
            className="group relative size-14 shrink-0 cursor-pointer overflow-hidden rounded-xl"
        >
            <ProductVisual imageUrl={product.image_url} categorySlug={product.category?.slug} name={product.name} />
            <span className={cn("absolute inset-0 flex items-center justify-center bg-cocoa/55 text-cream transition-opacity", busy ? "opacity-100" : "opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100")}>
                {busy ? <Loader2 className="size-5 animate-spin" /> : <Camera className="size-5" />}
            </span>
            <input
                ref={input}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/avif"
                className="sr-only"
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) change(file);
                    e.target.value = "";
                }}
            />
        </button>
    );
}

function ProductForm({ product, categories, onClose, onSaved }: { product: Product | null; categories: Category[]; onClose: () => void; onSaved: () => void }) {
    const [form, setForm] = useState<ProductInput>(() =>
        product
            ? {
                  category_id: product.category_id,
                  name: product.name,
                  slug: product.slug,
                  description: product.description ?? "",
                  price: product.price,
                  stock: product.stock,
                  image_url: product.image_url,
                  gallery: product.gallery,
                  model_3d_url: product.model_3d_url,
                  volume: product.volume ?? "",
                  ingredients: product.ingredients ?? "",
                  is_active: product.is_active,
                  is_featured: product.is_featured,
              }
            : { ...EMPTY, category_id: categories[0]?.id ?? 0 },
    );
    const set = <K extends keyof ProductInput>(k: K, v: ProductInput[K]) => setForm((f) => ({ ...f, [k]: v }));
    const [uploading, setUploading] = useState<string | null>(null);

    const save = useMutation({
        mutationFn: () => {
            const payload = {
                ...form,
                description: form.description || null,
                volume: form.volume || null,
                ingredients: form.ingredients || null,
                slug: form.slug || undefined,
            };
            return product ? adminApi.updateProduct(product.id, payload) : adminApi.createProduct(payload);
        },
        onSuccess: () => {
            toast.success(product ? "Produit mis à jour" : "Produit créé");
            onSaved();
        },
        onError: (e) => toast.error(apiErrorMessage(e)),
    });

    const remove = useMutation({
        mutationFn: () => adminApi.deleteProduct(product!.id),
        onSuccess: () => {
            toast.success("Produit supprimé");
            onSaved();
        },
        onError: (e) => toast.error(apiErrorMessage(e)),
    });

    const upload = async (file: File, target: "image" | "gallery" | "model") => {
        setUploading(target);
        try {
            const { url } = await adminApi.upload(file);
            if (target === "image") set("image_url", url);
            else if (target === "model") set("model_3d_url", url);
            else setForm((f) => ({ ...f, gallery: [...f.gallery, url] }));
        } catch (e) {
            toast.error(apiErrorMessage(e, "Envoi du fichier impossible."));
        } finally {
            setUploading(null);
        }
    };

    return (
        <Drawer title={product ? "Modifier le produit" : "Nouveau produit"} onClose={onClose}>
            <form
                className="mt-6 space-y-4"
                onSubmit={(e) => {
                    e.preventDefault();
                    save.mutate();
                }}
            >
                <label className="block text-sm font-medium">
                    Nom
                    <input required minLength={2} maxLength={160} value={form.name} onChange={(e) => set("name", e.target.value)} className={field} />
                </label>
                <div className="grid grid-cols-2 gap-3">
                    <label className="block text-sm font-medium">
                        Catégorie
                        <select value={form.category_id} onChange={(e) => set("category_id", Number(e.target.value))} className={cn(field, "cursor-pointer")}>
                            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </label>
                    <label className="block text-sm font-medium">
                        Volume / quantité
                        <input maxLength={60} value={form.volume ?? ""} onChange={(e) => set("volume", e.target.value)} placeholder="33 cl, boîte de 6…" className={field} />
                    </label>
                    <label className="block text-sm font-medium">
                        Prix (FCFA)
                        <input required inputMode="numeric" value={form.price} onChange={(e) => set("price", Number(e.target.value.replace(/\D/g, "")) || 0)} className={field} />
                    </label>
                    <label className="block text-sm font-medium">
                        Stock
                        <input required inputMode="numeric" value={form.stock} onChange={(e) => set("stock", Number(e.target.value.replace(/\D/g, "")) || 0)} className={field} />
                    </label>
                </div>
                <label className="block text-sm font-medium">
                    Description
                    <textarea rows={3} value={form.description ?? ""} onChange={(e) => set("description", e.target.value)} className={cn(field, "h-auto py-2.5")} />
                </label>
                <label className="block text-sm font-medium">
                    Composition
                    <textarea rows={2} value={form.ingredients ?? ""} onChange={(e) => set("ingredients", e.target.value)} className={cn(field, "h-auto py-2.5")} />
                </label>

                <div>
                    <p className="text-sm font-medium">Photo principale</p>
                    <p className="text-xs text-mist">Celle des cartes de la boutique. Format carré ou portrait conseillé.</p>
                    <div className="mt-2 flex items-center gap-4">
                        <div className="size-28 shrink-0 overflow-hidden rounded-2xl bg-white shadow-soft">
                            <ProductVisual imageUrl={form.image_url} categorySlug={categories.find((c) => c.id === form.category_id)?.slug} name={form.name || "Produit"} />
                        </div>
                        <div className="flex flex-col items-start gap-2">
                            <label className={cn(foodyButton({ variant: "primary", size: "sm" }), uploading === "image" && "pointer-events-none opacity-60")}>
                                {uploading === "image" ? <Loader2 className="animate-spin" /> : <Camera />}
                                {form.image_url ? "Changer la photo" : "Ajouter une photo"}
                                <input
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp,image/avif"
                                    className="sr-only"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) upload(file, "image");
                                        e.target.value = "";
                                    }}
                                />
                            </label>
                            {form.image_url && (
                                <button type="button" onClick={() => set("image_url", null)} className="cursor-pointer text-xs font-semibold text-mist underline hover:text-cocoa">
                                    Retirer
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                <div>
                    <p className="text-sm font-medium">Galerie <span className="font-normal text-mist">(photos en plus sur la fiche produit)</span></p>
                    <div className="mt-2 flex flex-wrap gap-2">
                        {form.gallery.map((src) => (
                            <div key={src} className="relative size-20 overflow-hidden rounded-xl bg-white">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={src} alt="" className="size-full object-cover" />
                                <button
                                    type="button"
                                    title="Mettre en photo principale"
                                    onClick={() =>
                                        setForm((f) => ({
                                            ...f,
                                            image_url: src,
                                            gallery: [...(f.image_url ? [f.image_url] : []), ...f.gallery.filter((g) => g !== src)],
                                        }))
                                    }
                                    className="absolute inset-x-0 bottom-0 cursor-pointer bg-cocoa/70 py-0.5 text-[10px] text-cream opacity-0 transition hover:opacity-100 focus:opacity-100"
                                >
                                    Principale
                                </button>
                                <button
                                    type="button"
                                    aria-label="Retirer l'image"
                                    onClick={() => setForm((f) => ({ ...f, gallery: f.gallery.filter((g) => g !== src) }))}
                                    className="absolute top-1 right-1 cursor-pointer rounded-full bg-white/90 p-1"
                                >
                                    <X className="size-3" />
                                </button>
                            </div>
                        ))}
                        <label className="flex size-20 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-cocoa/15 text-xs text-mist hover:border-sun">
                            {uploading === "gallery" ? <Loader2 className="size-5 animate-spin" /> : <ImagePlus className="size-5" />}
                            {uploading === "gallery" ? "Envoi…" : "Ajouter"}
                            <input
                                type="file"
                                accept="image/jpeg,image/png,image/webp,image/avif"
                                className="sr-only"
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) upload(file, "gallery");
                                    e.target.value = "";
                                }}
                            />
                        </label>
                    </div>
                </div>

                <div>
                    <p className="text-sm font-medium">Modèle 3D (GLB)</p>
                    <div className="mt-2 flex items-center gap-3 text-sm">
                        {form.model_3d_url ? (
                            <>
                                <span className="truncate text-mist">{form.model_3d_url.split("/").pop()}</span>
                                <button type="button" onClick={() => set("model_3d_url", null)} className="cursor-pointer font-semibold underline">Retirer</button>
                            </>
                        ) : (
                            <label className="cursor-pointer font-semibold underline">
                                {uploading === "model" ? "Envoi…" : "Téléverser un .glb"}
                                <input type="file" accept=".glb,model/gltf-binary" className="sr-only" onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f, "model"); e.target.value = ""; }} />
                            </label>
                        )}
                    </div>
                </div>

                <div className="flex gap-6 pt-2 text-sm">
                    <label className="flex items-center gap-2"><Toggle checked={form.is_active} label="En ligne" onChange={(v) => set("is_active", v)} /> En ligne</label>
                    <label className="flex items-center gap-2"><Toggle checked={form.is_featured} label="Populaire" onChange={(v) => set("is_featured", v)} /> Populaire</label>
                </div>

                <div className="flex items-center justify-between gap-3 border-t border-cocoa/10 pt-5">
                    {product ? (
                        <FoodyButton
                            type="button"
                            variant="danger"
                            loading={remove.isPending}
                            onClick={() => window.confirm(`Supprimer « ${product.name} » ? Les commandes passées sont conservées.`) && remove.mutate()}
                        >
                            <Trash2 /> Supprimer
                        </FoodyButton>
                    ) : (
                        <span />
                    )}
                    <FoodyButton type="submit" loading={save.isPending} disabled={!!uploading}>Enregistrer</FoodyButton>
                </div>
            </form>
        </Drawer>
    );
}

