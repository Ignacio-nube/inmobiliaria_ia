"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { motion, useInView } from "framer-motion";
import { ChevronLeft, ChevronRight, Bed, Bath, Home } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Database } from "@/lib/database.types";

type Property = Database["public"]["Tables"]["properties"]["Row"];

const OPERATION_COLORS: Record<string, string> = {
    venta: "bg-emerald-500/90",
    alquiler: "bg-blue-500/90",
    alquiler_temporal: "bg-violet-500/90",
};

const OPERATION_LABELS: Record<string, string> = {
    venta: "Venta",
    alquiler: "Alquiler",
    alquiler_temporal: "Temporal",
};

interface SimilarPropertiesProps {
    properties: Property[];
    currentCity: string;
    currentType: string;
    matchedByCity: boolean;
}

export function SimilarProperties({
    properties,
    currentCity,
    currentType,
    matchedByCity,
}: SimilarPropertiesProps) {
    const sectionRef = useRef<HTMLDivElement>(null);
    const scrollRef = useRef<HTMLDivElement>(null);
    const isInView = useInView(sectionRef, { once: true, margin: "-80px" });
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);

    const checkScroll = useCallback(() => {
        const el = scrollRef.current;
        if (!el) return;
        setCanScrollLeft(el.scrollLeft > 10);
        setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
    }, []);

    useEffect(() => {
        const el = scrollRef.current;
        if (!el) return;
        checkScroll();
        el.addEventListener("scroll", checkScroll, { passive: true });
        window.addEventListener("resize", checkScroll);
        return () => {
            el.removeEventListener("scroll", checkScroll);
            window.removeEventListener("resize", checkScroll);
        };
    }, [checkScroll, properties]);

    const scroll = (dir: "left" | "right") => {
        const el = scrollRef.current;
        if (!el) return;
        const cardWidth = el.querySelector("[data-card]")?.clientWidth || 340;
        const gap = 24;
        el.scrollBy({ left: dir === "left" ? -(cardWidth + gap) : cardWidth + gap, behavior: "smooth" });
    };

    // Dynamic subtitle
    const subtitle = matchedByCity
        ? `Otros ${currentType.toLowerCase()}s en ${currentCity}`
        : "También te puede interesar";

    return (
        <section
            ref={sectionRef}
            className="relative mt-16 pt-16 border-t border-border/40"
        >
            {/* Header */}
            <div className="max-w-7xl mx-auto px-6 mb-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                    transition={{ duration: 0.5 }}
                >
                    <h2 className="text-3xl md:text-4xl font-heading font-medium tracking-tight text-foreground mb-2">
                        Propiedades similares
                    </h2>
                    <p className="text-muted-foreground text-lg">{subtitle}</p>
                </motion.div>
            </div>

            {/* Carousel container */}
            <div className="group relative max-w-7xl mx-auto px-6">
                {/* Navigation arrows — desktop only, show on hover */}
                {canScrollLeft && (
                    <button
                        onClick={() => scroll("left")}
                        className="hidden lg:flex absolute -left-1 top-1/2 -translate-y-1/2 z-20 w-11 h-11 items-center justify-center rounded-full bg-background/80 backdrop-blur-sm border border-border shadow-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-background hover:scale-110"
                        aria-label="Anterior"
                    >
                        <ChevronLeft className="w-5 h-5 text-foreground" />
                    </button>
                )}
                {canScrollRight && (
                    <button
                        onClick={() => scroll("right")}
                        className="hidden lg:flex absolute -right-1 top-1/2 -translate-y-1/2 z-20 w-11 h-11 items-center justify-center rounded-full bg-background/80 backdrop-blur-sm border border-border shadow-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-background hover:scale-110"
                        aria-label="Siguiente"
                    >
                        <ChevronRight className="w-5 h-5 text-foreground" />
                    </button>
                )}

                {/* Scroll container */}
                <div
                    ref={scrollRef}
                    className="flex gap-6 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-4 -mx-6 px-6"
                    style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                >
                    {properties.map((property, index) => (
                        <SimilarCard
                            key={property.id}
                            property={property}
                            index={index}
                            isInView={isInView}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
}

// ─── Individual Card ───────────────────────────────────────
function SimilarCard({
    property,
    index,
    isInView,
}: {
    property: Property;
    index: number;
    isInView: boolean;
}) {
    const opColor = OPERATION_COLORS[property.operation_type] || "bg-brand/90";
    const opLabel = OPERATION_LABELS[property.operation_type] || property.operation_type;

    return (
        <motion.div
            data-card
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.4, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
            className="flex-shrink-0 w-[calc(100%-2rem)] sm:w-[calc(50%-0.75rem)] lg:w-[calc(33.333%-1rem)] snap-start"
        >
            <Link href={`/propiedades/${property.id}`} className="block group/card">
                <div className="bg-card border border-border rounded-2xl overflow-hidden cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_12px_30px_rgba(0,0,0,0.25)] hover:border-brand/20">
                    {/* Image */}
                    <div className="relative aspect-[4/3] bg-muted overflow-hidden">
                        {property.images && property.images.length > 0 ? (
                            <Image
                                src={property.images[0]}
                                alt={property.title}
                                fill
                                loading="lazy"
                                className="object-cover transition-transform duration-500 group-hover/card:scale-105"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                                <Home className="w-12 h-12 opacity-30" />
                            </div>
                        )}

                        {/* Gradient overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />

                        {/* Operation badge */}
                        <span
                            className={`absolute top-3 left-3 px-2.5 py-1 rounded-full text-white text-[11px] font-semibold backdrop-blur-sm ${opColor}`}
                        >
                            {opLabel}
                        </span>
                    </div>

                    {/* Content */}
                    <div className="p-4">
                        {/* Price */}
                        <p className="font-brand font-bold text-xl text-gold mb-1">
                            {property.currency} {property.price.toLocaleString()}
                        </p>

                        {/* Title */}
                        <h3
                            className="font-heading font-medium text-foreground leading-tight line-clamp-1 mb-1.5"
                            title={property.title}
                        >
                            {property.title}
                        </h3>

                        {/* City + type */}
                        <p className="text-sm text-muted-foreground mb-3">
                            {property.city} · {property.property_type}
                        </p>

                        {/* Stats row */}
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            {property.bedrooms !== null && property.bedrooms > 0 && (
                                <span className="flex items-center gap-1">
                                    <Bed className="w-3.5 h-3.5" />
                                    {property.bedrooms}
                                </span>
                            )}
                            {property.bathrooms !== null && property.bathrooms > 0 && (
                                <span className="flex items-center gap-1">
                                    <Bath className="w-3.5 h-3.5" />
                                    {property.bathrooms}
                                </span>
                            )}
                            {property.square_meters !== null && (
                                <span>{property.square_meters} m²</span>
                            )}
                        </div>
                    </div>
                </div>
            </Link>
        </motion.div>
    );
}
