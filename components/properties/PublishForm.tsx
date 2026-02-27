"use client";

import { useState, useTransition } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { Database } from "@/lib/database.types";
import { useRouter } from "next/navigation";
import {
    Loader2, Upload, MapPin, Bed, Bath, Square, DollarSign,
    Car, Calendar, Ruler, Tag, Building2, Sparkles, ImageIcon, X, AlertCircle
} from "lucide-react";
import Image from "next/image";

type PropertyInsert = Database['public']['Tables']['properties']['Insert'];

interface PublishFormProps {
    initialData?: Database['public']['Tables']['properties']['Row'] | null;
    isAdminEdit?: boolean;
}

const PROPERTY_TYPES = ['Casa', 'Departamento', 'Terreno', 'Local', 'Oficina', 'Duplex'];
const OPERATIONS = ['venta', 'alquiler', 'alquiler_temporal'];
const CONDITIONS = ['nuevo', 'bueno', 'a_refaccionar'];
const OPERATION_LABELS: Record<string, string> = { venta: 'Venta', alquiler: 'Alquiler', alquiler_temporal: 'Alquiler Temporal' };
const CONDITION_LABELS: Record<string, string> = { nuevo: 'A Estrenar', bueno: 'Buen Estado', a_refaccionar: 'A Refaccionar' };

const AMENITY_OPTIONS = [
    'pileta', 'quincho', 'parrilla', 'seguridad', 'ascensor', 'jardin',
    'cochera_cubierta', 'vestidor', 'deposito', 'vidriera', 'alta_visibilidad',
    'vista_panoramica', 'servicios_completos', 'lavadero', 'terraza', 'calefaccion'
];

function FormSection({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
    return (
        <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
            <h3 className="text-base font-semibold text-foreground flex items-center gap-2 pb-2 border-b border-border">
                <span className="text-brand">{icon}</span>
                {title}
            </h3>
            {children}
        </div>
    );
}

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
    return (
        <label className="text-sm font-medium text-muted-foreground mb-1 block">
            {children}
            {required && <span className="text-red-400 ml-0.5">*</span>}
        </label>
    );
}

const inputCls = "w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:ring-2 focus:ring-brand outline-none transition-all placeholder:text-muted-foreground/50";
const selectCls = `${inputCls} cursor-pointer`;

