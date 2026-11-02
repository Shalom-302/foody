import { Check } from "lucide-react";
import { ORDER_STATUS_LABEL, ORDER_STATUS_TONE } from "@/lib/format";
import { cn } from "@/lib/utils/cn";
import type { DeliveryMethod, OrderStatus } from "@/types/foody";

export function OrderStatusBadge({ status, className }: { status: OrderStatus; className?: string }) {
    return (
        <span className={cn("inline-flex rounded-full px-2.5 py-1 text-xs font-semibold", ORDER_STATUS_TONE[status], className)}>
            {ORDER_STATUS_LABEL[status]}
        </span>
    );
}

/** Horizontal progress for the customer: where is my order? */
export function OrderTimeline({ status, method }: { status: OrderStatus; method: DeliveryMethod }) {
    if (status === "cancelled") {
        return <p className="rounded-2xl bg-stone-100 px-4 py-3 text-sm text-stone-600">Cette commande a été annulée.</p>;
    }
    const steps: OrderStatus[] =
        method === "pickup"
            ? ["pending", "confirmed", "preparing", "ready", "delivered"]
            : ["pending", "confirmed", "preparing", "ready", "out_for_delivery", "delivered"];
    const current = steps.indexOf(status);
    return (
        <ol className="grid gap-2" style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}>
            {steps.map((s, i) => {
                const done = i <= current;
                return (
                    <li key={s} className="flex flex-col items-center gap-2 text-center">
                        <span className={cn("flex size-8 items-center justify-center rounded-full text-xs font-bold", done ? "bg-sun text-cocoa" : "bg-stone-100 text-stone-400")}>
                            {i < current ? <Check className="size-4" /> : i + 1}
                        </span>
                        <span className={cn("text-[11px] leading-tight", done ? "font-semibold text-cocoa" : "text-mist")}>
                            {method === "pickup" && s === "delivered" ? "Récupérée" : ORDER_STATUS_LABEL[s]}
                        </span>
                    </li>
                );
            })}
        </ol>
    );
}
