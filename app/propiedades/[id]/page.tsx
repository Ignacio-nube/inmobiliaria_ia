import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { MapPin, Bed, Bath, Square, Calendar, Check, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { ContactForm } from '@/components/properties/ContactForm';

export const revalidate = 60; // Revalidate page every 60 seconds

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const supabase = await createClient();
    const { data: property } = await supabase
        .from('properties')
        .select('title, description')
        .eq('id', id)
        .single();

    if (!property) return { title: 'Propiedad no encontrada' };

    return {
        title: property.title,
        description: property.description.substring(0, 160) + '...',
    };
}

export default async function PropertyDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const supabase = await createClient();

    const { data: property, error } = await supabase
        .from('properties')
        .select(`
            *,
            agencies (
                name,
                phone,
                contact_email,
                logo_url
            )
        `)
        .eq('id', id)
        .single();

    if (error || !property) {
        notFound();
    }

    // Default agency info if none provided
    const agencyName = property.agencies?.name || "Ignacio Propiedades";
    const agencyEmail = property.agencies?.contact_email || "contacto@ignaciopropiedades.com";
    const agencyPhone = property.agencies?.phone || "+54 9 381 123-4567";

    return (
        <div className="min-h-screen bg-background pt-24 pb-24">
            <div className="max-w-7xl mx-auto px-6">

                {/* Back Link */}
                <Link href="/propiedades" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground mb-6 transition-colors">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Volver a resultados
                </Link>

                {/* Hero / Header */}
                <div className="flex flex-col lg:flex-row gap-8 mb-8 items-start justify-between">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-3">
                            <span className="px-3 py-1 bg-brand/10 text-brand rounded-full text-xs font-semibold tracking-wide uppercase">
                                En Venta
                            </span>
                            <span className="px-3 py-1 bg-muted text-muted-foreground rounded-full text-xs font-semibold tracking-wide uppercase">
                                {property.property_type}
                            </span>
                        </div>
                        <h1 className="text-3xl md:text-5xl font-heading font-medium tracking-tight text-foreground mb-4">
                            {property.title}
                        </h1>
                        <div className="flex items-center text-muted-foreground gap-1 text-lg">
                            <MapPin className="w-5 h-5 text-brand" />
                            {property.location}
                        </div>
                    </div>
                    <div className="flex-shrink-0 bg-brand/5 border border-brand/20 rounded-2xl p-6 text-center lg:text-right min-w-[250px]">
                        <p className="text-sm font-medium text-brand mb-1 uppercase tracking-wider">Precio de Publicación</p>
                        <p className="text-4xl font-brand font-bold text-foreground">
                            {property.currency} {property.price.toLocaleString()}
                        </p>
                    </div>
                </div>

                {/* Image Gallery */}
                <div className="mb-12">
                    {property.images && property.images.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 h-[500px]">
                            <div className="md:col-span-3 relative rounded-3xl overflow-hidden h-full">
                                <Image
                                    src={property.images[0]}
                                    alt={property.title}
                                    fill
                                    className="object-cover"
                                    priority
                                />
                            </div>
                            <div className="hidden md:flex flex-col gap-4 h-full">
                                {property.images.slice(1, 3).map((img, idx) => (
                                    <div key={idx} className="relative flex-1 rounded-3xl overflow-hidden">
                                        <Image src={img} alt={`Vista ${idx + 2}`} fill className="object-cover" />
                                    </div>
                                ))}
                                {property.images.length === 1 && (
                                    <div className="relative flex-1 rounded-3xl overflow-hidden bg-muted flex items-center justify-center border border-border">
                                        <span className="text-muted-foreground font-medium text-sm">Sin más fotos</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="w-full h-[500px] bg-muted rounded-3xl flex items-center justify-center border border-dashed border-border text-muted-foreground">
                            Sin imágenes disponibles
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-12">

                        {/* Features Overview */}
                        <section>
                            <h2 className="text-2xl font-heading font-medium mb-6">Características Principales</h2>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="bg-card border border-border rounded-2xl p-4 flex flex-col items-center justify-center text-center gap-2">
                                    <Bed className="w-6 h-6 text-brand" />
                                    <span className="font-semibold text-foreground text-lg">{property.bedrooms || '-'}</span>
                                    <span className="text-muted-foreground text-xs uppercase tracking-wider">Dormitorios</span>
                                </div>
                                <div className="bg-card border border-border rounded-2xl p-4 flex flex-col items-center justify-center text-center gap-2">
                                    <Bath className="w-6 h-6 text-brand" />
                                    <span className="font-semibold text-foreground text-lg">{property.bathrooms || '-'}</span>
                                    <span className="text-muted-foreground text-xs uppercase tracking-wider">Baños</span>
                                </div>
                                <div className="bg-card border border-border rounded-2xl p-4 flex flex-col items-center justify-center text-center gap-2">
                                    <Square className="w-6 h-6 text-brand" />
                                    <span className="font-semibold text-foreground text-lg">{property.square_meters || '-'}</span>
                                    <span className="text-muted-foreground text-xs uppercase tracking-wider">Metros Cuadrados</span>
                                </div>
                                <div className="bg-card border border-border rounded-2xl p-4 flex flex-col items-center justify-center text-center gap-2">
                                    <Calendar className="w-6 h-6 text-brand" />
                                    <span className="font-semibold text-foreground text-lg">Inmediata</span>
                                    <span className="text-muted-foreground text-xs uppercase tracking-wider">Disponibilidad</span>
                                </div>
                            </div>
                        </section>

                        {/* Description */}
                        <section>
                            <h2 className="text-2xl font-heading font-medium mb-6">Descripción de la Propiedad</h2>
                            <div className="prose prose-lg dark:prose-invert max-w-none text-muted-foreground leading-relaxed whitespace-pre-wrap">
                                {property.description}
                            </div>
                        </section>

                    </div>

                    {/* Sidebar / Contact */}
                    <div className="lg:col-span-1">
                        <div className="sticky top-28 bg-card border border-border rounded-3xl p-6 shadow-sm">
                            <div className="text-center mb-6">
                                <div className="w-20 h-20 bg-muted rounded-full mx-auto mb-4 border-2 border-brand/20 overflow-hidden relative">
                                    {/* Placeholder avatar or logo */}
                                    <Image src="https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=256&auto=format&fit=crop" alt="Agent" fill className="object-cover" />
                                </div>
                                <h3 className="font-semibold text-lg text-foreground">{agencyName}</h3>
                                <p className="text-muted-foreground text-sm">Agente Inmobiliario</p>
                            </div>

                            <div className="space-y-4 mb-8">
                                <a href={`mailto:${agencyEmail}`} className="flex items-center justify-center w-full py-3 rounded-xl border border-border hover:bg-muted transition-colors font-medium text-sm">
                                    Enviar Correo
                                </a>
                                <a href={`https://wa.me/${agencyPhone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="flex items-center justify-center w-full py-3 rounded-xl bg-green-600 hover:bg-green-700 text-white transition-colors font-medium text-sm">
                                    Contactar por WhatsApp
                                </a>
                            </div>

                            <ContactForm propertyId={property.id} propertyTitle={property.title} />
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
