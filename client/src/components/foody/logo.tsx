import Link from "next/link";
import { cn } from "@/lib/utils/cn";

export function FoodyMark({ className }: { className?: string }) {
    // A sun-drop: the yellow of a lemon slice with a hibiscus heart.
    return (
        <svg viewBox="0 0 40 40" className={cn("size-9", className)} aria-hidden>
            <circle cx="20" cy="20" r="18" fill="#F4C94E" />
            <circle cx="20" cy="20" r="13" fill="#FDE9A8" />
            {[0, 60, 120, 180, 240, 300].map((deg) => (
                <path
                    key={deg}
                    d="M20 20 L20 8.5"
                    stroke="#F4C94E"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    transform={`rotate(${deg} 20 20)`}
                />
            ))}
            <circle cx="20" cy="20" r="4.2" fill="#9B1D3A" />
        </svg>
    );
}

export function FoodyLogo({ className }: { className?: string }) {
    return (
        <Link href="/" className={cn("flex items-center gap-2.5", className)} aria-label="FOODY Miniardise, accueil">
            <FoodyMark />
            <span className="flex flex-col leading-none">
                <span className="font-display text-lg font-bold tracking-tight text-cocoa">FOODY</span>
                <span className="text-[10px] font-medium tracking-[0.22em] text-mist uppercase">Miniardise</span>
            </span>
        </Link>
    );
}
