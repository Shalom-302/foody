import { cn } from "@/lib/utils/cn";

/** "Backed by Kortex" mark, same as STOUDENT. The SVG wordmark is black: `onDark` inverts it. */
export function BackedByKortex({ className, onDark = false }: { className?: string; onDark?: boolean }) {
    return (
        <a
            href="https://kortex.sbs"
            target="_blank"
            rel="noopener"
            className={cn("inline-flex items-center gap-2 text-xs transition-opacity hover:opacity-80", onDark ? "text-cream/60" : "text-mist", className)}
        >
            Backed by
            {/* eslint-disable-next-line @next/next/no-img-element -- static SVG wordmark */}
            <img src="/kortex-logo.svg" alt="Kortex" className={cn("h-5 w-auto", onDark && "invert")} />
        </a>
    );
}
