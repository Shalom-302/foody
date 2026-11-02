import type { Metadata, Viewport } from "next";
import { Inter, Poppins } from "next/font/google";
import { Providers } from "@/components/providers";
import { cn } from "@/lib/utils/cn";
import "../styles/globals.css";
import { BRAND } from "@/lib/brand";

const inter = Inter({
    subsets: ["latin"],
    display: "swap",
    variable: "--font-inter",
});

const poppins = Poppins({
    subsets: ["latin"],
    weight: ["400", "500", "600", "700"],
    display: "swap",
    variable: "--font-poppins",
});

export const metadata: Metadata = {
    title: {
        default: `${BRAND.full} · Jus artisanaux et mignardises à Abidjan`,
        template: `%s · ${BRAND.full}`,
    },
    description:
        "Jus de bissap, citronnades, mignardises et amuse-bouches faits maison, livrés dans tout Abidjan.",
    manifest: "/manifest.json",
    openGraph: {
        title: BRAND.full,
        description: "Une petite douceur pour illuminer votre journée.",
        locale: "fr_CI",
        type: "website",
    },
};

export const viewport: Viewport = {
    themeColor: "#FFFDF5",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
    return (
        <html lang="fr" className="scroll-smooth">
            <body className={cn(inter.variable, poppins.variable, "min-h-dvh bg-cream text-cocoa antialiased")}>
                <Providers>{children}</Providers>
            </body>
        </html>
    );
}
