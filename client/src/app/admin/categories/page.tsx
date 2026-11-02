"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Drawer, field, ImagePicker, PageHeader, Toggle } from "@/components/admin/ui";
import { FoodyButton } from "@/components/foody/button";
import { ProductVisual } from "@/components/products/product-visual";
import { apiErrorMessage } from "@/lib/api/client";
import { cn } from "@/lib/utils/cn";
import { adminApi } from "@/services/foody";
import type { Category } from "@/types/foody";

type Draft = { name: string; description: string; image_url: string | null; is_active: boolean };

export default function AdminCategoriesPage() {
    const queryClient = useQueryClient();
    const [editing, setEditing] = useState<Category | "new" | null>(null);
    const { data: categories, isLoading } = useQuery({ queryKey: ["admin-categories"], queryFn: adminApi.categories });

    const refresh = () => {
        queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
        queryClient.invalidateQueries({ queryKey: ["categories"] });
        queryClient.invalidateQueries({ queryKey: ["products"] });
    };

    const update = useMutation({
        mutationFn: ({ id, input }: { id: number; input: Partial<Category> }) => adminApi.updateCategory(id, input),
        onSuccess: refresh,
        onError: (e) => toast.error(apiErrorMessage(e)),
    });
    const remove = useMutation({
        mutationFn: (c: Category) => adminApi.deleteCategory(c.id),
        onSuccess: (_, c) => {
            toast.success(`Catégorie « ${c.name} » supprimée`);
            refresh();
        },
        onError: (e) => toast.error(apiErrorMessage(e)),
    });

    // Swap with the neighbour, then renumber so the order stays clean.
    const move = async (index: number, delta: -1 | 1) => {
        if (!categories) return;
        const list = [...categories];
        const target = index + delta;
        if (target < 0 || target >= list.length) return;
        [list[index], list[target]] = [list[target], list[index]];
        try {
            await Promise.all(list.map((c, i) => (c.sort_order === i ? null : adminApi.updateCategory(c.id, { sort_order: i }))));
            refresh();
        } catch (e) {
            toast.error(apiErrorMessage(e));
        }
    };

    return (
        <div>
            <PageHeader title="Catégories" hint="L'ordre ici est celui de la boutique. Une catégorie masquée n'apparaît plus aux clients ; pour la supprimer, elle doit d'abord être vide.">
                <FoodyButton onClick={() => setEditing("new")}>
                    <Plus /> Nouvelle catégorie
                </FoodyButton>
            </PageHeader>

            <ul className="mt-6 space-y-3">
                {isLoading && <li className="h-24 animate-pulse rounded-3xl bg-honey" />}
                {categories?.map((c, i) => (
                    <li key={c.id} className={cn("flex flex-wrap items-center gap-4 rounded-3xl bg-white p-4 shadow-soft", !c.is_active && "opacity-60")}>
                        <div className="flex flex-col">
                            <button type="button" disabled={i === 0} onClick={() => move(i, -1)} aria-label="Monter" className="cursor-pointer rounded-full p-1 hover:bg-honey disabled:opacity-20">
                                <ArrowUp className="size-4" />
                            </button>
                            <button type="button" disabled={i === categories.length - 1} onClick={() => move(i, 1)} aria-label="Descendre" className="cursor-pointer rounded-full p-1 hover:bg-honey disabled:opacity-20">
                                <ArrowDown className="size-4" />
                            </button>
                        </div>
                        <div className="size-16 shrink-0 overflow-hidden rounded-2xl">
                            <ProductVisual imageUrl={c.image_url} categorySlug={c.slug} name={c.name} />
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="font-display font-semibold">{c.name}</p>
                            <p className="truncate text-sm text-mist">{c.description || "Pas de description"}</p>
                        </div>
                        <label className="flex items-center gap-2 text-sm">
                            <Toggle checked={c.is_active} label="Visible" onChange={(is_active) => update.mutate({ id: c.id, input: { is_active } })} />
                            Visible
                        </label>
                        <FoodyButton size="sm" variant="outline" onClick={() => setEditing(c)}>
                            <Pencil /> Modifier
                        </FoodyButton>
                        <FoodyButton
                            size="sm"
                            variant="danger"
                            loading={remove.isPending && remove.variables?.id === c.id}
                            onClick={() => window.confirm(`Supprimer la catégorie « ${c.name} » ?`) && remove.mutate(c)}
                            aria-label={`Supprimer ${c.name}`}
                        >
                            <Trash2 />
                        </FoodyButton>
                    </li>
                ))}
            </ul>

            {editing && (
                <CategoryForm
                    category={editing === "new" ? null : editing}
                    nextOrder={categories?.length ?? 0}
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

function CategoryForm({ category, nextOrder, onClose, onSaved }: { category: Category | null; nextOrder: number; onClose: () => void; onSaved: () => void }) {
    const [draft, setDraft] = useState<Draft>({
        name: category?.name ?? "",
        description: category?.description ?? "",
        image_url: category?.image_url ?? null,
        is_active: category?.is_active ?? true,
    });
    const save = useMutation({
        mutationFn: () => {
            const input = { ...draft, name: draft.name.trim(), description: draft.description.trim() || null };
            return category ? adminApi.updateCategory(category.id, input) : adminApi.createCategory({ ...input, sort_order: nextOrder });
        },
        onSuccess: () => {
            toast.success(category ? "Catégorie mise à jour" : "Catégorie créée");
            onSaved();
        },
        onError: (e) => toast.error(apiErrorMessage(e)),
    });

    return (
        <Drawer title={category ? "Modifier la catégorie" : "Nouvelle catégorie"} onClose={onClose}>
            <form
                className="mt-6 space-y-4"
                onSubmit={(e) => {
                    e.preventDefault();
                    save.mutate();
                }}
            >
                <label className="block text-sm font-medium">
                    Nom
                    <input required minLength={2} maxLength={120} value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} className={field} />
                </label>
                <label className="block text-sm font-medium">
                    Description <span className="font-normal text-mist">(affichée en haut de la page boutique)</span>
                    <textarea rows={3} maxLength={500} value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} className={cn(field, "h-auto py-2.5")} />
                </label>
                <div>
                    <p className="text-sm font-medium">Photo</p>
                    <div className="mt-2 flex items-center gap-4">
                        <div className="size-24 shrink-0 overflow-hidden rounded-2xl bg-white shadow-soft">
                            <ProductVisual imageUrl={draft.image_url} categorySlug={category?.slug} name={draft.name || "Catégorie"} />
                        </div>
                        <div className="flex flex-col items-start gap-2">
                            <ImagePicker label={draft.image_url ? "Changer la photo" : "Ajouter une photo"} onUploaded={(url) => setDraft((d) => ({ ...d, image_url: url }))} />
                            {draft.image_url && (
                                <button type="button" onClick={() => setDraft({ ...draft, image_url: null })} className="cursor-pointer text-xs font-semibold text-mist underline hover:text-cocoa">
                                    Retirer
                                </button>
                            )}
                        </div>
                    </div>
                </div>
                <label className="flex items-center gap-2 pt-2 text-sm">
                    <Toggle checked={draft.is_active} label="Visible" onChange={(is_active) => setDraft({ ...draft, is_active })} /> Visible dans la boutique
                </label>
                <div className="flex justify-end border-t border-cocoa/10 pt-5">
                    <FoodyButton type="submit" loading={save.isPending}>Enregistrer</FoodyButton>
                </div>
            </form>
        </Drawer>
    );
}
