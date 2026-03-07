import { createClient } from '@/lib/supabase/server';
import { PropertiesClient } from '@/components/properties/PropertiesClient';
import { Suspense } from 'react';
import { Database } from '@/lib/database.types';

export const metadata = {
    title: 'Todas las Propiedades',
    description: 'Explora nuestro catálogo completo de propiedades en Tucumán. Casas, departamentos, duplex y terrenos en venta y alquiler.',
    alternates: {
        canonical: 'https://ignacio.cloud/propiedades',
    }
};

type Property = Database['public']['Tables']['properties']['Row'];

const PAGE_SIZE = 20;

interface PageProps {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

async function fetchInitialProperties(searchParams: { [key: string]: string | string[] | undefined }) {
    const supabase = await createClient();

    const getParam = (key: string): string | undefined => {
        const val = searchParams[key];
        return typeof val === 'string' ? val : undefined;
    };

    let query = supabase
        .from('properties')
        .select('*', { count: 'exact' })
        .eq('published', true)
        .eq('approval_status', 'approved');

    // Apply filters from URL params (mirrors API route logic)
    const tipo = getParam('tipo');
    if (tipo && tipo !== 'all') query = query.ilike('property_type', `%${tipo}%`);

    const operacion = getParam('operacion');
    if (operacion && operacion !== 'all') query = query.ilike('operation_type', `%${operacion}%`);

    const dormitorios = getParam('dormitorios');
    if (dormitorios && dormitorios !== 'any') {
        const n = parseInt(dormitorios);
        if (!isNaN(n)) query = query.gte('bedrooms', n);
    }

    const banos = getParam('banos');
    if (banos && banos !== 'any') {
        const n = parseInt(banos);
        if (!isNaN(n)) query = query.gte('bathrooms', n);
    }

    const cocheras = getParam('cocheras');
    if (cocheras && cocheras !== 'any') {
        const n = parseInt(cocheras);
        if (!isNaN(n)) query = query.gte('garage', n);
    }

    const supMin = getParam('supMin');
    if (supMin) {
        const n = parseInt(supMin);
        if (!isNaN(n)) query = query.gte('square_meters', n);
    }

    const supMax = getParam('supMax');
    if (supMax) {
        const n = parseInt(supMax);
        if (!isNaN(n)) query = query.lte('square_meters', n);
    }

    const estado = getParam('estado');
    if (estado && estado !== 'all') query = query.ilike('condition', `%${estado}%`);

    const precioMin = getParam('precioMin');
    if (precioMin) {
        const n = parseFloat(precioMin);
        if (!isNaN(n)) query = query.gte('price', n);
    }

    const precioMax = getParam('precioMax');
    if (precioMax) {
        const n = parseFloat(precioMax);
        if (!isNaN(n)) query = query.lte('price', n);
    }

    const monedaParam = getParam('moneda');
    if (monedaParam) query = query.eq('currency', monedaParam);

    const ciudad = getParam('ciudad');
    if (ciudad) {
        query = query.or(
            `city.ilike.%${ciudad}%,location.ilike.%${ciudad}%,address.ilike.%${ciudad}%`
        );
    }

    const barrio = getParam('barrio');
    if (barrio) query = query.ilike('neighborhood', `%${barrio}%`);

    const amenitiesRaw = getParam('amenities');
    if (amenitiesRaw) {
        const arr = amenitiesRaw.split(',').filter(Boolean);
        if (arr.length > 0) query = query.overlaps('amenities', arr);
    }

    const q = getParam('q');
    if (q && q.trim()) {
        query = query.or(`title.ilike.%${q.trim()}%,description.ilike.%${q.trim()}%`);
    }

    const page = Math.max(1, parseInt(getParam('page') || '1'));
    const from = (page - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    query = query
        .order('is_featured', { ascending: false })
        .order('created_at', { ascending: false })
        .range(from, to);

    const { data, error, count } = await query;

    if (error) {
        console.error("Error fetching properties:", error);
        return { properties: [], total: 0 };
    }

    return { properties: data || [], total: count || 0 };
}

export default async function PropertiesPage({ searchParams }: PageProps) {
    const resolvedParams = await searchParams;

    const { properties, total } = await fetchInitialProperties(resolvedParams);

    // Fetch dynamic CMS settings
    const supabase = await createClient();
    const { data: settings, error: settingsError } = await supabase
        .from('site_settings')
        .select('property_card_style')
        .limit(1)
        .single();

    if (settingsError && settingsError.code !== 'PGRST116') {
        console.error("Error fetching site settings:", settingsError);
    }

    const cardStyle = settings?.property_card_style || "modern";

    return (
        <div className="min-h-screen bg-background pt-24 pb-12">
            <div className="max-w-7xl mx-auto px-6">
                <div className="mb-8">
                    <h1 className="text-4xl md:text-5xl font-heading font-medium tracking-tight text-foreground mb-4">
                        Catálogo de Propiedades
                    </h1>
                    <p className="text-lg text-muted-foreground">
                        Encuentra la propiedad que estás buscando utilizando nuestros filtros avanzados.
                    </p>
                </div>

                <Suspense fallback={<div className="text-center py-20 text-muted-foreground">Cargando propiedades...</div>}>
                    <PropertiesClient
                        initialProperties={properties}
                        initialTotal={total}
                        initialRelaxed={false}
                        cardStyle={cardStyle}
                    />
                </Suspense>
            </div>
        </div>
    );
}
