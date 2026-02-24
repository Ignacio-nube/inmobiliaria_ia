"use client";

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client'; // Client-side Supabase
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { Database } from '@/lib/database.types';

type Property = Database['public']['Tables']['properties']['Row'];

interface PublishFormProps {
    initialData?: Property;
}

export function PublishForm({ initialData }: PublishFormProps) {
    const router = useRouter();
    const supabase = createClient();
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        title: initialData?.title || '',
        description: initialData?.description || '',
        property_type: initialData?.property_type || 'Casa',
        price: initialData?.price?.toString() || '',
        currency: initialData?.currency || 'USD',
        location: initialData?.location || '',
        bedrooms: initialData?.bedrooms?.toString() || '',
        bathrooms: initialData?.bathrooms?.toString() || '',
        square_meters: initialData?.square_meters?.toString() || '',
        imagesStr: initialData?.images?.join(', ') || ''
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setErrorMsg(null);

        // Parse inputs
        const images = formData.imagesStr
            .split(',')
            .map(url => url.trim())
            .filter(url => url.length > 0);

        const priceNum = parseFloat(formData.price) || 0;
        const bedNum = parseInt(formData.bedrooms) || null;
        const bathNum = parseFloat(formData.bathrooms) || null;
        const sqMetersNum = parseFloat(formData.square_meters) || null;

        try {
            const payload = {
                title: formData.title,
                description: formData.description,
                property_type: formData.property_type,
                price: priceNum,
                currency: formData.currency,
                location: formData.location,
                bedrooms: bedNum,
                bathrooms: bathNum,
                square_meters: sqMetersNum,
                images: images,
                published: initialData ? initialData.published : true,
                is_featured: initialData ? initialData.is_featured : false
            };

            const query = initialData
                ? supabase.from('properties').update(payload).eq('id', initialData.id)
                : supabase.from('properties').insert(payload);

            const { error } = await query;

            if (error) {
                console.error("Supabase Error:", error);
                throw error;
            }

            // Success, wait a sec and redirect
            if (initialData) {
                router.push('/admin'); // Return to admin if it's an edit
            } else {
                router.push('/propiedades'); // Go to properties listing if it's new
            }
            router.refresh(); // Refresh properties cache

        } catch (err: any) {
            console.error(err);
            if (err.message) {
                setErrorMsg(err.message);
            } else if (err.code && err.details) {
                setErrorMsg(`${err.code}: ${err.details}`);
            } else {
                setErrorMsg(JSON.stringify(err) === '{}' ? "Error de permisos o base de datos." : JSON.stringify(err));
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {errorMsg && (
                <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm mb-6 border border-red-100">
                    {errorMsg}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                    <label className="text-sm font-medium text-muted-foreground mb-1 block">Título de la Propiedad *</label>
                    <input required name="title" value={formData.title} onChange={handleChange} type="text" className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand outline-none" placeholder="Hermosa casa en Yerba Buena" />
                </div>

                <div className="md:col-span-2">
                    <label className="text-sm font-medium text-muted-foreground mb-1 block">Descripción detallada</label>
                    <textarea name="description" value={formData.description} onChange={handleChange} rows={5} className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand outline-none resize-y" placeholder="Características adicionales, estado general..." />
                </div>

                <div>
                    <label className="text-sm font-medium text-muted-foreground mb-1 block">Tipo de Propiedad *</label>
                    <select required name="property_type" value={formData.property_type} onChange={handleChange} className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand outline-none cursor-pointer">
                        <option value="Casa">Casa</option>
                        <option value="Departamento">Departamento</option>
                        <option value="Duplex">Duplex</option>
                        <option value="Terreno">Terreno</option>
                        <option value="Local">Local</option>
                        <option value="Oficina">Oficina</option>
                    </select>
                </div>

                <div>
                    <label className="text-sm font-medium text-muted-foreground mb-1 block">Ubicación *</label>
                    <input required name="location" value={formData.location} onChange={handleChange} type="text" className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand outline-none" placeholder="Yerba Buena, Tucumán" />
                </div>

                <div>
                    <label className="text-sm font-medium text-muted-foreground mb-1 block">Cotización *</label>
                    <div className="flex rounded-xl overflow-hidden border border-border focus-within:ring-2 focus-within:ring-brand">
                        <select name="currency" value={formData.currency} onChange={handleChange} className="bg-muted px-4 py-3 text-sm border-r border-border outline-none font-medium cursor-pointer">
                            <option value="USD">USD</option>
                            <option value="ARS">ARS</option>
                        </select>
                        <input required name="price" value={formData.price} onChange={handleChange} type="number" min={0} step={100} className="w-full bg-background px-4 py-3 text-sm outline-none" placeholder="150000" />
                    </div>
                </div>

                <div>
                    <label className="text-sm font-medium text-muted-foreground mb-1 block">Imágenes (URLs separadas por comas)</label>
                    <input name="imagesStr" value={formData.imagesStr} onChange={handleChange} type="text" className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand outline-none" placeholder="https://ejemplo.com/foto1.jpg, https://..." />
                </div>

                <div className="grid grid-cols-3 gap-4 md:col-span-2">
                    <div>
                        <label className="text-sm font-medium text-muted-foreground mb-1 block">Dormitorios</label>
                        <input name="bedrooms" value={formData.bedrooms} onChange={handleChange} type="number" min={0} className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand outline-none" placeholder="3" />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-muted-foreground mb-1 block">Baños</label>
                        <input name="bathrooms" value={formData.bathrooms} onChange={handleChange} type="number" min={0} step={0.5} className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand outline-none" placeholder="2" />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-muted-foreground mb-1 block">Superficie (m²)</label>
                        <input name="square_meters" value={formData.square_meters} onChange={handleChange} type="number" min={0} step={0.1} className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand outline-none" placeholder="350" />
                    </div>
                </div>
            </div>

            <div className="pt-6 border-t border-border mt-8 flex justify-end gap-4">
                <button type="button" onClick={() => router.back()} disabled={loading} className="px-6 py-3 rounded-full font-medium hover:bg-muted transition-colors text-foreground">
                    Cancelar
                </button>
                <button type="submit" disabled={loading} className="px-8 py-3 bg-brand text-white rounded-full font-medium hover:bg-gold hover:text-black transition-colors flex items-center gap-2">
                    {loading ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>{initialData ? 'Guardando...' : 'Publicando...'}</span>
                        </>
                    ) : (
                        <span>{initialData ? 'Guardar Cambios' : 'Publicar ahora'}</span>
                    )}
                </button>
            </div>
        </form>
    );
}
