import type { Metadata } from "next";
import { ProductDetail } from "@/components/products/product-detail";
import { SERVER_API_URL } from "@/lib/api/config";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params;
    try {
        const res = await fetch(`${SERVER_API_URL}/products/${encodeURIComponent(slug)}`, { next: { revalidate: 300 } });
        if (!res.ok) return { title: "Produit" };
        const { data } = await res.json();
        return {
            title: data.name,
            description: data.description ?? `${data.name} — FOODY Miniardise, Abidjan.`,
            openGraph: data.image_url ? { images: [data.image_url] } : undefined,
        };
    } catch {
        return { title: "Produit" };
    }
}

export default async function ProductPage({ params }: Props) {
    const { slug } = await params;
    return <ProductDetail slug={slug} />;
}
