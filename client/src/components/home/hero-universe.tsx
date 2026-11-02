"use client";

import { ArrowDown, ArrowRight } from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { FoodyButton } from "@/components/foody/button";
import { gsap, prefersReducedMotion, useGSAP } from "@/lib/gsap";
import { cn } from "@/lib/utils/cn";
import { BRAND } from "@/lib/brand";

const ObjectUniverse = dynamic(() => import("@/components/3d/object-universe"), { ssr: false });

/** WebGL scene only where it will run smoothly; everyone else gets the photo collage. */
function canRun3D(): boolean {
    if (prefersReducedMotion()) return false;
    const nav = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } };
    if (nav.connection?.saveData) return false;
    if (nav.deviceMemory !== undefined && nav.deviceMemory < 4) return false;
    if (nav.hardwareConcurrency !== undefined && nav.hardwareConcurrency < 4) return false;
    try {
        const c = document.createElement("canvas");
        return !!(c.getContext("webgl2") || c.getContext("webgl"));
    } catch {
        return false;
    }
}

const CHAPTERS = [
    { eyebrow: "Bissap", title: "Des fleurs d'hibiscus, infusées lentement.", text: "Une robe rubis, une pointe de menthe, servi glacé." },
    { eyebrow: "Citron", title: "Des citrons pressés chaque matin.", text: "Vif, frais, juste assez sucré. Le soleil en bouteille." },
    { eyebrow: "Mignardises", title: "Des petites bouchées, de grandes émotions.", text: "Petits fours, macarons, mini-tartelettes : faits main, à croquer en une bouchée." },
];

