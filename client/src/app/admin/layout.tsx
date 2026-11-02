"use client";

import { LayoutDashboard, Package, ReceiptText, Store, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FoodyLogo } from "@/components/foody/logo";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { cn } from "@/lib/utils/cn";

const NAV = [
    { href: "/admin", label: "Tableau de bord", icon: LayoutDashboard },
    { href: "/admin/commandes", label: "Commandes", icon: ReceiptText },
    { href: "/admin/produits", label: "Produits", icon: Package },
    { href: "/admin/equipe", label: "Clients & équipe", icon: Users },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const { ready } = useRequireAuth({ admin: true });
    const pathname = usePathname();

    if (!ready) return <div className="min-h-dvh bg-cream" />;

    return (
        <div className="min-h-dvh bg-cream md:flex">
            <aside className="border-b border-butter bg-white md:sticky md:top-0 md:h-dvh md:w-60 md:shrink-0 md:border-r md:border-b-0">
                <div className="flex items-center justify-between px-4 py-4 md:block md:px-5 md:py-6">
                    <FoodyLogo />
                    <Link href="/" className="inline-flex items-center gap-1.5 text-xs font-medium text-mist hover:text-cocoa md:mt-3">
                        <Store className="size-3.5" /> Voir la boutique
                    </Link>
                </div>
                <nav className="flex gap-1 overflow-x-auto px-3 pb-3 scrollbar-hide md:flex-col md:px-3">
                    {NAV.map((n) => {
                        const active = n.href === "/admin" ? pathname === "/admin" : pathname.startsWith(n.href);
                        return (
                            <Link
                                key={n.href}
                                href={n.href}
                                className={cn(
                                    "flex shrink-0 items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                                    active ? "bg-sun text-cocoa" : "text-cocoa/70 hover:bg-honey hover:text-cocoa",
                                )}
                            >
                                <n.icon className="size-4" /> {n.label}
                            </Link>
                        );
                    })}
                </nav>
            </aside>
            <main className="min-w-0 flex-1 px-4 py-6 md:px-8 md:py-8">{children}</main>
        </div>
    );
}
