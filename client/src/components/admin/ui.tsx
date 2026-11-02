"use client";

import { Camera, Loader2, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { foodyButton } from "@/components/foody/button";
import { apiErrorMessage } from "@/lib/api/client";
import { cn } from "@/lib/utils/cn";
import { adminApi } from "@/services/foody";

export const field =
    "mt-1.5 h-11 w-full rounded-xl border border-cocoa/15 bg-white px-3 text-sm outline-none focus:border-sun focus:ring-2 focus:ring-sun/30";

export function PageHeader({ title, hint, children }: { title: string; hint?: string; children?: React.ReactNode }) {
    return (
        <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
                <h1 className="text-2xl font-bold">{title}</h1>
                {hint && <p className="mt-1 max-w-2xl text-sm text-mist">{hint}</p>}
            </div>
            {children && <div className="flex flex-wrap gap-2">{children}</div>}
        </div>
    );
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            aria-label={label}
            onClick={() => onChange(!checked)}
            className={cn("relative h-6 w-11 shrink-0 cursor-pointer rounded-full transition", checked ? "bg-sun" : "bg-stone-200")}
        >
            <span className={cn("absolute top-0.5 size-5 rounded-full bg-white shadow transition-all", checked ? "left-5.5" : "left-0.5")} />
        </button>
    );
}

export function Drawer({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
    return (
        <div className="fixed inset-0 z-50 flex justify-end bg-cocoa/30" onClick={onClose}>
            <div role="dialog" aria-modal="true" aria-label={title} className="h-full w-full max-w-lg overflow-y-auto bg-cream p-6 shadow-lift" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between">
                    <h2 className="font-display text-xl font-semibold">{title}</h2>
                    <button type="button" onClick={onClose} aria-label="Fermer" className="cursor-pointer rounded-full p-2 hover:bg-honey">
                        <X className="size-5" />
                    </button>
                </div>
                {children}
            </div>
        </div>
    );
}

/** Uploads an image and hands back its URL ("Changer la photo" button). */
export function ImagePicker({ onUploaded, label = "Changer la photo" }: { onUploaded: (url: string) => void; label?: string }) {
    const [busy, setBusy] = useState(false);
    return (
        <label className={cn(foodyButton({ variant: "primary", size: "sm" }), busy && "pointer-events-none opacity-60")}>
            {busy ? <Loader2 className="animate-spin" /> : <Camera />}
            {label}
            <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/avif"
                className="sr-only"
                onChange={async (e) => {
                    const file = e.target.files?.[0];
                    e.target.value = "";
                    if (!file) return;
                    setBusy(true);
                    try {
                        onUploaded((await adminApi.upload(file)).url);
                    } catch (err) {
                        toast.error(apiErrorMessage(err, "Envoi de la photo impossible."));
                    } finally {
                        setBusy(false);
                    }
                }}
            />
        </label>
    );
}
