import Link from "next/link";
import { FoodyMark } from "@/components/foody/logo";
import { BRAND } from "@/lib/brand";

export function Footer() {
    return (
        <footer className="mt-24 bg-cocoa text-cream">
            <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 md:grid-cols-4 md:px-6">
                <div className="md:col-span-2">
                    <div className="flex items-center gap-2.5">
                        <FoodyMark />
                        <span className="font-display text-xl font-bold">{BRAND.full}</span>
                    </div>
                    <p className="mt-4 max-w-sm text-sm leading-relaxed text-cream/70">
                        Jus artisanaux, mignardises et amuse-bouches préparés chaque jour avec amour, à Abidjan.
                    </p>
                </div>
                <div>
                    <h3 className="text-sm font-semibold tracking-wide text-sun uppercase">Boutique</h3>
                    <ul className="mt-4 space-y-2 text-sm text-cream/80">
                        <li><Link href="/boutique?categorie=jus-de-bissap" className="hover:text-sun">Jus de bissap</Link></li>
                        <li><Link href="/boutique?categorie=jus-de-citron" className="hover:text-sun">Jus de citron</Link></li>
                        <li><Link href="/boutique?categorie=mignardises" className="hover:text-sun">Mignardises</Link></li>
                        <li><Link href="/boutique?categorie=amuse-bouches" className="hover:text-sun">Amuse-bouches salés</Link></li>
                        <li><Link href="/boutique?categorie=coffrets-gourmands" className="hover:text-sun">Coffrets gourmands</Link></li>
                    </ul>
                </div>
                <div>
                    <h3 className="text-sm font-semibold tracking-wide text-sun uppercase">Commander</h3>
                    <ul className="mt-4 space-y-2 text-sm text-cream/80">
                        <li>Livraison dans tout Abidjan</li>
                        <li>Paiement à la livraison</li>
                        <li><Link href="/mon-compte" className="hover:text-sun">Suivre ma commande</Link></li>
                    </ul>
                </div>
            </div>
            <div className="border-t border-cream/10 py-5 text-center text-xs text-cream/50">
                © {new Date().getFullYear()} {BRAND.full} · Abidjan, Côte d&apos;Ivoire
            </div>
        </footer>
    );
}
