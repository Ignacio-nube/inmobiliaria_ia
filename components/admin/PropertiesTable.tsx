"use client";

import { useState, useMemo, useTransition } from "react";
import { togglePropertyPublish, togglePropertyFeature, deleteProperty, approveProperty, rejectProperty } from "@/app/admin/actions";
import { Check, X, Star, Trash2, Plus, Clock, CheckCircle, XCircle, Filter, ExternalLink } from "lucide-react";
import { Database } from "@/lib/database.types";
import Image from "next/image";
import Link from "next/link";

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

export function PropertiesTable({ properties }: { properties: Property[] }) {
    const [isPending, startTransition] = useTransition();
    const [statusFilter, setStatusFilter] = useState("all");

    const filteredProperties = useMemo(() => {
        if (statusFilter === "all") return properties;
        return properties.filter(p => p.approval_status === statusFilter);
    }, [properties, statusFilter]);

    const counts = useMemo(() => {
        const c: Record<string, number> = { all: properties.length, pending: 0, approved: 0, rejected: 0 };
        properties.forEach(p => { c[p.approval_status] = (c[p.approval_status] || 0) + 1; });
        return c;
    }, [properties]);

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
        startTransition(async () => { await approveProperty(id); });
    };

    const handleReject = (id: string) => {
        startTransition(async () => { await rejectProperty(id); });
    };

    return (
        <div>
            {/* Header + Filters */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
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

            {filteredProperties.length === 0 ? (
                <div className="text-center py-12 rounded-2xl bg-slate-800/20">
                    <Filter className="w-8 h-8 text-slate-600 mx-auto mb-3" />
                    <p className="text-slate-500">No hay propiedades en esta categoría.</p>
                </div>
            ) : (
                <div className="overflow-x-auto rounded-2xl bg-slate-900/50">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-slate-400 uppercase bg-slate-800/30">
                            <tr>
                                <th className="px-6 py-4 font-medium">Propiedad</th>
                                <th className="px-6 py-4 font-medium">Precio</th>
                                <th className="px-6 py-4 font-medium text-center">Estado</th>
                                <th className="px-6 py-4 font-medium text-center">Publicada</th>
                                <th className="px-6 py-4 font-medium text-center">Destacada</th>
                                <th className="px-6 py-4 font-medium text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/50">
                            {filteredProperties.map((property) => {
                                const badge = STATUS_BADGE[property.approval_status] || STATUS_BADGE.pending;
                                return (
                                    <tr key={property.id} className="hover:bg-slate-800/20 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 relative rounded-xl overflow-hidden bg-slate-800 flex-shrink-0">
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
                                        <td className="px-6 py-4 font-medium text-slate-200">
                                            {property.currency} {property.price.toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${badge.className}`}>
                                                {badge.label}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
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
                                        <td className="px-6 py-4 text-center">
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
                                        <td className="px-6 py-4">
                                            <div className="flex justify-end gap-1 items-center">
                                                {property.approval_status === 'pending' && (
                                                    <>
                                                        <button
                                                            onClick={() => handleApprove(property.id)}
                                                            disabled={isPending}
                                                            className="p-2 text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors"
                                                            title="Aprobar"
                                                        >
                                                            <CheckCircle className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleReject(property.id)}
                                                            disabled={isPending}
                                                            className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                                            title="Rechazar"
                                                        >
                                                            <XCircle className="w-4 h-4" />
                                                        </button>
                                                    </>
                                                )}
                                                <Link
                                                    href={`/admin/propiedades/${property.id}/editar`}
                                                    className="p-2 text-slate-400 hover:bg-slate-700/50 hover:text-blue-400 rounded-lg transition-colors"
                                                    title="Editar"
                                                >
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                    </svg>
                                                </Link>
                                                {property.published && (
                                                    <Link
                                                        href={`/propiedades/${property.id}`}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="p-2 text-slate-400 hover:bg-slate-700/50 hover:text-emerald-400 rounded-lg transition-colors"
                                                        title="Ver en el sitio"
                                                    >
                                                        <ExternalLink className="w-4 h-4" />
                                                    </Link>
                                                )}
                                                <button
                                                    onClick={() => handleDelete(property.id, property.title)}
                                                    disabled={isPending}
                                                    className="p-2 text-slate-500 hover:bg-red-500/10 hover:text-red-400 rounded-lg transition-colors"
                                                    title="Eliminar"
                                                >
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
            )}
        </div>
    );
}