export function PublishForm({ initialData, isAdminEdit = false }: PublishFormProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [submitted, setSubmitted] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");

    const [formData, setFormData] = useState({
        title: initialData?.title || '',
        description: initialData?.description || '',
        property_type: initialData?.property_type || 'Casa',
        operation_type: initialData?.operation_type || 'venta',
        price: initialData?.price?.toString() || '',
        currency: initialData?.currency || 'USD',
        location: initialData?.location || '',
        address: initialData?.address || '',
        neighborhood: initialData?.neighborhood || '',
        city: initialData?.city || 'San Miguel de Tucumán',
        province: initialData?.province || 'Tucumán',
        bedrooms: initialData?.bedrooms?.toString() || '',
        bathrooms: initialData?.bathrooms?.toString() || '',
        square_meters: initialData?.square_meters?.toString() || '',
        lot_meters: initialData?.lot_meters?.toString() || '',
        garage: initialData?.garage?.toString() || '0',
        year_built: initialData?.year_built?.toString() || '',
        condition: initialData?.condition || 'bueno',
        expenses: initialData?.expenses?.toString() || '',
        latitude: initialData?.latitude?.toString() || '',
        longitude: initialData?.longitude?.toString() || '',
        imagesStr: initialData?.images?.join('\n') || '',
    });

    const [selectedAmenities, setSelectedAmenities] = useState<string[]>(initialData?.amenities || []);

    const previewImages = formData.imagesStr
        .split(/[\n,]/)
        .map(s => s.trim())
        .filter(s => s.length > 0 && s.startsWith('http'));

    const toggleAmenity = (a: string) => {
        setSelectedAmenities(prev =>
            prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a]
        );
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg("");

        startTransition(async () => {
            const supabase = createBrowserClient<Database>(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            );

            const images = formData.imagesStr
                .split(/[\n,]/)
                .map(s => s.trim())
                .filter(s => s.length > 0);

            const propertyData: PropertyInsert = {
                title: formData.title,
                description: formData.description,
                property_type: formData.property_type,
                operation_type: formData.operation_type,
                price: parseFloat(formData.price),
                currency: formData.currency,
                location: formData.location,
                address: formData.address || null,
                neighborhood: formData.neighborhood || null,
                city: formData.city,
                province: formData.province,
                bedrooms: formData.bedrooms ? parseInt(formData.bedrooms) : null,
                bathrooms: formData.bathrooms ? parseInt(formData.bathrooms) : null,
                square_meters: formData.square_meters ? parseFloat(formData.square_meters) : null,
                lot_meters: formData.lot_meters ? parseFloat(formData.lot_meters) : null,
                garage: formData.garage ? parseInt(formData.garage) : 0,
                year_built: formData.year_built ? parseInt(formData.year_built) : null,
                condition: formData.condition,
                expenses: formData.expenses ? parseFloat(formData.expenses) : null,
                latitude: formData.latitude ? parseFloat(formData.latitude) : null,
                longitude: formData.longitude ? parseFloat(formData.longitude) : null,
                images,
                amenities: selectedAmenities,
                ...(isAdminEdit ? {} : { approval_status: 'pending', published: false }),
            };

            if (initialData?.id) {
                const { error } = await supabase
                    .from('properties')
                    .update(propertyData)
                    .eq('id', initialData.id);
                if (error) { setErrorMsg(error.message); return; }
                if (isAdminEdit) {
                    router.push('/admin/propiedades');
                    router.refresh();
                } else {
                    setSubmitted(true);
                }
            } else {
                const { error } = await supabase
                    .from('properties')
                    .insert(propertyData);
                if (error) { setErrorMsg(error.message); return; }
                setSubmitted(true);
            }
        });
    };

    if (submitted) {
        return (
            <div className="text-center py-20 space-y-4">
                <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto">
                    <Sparkles className="w-8 h-8 text-emerald-400" />
                </div>
                <h2 className="text-2xl font-heading font-medium text-foreground">¡Propiedad Enviada!</h2>
                <p className="text-muted-foreground max-w-md mx-auto">
                    Tu propiedad fue enviada para revisión. Nuestro equipo la aprobará en las próximas horas.
                </p>
                <button
                    onClick={() => router.push('/propiedades')}
                    className="mt-4 px-6 py-3 bg-brand text-white rounded-xl font-medium hover:opacity-90 transition-opacity"
                >
                    Ver Propiedades
                </button>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error */}
            {errorMsg && (
                <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl p-4">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <p className="text-sm">{errorMsg}</p>
                    <button type="button" onClick={() => setErrorMsg("")} className="ml-auto">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* 1. Información Principal */}
            <FormSection icon={<Building2 className="w-5 h-5" />} title="Información Principal">
                <div>
                    <FieldLabel required>Título</FieldLabel>
                    <input name="title" value={formData.title} onChange={handleChange} required
                        placeholder="Ej: Hermosa casa con pileta en Yerba Buena"
                        className={inputCls} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <FieldLabel required>Tipo de Propiedad</FieldLabel>
                        <select name="property_type" value={formData.property_type} onChange={handleChange} className={selectCls}>
                            {PROPERTY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>
                    <div>
                        <FieldLabel required>Operación</FieldLabel>
                        <select name="operation_type" value={formData.operation_type} onChange={handleChange} className={selectCls}>
                            {OPERATIONS.map(t => <option key={t} value={t}>{OPERATION_LABELS[t]}</option>)}
                        </select>
                    </div>
                    <div>
                        <FieldLabel>Estado</FieldLabel>
                        <select name="condition" value={formData.condition} onChange={handleChange} className={selectCls}>
                            {CONDITIONS.map(c => <option key={c} value={c}>{CONDITION_LABELS[c]}</option>)}
                        </select>
                    </div>
                </div>

                <div>
                    <FieldLabel required>Descripción</FieldLabel>
                    <textarea name="description" value={formData.description} onChange={handleChange} required rows={4}
                        placeholder="Describí la propiedad en detalle: materiales, luminosidad, vistas, entorno…"
                        className={`${inputCls} resize-none`} />
                </div>
            </FormSection>

            {/* 2. Precio */}
            <FormSection icon={<DollarSign className="w-5 h-5" />} title="Precio">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <FieldLabel required>Precio</FieldLabel>
                        <input name="price" type="number" value={formData.price} onChange={handleChange} required
                            placeholder="150000" className={inputCls} />
                    </div>
                    <div>
                        <FieldLabel>Moneda</FieldLabel>
                        <select name="currency" value={formData.currency} onChange={handleChange} className={selectCls}>
                            <option value="USD">USD — Dólares</option>
                            <option value="ARS">ARS — Pesos</option>
                        </select>
                    </div>
                    <div>
                        <FieldLabel>Expensas (ARS/mes)</FieldLabel>
                        <input name="expenses" type="number" value={formData.expenses} onChange={handleChange}
                            placeholder="0" className={inputCls} />
                    </div>
                </div>
            </FormSection>

            {/* 3. Ubicación */}
            <FormSection icon={<MapPin className="w-5 h-5" />} title="Ubicación">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <FieldLabel required>Zona / Localidad</FieldLabel>
                        <input name="location" value={formData.location} onChange={handleChange} required
                            placeholder="Yerba Buena, Tucumán" className={inputCls} />
                    </div>
                    <div>
                        <FieldLabel>Dirección</FieldLabel>
                        <input name="address" value={formData.address} onChange={handleChange}
                            placeholder="Av. Aconquija 1200" className={inputCls} />
                    </div>
                    <div>
                        <FieldLabel>Barrio / Country</FieldLabel>
                        <input name="neighborhood" value={formData.neighborhood} onChange={handleChange}
                            placeholder="Country Los Cerros" className={inputCls} />
                    </div>
                    <div>
                        <FieldLabel>Ciudad</FieldLabel>
                        <input name="city" value={formData.city} onChange={handleChange} className={inputCls} />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2">
                    <div>
                        <FieldLabel>Latitud <span className="text-xs text-muted-foreground/60">(opcional – para el mapa)</span></FieldLabel>
                        <input name="latitude" type="number" step="any" value={formData.latitude} onChange={handleChange}
                            placeholder="-26.8241" className={inputCls} />
                    </div>
                    <div>
                        <FieldLabel>Longitud</FieldLabel>
                        <input name="longitude" type="number" step="any" value={formData.longitude} onChange={handleChange}
                            placeholder="-65.2226" className={inputCls} />
                    </div>
                </div>
            </FormSection>

            {/* 4. Características */}
            <FormSection icon={<Square className="w-5 h-5" />} title="Características">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {[
                        { name: "bedrooms", icon: <Bed className="w-3.5 h-3.5" />, label: "Dormitorios", placeholder: "0" },
                        { name: "bathrooms", icon: <Bath className="w-3.5 h-3.5" />, label: "Baños", placeholder: "0" },
                        { name: "square_meters", icon: <Square className="w-3.5 h-3.5" />, label: "m² Cubiertos", placeholder: "0" },
                        { name: "lot_meters", icon: <Ruler className="w-3.5 h-3.5" />, label: "m² Terreno", placeholder: "0" },
                        { name: "garage", icon: <Car className="w-3.5 h-3.5" />, label: "Cocheras", placeholder: "0" },
                        { name: "year_built", icon: <Calendar className="w-3.5 h-3.5" />, label: "Año Construcción", placeholder: "2024" },
                    ].map(field => (
                        <div key={field.name}>
                            <FieldLabel>
                                <span className="flex items-center gap-1">{field.icon} {field.label}</span>
                            </FieldLabel>
                            <input name={field.name}
                                value={(formData as any)[field.name]}
                                onChange={handleChange}
                                type="number" placeholder={field.placeholder}
                                className={inputCls} />
                        </div>
                    ))}
                </div>
            </FormSection>

            {/* 5. Amenidades */}
            <FormSection icon={<Tag className="w-5 h-5" />} title="Amenidades">
                <div className="flex flex-wrap gap-2">
                    {AMENITY_OPTIONS.map(a => (
                        <button key={a} type="button" onClick={() => toggleAmenity(a)}
                            className={`px-4 py-1.5 rounded-xl text-sm font-medium transition-all border ${selectedAmenities.includes(a)
                                ? 'bg-brand/10 text-brand border-brand/30'
                                : 'bg-muted/50 text-muted-foreground border-border hover:text-foreground hover:border-border/80'
                                }`}
                        >
                            {a.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                        </button>
                    ))}
                </div>
                {selectedAmenities.length > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">{selectedAmenities.length} seleccionada{selectedAmenities.length !== 1 ? 's' : ''}</p>
                )}
            </FormSection>

            {/* 6. Imágenes */}
            <FormSection icon={<ImageIcon className="w-5 h-5" />} title="Imágenes">
                <div>
                    <FieldLabel>URLs de imágenes <span className="text-xs text-muted-foreground/60">(una por línea o separadas por coma)</span></FieldLabel>
                    <textarea name="imagesStr"
                        value={formData.imagesStr}
                        onChange={handleChange as any}
                        rows={3}
                        placeholder={"https://ejemplo.com/foto1.jpg\nhttps://ejemplo.com/foto2.jpg"}
                        className={`${inputCls} resize-y font-mono text-xs`}
                    />
                </div>

                {/* Live image preview strip */}
                {previewImages.length > 0 && (
                    <div className="flex gap-3 flex-wrap mt-2">
                        {previewImages.map((url, i) => (
                            <div key={i} className="relative w-24 h-16 rounded-xl overflow-hidden border border-border">
                                <Image src={url} alt={`Preview ${i + 1}`} fill className="object-cover" />
                                <div className="absolute bottom-0 left-0 right-0 text-[9px] text-white text-center bg-black/50 py-0.5">
                                    #{i + 1}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </FormSection>

            {/* Submit */}
            <button
                type="submit"
                disabled={isPending}
                className="w-full py-4 bg-gradient-to-r from-brand to-blue-600 text-white text-base font-semibold rounded-2xl hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
            >
                {isPending ? (
                    <><Loader2 className="w-5 h-5 animate-spin" /> Guardando...</>
                ) : (
                    <><Upload className="w-5 h-5" />{initialData ? 'Guardar Cambios' : 'Enviar para Revisión'}</>
                )}
            </button>
        </form>
    );
}
