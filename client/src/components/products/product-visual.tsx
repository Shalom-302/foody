import { cn } from "@/lib/utils/cn";

type Theme = { bg: string; liquid: string; accent: string; kind: "bottle" | "cake" | "box" };

const THEMES: Record<string, Theme> = {
    "jus-de-bissap": { bg: "#FDE9A8", liquid: "#8E1B3A", accent: "#C2416A", kind: "bottle" },
    "jus-de-citron": { bg: "#FFF6D9", liquid: "#F4D35E", accent: "#8DB63C", kind: "bottle" },
    "autres-boissons": { bg: "#FDE9A8", liquid: "#E8A33D", accent: "#6E8B3D", kind: "bottle" },
    "mini-cakes": { bg: "#FFF6D9", liquid: "#E9B872", accent: "#8A5A2B", kind: "cake" },
    mignardises: { bg: "#FFF6D9", liquid: "#F2B5C4", accent: "#9B1D3A", kind: "cake" },
    "amuse-bouches": { bg: "#FDE9A8", liquid: "#E9B872", accent: "#6E8B3D", kind: "cake" },
    "coffrets-gourmands": { bg: "#FDE9A8", liquid: "#F4C94E", accent: "#9B1D3A", kind: "box" },
};

const DEFAULT: Theme = { bg: "#FFF6D9", liquid: "#F4C94E", accent: "#493D26", kind: "bottle" };

/**
 * Product image, or a drawn illustration in the brand palette while the
 * catalogue has no photos yet.
 */
export function ProductVisual({
    imageUrl,
    categorySlug,
    name,
    className,
}: {
    imageUrl?: string | null;
    categorySlug?: string | null;
    name: string;
    className?: string;
}) {
    if (imageUrl) {
        return (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imageUrl} alt={name} loading="lazy" className={cn("size-full object-cover", className)} />
        );
    }
    const t = (categorySlug && THEMES[categorySlug]) || DEFAULT;
    return (
        <div className={cn("flex size-full items-center justify-center", className)} style={{ background: t.bg }}>
            <svg viewBox="0 0 120 120" className="h-3/4 w-3/4" role="img" aria-label={name}>
                <ellipse cx="60" cy="108" rx="34" ry="5" fill="#493D26" opacity="0.08" />
                {t.kind === "bottle" && (
                    <g>
                        <rect x="51" y="10" width="18" height="9" rx="3" fill={t.accent} />
                        <path d="M53 19h14v12c0 4 13 9 13 22v48a7 7 0 0 1-7 7H47a7 7 0 0 1-7-7V53c0-13 13-18 13-22z" fill="#fff" opacity="0.85" />
                        <path d="M43 60h34v41a5 5 0 0 1-5 5H48a5 5 0 0 1-5-5z" fill={t.liquid} />
                        <rect x="44" y="66" width="32" height="18" rx="4" fill="#FFFDF5" opacity="0.92" />
                        <rect x="50" y="72" width="20" height="2.5" rx="1.2" fill="#493D26" opacity="0.6" />
                        <rect x="53" y="77" width="14" height="2" rx="1" fill="#493D26" opacity="0.3" />
                        <path d="M48 26v20" stroke="#fff" strokeWidth="3" strokeLinecap="round" opacity="0.7" />
                    </g>
                )}
                {t.kind === "cake" && (
                    <g>
                        {[30, 60, 90].map((x, i) => (
                            <g key={x} transform={`translate(${x - 60} ${i === 1 ? -6 : 4})`}>
                                <path d="M42 70h36l-4 30H46z" fill={t.accent} opacity="0.85" />
                                <path d="M42 70h36" stroke="#fff" strokeWidth="1.5" opacity="0.4" />
                                <ellipse cx="60" cy="66" rx="20" ry="13" fill={t.liquid} />
                                <path d="M44 64c6 6 26 6 32 0" stroke="#FFFDF5" strokeWidth="4" strokeLinecap="round" fill="none" />
                                <circle cx="60" cy="54" r="4" fill="#9B1D3A" />
                            </g>
                        ))}
                    </g>
                )}
                {t.kind === "box" && (
                    <g>
                        <rect x="22" y="48" width="76" height="54" rx="8" fill="#fff" />
                        <rect x="18" y="40" width="84" height="16" rx="6" fill={t.liquid} />
                        <rect x="55" y="40" width="10" height="62" fill={t.accent} />
                        <path d="M60 40c-8-14-24-12-20-2 3 6 14 4 20 2zm0 0c8-14 24-12 20-2-3 6-14 4-20 2z" fill={t.accent} />
                    </g>
                )}
            </svg>
        </div>
    );
}
