"use client";

import { Plus } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ProductVisual } from "@/components/products/product-visual";
import { formatFCFA } from "@/lib/format";
import { useCartStore } from "@/store/cart";
import type { Product } from "@/types/foody";

export function ProductCard({ product }: { product: Product }) {
    const add = useCartStore((s) => s.add);
    const router = useRouter();

    const quickAdd = () => {
        add(product);
        toast.success(`${product.name} ajouté au panier`, {
            action: { label: "Voir", onClick: () => router.push("/panier") },
        });
    };

    return (
        <motion.article
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="group relative flex flex-col overflow-hidden rounded-3xl bg-white shadow-soft transition-shadow duration-300 hover:shadow-lift"
        >
            <Link href={`/produit/${product.slug}`} className="relative block aspect-[4/5] overflow-hidden">
                <div className="size-full transition-transform duration-500 ease-out group-hover:scale-[1.04]">
                    <ProductVisual imageUrl={product.image_url} categorySlug={product.category?.slug} name={product.name} />
                </div>
                {product.is_featured && (
                    <span className="absolute top-3 left-3 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-cocoa shadow-soft">
                        Populaire
                    </span>
                )}
                {!product.is_available && (
                    <span className="absolute inset-x-3 bottom-3 rounded-full bg-cocoa/85 py-1.5 text-center text-xs font-semibold text-cream">
                        Victime de son succès
                    </span>
                )}
            </Link>
            <div className="flex flex-1 items-end justify-between gap-3 p-4">
                <div className="min-w-0">
                    <p className="text-xs font-medium text-mist">{product.category?.name}</p>
                    <h3 className="mt-0.5 truncate font-display text-base font-semibold text-cocoa">
                        <Link href={`/produit/${product.slug}`}>{product.name}</Link>
                    </h3>
                    <p className="mt-1 text-sm">
                        <span className="font-semibold text-cocoa">{formatFCFA(product.price)}</span>
                        {product.volume && <span className="text-mist"> · {product.volume}</span>}
                    </p>
                </div>
                <button
                    type="button"
                    onClick={quickAdd}
                    disabled={!product.is_available}
                    aria-label={`Ajouter ${product.name} au panier`}
                    className="flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-full bg-sun text-cocoa shadow-soft transition hover:bg-sun-dark active:scale-95 disabled:cursor-not-allowed disabled:bg-stone-200 disabled:text-stone-400"
                >
                    <Plus className="size-5" />
                </button>
            </div>
        </motion.article>
    );
}

export function ProductCardSkeleton() {
    return (
        <div className="overflow-hidden rounded-3xl bg-white shadow-soft">
            <div className="aspect-[4/5] animate-pulse bg-honey" />
            <div className="space-y-2 p-4">
                <div className="h-3 w-1/3 animate-pulse rounded bg-honey" />
                <div className="h-4 w-2/3 animate-pulse rounded bg-honey" />
                <div className="h-3 w-1/2 animate-pulse rounded bg-honey" />
            </div>
        </div>
    );
}
