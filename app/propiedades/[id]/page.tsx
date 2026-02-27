import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { MapPin, Bed, Bath, Square, Calendar, ArrowLeft, Car, Ruler, Wrench, DollarSign, Tag } from 'lucide-react';
import Link from 'next/link';
import { ContactForm } from '@/components/properties/ContactForm';
import { PropertyMap } from '@/components/properties/PropertyMap';
import { PropertyChat } from '@/components/properties/PropertyChat';
import { TrackPageView } from '@/components/analytics/TrackPageView';
import { Logo } from '@/components/ui/Logo';

export const revalidate = 60;

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const supabase = await createClient();
    const { data: property } = await supabase
        .from('properties')
        .select('title, description, location, property_type, price, currency')
        .eq('id', id)
        .single();

    if (!property) return { title: 'Propiedad no encontrada' };

    return {
        title: `${property.title} | ${property.property_type} en ${property.location}`,
        description: `${property.property_type} en ${property.location} - ${property.currency} ${property.price?.toLocaleString()}. ${property.description?.substring(0, 120)}...`,
    };
}

// Helper to format amenity names
function formatAmenity(a: string): string {
    return a.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

const OPERATION_LABELS: Record<string, string> = {
    venta: 'En Venta',
    alquiler: 'En Alquiler',
    alquiler_temporal: 'Alquiler Temporal',
};

const CONDITION_LABELS: Record<string, string> = {
    nuevo: 'A Estrenar',
    bueno: 'Buen Estado',
    a_refaccionar: 'A Refaccionar',
};

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

    const agencyName = property.agencies?.name || "Ignacio Propiedades";
    const agencyEmail = property.agencies?.contact_email || "contacto@ignaciopropiedades.com";
    const agencyPhone = property.agencies?.phone || "+54 9 381 123-4567";

    // JSON-LD Structured Data
    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "RealEstateListing",
        name: property.title,
        description: property.description,
        url: `https://ignacio.cloud/propiedades/${property.id}`,
        image: property.images?.[0],
        datePosted: property.created_at,
        offers: {
            "@type": "Offer",
            price: property.price,
            priceCurrency: property.currency,
        },
        address: {
            "@type": "PostalAddress",
            streetAddress: property.address || property.location,
            addressLocality: property.city,
            addressRegion: property.province,
            addressCountry: "AR",
        },
        ...(property.latitude && property.longitude ? {
            geo: {
                "@type": "GeoCoordinates",
                latitude: property.latitude,
                longitude: property.longitude,
            }
        } : {}),
        numberOfRooms: property.bedrooms,
        numberOfBathroomsTotal: property.bathrooms,
        floorSize: property.square_meters ? {
            "@type": "QuantitativeValue",
            value: property.square_meters,
            unitCode: "MTK",
        } : undefined,
    };

    return (
        <div className="min-h-screen bg-background pt-24 pb-24">
            <TrackPageView propertyId={property.id} />

            {/* JSON-LD */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />

            <div className="max-w-7xl mx-auto px-6">

                <Link href="/propiedades" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground mb-6 transition-colors">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Volver a resultados
                </Link>

                {/* Hero Header */}
                <div className="flex flex-col lg:flex-row gap-8 mb-8 items-start justify-between">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-3 flex-wrap">
                            <span className="px-3 py-1 bg-brand/10 text-brand rounded-full text-xs font-semibold tracking-wide uppercase">
                                {OPERATION_LABELS[property.operation_type] || 'En Venta'}
                            </span>
                            <span className="px-3 py-1 bg-muted text-muted-foreground rounded-full text-xs font-semibold tracking-wide uppercase">
                                {property.property_type}
                            </span>
                            {property.condition && (
                                <span className="px-3 py-1 bg-muted text-muted-foreground rounded-full text-xs font-semibold tracking-wide uppercase">
                                    {CONDITION_LABELS[property.condition] || property.condition}
                                </span>
                            )}
                        </div>
                        <h1 className="text-3xl md:text-5xl font-heading font-medium tracking-tight text-foreground mb-4">
                            {property.title}
                        </h1>
                        <div className="flex items-center text-muted-foreground gap-1 text-lg">
                            <MapPin className="w-5 h-5 text-brand" />
                            {property.address || property.location}
                            {property.neighborhood && <span className="text-sm ml-2 text-muted-foreground/70">• {property.neighborhood}</span>}
                        </div>
                    </div>
                    <div className="flex-shrink-0 bg-brand/5 dark:bg-brand/10 rounded-2xl p-6 text-center lg:text-right min-w-[250px]">
                        <p className="text-sm font-medium text-brand mb-1 uppercase tracking-wider">Precio</p>
                        <p className="text-4xl font-brand font-bold text-foreground">
                            {property.currency} {property.price.toLocaleString()}
                        </p>
                        {property.expenses && property.expenses > 0 && (
                            <p className="text-sm text-muted-foreground mt-1">
                                <DollarSign className="w-3.5 h-3.5 inline" />
                                Expensas: ${property.expenses.toLocaleString()}/mes
                            </p>
                        )}
                    </div>
                </div>

                {/* Image Gallery */}
                <div className="mb-12">
                    {property.images && property.images.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 h-[500px]">
                            <div className="md:col-span-3 relative rounded-3xl overflow-hidden h-full">
                                <Image src={property.images[0]} alt={property.title} fill className="object-cover" priority />
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

                        {/* Features Grid */}
                        <section>
                            <h2 className="text-2xl font-heading font-medium mb-6">Características</h2>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {property.bedrooms !== null && property.bedrooms > 0 && (
                                    <FeatureCard icon={<Bed className="w-6 h-6 text-brand" />} value={`${property.bedrooms}`} label="Dormitorios" />
                                )}
                                {property.bathrooms !== null && property.bathrooms > 0 && (
                                    <FeatureCard icon={<Bath className="w-6 h-6 text-brand" />} value={`${property.bathrooms}`} label="Baños" />
                                )}
                                {property.square_meters && (
                                    <FeatureCard icon={<Square className="w-6 h-6 text-brand" />} value={`${property.square_meters}`} label="m² Cubiertos" />
                                )}
                                {property.lot_meters && (
                                    <FeatureCard icon={<Ruler className="w-6 h-6 text-brand" />} value={`${property.lot_meters}`} label="m² Terreno" />
                                )}
                                {property.garage !== null && property.garage > 0 && (
                                    <FeatureCard icon={<Car className="w-6 h-6 text-brand" />} value={`${property.garage}`} label="Cocheras" />
                                )}
                                {property.year_built && (
                                    <FeatureCard icon={<Calendar className="w-6 h-6 text-brand" />} value={`${property.year_built}`} label="Año Construcción" />
                                )}
                                {property.condition && (
                                    <FeatureCard icon={<Wrench className="w-6 h-6 text-brand" />} value={CONDITION_LABELS[property.condition] || property.condition} label="Estado" />
                                )}
                                {property.operation_type && (
                                    <FeatureCard icon={<Tag className="w-6 h-6 text-brand" />} value={OPERATION_LABELS[property.operation_type] || property.operation_type} label="Operación" />
                                )}
                            </div>
                        </section>

                        {/* Amenities */}
                        {property.amenities && property.amenities.length > 0 && (
                            <section>
                                <h2 className="text-2xl font-heading font-medium mb-6">Amenidades</h2>
                                <div className="flex flex-wrap gap-2">
                                    {property.amenities.map(a => (
                                        <span key={a} className="px-4 py-2 bg-muted rounded-xl text-sm font-medium text-foreground">
                                            {formatAmenity(a)}
                                        </span>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Description */}
                        <section>
                            <h2 className="text-2xl font-heading font-medium mb-6">Descripción</h2>
                            <div className="prose prose-lg dark:prose-invert max-w-none text-muted-foreground leading-relaxed whitespace-pre-wrap">
                                {property.description}
                            </div>
                        </section>

                        {/* Map */}
                        {property.latitude && property.longitude && (
                            <section>
                                <h2 className="text-2xl font-heading font-medium mb-6">Ubicación</h2>
                                <PropertyMap
                                    latitude={property.latitude}
                                    longitude={property.longitude}
                                    title={property.title}
                                    address={property.address || property.location}
                                />
                                {property.address && (
                                    <p className="text-sm text-muted-foreground mt-3 flex items-center gap-1">
                                        <MapPin className="w-4 h-4" />
                                        {property.address}, {property.city}, {property.province}
                                    </p>
                                )}
                            </section>
                        )}
                    </div>

                    {/* Sidebar / Contact */}
                    <div className="lg:col-span-1">
                        <div className="sticky top-28 bg-card border border-border rounded-3xl shadow-sm overflow-hidden">
                            {/* Property thumbnail */}
                            {property.images && property.images.length > 0 && (
                                <div className="relative w-full h-48">
                                    <Image
                                        src={property.images[0]}
                                        alt={property.title}
                                        fill
                                        className="object-cover"
                                    />
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center p-8 backdrop-blur-[2px]">
                                        <div className="w-full max-w-[150px] opacity-70 drop-shadow-lg scale-90">
                                            <Logo isDarkTheme={true} />
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="p-6">
                                {/* Agency info */}
                                <div className="text-center mb-6">
                                    <h3 className="font-semibold text-lg text-foreground">{agencyName}</h3>
                                    <p className="text-muted-foreground text-sm">Agente Inmobiliario</p>
                                </div>

                                <div className="space-y-3 mb-8">
                                    <a
                                        href={`mailto:${agencyEmail}`}
                                        className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl border border-border hover:bg-muted transition-colors font-medium text-sm"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-muted-foreground flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                        </svg>
                                        <span className="truncate">{agencyEmail}</span>
                                    </a>
                                    <a
                                        href={`https://wa.me/${agencyPhone.replace(/\D/g, '')}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-green-600 hover:bg-green-700 text-white transition-colors font-medium text-sm"
                                    >
                                        <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.878-.788-1.47-1.761-1.643-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01h-.008c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
                                        </svg>
                                        Contactar por WhatsApp
                                    </a>
                                </div>

                                <ContactForm propertyId={property.id} propertyTitle={property.title} />
                            </div>
                        </div>
                    </div>

                </div>
            </div>

            {/* Chatbot */}
            <PropertyChat property={property} />
        </div>
    );
}

function FeatureCard({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
    return (
        <div className="bg-card rounded-2xl p-4 flex flex-col items-center justify-center text-center gap-2">
            {icon}
            <span className="font-semibold text-foreground text-lg">{value}</span>
            <span className="text-muted-foreground text-xs uppercase tracking-wider">{label}</span>
        </div>
    );
}
