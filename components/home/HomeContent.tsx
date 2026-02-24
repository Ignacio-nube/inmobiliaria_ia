"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { motion, type Variants } from "framer-motion";
import { Search, MapPin, Sparkles } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { PropertyCard } from "@/components/ui/PropertyCard";
import { Database } from "@/lib/database.types";

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
    heroImgUrl: string;
}

export function HomeContent({ properties, heroTitle, heroSubtitle, cardStyle, heroImgUrl }: HomeContentProps) {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState("");
    const [isSearching, setIsSearching] = useState(false);

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

    return (
        <>
            {/* Hero Section */}
            <section className="relative w-full min-h-[92vh] flex flex-col items-center justify-center overflow-hidden px-6 pt-24 pb-12">
                {/* Background Image with Parallax & Overlay */}
                <motion.div
                    initial={{ scale: 1.1, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 1.2, ease: "easeOut" }}
                    className="absolute inset-0 -z-20"
                >
                    <Image
                        src={heroImgUrl}
                        alt="Hero Background"
                        fill
                        className="object-cover"
                        priority
                    />
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" />
                    <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
                </motion.div>

                <div className="absolute top-0 flex items-center justify-center w-full -z-10">
                    <div className="w-[60vw] h-[50vh] bg-brand/20 rounded-full blur-[120px] translate-y-[-50%]" />
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
                    <motion.div variants={FADE_UP_ANIMATION_VARIANTS} className="mb-8 flex items-center gap-2 px-5 py-2.5 rounded-full bg-black/40 border border-white/10 text-white backdrop-blur-md text-sm font-medium shadow-2xl">
                        <Sparkles className="w-4 h-4 text-gold" />
                        <span>Búsqueda Inteligente con IA para Tucumán</span>
                    </motion.div>

                    <motion.h1
                        variants={FADE_UP_ANIMATION_VARIANTS}
                        className="text-6xl md:text-8xl font-heading font-medium tracking-tighter text-balance mb-6 text-white drop-shadow-xl"
                        dangerouslySetInnerHTML={{ __html: heroTitle }}
                    />

                    <motion.p
                        variants={FADE_UP_ANIMATION_VARIANTS}
                        className="text-lg md:text-2xl text-white/80 max-w-2xl mb-14 text-balance leading-relaxed font-light"
                    >
                        {heroSubtitle}
                    </motion.p>

                    {/* AI Search Bar */}
                    <form onSubmit={handleSearch} className="w-full relative z-20">
                        <motion.div
                            variants={FADE_UP_ANIMATION_VARIANTS}
                            className="w-full max-w-3xl mx-auto flex flex-col md:flex-row items-center gap-2 relative shadow-2xl"
                        >
                            <div className="absolute -inset-2 bg-gradient-to-r from-brand/40 to-gold/40 rounded-3xl blur-xl opacity-50" />
                            <div className="relative flex w-full flex-col md:flex-row bg-white/10 dark:bg-black/40 backdrop-blur-xl rounded-3xl overflow-hidden border border-white/20 p-2 gap-2">
                                <div className="flex-1 flex items-center bg-white dark:bg-zinc-900 rounded-2xl px-2">
                                    <div className="pl-4 text-brand">
                                        <Sparkles className="w-5 h-5" />
                                    </div>
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        disabled={isSearching}
                                        placeholder="Ej: Casa 3 dormitorios en Yerba Buena con pileta..."
                                        className="w-full bg-transparent border-none outline-none py-4 px-4 text-foreground placeholder:text-muted-foreground text-base md:text-lg disabled:opacity-50"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={isSearching || !searchQuery.trim()}
                                    className="bg-brand text-white px-8 py-4 font-semibold text-base md:text-lg transition-all active:scale-95 hover:bg-gold hover:text-black flex items-center justify-center gap-2 rounded-2xl disabled:opacity-50 whitespace-nowrap"
                                >
                                    {isSearching ? (
                                        <>
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            <span>Analizando...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Search className="w-5 h-5" />
                                            <span>Buscar Propiedad</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    </form>
                </motion.div>
            </section>

            {/* Featured Properties Section */}
            <section className="py-24 px-6 relative">
                <div className="max-w-7xl mx-auto">
                    <div className="flex justify-between items-end mb-12">
                        <div>
                            <h2 className="text-3xl md:text-5xl font-heading font-medium mb-4 tracking-tight text-foreground">Propiedades Destacadas</h2>
                            <p className="text-muted-foreground text-lg">Las mejores oportunidades en Tucumán seleccionadas para vos.</p>
                        </div>
                        <Link href="/propiedades" className="hidden md:flex text-brand font-medium hover:underline items-center gap-1">
                            Ver todas <Search className="w-4 h-4 ml-1" />
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {properties.map((property, index) => (
                            <PropertyCard key={property.id} property={property} cardStyle={cardStyle} index={index} />
                        ))}
                    </div>
                    <div className="mt-8 flex justify-center md:hidden">
                        <button className="px-6 py-3 border border-border rounded-full font-medium hover:bg-muted transition-colors">
                            Ver todas las propiedades
                        </button>
                    </div>
                </div>
            </section>

            {/* Call to Action for Agencies/Owners */}
            <section className="py-24 px-6 relative overflow-hidden">
                <div className="absolute inset-0 bg-foreground" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-brand/30 rounded-full blur-[120px] opacity-40" />

                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, type: "spring" }}
                    className="max-w-4xl mx-auto relative z-10 text-center text-white"
                >
                    <h2 className="text-4xl md:text-5xl font-brand font-bold mb-6 tracking-tight">
                        ¿Tenés una propiedad o inmobiliaria?
                    </h2>
                    <p className="text-lg md:text-xl text-zinc-400 mb-10 max-w-2xl mx-auto text-balance">
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
                            className="bg-brand text-white px-8 py-4 rounded-full font-semibold text-lg hover:bg-gold hover:text-black transition-all shadow-lg hover:shadow-gold/20 active:scale-95"
                        >
                            Publicar Propiedad
                        </Link>
                        <Link
                            href="/contacto"
                            className="bg-white/10 backdrop-blur-md text-white border border-white/20 px-8 py-4 rounded-full font-semibold text-lg hover:bg-white/20 transition-all active:scale-95"
                        >
                            Contactar Ventas
                        </Link>
                    </motion.div>
                </motion.div>
            </section>
        </>
    );
}
