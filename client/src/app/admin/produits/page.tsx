"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ImagePlus, Pencil, Plus, Trash2, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { FoodyButton } from "@/components/foody/button";
import { ProductVisual } from "@/components/products/product-visual";
import { apiErrorMessage } from "@/lib/api/client";
import { useDebounce } from "@/lib/hooks/use-debounce";
import { formatFCFA } from "@/lib/format";
import { cn } from "@/lib/utils/cn";
import { adminApi } from "@/services/foody";
import type { Category, Product, ProductInput } from "@/types/foody";

const field = "mt-1.5 h-11 w-full rounded-xl border border-cocoa/15 bg-white px-3 text-sm outline-none focus:border-sun focus:ring-2 focus:ring-sun/30";

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
    const [showCategories, setShowCategories] = useState(false);

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
                <h1 className="text-2xl font-bold">Produits</h1>
                <div className="flex gap-2">
                    <FoodyButton variant="outline" onClick={() => setShowCategories(true)}>Catégories</FoodyButton>
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
                                            <div className="size-12 shrink-0 overflow-hidden rounded-xl">
                                                <ProductVisual imageUrl={p.image_url} categorySlug={p.category?.slug} name={p.name} />
                                            </div>
                                            <div>
                                                <p className="font-semibold">{p.name}</p>
                                                <p className="text-xs text-mist">{p.category?.name} {p.volume && `· ${p.volume}`}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 tabular-nums">{formatFCFA(p.price)}</td>
                                    <td className="px-4 py-3">
                                        <StockInput value={p.stock} onCommit={(stock) => quickUpdate.mutate({ id: p.id, input: { stock } })} />
                                    </td>
                                    <td className="px-4 py-3">
                                        <Toggle checked={p.is_active} label="En ligne" onChange={(is_active) => quickUpdate.mutate({ id: p.id, input: { is_active } })} />
                                    </td>
                                    <td className="px-4 py-3">
                                        <Toggle checked={p.is_featured} label="Populaire" onChange={(is_featured) => quickUpdate.mutate({ id: p.id, input: { is_featured } })} />
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <button type="button" onClick={() => setEditing(p)} aria-label={`Modifier ${p.name}`} className="cursor-pointer rounded-full p-2 hover:bg-honey">
                                            <Pencil className="size-4" />
                                        </button>
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
            {showCategories && categories && <CategoriesPanel categories={categories} onClose={() => setShowCategories(false)} />}
        </div>
    );
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            aria-label={label}
            onClick={() => onChange(!checked)}
            className={cn("relative h-6 w-11 cursor-pointer rounded-full transition", checked ? "bg-sun" : "bg-stone-200")}
        >
            <span className={cn("absolute top-0.5 size-5 rounded-full bg-white shadow transition-all", checked ? "left-5.5" : "left-0.5")} />
        </button>
    );
}

function StockInput({ value, onCommit }: { value: number; onCommit: (v: number) => void }) {
    const [v, setV] = useState(String(value));
    const commit = () => {
        const n = Math.max(0, Math.floor(Number(v)));
        if (Number.isFinite(n) && n !== value) onCommit(n);
        else setV(String(value));
    };
    return (
        <input
            inputMode="numeric"
            value={v}
            onChange={(e) => setV(e.target.value.replace(/\D/g, ""))}
            onBlur={commit}
            onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
            aria-label="Stock"
            className={cn("h-9 w-20 rounded-lg border px-2 text-sm tabular-nums outline-none focus:border-sun", value === 0 ? "border-red-200 bg-red-50" : "border-cocoa/10")}
        />
    );
}

function Drawer({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
    return (
        <div className="fixed inset-0 z-50 flex justify-end bg-cocoa/30" onClick={onClose}>
            <div role="dialog" aria-modal="true" aria-label={title} className="h-full w-full max-w-lg overflow-y-auto bg-cream p-6 shadow-lift" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between">
                    <h2 className="font-display text-xl font-semibold">{title}</h2>
                    <button type="button" onClick={onClose} aria-label="Fermer" className="cursor-pointer rounded-full p-2 hover:bg-honey">
                        <X className="size-5" />
                    </button>
                </div>
                {children}
            </div>
        </div>
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
                    <p className="text-sm font-medium">Images</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                        {[form.image_url, ...form.gallery].filter(Boolean).map((src, i) => (
                            <div key={src!} className="relative size-20 overflow-hidden rounded-xl bg-white">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={src!} alt="" className="size-full object-cover" />
                                {i === 0 && <span className="absolute inset-x-0 bottom-0 bg-cocoa/70 py-0.5 text-center text-[10px] text-cream">Principale</span>}
                                <button
                                    type="button"
                                    aria-label="Retirer l'image"
                                    onClick={() =>
                                        setForm((f) =>
                                            i === 0
                                                ? { ...f, image_url: f.gallery[0] ?? null, gallery: f.gallery.slice(1) }
                                                : { ...f, gallery: f.gallery.filter((g) => g !== src) },
                                        )
                                    }
                                    className="absolute top-1 right-1 cursor-pointer rounded-full bg-white/90 p-1"
                                >
                                    <X className="size-3" />
                                </button>
                            </div>
                        ))}
                        <label className="flex size-20 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-cocoa/15 text-xs text-mist hover:border-sun">
                            <ImagePlus className="size-5" />
                            {uploading === "image" || uploading === "gallery" ? "Envoi…" : "Ajouter"}
                            <input
                                type="file"
                                accept="image/jpeg,image/png,image/webp,image/avif"
                                className="sr-only"
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) upload(file, form.image_url ? "gallery" : "image");
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

function CategoriesPanel({ categories, onClose }: { categories: Category[]; onClose: () => void }) {
    const queryClient = useQueryClient();
    const [name, setName] = useState("");
    const refresh = () => {
        queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
        queryClient.invalidateQueries({ queryKey: ["categories"] });
    };
    const create = useMutation({
        mutationFn: () => adminApi.createCategory({ name: name.trim(), sort_order: categories.length }),
        onSuccess: () => {
            setName("");
            refresh();
        },
        onError: (e) => toast.error(apiErrorMessage(e)),
    });
    const update = useMutation({
        mutationFn: ({ id, input }: { id: number; input: Partial<Category> }) => adminApi.updateCategory(id, input),
        onSuccess: refresh,
        onError: (e) => toast.error(apiErrorMessage(e)),
    });

    return (
        <Drawer title="Catégories" onClose={onClose}>
            <ul className="mt-6 space-y-2">
                {categories.map((c) => (
                    <li key={c.id} className="flex items-center justify-between gap-3 rounded-2xl bg-white p-3 shadow-soft">
                        <input
                            defaultValue={c.name}
                            aria-label="Nom de la catégorie"
                            onBlur={(e) => e.target.value.trim() && e.target.value.trim() !== c.name && update.mutate({ id: c.id, input: { name: e.target.value.trim() } })}
                            className="h-9 min-w-0 flex-1 rounded-lg px-2 text-sm font-medium outline-none focus:bg-cream"
                        />
                        <Toggle checked={c.is_active} label="Visible" onChange={(is_active) => update.mutate({ id: c.id, input: { is_active } })} />
                    </li>
                ))}
            </ul>
            <form
                className="mt-5 flex gap-2"
                onSubmit={(e) => {
                    e.preventDefault();
                    if (name.trim().length >= 2) create.mutate();
                }}
            >
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nouvelle catégorie" className={cn(field, "mt-0")} />
                <FoodyButton type="submit" loading={create.isPending}><Plus /> Ajouter</FoodyButton>
            </form>
        </Drawer>
    );
}
