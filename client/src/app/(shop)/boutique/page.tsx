import type { Metadata } from "next";
import { Suspense } from "react";
import { ShopCatalog } from "@/components/products/shop-catalog";

export const metadata: Metadata = {
    title: "Boutique",
    description: "Jus de bissap, citronnades, mini-cakes et coffrets gourmands FOODY.",
};

export default function BoutiquePage() {
    return (
        <Suspense>
            <ShopCatalog />
        </Suspense>
    );
}
