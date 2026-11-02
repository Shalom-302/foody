import { HeroUniverse } from "@/components/home/hero-universe";
import {
    BrandStory,
    CategoryShowcase,
    ClosingCta,
    Craft,
    PopularProducts,
    Promo,
    Testimonials,
} from "@/components/home/sections";

export default function HomePage() {
    return (
        <>
            <HeroUniverse />
            <BrandStory />
            <CategoryShowcase />
            <PopularProducts />
            <Promo />
            <Craft />
            <Testimonials />
            <ClosingCta />
        </>
    );
}
