"use client";

import { useTransition } from "react";
import { togglePropertyPublish, togglePropertyFeature, deleteProperty } from "@/app/admin/actions";
import { Check, X, Star, Trash2 } from "lucide-react";
import { Database } from "@/lib/database.types";
import Image from "next/image";
import Link from "next/link";

type Property = Database['public']['Tables']['properties']['Row'];

export function PropertiesTable({ properties }: { properties: Property[] }) {
    const [isPending, startTransition] = useTransition();

    const handlePublishToggle = (id: string, published: boolean) => {
        startTransition(async () => {
            await togglePropertyPublish(id, published);
        });
    };

    const handleFeatureToggle = (id: string, featured: boolean) => {
        startTransition(async () => {
            await togglePropertyFeature(id, featured);
        });
    };

    const handleDelete = (id: string, title: string) => {
        if (confirm(`¿Estás seguro que deseas eliminar "${title}"? Esta acción no se puede deshacer.`)) {
            startTransition(async () => {
                await deleteProperty(id);
            });
        }
    };

    if (properties.length === 0) {
        return (
            <div className="text-center py-12 bg-card rounded-2xl border border-border">
                <p className="text-muted-foreground">No hay propiedades cargadas.</p>
            </div>
        );
    }

    return (
        <div className="overflow-x-auto rounded-2xl border border-border bg-card">
            <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border">
                    <tr>
                        <th className="px-6 py-4 font-medium">Propiedad</th>
                        <th className="px-6 py-4 font-medium">Precio</th>
                        <th className="px-6 py-4 font-medium text-center">Publicada</th>
                        <th className="px-6 py-4 font-medium text-center">Destacada</th>
                        <th className="px-6 py-4 font-medium text-right">Acciones</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-border">
                    {properties.map((property) => (
                        <tr key={property.id} className="hover:bg-muted/10 transition-colors">
                            <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 relative rounded-lg overflow-hidden bg-muted flex-shrink-0 border border-border">
                                        {property.images && property.images.length > 0 ? (
                                            <Image src={property.images[0]} alt={property.title} fill className="object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">Img</div>
                                        )}
                                    </div>
                                    <div>
                                        <div className="font-medium text-foreground line-clamp-1">{property.title}</div>
                                        <div className="text-xs text-muted-foreground">{property.location} • {property.property_type}</div>
                                    </div>
                                </div>
                            </td>
                            <td className="px-6 py-4 font-medium">
                                {property.currency} {property.price.toLocaleString()}
                            </td>
                            <td className="px-6 py-4 text-center">
                                <button
                                    onClick={() => handlePublishToggle(property.id, property.published)}
                                    disabled={isPending}
                                    className={`inline-flex items-center justify-center w-8 h-8 rounded-full transition-colors ${property.published ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-red-100 text-red-700 hover:bg-red-200'}`}
                                    title={property.published ? "Despublicar" : "Publicar"}
                                >
                                    {property.published ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                                </button>
                            </td>
                            <td className="px-6 py-4 text-center">
                                <button
                                    onClick={() => handleFeatureToggle(property.id, property.is_featured)}
                                    disabled={isPending}
                                    className={`inline-flex items-center justify-center w-8 h-8 rounded-full transition-colors ${property.is_featured ? 'bg-yellow-100 text-yellow-600 hover:bg-yellow-200' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
                                    title={property.is_featured ? "Quitar destacado" : "Destacar en la Home"}
                                >
                                    <Star className={`w-4 h-4 ${property.is_featured ? 'fill-current' : ''}`} />
                                </button>
                            </td>
                            <td className="px-6 py-4">
                                <div className="flex justify-end gap-2 items-center">
                                    <Link
                                        href={`/admin/propiedades/${property.id}/editar`}
                                        className="p-2 text-muted-foreground hover:bg-muted hover:text-brand rounded-lg transition-colors"
                                        title="Editar propiedad"
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                        </svg>
                                    </Link>
                                    <button
                                        onClick={() => handleDelete(property.id, property.title)}
                                        disabled={isPending}
                                        className="p-2 text-muted-foreground hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
                                        title="Eliminar propiedad"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
