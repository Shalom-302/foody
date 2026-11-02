import type { OrderStatus, PaymentMethod, PaymentStatus } from "@/types/foody";

const fcfa = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 });

/** 12500 -> "12 500 FCFA" */
export function formatFCFA(amount: number): string {
    return `${fcfa.format(amount)} FCFA`;
}

/** "2250788016204" -> "+225 07 88 01 62 04" */
export function formatPhone(phone: string | null | undefined): string {
    if (!phone) return "";
    if (phone.startsWith("225") && phone.length === 13) {
        const local = phone.slice(3).replace(/(\d{2})(?=\d)/g, "$1 ");
        return `+225 ${local}`;
    }
    return `+${phone}`;
}

export function formatDate(value: string): string {
    return new Date(value).toLocaleString("fr-FR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
    pending: "En attente",
    confirmed: "Confirmée",
    preparing: "En préparation",
    ready: "Prête",
    out_for_delivery: "En livraison",
    delivered: "Livrée",
    cancelled: "Annulée",
};

export const ORDER_STATUS_TONE: Record<OrderStatus, string> = {
    pending: "bg-butter text-cocoa",
    confirmed: "bg-sky-100 text-sky-800",
    preparing: "bg-orange-100 text-orange-800",
    ready: "bg-lime-100 text-lime-800",
    out_for_delivery: "bg-violet-100 text-violet-800",
    delivered: "bg-emerald-100 text-emerald-800",
    cancelled: "bg-stone-200 text-stone-600",
};

// Same graph as backend ORDER_STATUS_TRANSITIONS (the backend stays the authority).
export const ORDER_NEXT_STATUSES: Record<OrderStatus, OrderStatus[]> = {
    pending: ["confirmed", "cancelled"],
    confirmed: ["preparing", "cancelled"],
    preparing: ["ready", "cancelled"],
    ready: ["out_for_delivery", "delivered", "cancelled"],
    out_for_delivery: ["delivered", "cancelled"],
    delivered: [],
    cancelled: [],
};

export const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
    cash: "Paiement à la livraison",
    mobile_money: "Mobile Money",
};

export const PAYMENT_STATUS_LABEL: Record<PaymentStatus, string> = {
    pending: "À encaisser",
    paid: "Payée",
    failed: "Échec",
    refunded: "Remboursée",
};
