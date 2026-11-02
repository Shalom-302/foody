import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { Product } from "@/types/foody";

export const MAX_QUANTITY = 50;

export type CartLine = {
    productId: number;
    slug: string;
    name: string;
    // Display only: the API recomputes every amount when the order is placed.
    price: number;
    imageUrl: string | null;
    categorySlug: string | null;
    volume: string | null;
    quantity: number;
};

type CartState = {
    lines: CartLine[];
    add: (product: Product, quantity?: number) => void;
    setQuantity: (productId: number, quantity: number) => void;
    remove: (productId: number) => void;
    clear: () => void;
};

const clamp = (q: number, stock?: number) =>
    Math.max(1, Math.min(q, MAX_QUANTITY, stock && stock > 0 ? stock : MAX_QUANTITY));

export const useCartStore = create<CartState>()(
    persist(
        (set) => ({
            lines: [],
            add: (product, quantity = 1) =>
                set((state) => {
                    const existing = state.lines.find((l) => l.productId === product.id);
                    if (existing) {
                        return {
                            lines: state.lines.map((l) =>
                                l.productId === product.id
                                    ? { ...l, price: product.price, quantity: clamp(l.quantity + quantity, product.stock) }
                                    : l,
                            ),
                        };
                    }
                    return {
                        lines: [
                            ...state.lines,
                            {
                                productId: product.id,
                                slug: product.slug,
                                name: product.name,
                                price: product.price,
                                imageUrl: product.image_url,
                                categorySlug: product.category?.slug ?? null,
                                volume: product.volume,
                                quantity: clamp(quantity, product.stock),
                            },
                        ],
                    };
                }),
            setQuantity: (productId, quantity) =>
                set((state) => ({
                    lines: state.lines.map((l) =>
                        l.productId === productId ? { ...l, quantity: clamp(quantity) } : l,
                    ),
                })),
            remove: (productId) =>
                set((state) => ({ lines: state.lines.filter((l) => l.productId !== productId) })),
            clear: () => set({ lines: [] }),
        }),
        { name: "foody-cart", storage: createJSONStorage(() => localStorage) },
    ),
);

export const cartCount = (lines: CartLine[]) => lines.reduce((n, l) => n + l.quantity, 0);
export const cartSubtotal = (lines: CartLine[]) => lines.reduce((n, l) => n + l.price * l.quantity, 0);
