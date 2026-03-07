"use client";

import { useState, useTransition } from "react";
import { bulkApproveProperties, bulkRejectProperties, approveProperty, rejectProperty } from "@/app/admin/actions";
import { Check, X, Clock, MapPin, CheckSquare, Square, Loader2 } from "lucide-react";
import { Database } from "@/lib/database.types";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

type Property = Database['public']['Tables']['properties']['Row'];

export function ApprovalQueue({ properties }: { properties: Property[] }) {
    const [isPending, startTransition] = useTransition();
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [bulkLoading, setBulkLoading] = useState(false);

    const toggleSelect = (id: string) => {
        setSelected(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const toggleAll = () => {
        if (selected.size === properties.length) {
            setSelected(new Set());
        } else {
            setSelected(new Set(properties.map(p => p.id)));
        }
    };

    const handleApprove = (id: string) => {
        startTransition(async () => {
            await approveProperty(id);
            toast.success("Propiedad aprobada ✓");
        });
    };

    const handleReject = (id: string) => {
        startTransition(async () => {
            await rejectProperty(id);
            toast.success("Propiedad rechazada");
        });
    };

    const handleBulkApprove = async () => {
        const ids = Array.from(selected);
        if (ids.length === 0) return;
        setBulkLoading(true);
        try {
            startTransition(async () => {
                await bulkApproveProperties(ids);
                toast.success(`${ids.length} propiedades aprobadas ✓`);
                setSelected(new Set());
                setBulkLoading(false);
            });
        } catch {
            toast.error("Error al aprobar propiedades");
            setBulkLoading(false);
        }
    };

    const handleBulkReject = async () => {
        const ids = Array.from(selected);
        if (ids.length === 0) return;
        setBulkLoading(true);
        try {
            startTransition(async () => {
                await bulkRejectProperties(ids);
                toast.success(`${ids.length} propiedades rechazadas`);
                setSelected(new Set());
                setBulkLoading(false);
            });
        } catch {
            toast.error("Error al rechazar propiedades");
            setBulkLoading(false);
        }
    };

    if (properties.length === 0) {
        return (
            <div className="text-center py-10 rounded-2xl bg-slate-800/20">
                <Clock className="w-8 h-8 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-500 text-sm">No hay propiedades pendientes</p>
                <p className="text-slate-600 text-xs mt-1">¡Todo al día! 🎉</p>
            </div>
        );
    }

    const allSelected = selected.size === properties.length;

    return (
        <div className="flex flex-col">
            {/* Header with select all */}
            <div className="flex items-center justify-between mb-3">
                <button
                    onClick={toggleAll}
                    className="flex items-center gap-2 text-xs text-slate-400 hover:text-slate-200 transition-colors"
                >
                    {allSelected ? (
                        <CheckSquare className="w-4 h-4 text-amber-400" />
                    ) : (
                        <Square className="w-4 h-4" />
                    )}
                    {allSelected ? "Deseleccionar todas" : "Seleccionar todas"}
                </button>
                {selected.size > 0 && (
                    <span className="text-[11px] text-amber-400 font-medium">
                        {selected.size} seleccionadas
                    </span>
                )}
            </div>

            {/* Scrollable list — max 5 items visible */}
            <div className="max-h-[410px] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                {properties.map((property, index) => {
                    const isSelected = selected.has(property.id);
                    return (
                        <motion.div
                            key={property.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.03 }}
                            className={`flex items-center gap-3 p-3 rounded-2xl transition-all group ${isSelected
                                    ? "bg-amber-500/10 border border-amber-500/20"
                                    : "bg-slate-800/30 hover:bg-slate-800/50 border border-transparent"
                                }`}
                        >
                            {/* Checkbox */}
                            <button
                                onClick={() => toggleSelect(property.id)}
                                className={`flex-shrink-0 w-5 h-5 rounded-md flex items-center justify-center transition-all ${isSelected
                                        ? "bg-amber-500 text-white"
                                        : "bg-slate-700/50 text-transparent hover:bg-slate-600 hover:text-slate-400"
                                    }`}
                            >
                                <Check className="w-3 h-3" />
                            </button>

                            {/* Thumbnail */}
                            <div className="w-11 h-11 relative rounded-xl overflow-hidden bg-slate-800 flex-shrink-0">
                                {property.images && property.images.length > 0 ? (
                                    <Image src={property.images[0]} alt={property.title} fill className="object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-xs text-slate-500">Img</div>
                                )}
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-slate-200 truncate text-sm">{property.title}</h4>
                                <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                                    <span className="flex items-center gap-1">
                                        <MapPin className="w-3 h-3" />
                                        {property.location}
                                    </span>
                                    <span>•</span>
                                    <span className="font-medium text-slate-400">
                                        {property.currency} {property.price.toLocaleString()}
                                    </span>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-1.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => handleReject(property.id)}
                                    disabled={isPending}
                                    className="p-2 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-50"
                                    title="Rechazar"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                                <button
                                    onClick={() => handleApprove(property.id)}
                                    disabled={isPending}
                                    className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors disabled:opacity-50"
                                    title="Aprobar y Publicar"
                                >
                                    <Check className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            {/* Floating Bulk Action Toolbar */}
            <AnimatePresence>
                {selected.size > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="mt-3 flex items-center gap-2 p-3 rounded-2xl bg-slate-800/80 backdrop-blur-sm border border-slate-700/50"
                    >
                        <button
                            onClick={handleBulkApprove}
                            disabled={bulkLoading || isPending}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl transition-colors disabled:opacity-50"
                        >
                            {bulkLoading ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                                <Check className="w-3.5 h-3.5" />
                            )}
                            Aprobar ({selected.size})
                        </button>
                        <button
                            onClick={handleBulkReject}
                            disabled={bulkLoading || isPending}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-500 text-white text-xs font-semibold rounded-xl transition-colors disabled:opacity-50"
                        >
                            {bulkLoading ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                                <X className="w-3.5 h-3.5" />
                            )}
                            Rechazar ({selected.size})
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
