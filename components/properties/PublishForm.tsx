"use client";

import { useState, useTransition } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { Database } from "@/lib/database.types";
import { useRouter } from "next/navigation";
import {
    Loader2, Upload, MapPin, Bed, Bath, Square, DollarSign,
    Car, Calendar, Ruler, Tag, Building2, Sparkles, ImageIcon, X, AlertCircle, FileImage, Trash2
} from "lucide-react";
import Image from "next/image";
import { PublishAssistantBot } from "./PublishAssistantBot";
import { CITIES, PROVINCES } from "@/lib/locations";

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

    // File upload state
    const [imageFiles, setImageFiles] = useState<File[]>([]);
    const [uploadProgress, setUploadProgress] = useState(0);

    const existingImages = formData.imagesStr
        .split(/[\n,]/)
        .map(s => s.trim())
        .filter(s => s.length > 0 && s.startsWith('http'));

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setImageFiles(prev => [...prev, ...Array.from(e.target.files!)]);
        }
    };

    const removeFile = (index: number) => {
        setImageFiles(prev => prev.filter((_, i) => i !== index));
    };

    const removeExistingImage = (url: string) => {
        setFormData(prev => ({
            ...prev,
            imagesStr: existingImages.filter(img => img !== url).join('\n')
        }));
    };

    const toggleAmenity = (a: string) => {
        setSelectedAmenities(prev =>
            prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a]
        );
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => {
            const nextData = { ...prev, [name]: value };

            // Auto-update location if city or province changes
            if (name === 'city' || name === 'province') {
                const city = name === 'city' ? value : nextData.city;
                const province = name === 'province' ? value : nextData.province;
                nextData.location = `${city}, ${province}`;
            }

            return nextData;
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg("");

        startTransition(async () => {
            const supabase = createBrowserClient<Database>(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            );

            // Upload the new files to storage first
            const newUploadedUrls: string[] = [];

            if (imageFiles.length > 0) {
                setUploadProgress(10);
                for (let i = 0; i < imageFiles.length; i++) {
                    const file = imageFiles[i];
                    const fileExt = file.name.split('.').pop();
                    const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
                    const filePath = `property-uploads/${fileName}`;

                    const { error: uploadError, data } = await supabase.storage
                        .from('properties') // Assume bucket is 'properties'
                        .upload(filePath, file);

                    if (uploadError) {
                        console.error('Error uploading image', uploadError);
                        setErrorMsg(`Error al subir la imagen ${file.name}: ${uploadError.message}`);
                        return; // Stop submission on error
                    }

                    if (data) {
                        const { data: { publicUrl } } = supabase.storage
                            .from('properties')
                            .getPublicUrl(filePath);
                        newUploadedUrls.push(publicUrl);
                    }

                    setUploadProgress(10 + Math.floor(((i + 1) / imageFiles.length) * 80));
                }
            }

            const finalImages = [...existingImages, ...newUploadedUrls];

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
                images: finalImages,
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

            {/* AI Assistant Bot Component */}
            {!isAdminEdit && <PublishAssistantBot />}

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
                        <FieldLabel required>Ciudad</FieldLabel>
                        <select name="city" value={formData.city} onChange={handleChange} required className={selectCls}>
                            {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                    <div>
                        <FieldLabel required>Provincia</FieldLabel>
                        <select name="province" value={formData.province} onChange={handleChange} required className={selectCls}>
                            {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                    </div>
                    <div>
                        <FieldLabel>Barrio / Country</FieldLabel>
                        <input name="neighborhood" value={formData.neighborhood} onChange={handleChange}
                            placeholder="Country Los Cerros" className={inputCls} />
                    </div>
                    <div>
                        <FieldLabel>Dirección</FieldLabel>
                        <input name="address" value={formData.address} onChange={handleChange}
                            placeholder="Av. Aconquija 1200" className={inputCls} />
                    </div>
                    <div className="md:col-span-2 hidden">
                        <FieldLabel>Zona / Localidad</FieldLabel>
                        <input name="location" value={formData.location} readOnly tabIndex={-1} className={`${inputCls} bg-muted opacity-60`} />
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
                    <label className="relative flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer overflow-hidden group">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <FileImage className="w-8 h-8 text-muted-foreground mb-3 group-hover:text-brand transition-colors" />
                            <p className="mb-1 text-sm text-muted-foreground"><span className="font-semibold text-foreground">Haz click para subir</span> o arrastra y suelta</p>
                            <p className="text-xs text-muted-foreground/70">SVG, PNG, JPG o WEBP (Max. 5MB por foto)</p>
                        </div>
                        <input type="file" className="hidden" multiple accept="image/*" onChange={handleFileChange} />
                    </label>
                </div>

                {/* Previews of newly selected files */}
                {imageFiles.length > 0 && (
                    <div className="mt-4">
                        <FieldLabel>Archivos Seleccionados ({imageFiles.length})</FieldLabel>
                        <div className="flex gap-3 flex-wrap mt-2">
                            {imageFiles.map((file, i) => (
                                <div key={i} className="relative w-24 h-24 rounded-xl overflow-hidden border border-border group bg-muted/30">
                                    <img src={URL.createObjectURL(file)} alt={`Preview ${i}`} className="object-cover w-full h-full" />
                                    <button
                                        type="button"
                                        onClick={() => removeFile(i)}
                                        className="absolute top-1 right-1 p-1 bg-black/50 hover:bg-red-500 rounded-full text-white opacity-0 group-hover:opacity-100 transition-all"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Previews of already existing images (if editing) */}
                {existingImages.length > 0 && (
                    <div className="mt-4">
                        <FieldLabel>Imágenes Existentes ({existingImages.length})</FieldLabel>
                        <div className="flex gap-3 flex-wrap mt-2">
                            {existingImages.map((url, i) => (
                                <div key={i} className="relative w-24 h-24 rounded-xl overflow-hidden border border-border group">
                                    <Image src={url} alt={`Existing ${i}`} fill className="object-cover" />
                                    <button
                                        type="button"
                                        onClick={() => removeExistingImage(url)}
                                        className="absolute top-1 right-1 p-1 bg-black/50 hover:bg-red-500 rounded-full text-white opacity-0 group-hover:opacity-100 transition-all"
                                    >
                                        <Trash2 className="w-3 h-3" />
                                    </button>
                                </div>
                            ))}
                        </div>
                        {/* Hidden input to maintain existing string if needed, though we manage it via state */}
                    </div>
                )}
            </FormSection>

            {/* Submit */}
            <button
                type="submit"
                disabled={isPending}
                className="w-full py-4 bg-gradient-to-r from-brand to-brand/80 text-white text-base font-semibold rounded-2xl shadow-[0_4px_15px_rgba(0,0,0,0.1)] hover:shadow-[0_4px_25px_rgba(brand,0.4)] transition-all disabled:opacity-50 flex items-center justify-center gap-2 relative overflow-hidden group"
            >
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out" />

                <span className="relative z-10 flex items-center gap-2">
                    {isPending ? (
                        <><Loader2 className="w-5 h-5 animate-spin" /> {uploadProgress > 0 ? `Subiendo... ${uploadProgress}%` : 'Guardando...'}</>
                    ) : (
                        <><Upload className="w-5 h-5" />{initialData ? 'Guardar Cambios' : 'Enviar para Revisión'}</>
                    )}
                </span>
            </button>
        </form>
    );
}
