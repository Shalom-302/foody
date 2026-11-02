"use client";

import { Menu, ShoppingBag, User, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { FoodyLogo } from "@/components/foody/logo";
import { useHydrated } from "@/hooks/use-hydrated";
import { cn } from "@/lib/utils/cn";
import { isAdmin, useAuthStore } from "@/store/auth";
import { cartCount, useCartStore } from "@/store/cart";

const LINKS = [
    { href: "/", label: "Accueil" },
    { href: "/boutique", label: "Boutique" },
    { href: "/boutique?categorie=coffrets-gourmands", label: "Coffrets" },
    { href: "/#savoir-faire", label: "Savoir-faire" },
];

export function Navbar() {
    const pathname = usePathname();
    const hydrated = useHydrated();
    const count = useCartStore((s) => cartCount(s.lines));
    const user = useAuthStore((s) => s.user);
    const [open, setOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => setOpen(false), [pathname]);
    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 8);
        onScroll();
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    return (
        <header
            className={cn(
                "sticky top-0 z-40 transition-colors duration-300",
                scrolled ? "border-b border-butter/70 bg-cream/90 backdrop-blur-md" : "bg-transparent",
            )}
        >
            <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 md:h-20 md:px-6">
                <FoodyLogo />

                <ul className="hidden items-center gap-1 md:flex">
                    {LINKS.map((l) => (
                        <li key={l.href}>
                            <Link
                                href={l.href}
                                className={cn(
                                    "rounded-full px-4 py-2 text-sm font-medium text-cocoa/80 transition hover:bg-honey hover:text-cocoa",
                                    pathname === l.href && "bg-honey text-cocoa",
                                )}
                            >
                                {l.label}
                            </Link>
                        </li>
                    ))}
                </ul>

                <div className="flex items-center gap-1.5">
                    {hydrated && isAdmin(user) && (
                        <Link
                            href="/admin"
                            className="hidden rounded-full px-3 py-2 text-xs font-semibold tracking-wide text-mist uppercase hover:text-cocoa md:block"
                        >
                            Admin
                        </Link>
                    )}
                    <Link
                        href={hydrated && user ? "/mon-compte" : "/auth"}
                        aria-label="Mon compte"
                        className="flex h-11 min-w-11 items-center justify-center gap-2 rounded-full px-3 text-cocoa transition hover:bg-honey"
                    >
                        <User className="size-5" />
                        {hydrated && user?.pseudo && (
                            <span className="hidden max-w-32 truncate text-sm font-semibold lg:inline">{user.pseudo}</span>
                        )}
                    </Link>
                    <Link
                        href="/panier"
                        aria-label={`Panier, ${hydrated ? count : 0} article(s)`}
                        className="relative flex h-11 items-center gap-2 rounded-full bg-cocoa px-4 text-sm font-semibold text-cream transition hover:bg-cocoa/90"
                    >
                        <ShoppingBag className="size-4" />
                        <span className="hidden sm:inline">Panier</span>
                        {hydrated && count > 0 && (
                            <span className="flex min-w-5 items-center justify-center rounded-full bg-sun px-1.5 text-xs font-bold text-cocoa">
                                {count}
                            </span>
                        )}
                    </Link>
                    <button
                        type="button"
                        className="flex size-11 items-center justify-center rounded-full text-cocoa hover:bg-honey md:hidden"
                        onClick={() => setOpen((o) => !o)}
                        aria-expanded={open}
                        aria-label="Menu"
                    >
                        {open ? <X className="size-5" /> : <Menu className="size-5" />}
                    </button>
                </div>
            </nav>

            {open && (
                <div className="border-t border-butter bg-cream px-4 pb-4 md:hidden">
                    <ul className="flex flex-col py-2">
                        {LINKS.map((l) => (
                            <li key={l.href}>
                                <Link href={l.href} className="block rounded-xl px-3 py-3 text-base font-medium text-cocoa hover:bg-honey">
                                    {l.label}
                                </Link>
                            </li>
                        ))}
                        {hydrated && isAdmin(user) && (
                            <li>
                                <Link href="/admin" className="block rounded-xl px-3 py-3 text-base font-medium text-mist hover:bg-honey">
                                    Administration
                                </Link>
                            </li>
                        )}
                    </ul>
                </div>
            )}
        </header>
    );
}
