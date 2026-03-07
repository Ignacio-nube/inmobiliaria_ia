"use client";

import { motion, Variants } from "framer-motion";
import { MapPin } from "lucide-react";
import Image from "next/image";
import { Database } from "@/lib/database.types";
import Link from "next/link";

type Property = Database['public']['Tables']['properties']['Row'];

interface PropertyCardProps {
    property: Property;
    cardStyle: string;
    index?: number;
}

// Pulse animation for badges
const badgePulseVariants: Variants = {
    animate: {
        boxShadow: [
            "0 0 0 0px rgba(212, 175, 55, 0)",
            "0 0 0 6px rgba(212, 175, 55, 0.15)",
            "0 0 0 0px rgba(212, 175, 55, 0)",
        ],
        transition: {
            duration: 2.4,
            repeat: Infinity,
            ease: "easeInOut",
        },
    },
};

export function PropertyCard({ property, cardStyle, index = 0 }: PropertyCardProps) {
    const isClassic = cardStyle === 'classic';

    return (
        <Link href={`/propiedades/${property.id}`} className="block h-full">
            <motion.div
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{
                    duration: 0.3,
                    delay: Math.min(index, 5) * 0.03,
                    ease: "easeOut",
                }}
                whileHover={{
                    y: -6,
                    boxShadow: "0 16px 32px rgba(0,0,0,0.25)",
                    transition: { type: "spring", stiffness: 400, damping: 25 },
                }}
                style={{ willChange: "transform" }}
                className={`group relative overflow-hidden bg-card text-card-foreground border border-border cursor-pointer flex flex-col h-full ${isClassic
                    ? "rounded-none border-b-2 border-r-2 hover:border-gold"
                    : "rounded-2xl shadow-sm hover:border-brand/30"
                    }`}
            >
                <div className={`aspect-[4/3] bg-muted relative overflow-hidden ${isClassic ? "rounded-none" : ""}`}>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent z-10" />
                    <div className={`absolute bottom-3 z-20 flex gap-2 ${isClassic ? "left-1/2 -translate-x-1/2" : "left-3"}`}>
                        {/* "En Venta" badge */}
                        <motion.span
                            variants={badgePulseVariants}
                            animate="animate"
                            className={`px-2.5 py-1 text-white text-[11px] font-semibold ${isClassic
                                ? "bg-black/60 backdrop-blur-sm rounded-none tracking-widest uppercase"
                                : "bg-white/20 backdrop-blur-md rounded-full"
                                }`}
                        >
                            En Venta
                        </motion.span>

                        {/* "Destacado" badge */}
                        {property.is_featured && (
                            <motion.span
                                variants={badgePulseVariants}
                                animate="animate"
                                className={`px-2.5 py-1 text-white text-[11px] font-semibold ${isClassic
                                    ? "bg-gold rounded-none tracking-widest uppercase"
                                    : "bg-gold rounded-full text-black"
                                    }`}
                                style={{ willChange: "box-shadow" }}
                            >
                                Destacado
                            </motion.span>
                        )}
                    </div>
                    {property.images && property.images.length > 0 ? (
                        <Image
                            src={property.images[0]}
                            alt={property.title}
                            fill
                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                            style={{ willChange: "transform" }}
                        />
                    ) : (
                        <div className="w-full h-full bg-muted flex items-center justify-center text-muted-foreground font-medium">
                            Sin imagen
                        </div>
                    )}
                </div>
                <div className={`p-5 flex-1 flex flex-col justify-between ${isClassic ? "text-center items-center" : ""}`}>
                    <div className="w-full">
                        <h3
                            className={`font-heading font-medium text-lg leading-tight line-clamp-1 text-foreground ${isClassic ? "text-center" : ""}`}
                            title={property.title}
                        >
                            {property.title}
                        </h3>
                        {/* Price — unified gold regardless of card style */}
                        <span className="font-brand font-bold text-xl mt-1 mb-1.5 block text-gold">
                            {property.currency} {property.price.toLocaleString()}
                        </span>
                        <div className={`flex items-center gap-1.5 text-sm text-muted-foreground ${isClassic ? "justify-center" : ""}`}>
                            <MapPin className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate">{property.location}</span>
                        </div>
                    </div>
                    <div className={`flex items-center gap-3 text-xs text-muted-foreground border-t border-border pt-3 mt-3 w-full ${isClassic ? "justify-center uppercase tracking-wider" : ""}`}>
                        {property.bedrooms !== null && property.bedrooms > 0 && <span>{property.bedrooms} Dorm.</span>}
                        {property.bedrooms !== null && property.bedrooms > 0 && <span className="w-1 h-1 rounded-full bg-border flex-shrink-0" />}
                        {property.bathrooms !== null && property.bathrooms > 0 && <span>{property.bathrooms} Baños</span>}
                        {property.bathrooms !== null && property.bathrooms > 0 && <span className="w-1 h-1 rounded-full bg-border flex-shrink-0" />}
                        {property.square_meters !== null && <span>{property.square_meters} m²</span>}
                    </div>
                </div>
            </motion.div>
        </Link>
    );
}
