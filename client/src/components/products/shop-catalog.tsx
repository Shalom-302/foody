"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Search, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ProductCard, ProductCardSkeleton } from "@/components/products/product-card";
import { useDebounce } from "@/lib/hooks/use-debounce";
import { cn } from "@/lib/utils/cn";
import { catalogApi, type ProductQuery } from "@/services/foody";

const SORTS: { value: NonNullable<ProductQuery["sort"]> | ""; label: string }[] = [
    { value: "", label: "Recommandés" },
    { value: "price_asc", label: "Prix croissant" },
    { value: "price_desc", label: "Prix décroissant" },
    { value: "newest", label: "Nouveautés" },
];

export function ShopCatalog() {
    const router = useRouter();
    const pathname = usePathname();
    const params = useSearchParams();

    const category = params.get("categorie") ?? "";
    const sort = (params.get("tri") ?? "") as ProductQuery["sort"] | "";
    const onlyAvailable = params.get("dispo") === "1";
    const page = Number(params.get("page") ?? 1) || 1;

    const [search, setSearch] = useState(params.get("q") ?? "");
    const debounced = useDebounce(search, 350);

    const update = (patch: Record<string, string | null>) => {
        const next = new URLSearchParams(params.toString());
        for (const [k, v] of Object.entries(patch)) {
            if (v) next.set(k, v);
            else next.delete(k);
        }
        if (!("page" in patch)) next.delete("page");
        const qs = next.toString();
        router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    };

    useEffect(() => {
        if ((params.get("q") ?? "") !== debounced) update({ q: debounced || null });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [debounced]);

    const { data: categories } = useQuery({ queryKey: ["categories"], queryFn: catalogApi.categories });
    const query: ProductQuery = {
        category: category || undefined,
        q: debounced || undefined,
        sort: sort || undefined,
        available: onlyAvailable || undefined,
        page,
    };
    const { data, isLoading, isError, isFetching } = useQuery({
        queryKey: ["products", query],
        queryFn: () => catalogApi.products(query),
        placeholderData: keepPreviousData,
    });

    const current = categories?.find((c) => c.slug === category);

    return (
        <div className="mx-auto max-w-6xl px-4 pt-6 pb-10 md:px-6 md:pt-10">
            <header>
                <h1 className="text-3xl font-bold tracking-tight md:text-4xl">{current?.name ?? "La boutique"}</h1>
                <p className="mt-2 max-w-xl text-mist">
                    {current?.description ?? "Jus frais, mignardises, amuse-bouches et coffrets : tout est préparé à la commande."}
                </p>
            </header>

            {/* Filters */}
            <div className="sticky top-16 z-30 -mx-4 mt-6 border-b border-butter/60 bg-cream/95 px-4 py-3 backdrop-blur md:top-20 md:mx-0 md:rounded-2xl md:border md:px-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center">
                    <label className="relative flex-1">
                        <span className="sr-only">Rechercher un produit</span>
                        <Search className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-mist" />
                        <input
                            type="search"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Bissap, macarons, tartelettes…"
                            className="h-11 w-full rounded-full border border-cocoa/10 bg-white pr-10 pl-11 text-sm text-cocoa outline-none placeholder:text-mist focus:border-sun focus:ring-2 focus:ring-sun/30"
                        />
                        {search && (
                            <button type="button" onClick={() => setSearch("")} aria-label="Effacer" className="absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer rounded-full p-1 text-mist hover:text-cocoa">
                                <X className="size-4" />
                            </button>
                        )}
                    </label>
                    <div className="flex gap-2">
                        <select
                            value={sort}
                            onChange={(e) => update({ tri: e.target.value || null })}
                            aria-label="Trier"
                            className="h-11 flex-1 cursor-pointer rounded-full border border-cocoa/10 bg-white px-4 text-sm text-cocoa outline-none focus:border-sun md:flex-none"
                        >
                            {SORTS.map((s) => (
                                <option key={s.value} value={s.value}>{s.label}</option>
                            ))}
                        </select>
                        <button
                            type="button"
                            onClick={() => update({ dispo: onlyAvailable ? null : "1" })}
                            aria-pressed={onlyAvailable}
                            className={cn(
                                "h-11 cursor-pointer rounded-full border px-4 text-sm font-medium whitespace-nowrap transition",
                                onlyAvailable ? "border-sun bg-sun text-cocoa" : "border-cocoa/10 bg-white text-cocoa hover:bg-honey",
                            )}
                        >
                            Disponibles
                        </button>
                    </div>
                </div>
                <div className="-mx-1 mt-3 flex gap-2 overflow-x-auto px-1 scrollbar-hide">
                    <Chip active={!category} onClick={() => update({ categorie: null })}>Tout</Chip>
                    {categories?.map((c) => (
                        <Chip key={c.id} active={category === c.slug} onClick={() => update({ categorie: c.slug })}>
                            {c.name}
                        </Chip>
                    ))}
                </div>
            </div>

            {/* Grid */}
            <div className={cn("mt-6 grid grid-cols-2 gap-3 transition-opacity sm:gap-5 lg:grid-cols-4", isFetching && !isLoading && "opacity-70")}>
                {isLoading
                    ? Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)
                    : data?.items.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>

            {isError && <p className="mt-10 text-center text-mist">La boutique ne répond pas. Réessayez dans un instant.</p>}
            {data && data.items.length === 0 && (
                <div className="mt-14 text-center">
                    <p className="font-display text-lg font-semibold">Aucun produit ne correspond.</p>
                    <button type="button" className="mt-3 cursor-pointer text-sm font-semibold underline" onClick={() => { setSearch(""); router.replace(pathname); }}>
                        Réinitialiser les filtres
                    </button>
                </div>
            )}

            {data && data.total_pages > 1 && (
                <nav className="mt-10 flex justify-center gap-2" aria-label="Pagination">
                    {Array.from({ length: data.total_pages }, (_, i) => i + 1).map((n) => (
                        <button
                            key={n}
                            type="button"
                            onClick={() => update({ page: n === 1 ? null : String(n) })}
                            aria-current={n === page ? "page" : undefined}
                            className={cn("size-10 cursor-pointer rounded-full text-sm font-semibold", n === page ? "bg-cocoa text-cream" : "bg-white text-cocoa hover:bg-honey")}
                        >
                            {n}
                        </button>
                    ))}
                </nav>
            )}
        </div>
    );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
    return (
        <button
            type="button"
            onClick={onClick}
            aria-pressed={active}
            className={cn(
                "h-9 shrink-0 cursor-pointer rounded-full px-4 text-sm font-medium whitespace-nowrap transition",
                active ? "bg-cocoa text-cream" : "bg-white text-cocoa shadow-soft hover:bg-honey",
            )}
        >
            {children}
        </button>
    );
}
