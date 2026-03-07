"use client";

import { useState, useMemo, useTransition } from "react";
import { togglePropertyPublish, togglePropertyFeature, deleteProperty, approveProperty, rejectProperty, bulkApproveProperties, bulkRejectProperties, bulkDeleteProperties, bulkToggleFeature } from "@/app/admin/actions";
import { Check, X, Star, Trash2, Plus, Clock, CheckCircle, XCircle, Filter, ExternalLink, Search, ChevronLeft, ChevronRight, CheckSquare, Square, Loader2, Globe } from "lucide-react";
import { Database } from "@/lib/database.types";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";

type Property = Database['public']['Tables']['properties']['Row'];

const STATUS_FILTERS = [
    { key: "all", label: "Todas" },
    { key: "pending", label: "Pendientes", icon: Clock, color: "text-amber-400" },
    { key: "approved", label: "Aprobadas", icon: CheckCircle, color: "text-emerald-400" },
    { key: "rejected", label: "Rechazadas", icon: XCircle, color: "text-red-400" },
];

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
    pending: { label: "Pendiente", className: "bg-amber-500/10 text-amber-400" },
    approved: { label: "Aprobada", className: "bg-emerald-500/10 text-emerald-400" },
    rejected: { label: "Rechazada", className: "bg-red-500/10 text-red-400" },
};

const ITEMS_PER_PAGE = 20;

function isScrapedProperty(property: Property): boolean {
    if (!property.images || property.images.length === 0) return false;
    return property.images.some(img => img.startsWith("http") && !img.includes("supabase"));
}

