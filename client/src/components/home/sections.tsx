"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowRight, HandHeart, Quote, Sparkles, Sun } from "lucide-react";
import Link from "next/link";
import { useRef } from "react";
import { FoodyButton } from "@/components/foody/button";
import { ProductCard, ProductCardSkeleton } from "@/components/products/product-card";
import { ProductVisual } from "@/components/products/product-visual";
import { gsap, prefersReducedMotion, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { PHOTOS, unsplash } from "@/lib/photos";
import { catalogApi } from "@/services/foody";

/**
 * Scroll choreography for a section: [data-reveal] children rise in by batch,
 * [data-parallax="<speed>"] images drift against the scroll.
 */
function useScrollFx(deps: unknown[] = []) {
    const scope = useRef<HTMLElement>(null);
    useGSAP(
        () => {
            if (prefersReducedMotion()) return;
            gsap.set("[data-reveal]", { autoAlpha: 0, y: 48 });
            ScrollTrigger.batch("[data-reveal]", {
                start: "top 88%",
                once: true,
                onEnter: (els) =>
                    gsap.to(els, { autoAlpha: 1, y: 0, duration: 0.9, ease: "power3.out", stagger: 0.1, overwrite: true }),
            });
            gsap.utils.toArray<HTMLElement>("[data-parallax]").forEach((el) => {
                const speed = Number(el.dataset.parallax) || 0.15;
                gsap.fromTo(
                    el,
                    { yPercent: -speed * 100 },
                    {
                        yPercent: speed * 100,
                        ease: "none",
                        scrollTrigger: { trigger: el.parentElement, start: "top bottom", end: "bottom top", scrub: true },
                    },
                );
            });
        },
        { scope, dependencies: deps, revertOnUpdate: true },
    );
    return scope;
}

function SectionTitle({ eyebrow, title, children }: { eyebrow: string; title: string; children?: React.ReactNode }) {
    return (
        <div className="max-w-2xl" data-reveal>
            <p className="text-xs font-semibold tracking-[0.3em] text-sun-dark uppercase">{eyebrow}</p>
            <h2 className="mt-3 text-4xl leading-[1.05] font-bold tracking-tight text-cocoa md:text-5xl">{title}</h2>
            {children && <p className="mt-5 text-lg leading-relaxed text-mist">{children}</p>}
        </div>
    );
}

function Photo({ id, alt, className, speed = 0.12, w = 1000, h }: { id: string; alt: string; className?: string; speed?: number; w?: number; h?: number }) {
    return (
        <div className={`overflow-hidden ${className ?? ""}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img data-parallax={speed} src={unsplash(id, w, h)} alt={alt} loading="lazy" className="h-[124%] w-full -translate-y-[12%] object-cover" />
        </div>
    );
}

export function BrandStory() {
    const scope = useScrollFx();
    const values = [
        { icon: Sun, title: "Fraîcheur", text: "Pressé et préparé le jour même, jamais de concentré." },
        { icon: HandHeart, title: "Qualité artisanale", text: "Des recettes familiales, faites à la main en petites séries." },
        { icon: Sparkles, title: "Gourmandise", text: "Le juste sucre, beaucoup de goût, et l'envie d'y revenir." },
    ];
    return (
        <section ref={scope} className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-20 md:grid-cols-2 md:px-6 md:py-32">
            <div className="relative">
                <Photo id={PHOTOS.lemonadeJar} alt="Citronnade à la menthe" className="aspect-[4/5] rounded-[2rem] shadow-lift" w={900} h={1100} />
                <div data-reveal className="absolute -right-4 -bottom-8 w-2/5 md:-right-10">
                    <Photo id={PHOTOS.hibiscusFlower} alt="Fleur d'hibiscus" className="aspect-square rounded-3xl border-4 border-cream shadow-lift" speed={0.25} w={500} h={500} />
                </div>
            </div>
            <div>
                <SectionTitle eyebrow="La maison FOODY" title="Une histoire de famille, servie bien fraîche.">
                    Ce qui a commencé dans la cuisine familiale, entre une marmite de bissap et des plateaux de
                    mignardises, devient aujourd&apos;hui une boutique. Même exigence, même tendresse.
                </SectionTitle>
                <ul className="mt-10 space-y-5">
                    {values.map((v) => (
                        <li key={v.title} data-reveal className="flex gap-4">
                            <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-butter text-cocoa">
                                <v.icon className="size-6" />
                            </span>
                            <div>
                                <h3 className="font-semibold text-cocoa">{v.title}</h3>
                                <p className="mt-1 text-sm leading-relaxed text-mist">{v.text}</p>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        </section>
    );
}

export function CategoryShowcase() {
    const { data: categories } = useQuery({ queryKey: ["categories"], queryFn: catalogApi.categories });
    const scope = useRef<HTMLElement>(null);
    const track = useRef<HTMLDivElement>(null);

    // Desktop: the section pins and the cards slide horizontally with the scroll.
    useGSAP(
        () => {
            if (!categories?.length || prefersReducedMotion()) return;
            const mm = gsap.matchMedia();
            mm.add("(min-width: 768px)", () => {
                const el = track.current!;
                const distance = () => el.scrollWidth - el.clientWidth + 48;
                gsap.to(el, {
                    x: () => -distance(),
                    ease: "none",
                    scrollTrigger: {
                        trigger: scope.current,
                        start: "top top",
                        end: () => `+=${distance()}`,
                        scrub: 1,
                        pin: true,
                        invalidateOnRefresh: true,
                    },
                });
                gsap.utils.toArray<HTMLElement>("[data-cat-img]").forEach((img) =>
                    gsap.fromTo(img, { scale: 1.25 }, { scale: 1, ease: "none", scrollTrigger: { trigger: scope.current, start: "top top", end: () => `+=${distance()}`, scrub: true } }),
                );
                // The pin adds scroll length: re-measure triggers created before it.
                requestAnimationFrame(() => {
                    ScrollTrigger.sort();
                    ScrollTrigger.refresh();
                });
            });
            return () => mm.revert();
        },
        { scope, dependencies: [categories?.length] },
    );

    return (
        <section ref={scope} className="overflow-hidden bg-butter/50 py-20 md:flex md:h-dvh md:flex-col md:justify-center md:py-0">
            <div className="mx-auto w-full max-w-6xl px-4 md:px-6">
                <div className="flex items-end justify-between gap-6">
                    <div className="max-w-2xl">
                        <p className="text-xs font-semibold tracking-[0.3em] text-sun-dark uppercase">Nos univers</p>
                        <h2 className="mt-3 text-4xl leading-[1.05] font-bold tracking-tight md:text-5xl">Que vous fait envie aujourd&apos;hui ?</h2>
                    </div>
                    <Link href="/boutique" className="hidden items-center gap-1 text-sm font-semibold hover:underline sm:flex">
                        Toute la boutique <ArrowRight className="size-4" />
                    </Link>
                </div>
            </div>
            <div ref={track} className="mt-10 flex snap-x gap-4 overflow-x-auto px-4 pb-2 scrollbar-hide md:gap-6 md:overflow-visible md:px-[max(1.5rem,calc((100vw-72rem)/2+1.5rem))]">
                {(categories ?? Array.from({ length: 5 }, () => null)).map((c, i) =>
                    c ? (
                        <Link
                            key={c.id}
                            href={`/boutique?categorie=${c.slug}`}
                            className="group relative block aspect-[3/4] w-64 shrink-0 snap-start overflow-hidden rounded-[2rem] shadow-lift md:w-[22rem]"
                        >
                            <div data-cat-img className="size-full transition-transform duration-700 group-hover:scale-105">
                                <ProductVisual imageUrl={c.image_url} categorySlug={c.slug} name={c.name} />
                            </div>
                            <div className="absolute inset-0 bg-gradient-to-t from-cocoa/80 via-cocoa/10 to-transparent" />
                            <div className="absolute inset-x-0 bottom-0 p-6 text-cream">
                                <p className="text-xs tracking-[0.25em] text-sun uppercase">0{i + 1}</p>
                                <h3 className="mt-1 font-display text-2xl font-semibold">{c.name}</h3>
                                {c.description && <p className="mt-1 line-clamp-2 text-sm text-cream/80">{c.description}</p>}
                            </div>
                        </Link>
                    ) : (
                        <div key={i} className="aspect-[3/4] w-64 shrink-0 animate-pulse rounded-[2rem] bg-white/70 md:w-[22rem]" />
                    ),
                )}
            </div>
        </section>
    );
}

export function PopularProducts() {
    const { data, isLoading } = useQuery({
        queryKey: ["products", { featured: true }],
        queryFn: () => catalogApi.products({ featured: true, size: 4 }),
    });
    const products = data?.items ?? [];
    const scope = useScrollFx([products.length]);
    return (
        <section ref={scope} className="mx-auto max-w-6xl px-4 py-20 md:px-6 md:py-32">
            <div className="flex items-end justify-between gap-6">
                <SectionTitle eyebrow="Les préférés" title="Nos produits populaires" />
                <Link href="/boutique" className="hidden items-center gap-1 text-sm font-semibold hover:underline sm:flex">
                    Voir tout <ArrowRight className="size-4" />
                </Link>
            </div>
            <div className="mt-12 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
                {isLoading
                    ? Array.from({ length: 4 }).map((_, i) => <ProductCardSkeleton key={i} />)
                    : products.map((p) => (
                          <div key={p.id} data-reveal>
                              <ProductCard product={p} />
                          </div>
                      ))}
            </div>
        </section>
    );
}

export function Promo() {
    const scope = useScrollFx();
    return (
        <section ref={scope} className="mx-auto max-w-6xl px-4 md:px-6">
            <div className="relative overflow-hidden rounded-[2.5rem] text-cream">
                <Photo id={PHOTOS.petitFoursStand} alt="Présentoir de mignardises" className="absolute inset-0" speed={0.18} w={1600} h={900} />
                <div className="absolute inset-0 bg-gradient-to-r from-cocoa/90 via-cocoa/60 to-transparent" />
                <div className="relative px-6 py-20 md:px-14 md:py-28">
                    <p data-reveal className="text-xs font-semibold tracking-[0.3em] text-sun uppercase">Coffrets gourmands</p>
                    <h2 data-reveal className="mt-4 max-w-lg text-4xl leading-[1.05] font-bold md:text-6xl">Le cadeau qui fait toujours plaisir.</h2>
                    <p data-reveal className="mt-5 max-w-md text-lg text-cream/80">
                        Anniversaire, bureau, réception : jus frais et mignardises réunis, prêts à offrir ou à partager.
                    </p>
                    <div data-reveal>
                        <FoodyButton asChild size="lg" className="mt-8">
                            <Link href="/boutique?categorie=coffrets-gourmands">Découvrir les coffrets <ArrowRight /></Link>
                        </FoodyButton>
                    </div>
                </div>
            </div>
        </section>
    );
}

export function Craft() {
    const scope = useScrollFx();
    const steps = [
        { id: PHOTOS.driedHibiscus, title: "Hibiscus choisi", text: "Des fleurs de bissap sélectionnées, infusées lentement pour une robe rubis." },
        { id: PHOTOS.lemonSlicesFlat, title: "Citrons pressés", text: "Pressés chaque matin, pour une acidité vive et nette." },
        { id: PHOTOS.fruitTartlets, title: "Façonnées à la main", text: "Tartelettes, macarons et petits fours montés pièce par pièce, chaque jour." },
    ];
    return (
        <section ref={scope} id="savoir-faire" className="mx-auto max-w-6xl scroll-mt-24 px-4 py-20 md:px-6 md:py-32">
            <SectionTitle eyebrow="Savoir-faire" title="Le goût du fait main, à chaque étape.">
                Pas de conservateurs, pas d&apos;arômes artificiels : des fruits, des fleurs, du temps et beaucoup
                d&apos;attention.
            </SectionTitle>
            <ol className="mt-14 grid gap-6 md:grid-cols-3">
                {steps.map((s, i) => (
                    <li key={s.title} data-reveal className={i === 1 ? "md:mt-16" : ""}>
                        <Photo id={s.id} alt={s.title} className="aspect-[4/5] rounded-[2rem] shadow-soft" speed={0.1 + i * 0.05} w={700} h={875} />
                        <div className="mt-5 flex items-baseline gap-3">
                            <span className="font-display text-3xl font-bold text-sun">0{i + 1}</span>
                            <h3 className="text-xl font-semibold">{s.title}</h3>
                        </div>
                        <p className="mt-2 text-sm leading-relaxed text-mist">{s.text}</p>
                    </li>
                ))}
            </ol>
        </section>
    );
}

// Placeholder copy: replace with real, consented customer reviews before launch.
const TESTIMONIALS = [
    { quote: "Le bissap a le goût de celui de ma grand-mère. Livré bien frais, en plus !", name: "Cliente, Cocody" },
    { quote: "Le plateau de mignardises a disparu en dix minutes au bureau.", name: "Client, Plateau" },
    { quote: "Le coffret découverte est devenu mon cadeau préféré.", name: "Cliente, Marcory" },
];

export function Testimonials() {
    const scope = useScrollFx();
    return (
        <section ref={scope} className="bg-butter/50 py-20 md:py-32">
            <div className="mx-auto max-w-6xl px-4 md:px-6">
                <SectionTitle eyebrow="Ils en parlent" title="Des douceurs qui font sourire." />
                <div className="mt-12 grid gap-5 md:grid-cols-3">
                    {TESTIMONIALS.map((t, i) => (
                        <figure key={i} data-reveal className="rounded-[2rem] bg-white p-7 shadow-soft">
                            <Quote className="size-7 text-sun" />
                            <blockquote className="mt-4 text-lg leading-relaxed text-cocoa">« {t.quote} »</blockquote>
                            <figcaption className="mt-5 text-sm text-mist">{t.name}</figcaption>
                        </figure>
                    ))}
                </div>
            </div>
        </section>
    );
}

export function ClosingCta() {
    const scope = useScrollFx();
    return (
        <section ref={scope} className="mx-auto max-w-6xl px-4 pt-20 md:px-6 md:pt-32">
            <div className="relative overflow-hidden rounded-[2.5rem] bg-sun">
                <Photo id={PHOTOS.lemonsPile} alt="" className="absolute inset-y-0 right-0 hidden w-1/2 md:block" speed={0.15} w={900} h={900} />
                <div className="absolute inset-0 hidden bg-gradient-to-r from-sun via-sun/90 to-transparent md:block" />
                <div className="relative px-6 py-16 md:px-14 md:py-24">
                    <h2 data-reveal className="max-w-md text-4xl leading-[1.05] font-bold text-cocoa md:text-6xl">Envie d&apos;une pause fraîcheur ?</h2>
                    <p data-reveal className="mt-5 max-w-sm text-lg text-cocoa/80">Commandez en deux minutes, on s&apos;occupe du reste.</p>
                    <div data-reveal>
                        <FoodyButton asChild size="lg" variant="dark" className="mt-8">
                            <Link href="/boutique">Je commande <ArrowRight /></Link>
                        </FoodyButton>
                    </div>
                </div>
            </div>
        </section>
    );
}
