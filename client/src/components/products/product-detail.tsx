"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Box, Check, ShoppingBag } from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { QuantityStepper } from "@/components/cart/quantity-stepper";
import { FoodyButton } from "@/components/foody/button";
import { ProductVisual } from "@/components/products/product-visual";
import { formatFCFA } from "@/lib/format";
import { cn } from "@/lib/utils/cn";
import { catalogApi } from "@/services/foody";
import { MAX_QUANTITY, useCartStore } from "@/store/cart";

const ModelViewer = dynamic(() => import("@/components/3d/model-viewer"), {
    ssr: false,
    loading: () => <div className="size-full animate-pulse bg-honey" />,
});

export function ProductDetail({ slug }: { slug: string }) {
    const router = useRouter();
    const add = useCartStore((s) => s.add);
    const [quantity, setQuantity] = useState(1);
    const [active, setActive] = useState(0);
    const [show3d, setShow3d] = useState(false);

    const { data: product, isLoading, isError } = useQuery({
        queryKey: ["product", slug],
        queryFn: () => catalogApi.product(slug),
    });

    if (isLoading) {
        return (
            <div className="mx-auto grid max-w-6xl gap-8 px-4 py-8 md:grid-cols-2 md:px-6">
                <div className="aspect-square animate-pulse rounded-[2rem] bg-honey" />
                <div className="space-y-4">
                    <div className="h-8 w-2/3 animate-pulse rounded bg-honey" />
                    <div className="h-5 w-1/3 animate-pulse rounded bg-honey" />
                    <div className="h-24 animate-pulse rounded bg-honey" />
                </div>
            </div>
        );
    }

    if (isError || !product) {
        return (
            <div className="mx-auto max-w-xl px-4 py-24 text-center">
                <h1 className="text-2xl font-bold">Ce produit n&apos;est plus disponible.</h1>
                <FoodyButton asChild className="mt-6">
                    <Link href="/boutique">Retour à la boutique</Link>
                </FoodyButton>
            </div>
        );
    }

    const images = [product.image_url, ...product.gallery].filter(Boolean) as string[];
    const maxQty = Math.min(MAX_QUANTITY, Math.max(product.stock, 1));

    const addToCart = (goToCart = false) => {
        add(product, quantity);
        if (goToCart) router.push("/panier");
        else toast.success(`${quantity} × ${product.name} ajouté au panier`);
    };

    return (
        <div className="mx-auto max-w-6xl px-4 pt-4 pb-28 md:px-6 md:pt-8 md:pb-12">
            <Link href="/boutique" className="inline-flex items-center gap-1.5 text-sm font-medium text-mist hover:text-cocoa">
                <ArrowLeft className="size-4" /> Boutique
            </Link>

            <div className="mt-4 grid gap-8 md:grid-cols-2 md:gap-12">
                {/* Gallery / 3D */}
                <div>
                    <div className="relative aspect-square overflow-hidden rounded-[2rem] bg-white shadow-soft">
                        {show3d && product.model_3d_url ? (
                            <ModelViewer url={product.model_3d_url} />
                        ) : (
                            <ProductVisual imageUrl={images[active]} categorySlug={product.category?.slug} name={product.name} />
                        )}
                        {product.model_3d_url && (
                            <button
                                type="button"
                                onClick={() => setShow3d((v) => !v)}
                                className="absolute right-4 bottom-4 inline-flex cursor-pointer items-center gap-2 rounded-full bg-white/95 px-4 py-2 text-sm font-semibold text-cocoa shadow-soft hover:bg-white"
                            >
                                <Box className="size-4" /> {show3d ? "Photos" : "Voir en 3D"}
                            </button>
                        )}
                    </div>
                    {images.length > 1 && !show3d && (
                        <div className="mt-3 flex gap-2 overflow-x-auto scrollbar-hide">
                            {images.map((src, i) => (
                                <button
                                    key={src}
                                    type="button"
                                    onClick={() => setActive(i)}
                                    aria-label={`Image ${i + 1}`}
                                    className={cn("size-18 shrink-0 cursor-pointer overflow-hidden rounded-2xl border-2", i === active ? "border-sun" : "border-transparent")}
                                >
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={src} alt="" className="size-full object-cover" />
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Info */}
                <div className="md:py-4">
                    {product.category && (
                        <Link href={`/boutique?categorie=${product.category.slug}`} className="text-sm font-semibold text-sun-dark hover:underline">
                            {product.category.name}
                        </Link>
                    )}
                    <h1 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">{product.name}</h1>
                    <div className="mt-4 flex items-center gap-3">
                        <span className="text-2xl font-bold">{formatFCFA(product.price)}</span>
                        {product.volume && <span className="rounded-full bg-honey px-3 py-1 text-sm text-cocoa">{product.volume}</span>}
                    </div>
                    <p className={cn("mt-3 flex items-center gap-1.5 text-sm font-medium", product.is_available ? "text-leaf" : "text-hibiscus")}>
                        {product.is_available ? (
                            <>
                                <Check className="size-4" />
                                {product.stock <= 5 ? `Plus que ${product.stock} en stock` : "Disponible"}
                            </>
                        ) : (
                            "Victime de son succès, bientôt de retour"
                        )}
                    </p>

                    {product.description && <p className="mt-6 leading-relaxed text-cocoa/80">{product.description}</p>}

                    {product.ingredients && (
                        <div className="mt-6 rounded-2xl bg-honey p-5">
                            <h2 className="text-sm font-semibold">Composition</h2>
                            <p className="mt-1.5 text-sm leading-relaxed text-cocoa/75">{product.ingredients}</p>
                        </div>
                    )}

                    {product.is_available && (
                        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-butter bg-cream/95 p-4 backdrop-blur md:static md:mt-8 md:border-0 md:bg-transparent md:p-0">
                            <div className="mx-auto flex max-w-6xl items-center gap-3">
                                <QuantityStepper value={quantity} onChange={(q) => setQuantity(Math.min(Math.max(q, 1), maxQty))} max={maxQty} />
                                <FoodyButton size="lg" className="flex-1 md:flex-none" onClick={() => addToCart()}>
                                    <ShoppingBag /> Ajouter · {formatFCFA(product.price * quantity)}
                                </FoodyButton>
                            </div>
                            <button type="button" onClick={() => addToCart(true)} className="mt-3 hidden cursor-pointer text-sm font-semibold underline md:block">
                                Ajouter et voir le panier
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
