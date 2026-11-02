"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Quote, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Drawer, field, PageHeader, Toggle } from "@/components/admin/ui";
import { FoodyButton } from "@/components/foody/button";
import { apiErrorMessage } from "@/lib/api/client";
import { cn } from "@/lib/utils/cn";
import { adminApi } from "@/services/foody";
import type { Testimonial } from "@/types/foody";

export default function AdminReviewsPage() {
    const queryClient = useQueryClient();
    const [editing, setEditing] = useState<Testimonial | "new" | null>(null);
    const { data: reviews, isLoading } = useQuery({ queryKey: ["admin-testimonials"], queryFn: adminApi.testimonials });

    const refresh = () => {
        queryClient.invalidateQueries({ queryKey: ["admin-testimonials"] });
        queryClient.invalidateQueries({ queryKey: ["testimonials"] });
    };
    const update = useMutation({
        mutationFn: ({ id, input }: { id: number; input: Partial<Testimonial> }) => adminApi.updateTestimonial(id, input),
        onSuccess: refresh,
        onError: (e) => toast.error(apiErrorMessage(e)),
    });
    const remove = useMutation({
        mutationFn: (t: Testimonial) => adminApi.deleteTestimonial(t.id),
        onSuccess: () => {
            toast.success("Avis supprimé");
            refresh();
        },
        onError: (e) => toast.error(apiErrorMessage(e)),
    });

    return (
        <div>
            <PageHeader title="Avis clients" hint="Les avis visibles s'affichent sur la page d'accueil. Sans avis visible, la section est masquée : n'ajoutez que de vrais retours de clients, avec leur accord.">
                <FoodyButton onClick={() => setEditing("new")}>
                    <Plus /> Ajouter un avis
                </FoodyButton>
            </PageHeader>

            {isLoading && <div className="mt-6 h-32 animate-pulse rounded-3xl bg-honey" />}
            {reviews && reviews.length === 0 && (
                <div className="mt-6 rounded-3xl bg-honey p-8 text-center">
                    <Quote className="mx-auto size-8 text-sun-dark" />
                    <p className="mt-3 font-semibold">Aucun avis pour l&apos;instant</p>
                    <p className="mt-1 text-sm text-mist">Recopiez ici les beaux messages reçus de vos clients sur WhatsApp.</p>
                </div>
            )}
            <div className="mt-6 grid gap-4 md:grid-cols-2">
                {reviews?.map((t) => (
                    <figure key={t.id} className={cn("flex flex-col rounded-3xl bg-white p-5 shadow-soft", !t.is_active && "opacity-60")}>
                        <blockquote className="flex-1 text-cocoa">« {t.quote} »</blockquote>
                        <figcaption className="mt-3 text-sm text-mist">
                            {t.author}
                            {t.location && `, ${t.location}`}
                        </figcaption>
                        <div className="mt-4 flex items-center gap-3 border-t border-cocoa/5 pt-4">
                            <label className="flex items-center gap-2 text-sm">
                                <Toggle checked={t.is_active} label="Visible" onChange={(is_active) => update.mutate({ id: t.id, input: { is_active } })} /> Visible
                            </label>
                            <span className="flex-1" />
                            <FoodyButton size="sm" variant="outline" onClick={() => setEditing(t)}>
                                <Pencil /> Modifier
                            </FoodyButton>
                            <FoodyButton size="sm" variant="danger" aria-label="Supprimer l'avis" onClick={() => window.confirm("Supprimer cet avis ?") && remove.mutate(t)}>
                                <Trash2 />
                            </FoodyButton>
                        </div>
                    </figure>
                ))}
            </div>

            {editing && (
                <ReviewForm
                    review={editing === "new" ? null : editing}
                    nextOrder={reviews?.length ?? 0}
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

function ReviewForm({ review, nextOrder, onClose, onSaved }: { review: Testimonial | null; nextOrder: number; onClose: () => void; onSaved: () => void }) {
    const [author, setAuthor] = useState(review?.author ?? "");
    const [location, setLocation] = useState(review?.location ?? "");
    const [quote, setQuote] = useState(review?.quote ?? "");
    const [active, setActive] = useState(review?.is_active ?? true);
    const save = useMutation({
        mutationFn: () => {
            const input = { author: author.trim(), location: location.trim() || null, quote: quote.trim(), is_active: active };
            return review ? adminApi.updateTestimonial(review.id, input) : adminApi.createTestimonial({ ...input, sort_order: nextOrder });
        },
        onSuccess: () => {
            toast.success(review ? "Avis mis à jour" : "Avis ajouté");
            onSaved();
        },
        onError: (e) => toast.error(apiErrorMessage(e)),
    });
    return (
        <Drawer title={review ? "Modifier l'avis" : "Ajouter un avis"} onClose={onClose}>
            <form
                className="mt-6 space-y-4"
                onSubmit={(e) => {
                    e.preventDefault();
                    save.mutate();
                }}
            >
                <label className="block text-sm font-medium">
                    L&apos;avis du client
                    <textarea required minLength={5} maxLength={400} rows={4} value={quote} onChange={(e) => setQuote(e.target.value)} className={cn(field, "h-auto py-2.5")} />
                    <span className="mt-1 block text-right text-xs font-normal text-mist">{quote.length}/400</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                    <label className="block text-sm font-medium">
                        Prénom
                        <input required minLength={2} maxLength={80} value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="Aïcha" className={field} />
                    </label>
                    <label className="block text-sm font-medium">
                        Commune <span className="font-normal text-mist">(facultatif)</span>
                        <input maxLength={80} value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Cocody" className={field} />
                    </label>
                </div>
                <label className="flex items-center gap-2 pt-2 text-sm">
                    <Toggle checked={active} label="Visible" onChange={setActive} /> Visible sur la page d&apos;accueil
                </label>
                <div className="flex justify-end border-t border-cocoa/10 pt-5">
                    <FoodyButton type="submit" loading={save.isPending}>Enregistrer</FoodyButton>
                </div>
            </form>
        </Drawer>
    );
}
