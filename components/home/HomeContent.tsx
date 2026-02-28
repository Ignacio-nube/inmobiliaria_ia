"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, type Variants, useInView } from "framer-motion";
import { Search, Sparkles, ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { PropertyCard } from "@/components/ui/PropertyCard";
import { Database } from "@/lib/database.types";
import { useParallax } from "@/hooks/useParallax";
import { useTypingPlaceholder } from "@/hooks/useTypingPlaceholder";

type Property = Database['public']['Tables']['properties']['Row'];

const FADE_UP_ANIMATION_VARIANTS: Variants = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0, transition: { type: "spring" } },
};

interface HomeContentProps {
    properties: Property[];
    heroTitle: string;
    heroSubtitle: string;
    cardStyle: string;
    heroImages: string[];
}

// Typing placeholders for AI Search
const SEARCH_PLACEHOLDERS = [
    "Casa con pileta cerca del cerro...",
    "Departamento en el Centro...",
    "Terreno en Yerba Buena...",
    "Local comercial en Yerba Buena...",
    "Casa 3 dormitorios en Barrio Sur..."
];

export function HomeContent({ properties, heroTitle, heroSubtitle, cardStyle, heroImages }: HomeContentProps) {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState("");
    const [isSearching, setIsSearching] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    // Hooks for new animations
    const { ref: heroRef, backgroundY, opacity: heroOpacity } = useParallax(0.35);
    const { placeholder } = useTypingPlaceholder(SEARCH_PLACEHOLDERS);

    useEffect(() => {
        if (heroImages.length <= 1) return;
        const interval = setInterval(() => {
            setCurrentImageIndex((prev) => (prev + 1) % heroImages.length);
        }, 6000);
        return () => clearInterval(interval);
    }, [heroImages.length]);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchQuery.trim()) return;

        setIsSearching(true);
        try {
            const res = await fetch('/api/ai-search', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: searchQuery })
            });
            const data = await res.json();

            // Build query params
            const params = new URLSearchParams();
            if (data.searchTerm) params.set('q', data.searchTerm);
            if (data.propertyType && data.propertyType !== 'all') params.set('type', data.propertyType);
            if (data.minBedrooms && data.minBedrooms !== 'any') params.set('beds', data.minBedrooms);
            if (data.priceRange && data.priceRange !== 'all') params.set('price', data.priceRange);

            router.push(`/propiedades?${params.toString()}`);
        } catch (error) {
            console.error(error);
            // Fallback
            router.push(`/propiedades?q=${encodeURIComponent(searchQuery)}`);
        } finally {
            setIsSearching(false);
        }
    };

    // Helper: Split title html into individual words for staggered entrance
    const rawText = heroTitle.replace(/<[^>]*>?/gm, ''); // rough strip HTML
    // We'll just split by space. Note: If heroTitle requires HTML preservation, 
    // we'd use a more complex parser. Here we assume it's simple text with maybe a <br> or a span.
    // For safety with raw text vs HTML from DB, we'll split basic text.
    const words = rawText.split(' ');

    return (
        <>
            {/* Hero Section with Parallax */}
            <section
                ref={heroRef}
                className="relative w-full min-h-[85vh] flex flex-col items-center justify-center overflow-hidden px-6 pt-24 pb-12"
            >
                {/* Background Image with Parallax, Overlay & Crossfade */}
                <motion.div
                    style={{ y: backgroundY, opacity: heroOpacity, willChange: "transform, opacity" }}
                    className="absolute inset-0 -z-20 bg-black scale-110" // scale up slightly to hide parallax edges
                >
                    <AnimatePresence mode="popLayout">
                        <motion.div
                            key={currentImageIndex}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 1.5, ease: "easeInOut" }}
                            className="absolute inset-0"
                            style={{ willChange: "opacity" }}
                        >
                            <Image
                                src={heroImages[currentImageIndex] || heroImages[0]}
                                alt="Hero Background"
                                fill
                                className="object-cover"
                                priority
                            />
                        </motion.div>
                    </AnimatePresence>
                    <div className="absolute inset-0 bg-black/70 backdrop-blur-[2px]" />
                    <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
                </motion.div>

                <div className="absolute top-0 flex items-center justify-center w-full -z-10">
                    <div className="hidden md:block w-[60vw] h-[50vh] bg-brand/20 rounded-full blur-[120px] translate-y-[-50%]" />
                </div>

                <motion.div
                    initial="hidden"
                    animate="show"
                    viewport={{ once: true }}
                    variants={{
                        hidden: {},
                        show: {
                            transition: {
                                staggerChildren: 0.15,
                            },
                        },
                    }}
                    className="max-w-5xl mx-auto text-center z-10 flex flex-col items-center"
                >
                    <motion.div variants={FADE_UP_ANIMATION_VARIANTS} className="mb-4 md:mb-8 flex items-center gap-2 px-5 py-2.5 rounded-full bg-black/50 border border-white/20 text-white backdrop-blur-md text-sm font-medium shadow-2xl">
                        <Sparkles className="w-4 h-4 text-gold" />
                        <span>Búsqueda Inteligente con IA para Tucumán</span>
                    </motion.div>

                    {/* Word-split Title Animation */}
                    <div className="text-6xl md:text-8xl font-heading font-medium tracking-tighter text-balance mb-6 text-white drop-shadow-xl overflow-hidden flex flex-wrap justify-center gap-x-4 gap-y-2 max-w-[850px]">
                        {words.map((word, i) => (
                            <motion.span
                                key={i}
                                initial={{ opacity: 0, y: 50 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{
                                    duration: 0.8,
                                    delay: i * 0.1, // staggered 0.1s
                                    ease: [0.2, 0.65, 0.3, 0.9],
                                }}
                                style={{ willChange: "transform, opacity" }}
                            >
                                {word}
                            </motion.span>
                        ))}
                    </div>

                    <motion.p
                        variants={FADE_UP_ANIMATION_VARIANTS}
                        className="text-lg md:text-2xl text-white/80 max-w-2xl mb-8 md:mb-14 text-balance leading-relaxed font-light"
                    >
                        {heroSubtitle}
                    </motion.p>

                    {/* AI Search Bar - Extra Glassmorphism */}
                    <form onSubmit={handleSearch} className="w-full relative z-20 mt-4">
                        <motion.div
                            id="tour-search-bar"
                            variants={FADE_UP_ANIMATION_VARIANTS}
                            className="w-full max-w-4xl mx-auto relative group"
                        >
                            {/* Animated Ambient Glow */}
                            <div className="absolute -inset-1 bg-gradient-to-r from-brand via-gold to-brand rounded-full blur-xl opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200 animate-gradient-xy" />

                            <div className="relative flex flex-col sm:flex-row items-center bg-white/10 backdrop-blur-md rounded-[2.5rem] p-2 border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
                                <div className="flex-1 flex items-center w-full px-4 py-2 sm:py-0">
                                    <div className="relative flex items-center justify-center w-10 h-10 rounded-full bg-white/5 mr-3 shrink-0">
                                        <div className="absolute inset-0 bg-brand blur-md opacity-50 rounded-full animate-pulse" />
                                        <Sparkles className="w-5 h-5 text-gold relative z-10" />
                                    </div>

                                    {/* Animated Typing Placeholder */}
                                    <div className="relative w-full overflow-hidden flex items-center">
                                        <input
                                            type="text"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            disabled={isSearching}
                                            className="w-full bg-transparent border-none outline-none py-4 text-white text-lg sm:text-xl font-light disabled:opacity-50 relative z-10 placeholder-transparent"
                                        />
                                        {/* Fake placeholder underneath */}
                                        {!searchQuery && (
                                            <span className="absolute left-0 pointer-events-none text-white/60 text-lg sm:text-xl font-light">
                                                {placeholder}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <button
                                    type="submit"
                                    disabled={isSearching || !searchQuery.trim()}
                                    className="w-full sm:w-auto mt-2 sm:mt-0 bg-white text-black px-8 py-5 sm:py-4 rounded-[2rem] font-semibold text-lg transition-all hover:bg-gold hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:hover:scale-100 disabled:hover:bg-white whitespace-nowrap"
                                >
                                    {isSearching ? (
                                        <>
                                            <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                                            <span>Analizando IA...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Search className="w-5 h-5" />
                                            <span>Descubrir</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    </form>
                </motion.div>
            </section>

            {/* Featured Properties Carousel */}
            {properties.length > 0 && (
                <FeaturedCarousel properties={properties} cardStyle={cardStyle} />
            )}

            {/* Call to Action for Agencies/Owners - Dynamic Premium Redesign */}
            <section id="tour-publish-property" className="py-32 px-6 relative overflow-hidden flex flex-col items-center justify-center border-t border-border/10">
                {/* Advanced Gradient Animated Background */}
                <motion.div
                    animate={{
                        backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                    }}
                    transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 -z-10 bg-[linear-gradient(270deg,#0a192f,#020c1b,#0a192f)] bg-[length:200%_200%]"
                    style={{ willChange: "background-position" }}
                />

                {/* Animated Gradient Orbs */}
                <div className="absolute inset-0 opacity-40 overflow-hidden mix-blend-screen pointer-events-none -z-10">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{
                            opacity: [0.4, 0.7, 0.4],
                            scale: [1, 1.2, 1],
                            x: [0, 80, 0],
                            y: [0, -40, 0]
                        }}
                        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
                        className="hidden md:block absolute top-[-20%] left-[-10%] w-[60vw] h-[60vw] max-w-[800px] max-h-[800px] rounded-full bg-brand/30 blur-[100px]"
                        style={{ willChange: "transform, opacity" }}
                    />
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{
                            opacity: [0.3, 0.6, 0.3],
                            scale: [1, 1.3, 1],
                            x: [0, -60, 0],
                            y: [0, 40, 0]
                        }}
                        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut", delay: 2 }}
                        className="hidden md:block absolute bottom-[-20%] right-[-10%] w-[50vw] h-[50vw] max-w-[600px] max-h-[600px] rounded-full bg-gold/15 blur-[120px]"
                        style={{ willChange: "transform, opacity" }}
                    />
                </div>

                {/* Subtle Grid Pattern Overlay */}
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay pointer-events-none -z-10" />

                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.8, type: "spring" }}
                    className="max-w-4xl mx-auto relative z-10 text-center text-white w-full"
                >
                    <h2 className="text-4xl md:text-5xl font-brand font-bold mb-6 tracking-tight drop-shadow-md">
                        ¿Tenés una propiedad o inmobiliaria?
                    </h2>
                    <p className="text-lg md:text-xl text-zinc-300 mb-10 max-w-2xl mx-auto text-balance">
                        Publicá tus propiedades en Ignacio Propiedades y llegá a más clientes. Es fácil, rápido y con la mejor tecnología del mercado.
                    </p>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 }}
                        className="flex flex-col sm:flex-row gap-4 justify-center"
                    >
                        <Link
                            href="/publicar"
                            className="relative overflow-hidden group bg-white text-black px-8 py-4 rounded-full font-bold text-lg transition-all shadow-[0_0_40px_rgba(255,255,255,0.1)] hover:shadow-[0_0_60px_rgba(255,255,255,0.2)] hover:scale-105 active:scale-95"
                        >
                            <span className="relative z-10">Publicar Propiedad</span>
                            <div className="absolute inset-0 h-full w-full bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
                        </Link>
                        <Link
                            href="/contacto"
                            className="bg-white/5 backdrop-blur-xl text-white border border-white/20 px-8 py-4 rounded-full font-medium text-lg hover:bg-white/10 hover:border-white/30 transition-all active:scale-95"
                        >
                            Contactar Ventas
                        </Link>
                    </motion.div>
                </motion.div>
            </section>
        </>
    );
}