export function PropertiesTable({ properties }: { properties: Property[] }) {
    const [isPending, startTransition] = useTransition();
    const [statusFilter, setStatusFilter] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [bulkLoading, setBulkLoading] = useState(false);

    const filteredProperties = useMemo(() => {
        let result = properties;
        if (statusFilter !== "all") {
            result = result.filter(p => p.approval_status === statusFilter);
        }
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            result = result.filter(p =>
                p.title.toLowerCase().includes(q) ||
                p.location.toLowerCase().includes(q) ||
                (p.address && p.address.toLowerCase().includes(q)) ||
                (p.city && p.city.toLowerCase().includes(q))
            );
        }
        return result;
    }, [properties, statusFilter, searchQuery]);

    // Pagination
    const totalPages = Math.ceil(filteredProperties.length / ITEMS_PER_PAGE);
    const paginatedProperties = useMemo(() => {
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredProperties.slice(start, start + ITEMS_PER_PAGE);
    }, [filteredProperties, currentPage]);

    // Reset page when filters change
    useMemo(() => {
        setCurrentPage(1);
    }, [statusFilter, searchQuery]);

    const counts = useMemo(() => {
        const c: Record<string, number> = { all: properties.length, pending: 0, approved: 0, rejected: 0 };
        properties.forEach(p => { c[p.approval_status] = (c[p.approval_status] || 0) + 1; });
        return c;
    }, [properties]);

    // Selection
    const toggleSelect = (id: string) => {
        setSelected(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const toggleAll = () => {
        const pageIds = paginatedProperties.map(p => p.id);
        const allPageSelected = pageIds.every(id => selected.has(id));
        if (allPageSelected) {
            setSelected(prev => {
                const next = new Set(prev);
                pageIds.forEach(id => next.delete(id));
                return next;
            });
        } else {
            setSelected(prev => {
                const next = new Set(prev);
                pageIds.forEach(id => next.add(id));
                return next;
            });
        }
    };

    const allPageSelected = paginatedProperties.length > 0 && paginatedProperties.every(p => selected.has(p.id));

    // Individual actions
    const handlePublishToggle = (id: string, published: boolean) => {
        startTransition(async () => { await togglePropertyPublish(id, published); });
    };
    const handleFeatureToggle = (id: string, featured: boolean) => {
        startTransition(async () => { await togglePropertyFeature(id, featured); });
    };
    const handleDelete = (id: string, title: string) => {
        if (confirm(`¿Estás seguro que deseas eliminar "${title}"?`)) {
            startTransition(async () => { await deleteProperty(id); });
        }
    };
    const handleApprove = (id: string) => {
        startTransition(async () => { await approveProperty(id); toast.success("Propiedad aprobada"); });
    };
    const handleReject = (id: string) => {
        startTransition(async () => { await rejectProperty(id); toast.success("Propiedad rechazada"); });
    };

    // Bulk actions
    const handleBulkAction = async (action: "approve" | "reject" | "delete" | "feature" | "unfeature") => {
        const ids = Array.from(selected);
        if (ids.length === 0) return;
        if (action === "delete" && !confirm(`¿Eliminar ${ids.length} propiedades?`)) return;
        setBulkLoading(true);
        try {
            startTransition(async () => {
                switch (action) {
                    case "approve":
                        await bulkApproveProperties(ids);
                        toast.success(`${ids.length} propiedades aprobadas ✓`);
                        break;
                    case "reject":
                        await bulkRejectProperties(ids);
                        toast.success(`${ids.length} propiedades rechazadas`);
                        break;
                    case "delete":
                        await bulkDeleteProperties(ids);
                        toast.success(`${ids.length} propiedades eliminadas`);
                        break;
                    case "feature":
                        await bulkToggleFeature(ids, true);
                        toast.success(`${ids.length} propiedades destacadas`);
                        break;
                    case "unfeature":
                        await bulkToggleFeature(ids, false);
                        toast.success(`${ids.length} propiedades sin destaque`);
                        break;
                }
                setSelected(new Set());
                setBulkLoading(false);
            });
        } catch {
            toast.error("Error al procesar acción");
            setBulkLoading(false);
        }
    };

    return (
        <div>
            {/* Header + Filters + Search */}
            <div className="flex flex-col gap-4 mb-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex gap-1 overflow-x-auto">
                        {STATUS_FILTERS.map(filter => {
                            const isActive = statusFilter === filter.key;
                            return (
                                <button
                                    key={filter.key}
                                    onClick={() => setStatusFilter(filter.key)}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${isActive
                                        ? "bg-blue-500/10 text-blue-400"
                                        : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                                        }`}
                                >
                                    {filter.icon && <filter.icon className={`w-3.5 h-3.5 ${isActive ? "" : filter.color}`} />}
                                    {filter.label}
                                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${isActive ? "bg-blue-500/20" : "bg-slate-700/50"}`}>
                                        {counts[filter.key] || 0}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                    <Link
                        href="/admin/propiedades/nueva"
                        className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-xl transition-colors whitespace-nowrap"
                    >
                        <Plus className="w-4 h-4" />
                        Nueva Propiedad
                    </Link>
                </div>

                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Buscar por nombre, dirección o ciudad..."
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-800/40 border border-slate-700/40 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 transition-all"
                    />
                </div>
            </div>

            {/* Bulk Actions Toolbar */}
            <AnimatePresence>
                {selected.size > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: -10, height: 0 }}
                        animate={{ opacity: 1, y: 0, height: "auto" }}
                        exit={{ opacity: 0, y: -10, height: 0 }}
                        className="mb-4 overflow-hidden"
                    >
                        <div className="flex items-center gap-2 p-3 rounded-2xl bg-slate-800/80 backdrop-blur-sm border border-slate-700/50">
                            <span className="text-xs text-slate-300 font-medium mr-2">
                                {selected.size} seleccionadas
                            </span>
                            <button onClick={() => handleBulkAction("approve")} disabled={bulkLoading}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-50">
                                {bulkLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
                                Aprobar
                            </button>
                            <button onClick={() => handleBulkAction("reject")} disabled={bulkLoading}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-50">
                                <XCircle className="w-3 h-3" /> Rechazar
                            </button>
                            <button onClick={() => handleBulkAction("feature")} disabled={bulkLoading}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-50">
                                <Star className="w-3 h-3" /> Destacar
                            </button>
                            <button onClick={() => handleBulkAction("unfeature")} disabled={bulkLoading}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-600 hover:bg-slate-500 text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-50">
                                <Star className="w-3 h-3" /> Quitar
                            </button>
                            <button onClick={() => handleBulkAction("delete")} disabled={bulkLoading}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-900/60 hover:bg-red-800 text-red-300 text-xs font-medium rounded-lg transition-colors disabled:opacity-50 ml-auto">
                                <Trash2 className="w-3 h-3" /> Eliminar
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {filteredProperties.length === 0 ? (
                <div className="text-center py-12 rounded-2xl bg-slate-800/20">
                    <Filter className="w-8 h-8 text-slate-600 mx-auto mb-3" />
                    <p className="text-slate-500">No hay propiedades en esta categoría.</p>
                </div>
            ) : (
                <>
                    <div className="overflow-x-auto rounded-2xl bg-slate-900/50">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-slate-400 uppercase bg-slate-800/30">
                                <tr>
                                    <th className="px-4 py-4 w-10">
                                        <button onClick={toggleAll}
                                            className={`w-5 h-5 rounded-md flex items-center justify-center transition-all ${allPageSelected ? 'bg-blue-500 text-white' : 'bg-slate-700/50 text-transparent hover:bg-slate-600'}`}>
                                            <Check className="w-3 h-3" />
                                        </button>
                                    </th>
                                    <th className="px-4 py-4 font-medium">Propiedad</th>
                                    <th className="px-4 py-4 font-medium">Precio</th>
                                    <th className="px-4 py-4 font-medium text-center">Estado</th>
                                    <th className="px-4 py-4 font-medium text-center">Origen</th>
                                    <th className="px-4 py-4 font-medium text-center">Publicada</th>
                                    <th className="px-4 py-4 font-medium text-center">Destacada</th>
                                    <th className="px-4 py-4 font-medium text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/50">
                                {paginatedProperties.map((property) => {
                                    const badge = STATUS_BADGE[property.approval_status] || STATUS_BADGE.pending;
                                    const isSelected = selected.has(property.id);
                                    const scraped = isScrapedProperty(property);
                                    return (
                                        <tr key={property.id} className={`transition-colors ${isSelected ? "bg-blue-500/5" : "hover:bg-slate-800/20"}`}>
                                            <td className="px-4 py-3">
                                                <button onClick={() => toggleSelect(property.id)}
                                                    className={`w-5 h-5 rounded-md flex items-center justify-center transition-all ${isSelected ? 'bg-blue-500 text-white' : 'bg-slate-700/40 text-transparent hover:bg-slate-600 hover:text-slate-400'}`}>
                                                    <Check className="w-3 h-3" />
                                                </button>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-11 h-11 relative rounded-xl overflow-hidden bg-slate-800 flex-shrink-0">
                                                        {property.images && property.images.length > 0 ? (
                                                            <Image src={property.images[0]} alt={property.title} fill className="object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-xs text-slate-500">Img</div>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <div className="font-medium text-slate-200 line-clamp-1">{property.title}</div>
                                                        <div className="text-xs text-slate-500">{property.location} • {property.property_type} • {property.operation_type}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 font-medium text-slate-200">
                                                {property.currency} {property.price.toLocaleString()}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${badge.className}`}>
                                                    {badge.label}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${scraped
                                                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                                    : "bg-slate-600/20 text-slate-400 border border-slate-600/20"
                                                    }`}>
                                                    {scraped ? <Globe className="w-3 h-3" /> : null}
                                                    {scraped ? "Scraping" : "Manual"}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <button
                                                    onClick={() => handlePublishToggle(property.id, property.published)}
                                                    disabled={isPending || property.approval_status !== 'approved'}
                                                    className={`inline-flex items-center justify-center w-8 h-8 rounded-full transition-colors disabled:opacity-30 ${property.published
                                                        ? 'bg-green-500/10 text-green-400 hover:bg-green-500/20'
                                                        : 'bg-red-500/10 text-red-400 hover:bg-red-500/20'
                                                        }`}
                                                    title={property.published ? "Despublicar" : "Publicar"}
                                                >
                                                    {property.published ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                                                </button>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <button
                                                    onClick={() => handleFeatureToggle(property.id, property.is_featured)}
                                                    disabled={isPending}
                                                    className={`inline-flex items-center justify-center w-8 h-8 rounded-full transition-colors ${property.is_featured
                                                        ? 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20'
                                                        : 'bg-slate-700/30 text-slate-500 hover:bg-slate-700'
                                                        }`}
                                                    title={property.is_featured ? "Quitar destacado" : "Destacar"}
                                                >
                                                    <Star className={`w-4 h-4 ${property.is_featured ? 'fill-current' : ''}`} />
                                                </button>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex justify-end gap-1 items-center">
                                                    {property.approval_status === 'pending' && (
                                                        <>
                                                            <button onClick={() => handleApprove(property.id)} disabled={isPending}
                                                                className="p-2 text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors" title="Aprobar">
                                                                <CheckCircle className="w-4 h-4" />
                                                            </button>
                                                            <button onClick={() => handleReject(property.id)} disabled={isPending}
                                                                className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors" title="Rechazar">
                                                                <XCircle className="w-4 h-4" />
                                                            </button>
                                                        </>
                                                    )}
                                                    <Link href={`/admin/propiedades/${property.id}/editar`}
                                                        className="p-2 text-slate-400 hover:bg-slate-700/50 hover:text-blue-400 rounded-lg transition-colors" title="Editar">
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                        </svg>
                                                    </Link>
                                                    {property.published && (
                                                        <Link href={`/propiedades/${property.id}`} target="_blank" rel="noreferrer"
                                                            className="p-2 text-slate-400 hover:bg-slate-700/50 hover:text-emerald-400 rounded-lg transition-colors" title="Ver en el sitio">
                                                            <ExternalLink className="w-4 h-4" />
                                                        </Link>
                                                    )}
                                                    <button onClick={() => handleDelete(property.id, property.title)} disabled={isPending}
                                                        className="p-2 text-slate-500 hover:bg-red-500/10 hover:text-red-400 rounded-lg transition-colors" title="Eliminar">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between mt-4 px-2">
                            <span className="text-xs text-slate-500">
                                Mostrando {(currentPage - 1) * ITEMS_PER_PAGE + 1}-{Math.min(currentPage * ITEMS_PER_PAGE, filteredProperties.length)} de {filteredProperties.length}
                            </span>
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="p-2 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-colors disabled:opacity-30"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                                {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                                    let page: number;
                                    if (totalPages <= 7) {
                                        page = i + 1;
                                    } else if (currentPage <= 4) {
                                        page = i + 1;
                                    } else if (currentPage >= totalPages - 3) {
                                        page = totalPages - 6 + i;
                                    } else {
                                        page = currentPage - 3 + i;
                                    }
                                    return (
                                        <button
                                            key={page}
                                            onClick={() => setCurrentPage(page)}
                                            className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${currentPage === page
                                                ? "bg-blue-600 text-white"
                                                : "text-slate-400 hover:bg-slate-800 hover:text-white"
                                                }`}
                                        >
                                            {page}
                                        </button>
                                    );
                                })}
                                <button
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                    className="p-2 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-colors disabled:opacity-30"
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
