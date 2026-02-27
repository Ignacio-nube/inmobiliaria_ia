"use client";

import { useTransition } from "react";
import { approveProperty, rejectProperty } from "@/app/admin/actions";
import { Check, X, Clock, MapPin } from "lucide-react";
import { Database } from "@/lib/database.types";
import Image from "next/image";
import { motion } from "framer-motion";

type Property = Database['public']['Tables']['properties']['Row'];

export function ApprovalQueue({ properties }: { properties: Property[] }) {
    const [isPending, startTransition] = useTransition();

    const handleApprove = (id: string) => {
        startTransition(async () => {
            await approveProperty(id);
        });
    };

    const handleReject = (id: string) => {
        startTransition(async () => {
            await rejectProperty(id);
        });
    };

    if (properties.length === 0) {
        return (
            <div className="text-center py-10 rounded-2xl bg-slate-800/20">
                <Clock className="w-8 h-8 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-500 text-sm">No hay propiedades pendientes</p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {properties.map((property, index) => (
                <motion.div
                    key={property.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center gap-4 p-4 rounded-2xl bg-slate-800/30 hover:bg-slate-800/50 transition-colors group"
                >
                    {/* Thumbnail */}
                    <div className="w-14 h-14 relative rounded-xl overflow-hidden bg-slate-800 flex-shrink-0">
                        {property.images && property.images.length > 0 ? (
                            <Image src={property.images[0]} alt={property.title} fill className="object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-xs text-slate-500">Img</div>
                        )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-slate-200 truncate">{property.title}</h4>
                        <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                            <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {property.location}
                            </span>
                            <span>•</span>
                            <span>{property.property_type}</span>
                            <span>•</span>
                            <span className="font-medium text-slate-400">
                                {property.currency} {property.price.toLocaleString()}
                            </span>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                            onClick={() => handleReject(property.id)}
                            disabled={isPending}
                            className="p-2.5 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-50"
                            title="Rechazar"
                        >
                            <X className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => handleApprove(property.id)}
                            disabled={isPending}
                            className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors disabled:opacity-50"
                            title="Aprobar y Publicar"
                        >
                            <Check className="w-4 h-4" />
                        </button>
                    </div>
                </motion.div>
            ))}
        </div>
    );
}
