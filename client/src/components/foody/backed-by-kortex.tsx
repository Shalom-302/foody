import { cn } from "@/lib/utils/cn";

/**
 * "Backed by KORTEX" mark. The logo (public/kortex-logo.webp, white strokes on
 * transparency) is used as a CSS mask, so it takes the text colour of wherever
 * it sits: brown on cream, cream on the brown footer.
 */
export function BackedByKortex({ className, size = "md" }: { className?: string; size?: "sm" | "md" }) {
    return (
        <a
            href="https://kortex.sbs"
            target="_blank"
            rel="noopener"
            aria-label="Backed by KORTEX"
            className={cn("inline-flex items-center gap-2 opacity-80 transition hover:opacity-100", className)}
        >
            <span className={cn("font-medium tracking-[0.18em] uppercase", size === "sm" ? "text-[9px]" : "text-[10px]")}>Backed by</span>
            <span
                aria-hidden
                className={cn("block bg-current", size === "sm" ? "h-5 w-[63px]" : "h-6 w-[76px]")}
                style={{
                    WebkitMaskImage: "url(/kortex-logo.webp)",
                    maskImage: "url(/kortex-logo.webp)",
                    WebkitMaskSize: "contain",
                    maskSize: "contain",
                    WebkitMaskRepeat: "no-repeat",
                    maskRepeat: "no-repeat",
                    WebkitMaskPosition: "center",
                    maskPosition: "center",
                }}
            />
        </a>
    );
}