// ─────────────────────────────────────────────────────
// Featured Properties Carousel
// ─────────────────────────────────────────────────────
function FeaturedCarousel({ properties, cardStyle }: { properties: Property[]; cardStyle: string }) {
    const [active, setActive] = useState(0);
    const total = properties.length;
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // InView tracking for Stagger container
    const carouselRef = useRef(null);
    const isInView = useInView(carouselRef, { once: true, margin: "-100px" });

    const goTo = useCallback((idx: number) => {
        setActive(((idx % total) + total) % total);
    }, [total]);

    const startAuto = useCallback(() => {
        if (intervalRef.current) clearInterval(intervalRef.current);
        intervalRef.current = setInterval(() => {
            setActive(prev => (prev + 1) % total);
        }, 5000);
    }, [total]);

    useEffect(() => {
        if (total > 1) startAuto();
        return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
    }, [startAuto, total]);

    const pause = () => { if (intervalRef.current) clearInterval(intervalRef.current); };
    const resume = () => { if (total > 1) startAuto(); };

    return (
        <section id="tour-properties-carousel" className="py-24 px-6 relative overflow-hidden" ref={carouselRef}>
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                    transition={{ duration: 0.6 }}
                    className="flex justify-between items-end mb-10"
                    style={{ willChange: "transform, opacity" }}
                >
                    <div>
                        <h2 className="text-3xl md:text-5xl font-heading font-medium mb-3 tracking-tight text-foreground">
                            Propiedades Destacadas
                        </h2>
                        <p className="text-muted-foreground text-lg">
                            Las mejores oportunidades en Tucumán seleccionadas para vos.
                        </p>
                    </div>
                    <Link
                        href="/propiedades"
                        className="hidden md:flex text-brand font-medium hover:underline items-center gap-1 group text-sm"
                    >
                        Ver todas <Search className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" />
                    </Link>
                </motion.div>

                {/* Carousel Track — 3 visible on desktop, 1 on mobile */}
                <div
                    className="relative"
                    onMouseEnter={pause}
                    onMouseLeave={resume}
                >
                    {/* Cards grid wrapper */}
                    <motion.div
                        variants={{
                            hidden: { opacity: 0 },
                            show: {
                                opacity: 1,
                                transition: { staggerChildren: 0.15 },
                            },
                        }}
                        initial="hidden"
                        animate={isInView ? "show" : "hidden"}
                        className="grid grid-cols-1 md:grid-cols-3 gap-6"
                    >
                        {Array.from({ length: Math.min(3, total) }).map((_, slot) => {
                            const propIdx = (active + slot) % total;
                            const property = properties[propIdx];
                            return (
                                <div key={slot} className={slot > 0 ? "hidden md:block" : ""}>
                                    <PropertyCard property={property} cardStyle={cardStyle} index={slot} />
                                </div>
                            );
                        })}
                    </motion.div>

                    {/* Navigation Arrows (desktop) */}
                    {total > 1 && (
                        <>
                            <button
                                onClick={() => goTo(active - 1)}
                                className="hidden md:flex absolute -left-6 top-1/2 -translate-y-1/2 w-12 h-12 items-center justify-center rounded-full bg-background/80 border border-border shadow-lg hover:bg-background transition-all hover:scale-110 z-10"
                                aria-label="Anterior"
                            >
                                <ChevronLeft className="w-5 h-5 text-foreground" />
                            </button>
                            <button
                                onClick={() => goTo(active + 1)}
                                className="hidden md:flex absolute -right-6 top-1/2 -translate-y-1/2 w-12 h-12 items-center justify-center rounded-full bg-background/80 border border-border shadow-lg hover:bg-background transition-all hover:scale-110 z-10"
                                aria-label="Siguiente"
                            >
                                <ChevronRight className="w-5 h-5 text-foreground" />
                            </button>
                        </>
                    )}
                </div>

                {/* Dots + mobile nav */}
                {total > 1 && (
                    <div className="flex items-center justify-center gap-4 mt-8">
                        <button
                            onClick={() => goTo(active - 1)}
                            className="md:hidden p-2 rounded-full border border-border hover:bg-muted transition-colors"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <div className="flex gap-2">
                            {properties.map((_, i) => (
                                <button
                                    key={i}
                                    onClick={() => goTo(i)}
                                    className={`rounded-full transition-all duration-300 ${i === active
                                        ? "w-6 h-2 bg-brand"
                                        : "w-2 h-2 bg-border hover:bg-muted-foreground"
                                        }`}
                                    aria-label={`Ir a propiedad ${i + 1}`}
                                />
                            ))}
                        </div>
                        <button
                            onClick={() => goTo(active + 1)}
                            className="md:hidden p-2 rounded-full border border-border hover:bg-muted transition-colors"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                )}

                {/* Mobile: view all */}
                <div className="mt-6 flex justify-center md:hidden">
                    <Link
                        href="/propiedades"
                        className="px-6 py-3 border border-border rounded-full font-medium text-sm hover:bg-muted transition-colors"
                    >
                        Ver todas las propiedades
                    </Link>
                </div>
            </div>
        </section>
    );
}
