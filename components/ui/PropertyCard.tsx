"use client";

import { motion } from "framer-motion";
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

export function PropertyCard({ property, cardStyle, index = 0 }: PropertyCardProps) {
    const isClassic = cardStyle === 'classic';

    return (
        <Link href={`/propiedades/${property.id}`} className="block">
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ y: -8, transition: { duration: 0.2 } }}
                className={`group relative overflow-hidden bg-white shadow-sm transition-all duration-300 cursor-pointer flex flex-col h-full ${isClassic
                        ? "rounded-none border-b-2 border-r-2 border-brand/20 hover:shadow-xl hover:border-gold"
                        : "rounded-3xl border border-border/50 hover:shadow-2xl hover:shadow-gold/10"
                    }`}
            >
                <div className={`aspect-[4/3] bg-muted relative overflow-hidden ${isClassic ? "rounded-none" : ""}`}>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent z-10" />
                    <div className={`absolute bottom-4 z-20 flex gap-2 ${isClassic ? "left-1/2 -translate-x-1/2" : "left-4"}`}>
                        <span className={`px-3 py-1 text-white text-xs font-semibold ${isClassic ? "bg-black/60 backdrop-blur-sm rounded-none tracking-widest uppercase" : "bg-white/20 backdrop-blur-md rounded-full"}`}>
                            En Venta
                        </span>
                        {property.is_featured && (
                            <span className={`px-3 py-1 text-white text-xs font-semibold ${isClassic ? "bg-gold rounded-none tracking-widest uppercase" : "bg-brand rounded-full"}`}>
                                Destacado
                            </span>
                        )}
                    </div>
                    {property.images && property.images.length > 0 ? (
                        <Image
                            src={property.images[0]}
                            alt={property.title}
                            fill
                            className="object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                    ) : (
                        <div className="w-full h-full bg-slate-200 flex items-center justify-center text-slate-400 font-medium transition-transform duration-500 group-hover:scale-110">
                            Sin imagen
                        </div>
                    )}
                </div>
                <div className={`p-6 flex-1 flex flex-col justify-between ${isClassic ? "text-center items-center" : ""}`}>
                    <div className="w-full">
                        <div className={`flex items-start mb-2 gap-4 ${isClassic ? "justify-center" : "justify-between"}`}>
                            <h3 className={`font-heading font-medium text-2xl line-clamp-1 ${isClassic ? "text-primary" : ""}`} title={property.title}>{property.title}</h3>
                        </div>
                        <span className={`font-brand font-bold text-xl text-brand mb-2 block ${isClassic ? "text-gold" : ""}`}>{property.currency} {property.price.toLocaleString()}</span>
                        <div className={`flex items-center gap-1 text-muted-foreground text-sm mb-4 ${isClassic ? "justify-center" : ""}`}>
                            <MapPin className="w-4 h-4 shrink-0" />
                            <span className="truncate">{property.location}</span>
                        </div>
                    </div>
                    <div className={`flex items-center gap-4 text-sm border-t pt-4 mt-auto w-full ${isClassic ? "text-muted-foreground justify-center border-border/20 uppercase tracking-wider text-xs" : "text-foreground/80 border-border"}`}>
                        {property.bedrooms !== null && property.bedrooms > 0 && <span>{property.bedrooms} Dorm.</span>}
                        {property.bedrooms !== null && property.bedrooms > 0 && <span className="w-1 h-1 rounded-full bg-muted-foreground flex-shrink-0" />}
                        {property.bathrooms !== null && property.bathrooms > 0 && <span>{property.bathrooms} Baños</span>}
                        {property.bathrooms !== null && property.bathrooms > 0 && <span className="w-1 h-1 rounded-full bg-muted-foreground flex-shrink-0" />}
                        {property.square_meters !== null && <span>{property.square_meters} m²</span>}
                    </div>
                </div>
            </motion.div>
        </Link>
    );
}