export function HeroUniverse() {
    const section = useRef<HTMLElement>(null);
    const progress = useRef(0);
    const [mode, setMode] = useState<"3d" | "static" | null>(null);
    const [ready, setReady] = useState(false);

    useEffect(() => setMode(canRun3D() ? "3d" : "static"), []);

    useGSAP(
        () => {
            if (!mode) return;
            // Intro: the headline rises word by word.
            gsap.from("[data-intro]", { y: 40, autoAlpha: 0, duration: 1, ease: "power3.out", stagger: 0.08, delay: 0.15 });
            if (mode !== "3d") return;

            const tl = gsap.timeline({
                defaults: { ease: "power2.inOut" },
                scrollTrigger: {
                    trigger: section.current,
                    start: "top top",
                    end: "bottom bottom",
                    scrub: 1.2,
                    onUpdate: (self) => {
                        progress.current = self.progress;
                    },
                },
            });
            tl.to("[data-chapter='intro']", { autoAlpha: 0, y: -80, scale: 0.96, duration: 1 });
            tl.to("[data-chapter-hint]", { autoAlpha: 0, duration: 0.4 }, 0);
            CHAPTERS.forEach((_, i) => {
                const el = `[data-chapter='${i}']`;
                tl.fromTo(el, { autoAlpha: 0, y: 80 }, { autoAlpha: 1, y: 0, duration: 1 }).to(el, { autoAlpha: 0, y: -80, duration: 1 }, "+=1.2");
            });
            tl.fromTo("[data-chapter='outro']", { autoAlpha: 0, y: 60 }, { autoAlpha: 1, y: 0, duration: 1 });
        },
        { scope: section, dependencies: [mode] },
    );

    const intro = (
        <div className="max-w-3xl">
            <p data-intro className="text-xs font-semibold tracking-[0.3em] text-cocoa/70 uppercase">{BRAND.full} · Abidjan</p>
            <h1 className="mt-5 text-[2.6rem] leading-[1.02] font-bold tracking-tight text-cocoa sm:text-6xl lg:text-7xl">
                <span data-intro className="block">Une petite douceur</span>
                <span data-intro className="block">pour illuminer</span>
                <span data-intro className="block text-sun-dark">votre journée.</span>
            </h1>
            <p data-intro className="mt-6 max-w-md text-lg text-cocoa/75">
                Découvrez nos jus frais et nos gourmandises préparés avec amour.
            </p>
            <div data-intro className="mt-8 flex flex-col gap-3 sm:flex-row">
                <FoodyButton asChild size="lg">
                    <Link href="/boutique">Découvrir nos produits <ArrowRight /></Link>
                </FoodyButton>
                <FoodyButton asChild size="lg" variant="outline">
                    <Link href="/boutique?dispo=1">Commander maintenant</Link>
                </FoodyButton>
            </div>
        </div>
    );

    if (mode !== "3d") {
        return (
            <section ref={section} className="relative overflow-hidden">
                <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 pt-6 pb-16 md:grid-cols-[1.1fr_1fr] md:px-6 md:pt-12">
                    {intro}
                    <CutoutCollage />
                </div>
            </section>
        );
    }

    return (
        <section ref={section} className="relative h-[420vh]" aria-label="Présentation FOODY">
            <div className="sticky top-0 h-dvh overflow-hidden">
                <div aria-hidden className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,#FFF6D9_0%,#FFFDF5_65%)]" />
                <div className={cn("absolute inset-0 transition-opacity duration-1000", ready ? "opacity-100" : "opacity-0")}>
                    <ObjectUniverse progress={progress} onReady={() => setReady(true)} />
                </div>
                {/* Text keeps contrast over the photos. */}
                <div aria-hidden className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,253,245,0.9)_0%,rgba(255,253,245,0.75)_45%,transparent_70%)] md:bg-[linear-gradient(90deg,rgba(255,253,245,0.96)_0%,rgba(255,253,245,0.85)_32%,transparent_55%)]" />

                <div className="pointer-events-none absolute inset-0 mx-auto flex max-w-6xl items-start px-4 pt-24 md:items-center md:px-6 md:pt-0">
                    <div data-chapter="intro" className="pointer-events-auto">{intro}</div>
                    {CHAPTERS.map((c, i) => (
                        <div key={c.eyebrow} data-chapter={i} className="invisible absolute max-w-2xl px-4 md:px-0">
                            <p className="text-xs font-semibold tracking-[0.3em] text-sun-dark uppercase">0{i + 1} · {c.eyebrow}</p>
                            <h2 className="mt-4 text-4xl leading-[1.05] font-bold tracking-tight text-cocoa sm:text-6xl">{c.title}</h2>
                            <p className="mt-5 max-w-md text-lg text-cocoa/75">{c.text}</p>
                        </div>
                    ))}
                    <div data-chapter="outro" className="pointer-events-auto invisible absolute max-w-2xl px-4 md:px-0">
                        <h2 className="text-4xl leading-[1.05] font-bold tracking-tight sm:text-6xl">Fait maison. Livré frais.</h2>
                        <FoodyButton asChild size="lg" className="mt-8">
                            <Link href="/boutique">Je commande <ArrowRight /></Link>
                        </FoodyButton>
                    </div>
                </div>

                <div data-chapter-hint className="pointer-events-none absolute bottom-6 left-1/2 flex -translate-x-1/2 flex-col items-center gap-2 text-xs font-medium tracking-widest text-cocoa/60 uppercase">
                    Défiler
                    <ArrowDown className="size-4 animate-bounce" />
                </div>
            </div>
        </section>
    );
}

/** Static fallback (reduced motion, small devices): the same cut-outs, composed. */
function CutoutCollage() {
    const items = [
        { name: "macarons-trio", cls: "left-[6%] top-[4%] w-[42%] rotate-[-6deg]" },
        { name: "glass-bissap", cls: "right-[4%] top-0 w-[34%] rotate-[5deg]" },
        { name: "tartlet-blueberry", cls: "left-[20%] bottom-[2%] w-[44%] rotate-[4deg]" },
        { name: "lemon-halves", cls: "right-[2%] bottom-[14%] w-[38%] rotate-[-8deg]" },
        { name: "hibiscus", cls: "left-0 top-[42%] w-[26%] rotate-[12deg]" },
    ];
    return (
        <div className="relative aspect-square w-full">
            {items.map((i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                    key={i.name}
                    data-intro
                    src={`/cutouts/${i.name}.webp`}
                    alt=""
                    className={cn("absolute drop-shadow-[0_18px_24px_rgba(73,61,38,0.25)]", i.cls)}
                />
            ))}
        </div>
    );
}
