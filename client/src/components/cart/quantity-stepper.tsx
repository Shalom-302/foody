import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export function QuantityStepper({
    value,
    onChange,
    max = 50,
    size = "md",
}: {
    value: number;
    onChange: (value: number) => void;
    max?: number;
    size?: "sm" | "md";
}) {
    const btn = cn(
        "flex items-center justify-center rounded-full text-cocoa transition hover:bg-butter disabled:opacity-30 cursor-pointer",
        size === "sm" ? "size-8" : "size-11",
    );
    return (
        <div className="inline-flex items-center rounded-full border border-cocoa/10 bg-white p-0.5">
            <button type="button" className={btn} onClick={() => onChange(value - 1)} disabled={value <= 1} aria-label="Retirer un">
                <Minus className="size-4" />
            </button>
            <span className={cn("min-w-8 text-center font-semibold tabular-nums", size === "sm" ? "text-sm" : "text-base")} aria-live="polite">
                {value}
            </span>
            <button type="button" className={btn} onClick={() => onChange(value + 1)} disabled={value >= max} aria-label="Ajouter un">
                <Plus className="size-4" />
            </button>
        </div>
    );
}
